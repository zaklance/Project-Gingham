import os
import json
import inspect
from sqlalchemy import event, func, and_, or_, inspect as SQLAlchemyInspect
from sqlalchemy.orm import sessionmaker, Session as SQLAlchemySession
from sqlalchemy.event import listens_for
from datetime import datetime, date, timezone, timedelta, time
from threading import Timer
from uuid import uuid4
from models import (db, User, Market, MarketDay, Vendor, MarketReview, VendorReview, MarketFavorite, VendorFavorite, VendorMarket, VendorUser, AdminUser, Basket, Event, UserNotification, VendorNotification, AdminNotification, SettingsUser, SettingsVendor, SettingsAdmin, Blog, Recipe, Instruction)
from typing import List, Optional, Any, Union, Dict
from tasks import (
    send_blog_notifications,
    send_email_user_fav_vendor_new_event_task,
    send_email_user_fav_vendor_schedule_change_task,
    send_email_user_fav_market_new_vendor_task,
    send_email_admin_reported_review_task,
    send_email_user_fav_vendor_new_basket_task,
    send_email_vendor_market_new_event_task,
    send_email_vendor_market_schedule_change_task,
    send_email_vendor_basket_sold_task,
    send_email_user_fav_market_new_basket_task,
    send_email_user_basket_pickup_time_task,
    send_email_user_vendor_review_response_task,
    send_email_user_new_market_in_city_task,
    send_email_vendor_new_review_task,
    send_email_admin_new_vendor_task,
    send_email_admin_product_request_task,
    send_email_user_fav_market_schedule_change_task,
    send_email_user_fav_market_new_event_task,
    send_sms_task
)


Session = sessionmaker()

def get_db_session(connection: Optional[Any] = None) -> SQLAlchemySession:
    """Get a database session, either from a connection or create a new one."""
    try:
        if connection:
            # print("Creating session from existing connection")
            return Session(bind=connection)
        # print("Creating new session")
        return Session()
    except Exception as e:
        print(f"Error creating database session: {e}")
        raise

def safe_commit(session: SQLAlchemySession) -> None:
    """Safely commit a session with error handling."""
    try:
        # print("Attempting to commit session")
        session.commit()
        # print("Session committed successfully")
    except Exception as e:
        print(f"Error committing session: {e}")
        session.rollback()
        raise e

def safe_close(session: SQLAlchemySession) -> None:
    """Safely close a session."""
    try:
        # print("Attempting to close session")
        session.close()
        # print("Session closed successfully")
    except Exception as e:
        print(f"Error closing session: {e}")

def safe_rollback(session: SQLAlchemySession) -> None:
    """Safely rollback a session with error handling."""
    try:
        # print("Attempting to rollback session")
        session.rollback()
        # print("Session rolled back successfully")
    except Exception as e:
        print(f"Error rolling back session: {e}")

def time_converter(time24: Union[time, str]) -> str:
    """Convert 24-hour time format to 12-hour format with AM/PM."""
    if isinstance(time24, time):
        time24 = time24.strftime("%H:%M:%S")

    try:
        hours, minutes, _ = map(int, time24.split(':'))
        period = "AM" if hours < 12 else "PM"
        hours = hours if 1 <= hours <= 12 else (hours - 12 if hours > 12 else 12)
        return f"{hours}:{minutes:02d} {period}"
    except Exception as e:
        print(f"Error converting time: {e}")
        return str(time24)

@listens_for(VendorFavorite, 'after_insert')
def track_vendor_favorite(mapper: Any, connection: Any, target: VendorFavorite) -> None:
    session = get_db_session(connection)
    try:
        # Retrieve the vendor
        vendor = session.query(Vendor).get(target.vendor_id)
        if not vendor:
            print(f"Vendor not found for Vendor ID: {target.vendor_id}")
            return

        # Retrieve the user
        user = session.query(User).get(target.user_id)
        if not user:
            print(f"User not found for User ID: {target.user_id}")
            return

        # Create a notification
        notification = VendorNotification(
            subject="Favorite Vendor Added",
            message=f"{user.first_name} added {vendor.name} to their favorites!",
            user_id=user.id,
            vendor_id=vendor.id,
            created_at=datetime.now(timezone.utc),
            is_read=False
        )
        
        session.add(notification)
        safe_commit(session)
        print(f"Created notification for user {user.id} about vendor {vendor.id}")
        
    except Exception as e:
        print(f"Error in track_vendor_favorite: {e}")
    finally:
        safe_close(session)

# User - New Event in Fav Market 
@listens_for(Event, 'after_insert')
def vendor_market_event_or_schedule_change(mapper: Any, connection: Any, target: Event) -> None:
    session = get_db_session(connection)
    try:
        # Only proceed if this event has a market_id
        if not target.market_id:
            print(f"Event ID={target.id} has no market_id. Skipping market notifications.")
            return
            
        market_day = session.query(MarketDay).filter_by(market_id=target.market_id).first()
        if not market_day:
            print(f"Market Day not found for Market ID: {target.market_id}")
            return

        vendors = session.query(Vendor).join(VendorMarket).join(MarketDay).filter(
            MarketDay.market_id == target.market_id
        ).all()

        if not vendors:
            print(f"No vendors found for Market ID {target.market_id}. No notifications will be created.")
            return

        is_schedule_change = target.schedule_change

        notifications: List[VendorNotification] = []
        for vendor in vendors:
            vendor_users = get_vendor_users(vendor.id, session)
            if not vendor_users:
                print(f"No vendor users found for Vendor ID={vendor.id}, skipping notification.")
                continue
            for vendor_user in vendor_users:
                try:
                    settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()
                    if not settings:
                        print(f"No settings found for Vendor User ID={vendor_user.id}, skipping notification.")
                        continue
                    if is_schedule_change and not settings.site_market_schedule_change:
                        print(f"Vendor User ID={vendor_user.id} has schedule change notifications disabled.")
                        continue
                    if not is_schedule_change and not settings.site_market_new_event:
                        print(f"Vendor User ID={vendor_user.id} has new event notifications disabled.")
                        continue
                    if market_day.id not in (settings.market_locations or []):
                        continue
                    # Check for duplicate notifications for this specific event only
                    subject_to_check = "Market Schedule Change" if is_schedule_change else "New Event in Your Market!"
                    existing_notification = session.query(VendorNotification).filter(
                        VendorNotification.vendor_user_id == vendor_user.id,
                        VendorNotification.vendor_id == vendor.id,
                        VendorNotification.market_id == market_day.market.id,
                        VendorNotification.created_at >= datetime.now(timezone.utc).date(),
                        VendorNotification.subject == subject_to_check,
                        VendorNotification.message.like(f"%: {target.title}.%") if not is_schedule_change else VendorNotification.message.like(f"%. Event: {target.title}.%")
                    ).first()
                    if existing_notification:
                        print(f"Duplicate notification exists for event '{target.title}', skipping vendor user {vendor_user.id}")
                        continue
                    notification = VendorNotification(
                        subject="Market Schedule Change" if is_schedule_change else "New Event in Your Market!",
                        message=f"The market, {market_day.market.name}, has updated its schedule temporarily."
                        if is_schedule_change
                        else f"The market, {market_day.market.name}, has added a new event: {target.title}.",
                        link=f"/user/markets/{market_day.market.id}",
                        vendor_id=vendor.id,
                        vendor_user_id=vendor_user.id,
                        market_id=market_day.market.id,
                        created_at=datetime.now(timezone.utc),
                        is_read=False
                    )
                    notifications.append(notification)
                    # Send email notification if enabled
                    is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
                    if is_production:
                        if is_schedule_change and settings.email_market_schedule_change:
                            try:
                                send_email_vendor_market_schedule_change_task.delay(vendor_user.email, vendor_user.id, market_day.market.id, target.id, f"/user/markets/{market_day.market.id}")
                                print(f"Email sent to {vendor_user.email} for market schedule change")
                            except Exception as e:
                                print(f"Error sending email to {vendor_user.email}: {e}")
                        
                        elif not is_schedule_change and settings.email_market_new_event:
                            try:
                                send_email_vendor_market_new_event_task.delay(vendor_user.email, vendor_user.id, market_day.market.id, target.id, f"/user/markets/{market_day.market.id}")
                                print(f"Email sent to {vendor_user.email} for market new event")
                            except Exception as e:
                                print(f"Error sending email to {vendor_user.email}: {e}")
                        # Send SMS notification if enabled (only for schedule changes)
                        if is_schedule_change and settings.text_market_schedule_change and vendor_user.phone:
                            try:
                                body = f"Hi {vendor_user.first_name}! {market_day.market.name} has a schedule change. Event: {target.title}. Details: www.gingham.nyc/user/markets/{market_day.market.id} Reply STOP to unsubscribe."
                                send_sms_task(body, vendor_user.phone)
                                print(f"SMS sent to {vendor_user.phone} for market schedule change")
                            except Exception as e:
                                print(f"Error sending SMS to {vendor_user.phone}: {e}")

                except Exception as e:
                    print(f"Error processing vendor_user {vendor_user.id}: {e}")
        if notifications:
            session.bulk_save_objects(notifications)
            safe_commit(session)
    except Exception as e:
        print(f"Error in vendor_market_event_or_schedule_change: {e}")
    finally:
        safe_close(session)

# User - New Event for Fav Vendor
@listens_for(Event, 'after_insert')
def track_fav_vendor_event(mapper: Any, connection: Any, target: Event) -> None:
    if not target.vendor_id:  # Ensure the event is associated with a vendor
        print(f"Event ID={target.id} is not associated with a vendor. Skipping user notifications.")
        return

    session = get_db_session(connection)
    try:
        # Retrieve users who favorited the vendor
        favorited_users = session.query(User).join(VendorFavorite).filter(
            VendorFavorite.vendor_id == target.vendor_id
        ).all()

        if not favorited_users:
            print(f"No favorited users for Vendor ID {target.vendor_id}. No notifications will be created.")
            return

        # Retrieve the vendor for the event
        vendor = session.query(Vendor).get(target.vendor_id)
        if not vendor:
            print(f"Vendor with ID {target.vendor_id} not found.")
            return

        is_schedule_change = target.schedule_change

        # Prepare notifications
        notifications = []
        for user in favorited_users:
            try:
                # Retrieve user notification settings
                settings = session.query(SettingsUser).filter_by(user_id=user.id).first()
                if not settings:
                    print(f"No settings found for User ID={user.id}, skipping notification.")
                    continue
                # Check if the user has notifications enabled for this type
                if is_schedule_change and not settings.site_fav_vendor_schedule_change:
                    print(f"User ID={user.id} has schedule change notifications disabled.")
                    continue
                if not is_schedule_change and not settings.site_fav_vendor_new_event:
                    print(f"User ID={user.id} has new event notifications disabled.")
                    continue
                # Check for duplicate notifications for this specific event only
                subject_to_check = "Vendor Schedule Change" if is_schedule_change else "New Event from Your Favorite Vendor!"
                existing_notification = session.query(UserNotification).filter(
                    UserNotification.user_id == user.id,
                    UserNotification.vendor_id == vendor.id,
                    UserNotification.created_at >= datetime.now(timezone.utc).date(),
                    UserNotification.subject == subject_to_check,
                    UserNotification.message.like(f"%: {target.title}%") if not is_schedule_change else UserNotification.message.like(f"%. Event: {target.title}.%")
                ).first()
                if existing_notification:
                    print(f"Duplicate notification exists for event '{target.title}', skipping user {user.id}")
                    continue
                # Create site notification
                notification = UserNotification(
                    subject="Vendor Schedule Change" if is_schedule_change else "New Event from Your Favorite Vendor!",
                    message=f"The vendor, {vendor.name}, has updated their schedule temporarily."
                    if is_schedule_change
                    else f"The vendor, {vendor.name}, has added a new event: {target.title}",
                    link=f"/user/vendors/{vendor.id}",
                    user_id=user.id,
                    vendor_id=vendor.id,
                    created_at=datetime.now(timezone.utc),
                    is_read=False
                )
                notifications.append(notification)
                # Send email notification if enabled
                is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
                if is_production:
                    if is_schedule_change and settings.email_fav_vendor_schedule_change:
                        try:
                            send_email_user_fav_vendor_schedule_change_task.delay(user.email, user.id, vendor.id, target.id, f"/user/vendors/{vendor.id}")
                            print(f"Email sent to {user.email} for vendor schedule change")
                        except Exception as e:
                            print(f"Error sending email to {user.email}: {e}")
                    elif not is_schedule_change and settings.email_fav_vendor_new_event:
                        try:
                            send_email_user_fav_vendor_new_event_task.delay(user.email, user.id, vendor.id, target.id, f"/user/vendors/{vendor.id}")
                            print(f"Email sent to {user.email} for vendor new event")
                        except Exception as e:
                            print(f"Error sending email to {user.email}: {e}")
                    # Send SMS notification if enabled (only for schedule changes)
                    if is_schedule_change and settings.text_fav_vendor_schedule_change and user.phone:
                        try:
                            body = f"Hi {user.first_name}! Your favorite vendor, {vendor.name}, has updated their schedule temporarily. Event: {target.title}. View details: www.gingham.nyc/user/vendors/{vendor.id} Reply STOP to unsubscribe."
                            send_sms_task(body, user.phone)
                            print(f"SMS sent to {user.phone} for vendor schedule change")
                        except Exception as e:
                            print(f"Error sending SMS to {user.phone}: {e}")

            except Exception as e:
                print(f"Error processing user {user.id}: {e}")
        # Save notifications
        if notifications:
            session.bulk_save_objects(notifications)
            safe_commit(session)
    except Exception as e:
        print(f"Error in track_fav_vendor_event: {e}")
    finally:
        safe_close(session)

# User - New Event in Fav Market
@listens_for(Event, 'after_insert')
def notify_fav_market_users_of_events(mapper: Any, connection: Any, target: Event) -> None:
    # Only handle market events (not vendor events)
    if not target.market_id:
        return
        
    session = get_db_session(connection)
    try:
        # Get the market
        market = session.query(Market).get(target.market_id)
        if not market:
            print(f"Market not found for Market ID: {target.market_id}")
            return

        # Retrieve users who have favorited this market
        favorited_users = session.query(User).join(MarketFavorite).filter(
            MarketFavorite.market_id == target.market_id
        ).all()

        if not favorited_users:
            print(f"No favorited users for Market ID {target.market_id}. No notifications will be created.")
            return

        is_schedule_change = target.schedule_change

        # Prepare notifications
        notifications = []
        for user in favorited_users:
            try:
                # Retrieve user notification settings
                settings = session.query(SettingsUser).filter_by(user_id=user.id).first()
                if not settings:
                    print(f"No settings found for User ID={user.id}, skipping notification.")
                    continue
                # Check if the user has notifications enabled for this type
                if is_schedule_change and not settings.site_fav_market_schedule_change:
                    print(f"User ID={user.id} has market schedule change notifications disabled.")
                    continue
                if not is_schedule_change and not settings.site_fav_market_new_event:
                    print(f"User ID={user.id} has market new event notifications disabled.")
                    continue
                
                # Check for duplicate notifications for this specific event only
                subject_to_check = "Market Schedule Change" if is_schedule_change else "New Event in Your Favorite Market!"
                existing_notification = session.query(UserNotification).filter(
                    UserNotification.user_id == user.id,
                    UserNotification.market_id == target.market_id,
                    UserNotification.created_at >= datetime.now(timezone.utc).date(),
                    UserNotification.subject == subject_to_check,
                    UserNotification.message.like(f"%: {target.title}%") if not is_schedule_change else UserNotification.message.like(f"%. Event: {target.title}.%")
                ).first()
                if existing_notification:
                    print(f"Duplicate notification exists for event '{target.title}', skipping user {user.id}")
                    continue
                
                # Create site notification
                notification = UserNotification(
                    subject="Market Schedule Change" if is_schedule_change else "New Event in Your Favorite Market!",
                    message=f"The market, {market.name}, has updated its schedule temporarily."
                    if is_schedule_change
                    else f"The market, {market.name}, has added a new event: {target.title}",
                    link=f"/user/markets/{market.id}",
                    user_id=user.id,
                    market_id=target.market_id,
                    created_at=datetime.now(timezone.utc),
                    is_read=False
                )
                notifications.append(notification)
                
                # Send email notification if enabled
                is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
                if is_production:
                    if is_schedule_change and settings.email_fav_market_schedule_change:
                        try:
                            send_email_user_fav_market_schedule_change_task.delay(
                                user.email, user.id, market.id, target.id, f"/user/markets/{market.id}"
                            )
                            print(f"Email sent to {user.email} for market schedule change")
                        except Exception as e:
                            print(f"Error sending email to {user.email}: {e}")
                    elif not is_schedule_change and settings.email_fav_market_new_event:
                        try:
                            send_email_user_fav_market_new_event_task.delay(
                                user.email, user.id, market.id, target.id, f"/user/markets/{market.id}"
                            )
                            print(f"Email sent to {user.email} for market new event")
                        except Exception as e:
                            print(f"Error sending email to {user.email}: {e}")
                    
                    # Send SMS notification if enabled (only for schedule changes)
                    if is_schedule_change and settings.text_fav_market_schedule_change and user.phone:
                        try:
                            body = f"Hi {user.first_name}! Your favorite market, {market.name}, has updated their schedule temporarily. Event: {target.title}. Details: www.gingham.nyc/user/markets/{market.id} Reply STOP to unsubscribe."
                            send_sms_task(body, user.phone)
                            print(f"SMS sent to {user.phone} for market schedule change")
                        except Exception as e:
                            print(f"Error sending SMS to {user.phone}: {e}")
                        
            except Exception as e:
                print(f"Error processing user {user.id}: {e}")
        
        # Save notifications
        if notifications:
            session.bulk_save_objects(notifications)
            safe_commit(session)
    except Exception as e:
        print(f"Error in notify_fav_market_users_of_events: {e}")
    finally:
        safe_close(session)

# User - New Vendor in Fav Market
@listens_for(VendorMarket, 'after_insert')
def notify_new_vendor_in_favorite_market(mapper: Any, connection: Any, target: VendorMarket) -> None:
    session = get_db_session(connection)
    try:
        # Retrieve the market associated with the market day
        market_day = session.query(MarketDay).filter_by(id=target.market_day_id).first()
        if not market_day:
            print(f"Market Day not found for Market Day ID: {target.market_day_id}")
            return

        market = session.query(Market).filter_by(id=market_day.market_id).first()
        if not market:
            print(f"Market not found for Market ID associated with Market Day ID: {target.market_day_id}")
            return

        # Retrieve the vendor
        vendor = session.query(Vendor).filter_by(id=target.vendor_id).first()
        if not vendor:
            print(f"Vendor not found for Vendor ID: {target.vendor_id}")
            return

        # Retrieve users who have favorited this market
        favorited_users = session.query(User).join(MarketFavorite).filter(
            MarketFavorite.market_id == market.id
        ).all()

        if not favorited_users:
            return

        # Prepare and insert notifications
        notifications = []
        for user in favorited_users:
            try:
                # Retrieve user notification settings
                settings = session.query(SettingsUser).filter_by(user_id=user.id).first()
                if not settings or not settings.site_fav_market_new_vendor:
                    print(f"User ID={user.id} has new vendor notifications disabled or no settings found.")
                    continue
                # Check for existing notifications
                existing_notification = session.query(UserNotification).filter(
                    UserNotification.user_id == user.id,
                    UserNotification.market_id == market.id,
                    UserNotification.vendor_id == vendor.id,
                    UserNotification.created_at >= datetime.now(timezone.utc).date(),
                    UserNotification.subject == "New Vendor in Your Favorite Market!"
                ).first()
                if existing_notification:
                    continue
                # Create site notification
                notifications.append(UserNotification(
                    subject="New Vendor in Your Favorite Market!",
                    message=f"The vendor, {vendor.name}, has been added to one of your favorite markets: {market.name}.",
                    link=f"/user/markets/{market.id}?day={market_day.id}#vendors",
                    user_id=user.id,
                    market_id=market.id,
                    vendor_id=vendor.id,
                    created_at=datetime.now(timezone.utc),
                    is_read=False
                ))
                # Send email notification if enabled
                is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
                if is_production:
                    if settings.email_fav_market_new_vendor:
                        try:
                            send_email_user_fav_market_new_vendor_task.delay(
                                user.email, user, market, vendor,
                                f"/user/markets/{market.id}?day={market_day.id}#vendors", 
                                f"/user/vendors/{vendor.id}",
                            )
                            print(f"Email sent to {user.email} for new vendor in favorite market")
                        except Exception as e:
                            print(f"Error sending email to {user.email}: {e}")

            except Exception as e:
                print(f"Error processing user {user.id}: {e}")
        if notifications:
            session.bulk_save_objects(notifications)
            safe_commit(session)
    except Exception as e:
        print(f"Error in notify_new_vendor_in_favorite_market: {e}")
    finally:
        safe_close(session)

# Admin - Reported Vendor Review
@listens_for(VendorReview, 'after_update')
def notify_admin_vendor_review_reported(mapper, connection, target):
    if target.is_reported:
        session = Session(bind=connection)
        # print(inspect.currentframe().f_code.co_name)
        try:
            # Retrieve the vendor
            vendor = session.query(Vendor).filter_by(id=target.vendor_id).first()
            if not vendor:
                print(f"Vendor not found for Vendor ID: {target.vendor_id}")
                return

            # Retrieve all admins with notification settings enabled
            admins = session.query(AdminUser).join(SettingsAdmin).filter(
                SettingsAdmin.site_report_review == True
            ).all()

            if not admins:
                print("No admins have report review notifications enabled. No notifications will be created.")
                return

            # Prepare admin notifications with role filtering
            notifications = []
            for admin in admins:
                if admin.admin_role <= 5:
                    # Create site notification
                    notifications.append(AdminNotification(
                        subject="Reported Vendor Review",
                        message=f"A review for vendor '{vendor.name}' has been reported.",
                        link="/admin/report#vendors",
                        admin_id=admin.id,
                        admin_role=admin.admin_role,
                        vendor_id=vendor.id,
                        created_at=datetime.now(timezone.utc),
                        is_read=False
                    ))

                    # Get admin settings for email/SMS
                    admin_settings = session.query(SettingsAdmin).filter_by(admin_id=admin.id).first()
                    if admin_settings:
                        # Retrieve the review for email context
                        review = session.query(VendorReview).filter_by(vendor_id=vendor.id, is_reported=True).first()
                        
                        # Send email notification if enabled
                        # Check if in dev mode
                        is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
                        if is_production:
                            if admin_settings.email_report_review:
                                try:
                                    send_email_admin_reported_review_task.delay(admin.email, admin.id, None, vendor.id, review.id, "/admin/report#vendors")
                                    print(f"Email sent to {admin.email} for reported vendor review")
                                except Exception as e:
                                    print(f"Error sending email to {admin.email}: {e}")
                            # Send SMS notification if enabled
                            if admin_settings.text_report_review and admin.phone:
                                try:
                                    body = f"Hi {admin.first_name}! A review for vendor '{vendor.name}' has been reported and needs your attention. Review: www.gingham.nyc/admin/report#vendors Reply STOP to unsubscribe."
                                    send_sms_task(body, admin.phone)
                                    print(f"SMS sent to {admin.phone} for reported vendor review")
                                except Exception as e:
                                    print(f"Error sending SMS to {admin.phone}: {e}")

            if notifications:
                session.bulk_save_objects(notifications)
                session.commit()

        except Exception as e:
            session.rollback()
            print(f"Error creating admin notification for Vendor Review: {e}")
        finally:
            session.close()

# Admin - Reported Market Review
@listens_for(MarketReview, 'after_update')
def notify_admin_market_review_reported(mapper, connection, target):
    if target.is_reported:
        session = Session(bind=connection)
        # print(inspect.currentframe().f_code.co_name)
        try:
            # Retrieve the market
            market = session.query(Market).filter_by(id=target.market_id).first()
            if not market:
                print(f"Market not found for Market ID: {target.market_id}")
                return

            # Retrieve all admins with notification settings enabled
            admins = session.query(AdminUser).join(SettingsAdmin).filter(
                SettingsAdmin.site_report_review == True
            ).all()

            if not admins:
                print("No admins have report review notifications enabled. No notifications will be created.")
                return

            # Prepare admin notifications with role filtering
            notifications = []
            for admin in admins:
                if admin.admin_role <= 5:
                    # Create site notification
                    notifications.append(AdminNotification(
                        subject="Reported Market Review",
                        message=f"A review for market, '{market.name}', has been reported.",
                        link="/admin/report#markets",
                        admin_id=admin.id,
                        admin_role=admin.admin_role,
                        market_id=market.id,
                        created_at=datetime.now(timezone.utc),
                        is_read=False
                    ))

                    # Get admin settings for email/SMS
                    admin_settings = session.query(SettingsAdmin).filter_by(admin_id=admin.id).first()
                    if admin_settings:
                        # Retrieve the review for email context
                        review = session.query(MarketReview).filter_by(market_id=market.id, is_reported=True).first()
                        
                        # Send email notification if enabled
                        # Check if in dev mode
                        is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
                        if is_production:
                            if admin_settings.email_report_review:
                                try:
                                    send_email_admin_reported_review_task.delay(admin.email, admin.id, market.id, None, review.id, "/admin/report#markets")
                                    print(f"Email sent to {admin.email} for reported market review")
                                except Exception as e:
                                    print(f"Error sending email to {admin.email}: {e}")

                            # Send SMS notification if enabled
                            if admin_settings.text_report_review and admin.phone:
                                try:
                                    body = f"Hi {admin.first_name}! A review for market '{market.name}' has been reported and needs your attention. Review: www.gingham.nyc/admin/report#markets Reply STOP to unsubscribe."
                                    send_sms_task(body, admin.phone)
                                    print(f"SMS sent to {admin.phone} for reported market review")
                                except Exception as e:
                                    print(f"Error sending SMS to {admin.phone}: {e}")

            if notifications:
                session.bulk_save_objects(notifications)
                session.commit()
                print(f"Sent notifications to {len(notifications)} admins about reported market review.")

        except Exception as e:
            session.rollback()
            print(f"Error creating admin notification for Market Review: {e}")
        finally:
            session.close()

# User Fav Vendor Added Baskets
@listens_for(Basket, 'after_insert')
def fav_vendor_new_baskets(mapper, connection, target):
    session = Session(bind=connection)
    # print(inspect.currentframe().f_code.co_name)
    try:
        vendor = session.query(Vendor).get(target.vendor_id)
        if not vendor:
            print(f"Vendor not found for Vendor ID: {target.vendor_id}")
            return

        # Retrieve users who favorited this vendor
        favorited_users = session.query(User).join(VendorFavorite).filter(
            VendorFavorite.vendor_id == target.vendor_id
        ).all()

        if not favorited_users:
            print(f"No users have favorited Vendor ID {vendor.id}. No notifications will be created.")
            return

        # Check for existing baskets for this vendor
        recent_baskets = session.query(Basket).filter(
            Basket.vendor_id == vendor.id,
            Basket.sale_date >= datetime.now(timezone.utc).date()
        ).all()

        basket_count = len(recent_baskets)

        if basket_count >= 2:
            # Consolidate notification
            message = f"{vendor.name} has added new baskets today! Check them out before they're gone!"
        else:
            # Individual basket notification
            message = f"{vendor.name} has added a new basket! Check it out before it's gone!"

        # Retrieve the market for email context
        market_day = session.query(MarketDay).filter_by(id=target.market_day_id).first()
        market = market_day.market if market_day else None

        # Prepare notifications for favorited users
        notifications = []
        for user in favorited_users:
            # Retrieve user notification settings
            settings = session.query(SettingsUser).filter_by(user_id=user.id).first()

            if not settings or not settings.site_fav_vendor_new_basket:
                print(f"User ID={user.id} has new vendor basket notifications disabled.")
                continue

            # Check for duplicate notifications - prevent spam from multiple baskets per day
            existing_notification = session.query(UserNotification).filter(
                UserNotification.user_id == user.id,
                UserNotification.vendor_id == vendor.id,
                UserNotification.created_at >= datetime.now(timezone.utc).date(),
                UserNotification.subject == "New Baskets from Your Favorite Vendor!"
            ).first()

            if existing_notification:
                print(f"Duplicate vendor basket notification prevented for user {user.id}")
                continue

            # Create site notification
            notification = UserNotification(
                subject="New Baskets from Your Favorite Vendor!",
                message=message,
                link=f"/user/vendors/{vendor.id}#markets",
                user_id=user.id,
                vendor_id=vendor.id,
                created_at=datetime.now(timezone.utc),
                is_read=False
            )
            notifications.append(notification)

            # Send email notification if enabled and market is available
            # Check if in dev mode
            is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
            if is_production:
                if settings.email_fav_vendor_new_basket and market:
                    try:
                        send_email_user_fav_vendor_new_basket_task.delay(
                            user.email, user.id, market.id, vendor.id,
                            f"/user/markets/{market.id}?day={target.market_day_id}#vendors", 
                            f"/user/vendors/{vendor.id}")
                        print(f"Email sent to {user.email} for new basket from favorite vendor")
                    except Exception as e:
                        print(f"Error sending email to {user.email}: {e}")

        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error in fav_vendor_new_baskets: {e}")
    finally:
        session.close()

# User - New Blog Post
@listens_for(Blog, 'after_insert')
def schedule_blog_notifications(mapper, connection, target):
    session = Session(bind=connection)
    # print(inspect.currentframe().f_code.co_name)
    try:
        now = datetime.now(timezone.utc).date()
        
        # Ensure target.post_date is converted to date for comparison
        if isinstance(target.post_date, datetime):
            post_date = target.post_date.date()
        else:
            post_date = target.post_date
        
        # If it's today or in the past, send immediately
        if post_date <= now:
            task_id = str(uuid4())
            send_blog_notifications.apply_async(
                args=[target.id],
                kwargs={"task_id": task_id}
            )
            
            connection.execute(
                Blog.__table__.update()
                .where(Blog.id == target.id)
                .values(
                    notifications_sent=True,
                    task_id=task_id
                )
            )
        else:
            connection.execute(
                Blog.__table__.update()
                .where(Blog.id == target.id)
                .values(notifications_sent=False)
            )

        print(f"Blog ID={target.id} set for notifications on {target.post_date}")

    except Exception as e:
        session.rollback()
        print(f"Error in schedule_blog_notifications: {e}")
    finally:
        session.close()

@listens_for(Blog, 'after_insert')
def flag_blog_for_notifications(mapper, connection, target):
    pass

@listens_for(Blog, 'after_update')
def update_blog_notification_status(mapper, connection, target):
    insp = SQLAlchemyInspect(target)
    if insp.attrs.post_date.history.has_changes():
        connection.execute(
            Blog.__table__.update()
            .where(Blog.id == target.id)
            .values(notifications_sent=False)
        )
        
# if blog is scheduled for the future and deleted before it is published
# @listens_for(Blog, 'before_delete')
# def delete_scheduled_blog_notifications(mapper, connection, target):
#     session = Session(bind=connection)
#     # print(inspect.currentframe().f_code.co_name)
#     try:
#         if target.task_id:
#             task_id = target.task_id
#             print(f"Attempting to delete scheduled task {task_id}")
            
#             # Revoke the task with terminate=True and signal=True for immediate effect
#             celery.control.revoke(task_id, terminate=True, signal='SIGKILL')
            
#             # For completeness, also try the AsyncResult approach
#             try:
#                 result = celery.AsyncResult(task_id)
#                 result.revoke(terminate=True)
#                 print(f"Revoked task using AsyncResult: {task_id}")
#             except Exception as e:
#                 print(f"AsyncResult revocation failed: {e}")
            
#             # Delete all related notifications
#             for model in [UserNotification, VendorNotification, AdminNotification]:
#                 if model.__table__.exists(bind=session.bind):
#                     notifications = session.query(model).filter(
#                         model.task_id == task_id
#                     ).all()
#                     for notification in notifications:
#                         session.delete(notification)
            
#             # Clean up any entries in Celery's results backend
#             try:
#                 if hasattr(celery.backend, 'delete'):
#                     celery.backend.delete(task_id)
#                     print(f"Deleted task result from backend: {task_id}")
#             except Exception as e:
#                 print(f"Failed to delete from result backend: {e}")
                
#             session.commit()
            
#     except Exception as e:
#         session.rollback()
#         print(f"Error deleting scheduled blog notifications: {e}")
#         import traceback
#         traceback.print_exc()
#     finally:
#         session.close()

# This function was removed as vendor_market_event_or_schedule_change now handles both cases

# Vendor User - Basket Sold   
@listens_for(Basket, 'after_update')
def vendor_basket_sold(mapper, connection, target):
    session = Session(bind=connection)
    try:
        # Check if is_sold changed from False to True
        state = SQLAlchemyInspect(target)
        history = state.attrs.is_sold.history

        if not history.has_changes() or not history.added or history.added[0] != True:
            return  # Skip if is_sold didn't change or was already True

        print(f"Processing notification for basket {target.id}")

        # Retrieve the vendor
        vendor = session.query(Vendor).get(target.vendor_id)
        if not vendor:
            print(f"Vendor not found for Vendor ID: {target.vendor_id}")
            return

        # Retrieve the market_day associated with the basket
        market_day = session.query(MarketDay).filter_by(id=target.market_day_id).first()
        if not market_day:
            print(f"Market Day not found for MarketDay ID: {target.market_day_id}")
            return

        # Ensure sale_date is a valid date
        if not target.sale_date:
            print(f"Skipping notification. No sale_date found for Basket ID {target.id}.")
            return

        sale_date = target.sale_date
        now_utc = datetime.now(timezone.utc)

        # Set the scheduled notification time for 6AM on the sale date (UTC)
        sale_day_6am_utc = datetime.combine(sale_date, datetime.min.time()).replace(tzinfo=timezone.utc) + timedelta(hours=6)

        # Retrieve vendor users with notifications enabled
        vendor_users = session.query(VendorUser).join(SettingsVendor).filter(
            SettingsVendor.vendor_user_id == VendorUser.id,
            SettingsVendor.site_basket_sold == True
        ).all()

        matched_vendor_users = []
        for vendor_user in vendor_users:
            if not vendor_user.vendor_id or not isinstance(vendor_user.vendor_id, dict):
                continue

            if str(vendor.id) not in vendor_user.vendor_id:
                continue
            
            settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()
            if not settings or not settings.market_locations:
                continue

            # Ensure the market_day_id is in the user's market_locations list
            if market_day.id not in settings.market_locations:
                print(f"Skipping Vendor User {vendor_user.id} - MarketDay ID {market_day.id} not in their market locations.")
                continue

            # Ensure vendor user is associated with the correct vendor
            vendor_json = vendor_user.vendor_id
            if isinstance(vendor_json, str):
                vendor_json = json.loads(vendor_json)

            extracted_vendor_id = next(iter(vendor_json.values()), None)
            if extracted_vendor_id == vendor.id:
                matched_vendor_users.append(vendor_user)

        if not matched_vendor_users:
            print(f"No vendor users found with basket sold notifications enabled for Vendor ID={vendor.id}, skipping notification.")
            return

        # If the sale is before 6AM on sale_date, schedule a summary notification
        if now_utc < sale_day_6am_utc:
            print(f"Basket sold before 6AM on sale date. Scheduling summary notification at 6AM UTC on {sale_date}.")

            def send_summary_notification():
                with Session(bind=connection) as notif_session:
                    try:
                        # Get the total baskets sold so far for the vendor on that sale_date
                        total_sold = notif_session.query(Basket).filter(
                            Basket.vendor_id == vendor.id,
                            Basket.sale_date == sale_date,
                            Basket.is_sold == True
                        ).count()

                        if total_sold == 0:
                            print(f"No baskets were sold before 6AM on sale_date {sale_date}. No summary notification needed.")
                            return

                        notifications = []
                        for vendor_user in matched_vendor_users:
                            # Get vendor user settings for email/SMS
                            settings = notif_session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()
                            
                            # Create site notification
                            notifications.append(VendorNotification(
                                subject="Basket Sales Update!",
                                message=f"You have sold {total_sold} baskets so far for today ({sale_date}).",
                                link=f"/vendor/dashboard",
                                vendor_id=vendor.id,
                                vendor_user_id=vendor_user.id,
                                created_at=datetime.now(timezone.utc),
                                is_read=False
                            ))

                            # Get market and basket info for email
                            basket_info = notif_session.query(Basket).filter(
                                Basket.vendor_id == vendor.id,
                                Basket.sale_date == sale_date,
                                Basket.is_sold == True
                            ).first()
                            
                            if basket_info:
                                basket_market_day = notif_session.query(MarketDay).filter_by(id=basket_info.market_day_id).first()
                                basket_market = basket_market_day.market if basket_market_day else None

                                # Send email notification if enabled
                                # Check if in dev mode
                                is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
                                if is_production:
                                    if settings and settings.email_basket_sold and basket_market:
                                        try:
                                            send_email_vendor_basket_sold_task.delay(
                                                vendor_user.email, vendor_user.id, basket_market.id, vendor.id,
                                                total_sold, basket_info.pickup_start, basket_info.pickup_end, sale_date
                                            )
                                            print(f"Summary email sent to {vendor_user.email} for {total_sold} baskets sold")
                                        except Exception as e:
                                            print(f"Error sending summary email to {vendor_user.email}: {e}")

                                    # Send SMS notification if enabled
                                    if settings and settings.text_basket_sold and vendor_user.phone:
                                        try:
                                            basket_text = "baskets" if total_sold > 1 else "basket"
                                            body = f"Hi {vendor_user.first_name}! {vendor.name} sold {total_sold} {basket_text} on {sale_date.strftime('%B %d')}. Pickup details: www.gingham.nyc/vendor/dashboard?tab=baskets Reply STOP to unsubscribe."
                                            send_sms_task(body, vendor_user.phone)
                                            print(f"Summary SMS sent to {vendor_user.phone} for {total_sold} baskets sold")
                                        except Exception as e:
                                            print(f"Error sending summary SMS to {vendor_user.phone}: {e}")

                        if notifications:
                            notif_session.bulk_save_objects(notifications)
                            notif_session.commit()
                            print(f"Summary notification sent to {len(notifications)} vendor users.")

                    except Exception as e:
                        print(f"Error sending summary notification: {e}")

            # Schedule the summary notification for 6AM on the sale date
            delay = (sale_day_6am_utc - now_utc).total_seconds()
            Timer(delay, send_summary_notification).start()
            return  # Skip the immediate notification in this case

        # If it's after 6AM on sale_date, send an individual notification for each basket sold
        notifications = []
        for vendor_user in matched_vendor_users:
            # Get vendor user settings for email/SMS
            settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()
            
            # Create site notification
            notifications.append(VendorNotification(
                subject="Basket Sold!",
                message=f"One of your baskets has sold.",
                link=f"/vendor/dashboard?tab=baskets",
                vendor_id=vendor.id,
                vendor_user_id=vendor_user.id,
                created_at=datetime.now(timezone.utc),
                is_read=False
            ))

            # Send email notification if enabled
            # Check if in dev mode
            is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
            if is_production:
                if settings and settings.email_basket_sold:
                    try:
                        send_email_vendor_basket_sold_task.delay(
                            vendor_user.email, vendor_user, market_day.market, vendor,
                            1, target.pickup_start, target.pickup_end, sale_date
                        )
                        print(f"Email sent to {vendor_user.email} for basket sold")
                    except Exception as e:
                        print(f"Error sending email to {vendor_user.email}: {e}")

                # Send SMS notification if enabled
                if settings and settings.text_basket_sold and vendor_user.phone:
                    try:
                        send_sms_task_vendor_basket_sold(
                            vendor_user.phone, vendor_user, vendor, 1, sale_date, "/vendor/dashboard?tab=baskets"
                        )
                        print(f"SMS sent to {vendor_user.phone} for basket sold")
                    except Exception as e:
                        print(f"Error sending SMS to {vendor_user.phone}: {e}")

        # Save all notifications in bulk
        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error in vendor_basket_sold: {e}")
    finally:
        session.close()
        
@listens_for(VendorMarket, 'after_insert')
def notify_vendor_users_new_market_location(mapper, connection, target):
    session = get_db_session(connection)
    try:
        # Retrieve all vendor users associated with this vendor
        vendor_users = session.query(VendorUser).filter(
            VendorUser.vendor_id.contains({target.vendor_id: target.vendor_id})
        ).all()

        if not vendor_users:
            return

        notifications = []
        for vendor_user in vendor_users:
            # Settings
            settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()
            if settings:
                existing_market_locations = set(settings.market_locations or [])
                if target.market_day_id not in existing_market_locations:
                    updated_market_locations = list(existing_market_locations.union({target.market_day_id}))
                    settings.market_locations = updated_market_locations
                    session.commit()

                    # Robustly fetch market_day and market
                    market_day = session.query(MarketDay).filter_by(id=target.market_day_id).first()
                    if not market_day:
                        print(f"notify_vendor_users_new_market_location: MarketDay not found for ID {target.market_day_id}, skipping notification.")
                        continue
                    market = session.query(Market).filter_by(id=market_day.market_id).first() if market_day else None
                    if not market:
                        print(f"notify_vendor_users_new_market_location: Market not found for MarketDay ID {target.market_day_id}, skipping notification.")
                        continue

                    notifications.append(VendorNotification(
                        subject="New Market Location Added",
                        message=f"A new market location has been added to your notifications list: {market.name}. Go to profile settings to edit market location notifications.",
                        link="/vendor/profile",
                        vendor_id=target.vendor_id,
                        vendor_user_id=vendor_user.id,
                        created_at=datetime.now(timezone.utc),
                        is_read=False
                    ))
        if notifications:
            session.bulk_save_objects(notifications)
            safe_commit(session)
    except Exception as e:
        session.rollback()
        print(f"Error notifying vendor users for new VendorMarket entry: {e}")
    finally:
        safe_close(session)
        
# @listens_for(QRCode, "after_insert")
# def handle_qr_code_deletion(mapper, connection, target):
#     session = Session(bind=connection)
#     # print(inspect.currentframe().f_code.co_name)
#     try:
#         # Get the current UTC time
#         current_time = datetime.now(timezone.utc)
#         delete_at = current_time.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=2)
        
#         # Retrieve the sale_date of the associated basket
#         basket = session.query(Basket).filter_by(id=target.basket_id).first()
#         if not basket or not basket.sale_date:
#             print(f"Skipping QR Code deletion. No sale_date found for Basket ID {target.basket_id}.")
#             return

#         # Ensure sale_date is a datetime.date (if not already)
#         if isinstance(basket.sale_date, datetime):
#             sale_date = basket.sale_date.date()
#         elif isinstance(basket.sale_date, date):
#             sale_date = basket.sale_date
#         else:
#             print(f"Unexpected type for sale_date: {type(basket.sale_date)}")
#             return

#         # Function to delete the QR code
#         def delete_qr_code():
#             delete_session = Session()
#             try:
#                 qr_code = delete_session.query(QRCode).filter_by(id=target.id).first()
#                 if not qr_code:
#                     print(f"QR Code ID {target.id} already deleted or does not exist. Skipping.")
#                     return

#                 delete_session.delete(qr_code)
#                 delete_session.commit()
#                 print(f"Successfully deleted QR Code ID {target.id}.")
#             except Exception as e:
#                 delete_session.rollback()
#                 print(f"Error deleting QR Code ID {target.id}: {e}")
#             finally:
#                 delete_session.close()

#         # If sale_date + 2 days has already passed, delete immediately
#         if delete_at <= current_time:
#             delete_qr_code()
#         else:
#             # Otherwise, schedule deletion
#             delay = (delete_at - current_time).total_seconds()
#             Timer(delay, delete_qr_code).start()

#     except Exception as e:
#         print(f"Error handling QR Code deletion: {e}")
#     finally:
#         session.close()
        
@listens_for(Basket, 'after_insert')
def notify_fav_market_new_baskets(mapper, connection, target):
    session = Session(bind=connection)
    # print(inspect.currentframe().f_code.co_name)
    try:
        # Retrieve the market associated with the basket
        market = session.query(Market).join(MarketDay).filter(
            MarketDay.id == target.market_day_id
        ).first()

        if not market:
            print(f"Market not found for MarketDay ID: {target.market_day_id}. Skipping notification.")
            return

        # Retrieve users who have favorited this market
        favorited_users = session.query(User).join(MarketFavorite).filter(
            MarketFavorite.market_id == market.id
        ).all()

        if not favorited_users:
            print(f"No users have favorited Market ID {market.id}. No notifications will be created.")
            return

        # Check if a notification for this market and basket type already exists today
        # We check per-user to avoid blocking all users if one already got notified
        today = datetime.now(timezone.utc).date()

        # Retrieve the vendor who created the basket for email context
        vendor = session.query(Vendor).filter_by(id=target.vendor_id).first()
        if not vendor:
            print(f"Vendor not found for Basket vendor_id: {target.vendor_id}")
            return

        # Prepare notifications for favorited users
        notifications = []
        for user in favorited_users:
            # Check user notification settings
            settings = session.query(SettingsUser).filter_by(user_id=user.id).first()
            if not settings or not settings.site_fav_market_new_basket:
                print(f"User ID={user.id} has new basket notifications disabled.")
                continue
                
            # Check for duplicate notifications per user - prevent spam from multiple baskets per day
            existing_notification = session.query(UserNotification).filter(
                UserNotification.user_id == user.id,
                UserNotification.market_id == market.id,
                UserNotification.subject == "New Baskets for Sale!",
                UserNotification.created_at >= today
            ).first()
            
            if existing_notification:
                print(f"Duplicate market basket notification prevented for user {user.id}")
                continue

            # Create site notification
            notifications.append(UserNotification(
                subject="New Baskets for Sale!",
                message=f"New baskets have been added to one of your favorite markets, {market.name}, check it out!",
                link=f"/user/markets/{market.id}?day={target.market_day_id}#vendors",
                user_id=user.id,
                market_id=market.id,
                created_at=datetime.now(timezone.utc),
                is_read=False
            ))

            # Send email notification if enabled
            # Check if in dev mode
            is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
            if is_production:
                if settings.email_fav_market_new_basket:
                    try:
                        send_email_user_fav_market_new_basket_task.delay(
                            user.email, user.id, market.id, vendor.id,
                            f"/user/markets/{market.id}?day={target.market_day_id}#vendors",
                            f"/user/vendors/{vendor.id}"
                        )
                        print(f"Email sent to {user.email} for new basket in favorite market")
                    except Exception as e:
                        print(f"Error sending email to {user.email}: {e}")

                # Send SMS notification if enabled
                if settings.text_fav_market_new_basket and user.phone:
                    try:
                        body = f"Hi {user.first_name}! New baskets available at {market.name} from {vendor.name}. Get yours: www.gingham.nyc/user/vendors/{vendor.id} Reply STOP to unsubscribe."
                        send_sms_task(body, user.phone)
                        print(f"SMS sent to {user.phone} for new basket in favorite market")
                    except Exception as e:
                        print(f"Error sending SMS to {user.phone}: {e}")

        # Save notifications
        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error in notify_fav_market_new_baskets: {e}")
    finally:
        session.close()
        

@listens_for(Basket, 'after_insert')
def schedule_and_notify_basket_pickup(mapper, connection, target):
    # print(inspect.currentframe().f_code.co_name)
    if os.environ.get("FLASK_ENV") == "development" and os.environ.get("SKIP_TIMERS_DURING_SEEDING") == "true":
        print("Skipping basket pickup notification during seeding.", flush=True)
        return
    try:
        # Pull raw values you need right away
        basket_id = target.id
        pickup_start = target.pickup_start
        pickup_end = target.pickup_end

        if not pickup_start:
            print(f"Skipping notification. No pickup_time found for Basket ID {basket_id}.")
            return

        now_utc = datetime.now(timezone.utc)
        pickup_datetime_utc = datetime.combine(now_utc.date(), pickup_start).replace(tzinfo=timezone.utc)
        pickup_end_utc = datetime.combine(now_utc.date(), pickup_end).replace(tzinfo=timezone.utc)
        delay = (pickup_datetime_utc - now_utc).total_seconds()

        if delay <= 0:
            return

        def send_notification():
            with Session(bind=connection) as notif_session:
                try:
                    basket = notif_session.query(Basket).filter_by(id=basket_id).first()
                    if not basket or basket.is_picked_up:
                        print(f"Skipping notification. Basket ID {basket_id} does not exist or is already picked up.")
                        return

                    user = notif_session.query(User).filter_by(id=basket.user_id).first()
                    if not user:
                        print(f"User for Basket ID {basket_id} not found. Skipping notification.")
                        return

                    settings = notif_session.query(SettingsUser).filter_by(user_id=user.id).first()
                    if not settings or not settings.site_basket_pickup_time:
                        print(f"User ID={user.id} has pickup notifications disabled.")
                        return

                    pickup_time_str = time_converter(pickup_datetime_utc.time())
                    pickup_end_str = time_converter(pickup_end_utc.time())
                    current_month = datetime.now(timezone.utc).strftime("%B")
                    current_day = datetime.now(timezone.utc).strftime("%d")

                    # Create site notification
                    notification = UserNotification(
                        subject="Time to Pick Up Your Basket!",
                        message=(
                            f"Your purchased basket is ready for pickup! "
                            f"Pick it up between {pickup_time_str} and {pickup_end_str} on {current_month} {current_day}."
                        ),
                        link="/user/pick-up",
                        user_id=user.id,
                        created_at=pickup_datetime_utc,
                        is_read=False
                    )

                    notif_session.add(notification)
                    notif_session.commit()
                    print(f"Pickup reminder sent for Basket ID={basket_id}")

                    # Get vendor and market data for email/SMS
                    vendor = notif_session.query(Vendor).filter_by(id=basket.vendor_id).first()
                    market_day = notif_session.query(MarketDay).filter_by(id=basket.market_day_id).first()
                    market = market_day.market if market_day else None

                    if vendor and market:
                        # Send email notification if enabled
                        # Check if in dev mode
                        is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
                        if is_production:
                            if settings.email_basket_pickup_time:
                                try:
                                    send_email_user_basket_pickup_time_task.delay(
                                        user.email, user.id, market.id, vendor.id, basket.id,
                                        f"/user/markets/{market.id}?day={basket.market_day_id}#vendors",
                                        f"/user/vendors/{vendor.id}"
                                    )
                                    print(f"Pickup email sent to {user.email}")
                                except Exception as e:
                                    print(f"Error sending pickup email to {user.email}: {e}")

                            # Send SMS notification if enabled
                            if settings.text_basket_pickup_time and user.phone:
                                try:
                                    pickup_start_str = time_converter(basket.pickup_start)
                                    pickup_end_str = time_converter(basket.pickup_end)
                                    body = f"Hi {user.first_name}! Time to pick up your basket from {vendor.name}. Pickup: {pickup_start_str}-{pickup_end_str}. Details: www.gingham.nyc/user/vendors/{vendor.id} Reply STOP to unsubscribe."
                                    send_sms_task(body, user.phone)
                                    print(f"Pickup SMS sent to {user.phone}")
                                except Exception as e:
                                    print(f"Error sending pickup SMS to {user.phone}: {e}")

                except Exception as e:
                    print(f"Error sending basket pickup notification: {e}")

        Timer(delay, send_notification).start()

    except Exception as e:
        print(f"Error scheduling pickup notification: {e}")
        
@listens_for(User, 'after_insert')
def create_user_settings(mapper, connection, target):
    session = Session(bind=connection)
    # print(inspect.currentframe().f_code.co_name)
    try:
        # Check if settings already exist (just in case)
        existing_settings = session.query(SettingsUser).filter_by(user_id=target.id).first()
        if existing_settings:
            return

        # Create default settings for the new user
        new_settings = SettingsUser(user_id=target.id)
        session.add(new_settings)
        session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error creating settings for User ID {target.id}: {e}")
    finally:
        session.close()

@listens_for(VendorReview, 'after_update')
def notify_user_vendor_review_response(mapper, connection, target):
    session = Session(bind=connection)
    # print(inspect.currentframe().f_code.co_name)
    try:
        # Ensure the response field has been updated
        if not target.vendor_response or target.vendor_response.strip() == "":
            print(f"No response detected for Review ID {target.id}. Skipping notification.")
            return

        # Retrieve the user who wrote the review
        user = session.query(User).filter_by(id=target.user_id).first()
        if not user:
            print(f"User for Review ID {target.id} not found. Skipping notification.")
            return

        # Retrieve the vendor details
        vendor = session.query(Vendor).filter_by(id=target.vendor_id).first()
        if not vendor:
            print(f"Vendor for Review ID {target.id} not found. Skipping notification.")
            return

        # Retrieve user notification settings
        settings = session.query(SettingsUser).filter_by(user_id=user.id).first()
        if not settings:
            print(f"No settings found for User ID={user.id}. Skipping notification.")
            return

        # Prepare notification message
        message = f"The vendor, {vendor.name}, has responded to your review. Click to see their response!"

        # Prepare notifications (site, email, text)
        notifications = []

        # Site Notification
        if settings.site_vendor_review_response:
            notifications.append(UserNotification(
                subject="Vendor Responded to Your Review",
                message=message,
                link=f"/user/vendors/{vendor.id}#reviews",
                user_id=user.id,
                created_at=datetime.now(timezone.utc),
                is_read=False
            ))
            
        # Save site notifications
        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()

        # Send email notification if enabled
        # Check if in dev mode
        is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
        if is_production:
            if settings.email_vendor_review_response:
                try:
                    send_email_user_vendor_review_response_task.delay(
                        user.email, user.id, vendor.id, target.id, f"/user/vendors/{vendor.id}#reviews"
                    )
                    print(f"Email sent to {user.email} for vendor review response")
                except Exception as e:
                    print(f"Error sending email to {user.email}: {e}")

    except Exception as e:
        session.rollback()
        print(f"Error notifying user about vendor review response: {e}")
    finally:
        session.close()

@listens_for(Market, 'after_insert')
def notify_users_new_market_in_state(mapper, connection, target):
    session = Session(bind=connection)
    # print(inspect.currentframe().f_code.co_name)
    try:
        # Retrieve users who reside in the same city as the new market (case-insensitive)
        users_in_state = session.query(User).filter(func.lower(User.state) == func.lower(target.state)).all()

        if not users_in_state:
            print(f"No users found in {target.city} {target.state}. No notifications will be created.")
            return

        # Prepare notifications (site, email)
        notifications = []
        for user in users_in_state:
            # Retrieve user notification settings
            settings = session.query(SettingsUser).filter_by(user_id=user.id).first()
            if not settings:
                print(f"No settings found for User ID={user.id}. Skipping notification.")
                continue

            # Site Notification
            if settings.site_new_market_in_city:
                notifications.append(UserNotification(
                    subject=f"New Market in {user.state}",
                    message=f"A new market, {target.name}, has opened in {user.city}! Click to explore.",
                    link=f"/user/markets/{target.id}",
                    user_id=user.id,
                    created_at=datetime.now(timezone.utc),
                    is_read=False
                ))

            # Send email notification if enabled
            # Check if in dev mode
            is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
            if is_production:
                if settings.email_new_market_in_city:
                    try:
                        send_email_user_new_market_in_city_task.delay(
                            user.email, user.id, target.id, f"/user/markets/{target.id}")
                        print(f"Email sent to {user.email} for new market in city")
                    except Exception as e:
                        print(f"Error sending email to {user.email}: {e}")

        # Save site notifications
        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error notifying users about new market in city: {e}")
    finally:
        session.close()

@listens_for(VendorUser, 'after_insert')
def create_vendor_user_settings(mapper, connection, target):
    session = Session(bind=connection)
    # print(inspect.currentframe().f_code.co_name)
    try:
        existing_settings = session.query(SettingsVendor).filter_by(vendor_user_id=target.id).first()
        if existing_settings:
            print(f"Settings already exist for Vendor User ID {target.id}. Skipping creation.")
            return

        new_settings = SettingsVendor(vendor_user_id=target.id)
        session.add(new_settings)
        session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error creating settings for Vendor User ID {target.id}: {e}")
    finally:
        session.close()
        
@listens_for(VendorReview, 'after_insert')
def notify_vendor_users_new_review(mapper, connection, target):
    session = Session(bind=connection)
    # print(inspect.currentframe().f_code.co_name)
    try:
        # Retrieve vendor users associated with this vendor
        vendor_users = session.query(VendorUser).filter(
            VendorUser.vendor_id.contains({target.vendor_id: target.vendor_id})
        ).all()

        if not vendor_users:
            print(f"No vendor users found for Vendor ID {target.vendor_id}. No notifications will be created.")
            return

        # Retrieve the vendor for email context
        vendor = session.query(Vendor).filter_by(id=target.vendor_id).first()
        if not vendor:
            print(f"Vendor not found for Vendor ID: {target.vendor_id}")
            return

        # Prepare notifications (site, email, text)
        notifications = []
        for vendor_user in vendor_users:
            if not vendor_user.vendor_id or not isinstance(vendor_user.vendor_id, dict):
                continue

            if str(vendor.id) not in vendor_user.vendor_id:
                continue
            
            # Retrieve vendor user notification settings
            settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()
            if not settings:
                print(f"No settings found for Vendor User ID={vendor_user.id}. Skipping notification.")
                continue

            message = f"A new review has been left for your vendor account. Click to view."

            # Site Notification
            if settings.site_new_review:
                notifications.append(VendorNotification(
                    subject="New Vendor Review!",
                    message=message,
                    link=f"/vendor/dashboard?tab=reviews",
                    vendor_user_id=vendor_user.id,
                    vendor_id=target.vendor_id,
                    created_at=datetime.now(timezone.utc),
                    is_read=False
                ))

            # Send email notification if enabled
            # Check if in dev mode
            is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
            # if is_production:
            if settings.email_new_review:
                try:
                    send_email_vendor_new_review_task.delay(
                        vendor_user.email, vendor_user.id, vendor.id, target.id, f"/vendor/dashboard?tab=reviews"
                    )
                    print(f"Email sent to {vendor_user.email} for new vendor review")
                except Exception as e:
                    print(f"Error sending email to {vendor_user.email}: {e}")

        # Save site notifications
        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error notifying vendor users about new review: {e}")
    finally:
        session.close()
        
@listens_for(AdminUser, 'after_insert')
def create_admin_settings(mapper, connection, target):
    session = Session(bind=connection)
    # print(inspect.currentframe().f_code.co_name)
    try:
        # Check if settings already exist
        existing_settings = session.query(SettingsAdmin).filter_by(admin_id=target.id).first()
        if existing_settings:
            return

        # Create default settings for the new admin
        new_settings = SettingsAdmin(admin_id=target.id)
        session.add(new_settings)
        session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error creating settings for Admin ID {target.id}: {e}")
    finally:
        session.close()
        
@listens_for(Vendor, 'after_insert')
def notify_admins_new_vendor(mapper, connection, target):
    session = Session(bind=connection)
    # print(inspect.currentframe().f_code.co_name)
    try:
        # Retrieve all admins
        admins = session.query(AdminUser).all()

        if not admins:
            print("No admins found. No notifications will be created.")
            return

        # Prepare notifications
        notifications = []
        for admin in admins:
            # Retrieve admin notification settings
            settings = session.query(SettingsAdmin).filter_by(admin_id=admin.id).first()
            if not settings:
                print(f"No settings found for Admin ID={admin.id}. Skipping notification.")
                continue

            # Site Notification (with proper settings check)
            if settings.site_new_vendor:
                notifications.append(AdminNotification(
                    subject="New Vendor Registration",
                    message=f"A new vendor, {target.name}, has registered on the platform.",
                    link="/admin/vendors",
                    admin_id=admin.id,
                    admin_role=admin.admin_role,
                    created_at=datetime.now(timezone.utc),
                    is_read=False
                ))

            # Send email notification if enabled
            # Check if in dev mode
            is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
            if is_production:
                if settings.email_new_vendor:
                    try:
                        send_email_admin_new_vendor_task.delay(
                            admin.email, admin.id, target.id, f"/admin/vendors/{target.id}"
                        )
                        print(f"Email sent to {admin.email} for new vendor registration")
                    except Exception as e:
                        print(f"Error sending email to {admin.email}: {e}")

        # Save notifications
        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error notifying admins about new vendor: {e}")
    finally:
        session.close()

@listens_for(Instruction, 'before_delete')
def delete_instruction_images(mapper, connection, target):
    if isinstance(target.images, dict):
        for image_path in target.images.values():
            UPLOAD_FOLDER = os.environ['IMAGE_UPLOAD_FOLDER']
            try:
                if image_path.startswith("/api/uploads/instruction-images/"):
                    rel_path = image_path.replace("/api/uploads", "")
                    abs_path = os.path.join(UPLOAD_FOLDER, rel_path.lstrip("/"))
                    dir_path = os.path.dirname(abs_path)
                    if os.path.exists(abs_path):
                        os.remove(abs_path)
                        print('Deleted image:', abs_path)
                        if os.path.isdir(dir_path) and not os.listdir(dir_path):
                            os.rmdir(dir_path)
                            print('Deleted empty image folder:', dir_path)
            except Exception as e:
                print(f"Error deleting image file {image_path}: {e}")

@listens_for(Recipe, 'before_delete')
def delete_recipe_image(mapper, connection, target):
    image_path = target.image
    if isinstance(image_path, str) and image_path.startswith("/api/uploads/recipe-images/"):
        UPLOAD_FOLDER = os.environ['IMAGE_UPLOAD_FOLDER']
        try:
            rel_path = image_path.replace("/api/uploads", "")
            abs_path = os.path.join(UPLOAD_FOLDER, rel_path.lstrip("/"))
            dir_path = os.path.dirname(abs_path)

            if os.path.exists(abs_path):
                os.remove(abs_path)
                print("Deleted recipe image:", abs_path)

                if os.path.isdir(dir_path) and not os.listdir(dir_path):
                    os.rmdir(dir_path)
                    print("Deleted empty recipe image folder:", dir_path)

        except Exception as e:
            print(f"Error deleting recipe image {image_path}: {e}")

@listens_for(Event, 'after_delete')
def delete_event_notifications(mapper, connection, target):
    try:
        # Get the session to query for specific notifications
        session = Session(bind=connection)
        
        # More specific matching: find notifications that mention this exact event title
        is_schedule_change = target.schedule_change
        vendor_notifications = []
        user_notifications = []
        user_market_notifications = []
        
        # For vendor notifications (market events)
        if target.market_id:
            if is_schedule_change:
                # Delete schedule change notifications that match the exact event title
                vendor_notifications = session.query(VendorNotification).filter(
                    and_(
                        VendorNotification.market_id == target.market_id,
                        VendorNotification.subject == "Market Schedule Change",
                        VendorNotification.message.like(f"%. Event: {target.title}.%")
                    )
                ).all()
            else:
                # Delete new event notifications that specifically mention this exact event title
                vendor_notifications = session.query(VendorNotification).filter(
                    and_(
                        VendorNotification.market_id == target.market_id,
                        VendorNotification.subject == "New Event in Your Market!",
                        VendorNotification.message.like(f"%: {target.title}.%")
                    )
                ).all()
            
            for notification in vendor_notifications:
                print(f"Deleting vendor notification ID {notification.id}: '{notification.subject}' for vendor user {notification.vendor_user_id}")
                session.delete(notification)
        
        # For user notifications (favorite vendor events)
        if target.vendor_id:
            if is_schedule_change:
                # Delete schedule change notifications for vendor events
                user_notifications = session.query(UserNotification).filter(
                    and_(
                        UserNotification.vendor_id == target.vendor_id,
                        UserNotification.subject == "Vendor Schedule Change",
                        UserNotification.message.like(f"%. Event: {target.title}.%")
                    )
                ).all()
            else:
                # Delete new event notifications that specifically mention this exact event title
                user_notifications = session.query(UserNotification).filter(
                    and_(
                        UserNotification.vendor_id == target.vendor_id,
                        UserNotification.subject == "New Event from Your Favorite Vendor!",
                        UserNotification.message.like(f"%: {target.title}%")
                    )
                ).all()
            
            for notification in user_notifications:
                print(f"Deleting user notification ID {notification.id}: '{notification.subject}' for user {notification.user_id}")
                session.delete(notification)
        
        # For user notifications (favorite market events)
        if target.market_id:
            if is_schedule_change:
                # Delete schedule change notifications for market events
                user_market_notifications = session.query(UserNotification).filter(
                    and_(
                        UserNotification.market_id == target.market_id,
                        UserNotification.subject == "Market Schedule Change",
                        UserNotification.message.like(f"%. Event: {target.title}.%")
                    )
                ).all()
            else:
                # Delete new event notifications for market events
                user_market_notifications = session.query(UserNotification).filter(
                    and_(
                        UserNotification.market_id == target.market_id,
                        UserNotification.subject == "New Event in Your Favorite Market!",
                        UserNotification.message.like(f"%: {target.title}%")
                    )
                ).all()
            
            for notification in user_market_notifications:
                print(f"Deleting user market notification ID {notification.id}: '{notification.subject}' for user {notification.user_id}")
                session.delete(notification)
        
        session.commit()
        
        # Count total notifications deleted
        total_vendor = len(vendor_notifications) if target.market_id else 0
        total_user_vendor = len(user_notifications) if target.vendor_id else 0
        total_user_market = len(user_market_notifications) if target.market_id else 0
        total_deleted = total_vendor + total_user_vendor + total_user_market
        
        print(f"Deleted {total_deleted} notifications for event '{target.title}': {total_vendor} vendor, {total_user_vendor} user-vendor, {total_user_market} user-market")
        
    except Exception as e:
        session.rollback() if session else None
        print(f"Error deleting event notifications: {e}")
    finally:
        session.close() if session else None

@listens_for(AdminNotification, 'after_insert')
def notify_admin_product_request(mapper, connection, target):
    session = Session(bind=connection)
    try:
        # Only handle product-request notifications
        if target.subject != 'product-request':
            return

        # Get the admin who should receive this notification
        admin = session.query(AdminUser).filter_by(id=target.admin_id).first()
        if not admin:
            print(f"Admin not found for notification ID: {target.id}")
            return

        # Get the vendor associated with this request
        vendor = session.query(Vendor).filter_by(id=target.vendor_id).first()
        if not vendor:
            print(f"Vendor not found for notification ID: {target.id}")
            return

        # Extract the product from the message
        # Message format: "{vendor_name} has requested to for a new Product category: {product_name}."
        import re
        match = re.search(r'Product category: (.+)\.', target.message)
        new_product = match.group(1) if match else "Unknown Product"

        # Get admin settings for email/SMS preferences
        admin_settings = session.query(SettingsAdmin).filter_by(admin_id=admin.id).first()
        if admin_settings:
            # Send email notification if enabled
            is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
            if is_production:
                if admin_settings.email_product_request:
                    try:
                        send_email_admin_product_request_task.delay(
                            admin.email, admin.id, vendor.id, new_product, target.link or "/admin/vendors?tab=products"
                        )
                        print(f"Email sent to {admin.email} for product request")
                    except Exception as e:
                        print(f"Error sending email to {admin.email}: {e}")

                # Send SMS notification if enabled
                if admin_settings.text_product_request and admin.phone:
                    try:
                        body = f"Hi {admin.first_name}! {vendor.name} has requested a new product category: {new_product}. Manage: www.gingham.nyc/admin/vendors?tab=products Reply STOP to unsubscribe."
                        send_sms_task(body, admin.phone)
                        print(f"SMS sent to {admin.phone} for product request")
                    except Exception as e:
                        print(f"Error sending SMS to {admin.phone}: {e}")

    except Exception as e:
        print(f"Error in notify_admin_product_request: {e}")
    finally:
        session.close()

def send_monthly_statement_notifications() -> None:
    """Send monthly statement notifications to vendors on the 10th of each month.
    
    This function should be called by a scheduled job (cron/celery) on the 10th of each month.
    It notifies vendors who sold at least one basket in the previous month.
    """
    session = Session()
    try:
        # Get the current date and calculate the previous month
        now = datetime.now(timezone.utc)
        
        # Calculate the first day of the previous month
        first_day_current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if first_day_current_month.month == 1:
            # If current month is January, previous month is December of the previous year
            first_day_previous_month = first_day_current_month.replace(
                year=first_day_current_month.year - 1, 
                month=12
            )
        else:
            first_day_previous_month = first_day_current_month.replace(
                month=first_day_current_month.month - 1
            )
        
        # Calculate the last day of the previous month
        last_day_previous_month = first_day_current_month - timedelta(days=1)
        
        # Get all vendors who sold at least one basket in the previous month
        vendors_with_sales = session.query(Vendor.id).join(Basket).filter(
            and_(
                Basket.is_sold == True,
                Basket.sale_date >= first_day_previous_month.date(),
                Basket.sale_date <= last_day_previous_month.date()
            )
        ).distinct().all()
        
        if not vendors_with_sales:
            print("No vendors with sales in the previous month. No statement notifications will be sent.")
            return
        
        vendor_ids = [vendor.id for vendor in vendors_with_sales]
        previous_month_name = first_day_previous_month.strftime("%B %Y")
        
        # Prepare notifications
        notifications = []
        for vendor_id in vendor_ids:
            vendor = session.query(Vendor).get(vendor_id)
            if not vendor:
                continue
                
            # Get vendor users for this vendor
            vendor_users = get_vendor_users(vendor_id, session)
            if not vendor_users:
                continue
                
            for vendor_user in vendor_users:
                # Get vendor user settings
                settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()
                if not settings:
                    print(f"No settings found for Vendor User ID={vendor_user.id}. Skipping notification.")
                    continue
                
                # Check if site notifications are enabled
                if settings.site_new_statement:
                    # Check for duplicate notifications to avoid sending multiple times
                    existing_notification = session.query(VendorNotification).filter(
                        VendorNotification.vendor_user_id == vendor_user.id,
                        VendorNotification.vendor_id == vendor.id,
                        VendorNotification.subject == "New Monthly Statement Available",
                        VendorNotification.created_at >= first_day_current_month
                    ).first()
                    
                    if existing_notification:
                        print(f"Statement notification already exists for vendor user {vendor_user.id} this month")
                        continue
                    
                    # Create site notification
                    notification = VendorNotification(
                        subject="New Monthly Statement Available",
                        message=f"Your monthly statement for {previous_month_name} is now available for review.",
                        link="/vendor/sales#statements",
                        vendor_id=vendor.id,
                        vendor_user_id=vendor_user.id,
                        created_at=datetime.now(timezone.utc),
                        is_read=False
                    )
                    notifications.append(notification)
                
                # Send email notification if enabled
                # Check if in dev mode
                is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
                if is_production and settings.email_new_statement:
                    try:
                        # Import the email function
                        from utils.emails import send_email_vendor_new_statement
                        send_email_vendor_new_statement(
                            vendor_user.email, vendor_user, vendor, first_day_previous_month.month, first_day_previous_month.year
                        )
                        print(f"Statement email sent to {vendor_user.email} for {previous_month_name}")
                    except Exception as e:
                        print(f"Error sending statement email to {vendor_user.email}: {e}")
        
        # Save all notifications in bulk
        if notifications:
            session.bulk_save_objects(notifications)
            safe_commit(session)
            print(f"Sent {len(notifications)} monthly statement notifications for {previous_month_name}")
        else:
            print(f"No statement notifications to send for {previous_month_name}")
            
    except Exception as e:
        print(f"Error in send_monthly_statement_notifications: {e}")
        safe_rollback(session)
    finally:
        safe_close(session)

@listens_for(VendorNotification, 'after_insert')
def handle_vendor_notify_me_notification(mapper, connection, target):
    """Handle email and SMS notifications when users click 'notify me for more baskets'."""
    # Only handle "New Basket Interest" notifications (the subject set in the API endpoint)
    if target.subject != "New Basket Interest":
        return
        
    session = Session(bind=connection)
    try:
        # Check for duplicate notifications first - prevent spam
        if target.user_id:
            # Check if this user already has a recent "notify me" notification for this vendor
            existing_notification = session.query(VendorNotification).filter(
                VendorNotification.vendor_user_id == target.vendor_user_id,
                VendorNotification.vendor_id == target.vendor_id,
                VendorNotification.user_id == target.user_id,
                VendorNotification.subject == "New Basket Interest",
                VendorNotification.created_at >= datetime.now(timezone.utc) - timedelta(hours=24),  # Within last 24 hours
                VendorNotification.id != target.id  # Exclude the current notification
            ).first()
            
            if existing_notification:
                print(f"Duplicate notify me notification prevented for user {target.user_id} to vendor user {target.vendor_user_id}")
                session.delete(target)
                session.commit()
                return
        
        # Get the vendor user who should receive this notification
        vendor_user = session.query(VendorUser).get(target.vendor_user_id)
        if not vendor_user:
            print(f"Vendor user not found for VendorNotification ID {target.id}")
            return
            
        # Get vendor user settings
        settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()
        if not settings:
            print(f"No settings found for Vendor User ID={vendor_user.id}. Skipping notification.")
            return
            
        # Only proceed if vendor_notify_me site notifications are enabled (already created, so just check for email/SMS)
        if not settings.site_notify_me:
            # If site notifications are disabled, delete the notification that was just created
            session.delete(target)
            session.commit()
            print(f"Site notifications disabled for vendor user {vendor_user.id}. Notification removed.")
            return
            
        # Get the user who clicked notify me
        user = session.query(User).get(target.user_id) if target.user_id else None
        if not user:
            print(f"User not found for VendorNotification ID {target.id}")
            return
            
        # Get the vendor
        vendor = session.query(Vendor).get(target.vendor_id)
        if not vendor:
            print(f"Vendor not found for VendorNotification ID {target.id}")
            return
            
        # Send email notification if enabled
        # Check if in dev mode
        is_production = os.environ.get('VITE_ENVIRONMENT', 'development').lower() == 'production'
        if is_production and settings.email_notify_me:
            try:
                send_email_user_fav_vendor_schedule_change_task.delay(
                    vendor_user.email, vendor_user.id, vendor.id, user.id, target.link or "/vendor/dashboard?tab=baskets"
                )
                print(f"Notify me email sent to {vendor_user.email}")
            except Exception as e:
                print(f"Error sending notify me email to {vendor_user.email}: {e}")
                
        # Send SMS notification if enabled
        if is_production and settings.text_vendor_notify_me and vendor_user.phone:
            try:
                body = f"Hi {vendor_user.first_name}! A user ({user.first_name}) is interested in buying more baskets from {vendor.name}. Add more: www.gingham.nyc/vendor/dashboard?tab=baskets Reply STOP to unsubscribe."
                send_sms_task(body, vendor_user.phone)
                print(f"Notify me SMS sent to {vendor_user.phone}")
            except Exception as e:
                print(f"Error sending notify me SMS to {vendor_user.phone}: {e}")
                
    except Exception as e:
        print(f"Error in handle_vendor_notify_me_notification: {e}")
    finally:
        session.close()

def get_vendor_users(vendor_id: int, session: SQLAlchemySession) -> List[VendorUser]:
    """Get all vendor users for a given vendor ID."""
    try:
        vendor_users = session.query(VendorUser).filter(
            VendorUser.vendor_id.contains({str(vendor_id): vendor_id})
        ).all()
        print(f"Found {len(vendor_users)} vendor users for Vendor ID {vendor_id}")
        return vendor_users
    except Exception as e:
        print(f"Error getting vendor users for Vendor ID {vendor_id}: {str(e)}")
        return []

def validate_notification_settings(settings: Dict[str, Any]) -> bool:
    """Validate notification settings."""
    if not isinstance(settings, dict):
        return False
        
    required_fields = ['enabled', 'email', 'sms']
    if not all(field in settings for field in required_fields):
        return False
        
    if not isinstance(settings['enabled'], bool):
        return False
        
    if not isinstance(settings['email'], bool) or not isinstance(settings['sms'], bool):
        return False
        
    return True

def get_user_notification_settings(user: User) -> Dict[str, Any]:
    """Get user notification settings with defaults."""
    default_settings = {
        'enabled': True,
        'email': True,
        'sms': True
    }
    
    if not user.notification_settings:
        return default_settings
        
    try:
        settings = json.loads(user.notification_settings)
        if validate_notification_settings(settings):
            return settings
        return default_settings
    except Exception as e:
        print(f"Error parsing notification settings for User ID {user.id}: {e}")
        return default_settings