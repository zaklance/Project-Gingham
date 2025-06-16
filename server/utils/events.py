import os
import json
import inspect
from sqlalchemy import event, func, and_
from sqlalchemy.orm import Session
from sqlalchemy.event import listens_for
from datetime import datetime, date, timezone, timedelta, time
from threading import Timer
from uuid import uuid4
from models import (db, User, Market, MarketDay, Vendor, MarketReview, VendorReview, MarketFavorite, VendorFavorite, VendorMarket, VendorUser, AdminUser, Basket, Event, UserNotification, VendorNotification, AdminNotification, SettingsUser, SettingsVendor, SettingsAdmin, Blog, Recipe, Instruction)
from typing import List, Optional, Any, Union, Dict
from tasks import send_blog_notifications
from utils.emails import (
    send_email_user_fav_vendor_new_event,
    send_email_user_fav_vendor_schedule_change,
    send_email_user_fav_market_new_vendor,
    send_email_admin_reported_review,
    send_email_user_fav_vendor_new_basket,
    send_email_vendor_market_new_event,
    send_email_vendor_market_schedule_change,
    send_email_vendor_basket_sold,
    send_email_user_fav_market_new_basket,
    send_email_user_basket_pickup_time,
    send_email_user_vendor_review_response,
    send_email_user_new_market_in_city,
    send_email_vendor_new_review,
    send_email_admin_new_vendor,
    send_email_admin_product_request
)
from utils.sms import (
    send_sms_user_fav_vendor_schedule_change,
    send_sms_admin_reported_review,
    send_sms_admin_reported_market_review,
    send_sms_vendor_basket_sold,
    send_sms_user_fav_market_new_basket,
    send_sms_user_basket_pickup_time,
    send_sms_vendor_market_schedule_change,
    send_sms_admin_product_request
)

def get_db_session(connection: Optional[Any] = None) -> Session:
    """Get a database session, either from a connection or create a new one."""
    try:
        if connection:
            print("Creating session from existing connection")
            return Session(bind=connection)
        print("Creating new session")
        return Session()
    except Exception as e:
        print(f"Error creating database session: {e}")
        raise

def safe_commit(session: Session) -> None:
    """Safely commit a session with error handling."""
    try:
        print("Attempting to commit session")
        session.commit()
        print("Session committed successfully")
    except Exception as e:
        print(f"Error committing session: {e}")
        session.rollback()
        raise e

def safe_close(session: Session) -> None:
    """Safely close a session."""
    try:
        print("Attempting to close session")
        session.close()
        print("Session closed successfully")
    except Exception as e:
        print(f"Error closing session: {e}")

def safe_rollback(session: Session) -> None:
    """Safely rollback a session with error handling."""
    try:
        print("Attempting to rollback session")
        session.rollback()
        print("Session rolled back successfully")
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
                    existing_notification = session.query(VendorNotification).filter(
                        VendorNotification.vendor_user_id == vendor_user.id,
                        VendorNotification.vendor_id == vendor.id,
                        VendorNotification.market_id == market_day.market.id,
                        VendorNotification.created_at >= datetime.now(timezone.utc).date(),
                        VendorNotification.subject.in_([
                            "New Event in Your Market!",
                            "Market Schedule Change"
                        ])
                    ).first()
                    if existing_notification:
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
                    if is_schedule_change and settings.email_market_schedule_change:
                        try:
                            send_email_vendor_market_schedule_change(
                                vendor_user.email, vendor_user, market_day.market, target, f"user/markets/{market_day.market.id}"
                            )
                            print(f"Email sent to {vendor_user.email} for market schedule change")
                        except Exception as e:
                            print(f"Error sending email to {vendor_user.email}: {e}")
                    elif not is_schedule_change and settings.email_market_new_event:
                        try:
                            send_email_vendor_market_new_event(
                                vendor_user.email, vendor_user, market_day.market, target, f"user/markets/{market_day.market.id}"
                            )
                            print(f"Email sent to {vendor_user.email} for market new event")
                        except Exception as e:
                            print(f"Error sending email to {vendor_user.email}: {e}")
                    # Send SMS notification if enabled (only for schedule changes)
                    if is_schedule_change and settings.text_market_schedule_change and vendor_user.phone:
                        try:
                            send_sms_vendor_market_schedule_change(vendor_user.phone, vendor_user, market_day.market, target)
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
def track_fav_vendor_event(mapper, connection, target):
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
                # Check for existing notifications
                existing_notification = session.query(UserNotification).filter(
                    UserNotification.user_id == user.id,
                    UserNotification.vendor_id == vendor.id,
                    UserNotification.created_at >= datetime.now(timezone.utc).date(),
                    UserNotification.subject.in_([
                        "New Event from Your Favorite Vendor!",
                        "Vendor Schedule Change"
                    ])
                ).first()
                if existing_notification:
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
                if is_schedule_change and settings.email_fav_vendor_schedule_change:
                    try:
                        send_email_user_fav_vendor_schedule_change(user.email, user, vendor, target, f"/user/vendors/{vendor.id}")
                        print(f"Email sent to {user.email} for vendor schedule change")
                    except Exception as e:
                        print(f"Error sending email to {user.email}: {e}")
                elif not is_schedule_change and settings.email_fav_vendor_new_event:
                    try:
                        send_email_user_fav_vendor_new_event(user.email, user, vendor, target, f"/user/vendors/{vendor.id}")
                        print(f"Email sent to {user.email} for vendor new event")
                    except Exception as e:
                        print(f"Error sending email to {user.email}: {e}")
                # Send SMS notification if enabled (only for schedule changes)
                if is_schedule_change and settings.text_fav_vendor_schedule_change and user.phone:
                    try:
                        send_sms_user_fav_vendor_schedule_change(user.phone, user, vendor, target)
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

# User - New Vendor in Fav Market
@listens_for(VendorMarket, 'after_insert')
def notify_new_vendor_in_favorite_market(mapper, connection, target):
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
                if settings.email_fav_market_new_vendor:
                    try:
                        send_email_user_fav_market_new_vendor(
                            user.email, user, market, vendor, 
                            f"/user/markets/{market.id}?day={market_day.id}#vendors", 
                            f"/user/vendors/{vendor.id}"
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
                        is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
                        if not is_dev_mode:
                            if admin_settings.email_report_review:
                                try:
                                    send_email_admin_reported_review(admin.email, admin, None, vendor, review, "/admin/report#vendors")
                                    print(f"Email sent to {admin.email} for reported vendor review")
                                except Exception as e:
                                    print(f"Error sending email to {admin.email}: {e}")

                            # Send SMS notification if enabled
                            if admin_settings.text_report_review and admin.phone:
                                try:
                                    send_sms_admin_reported_review(admin.phone, admin, vendor, review)
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
                        is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
                        if not is_dev_mode:
                            if admin_settings.email_report_review:
                                try:
                                    send_email_admin_reported_review(admin.email, admin, market, None, review, "/admin/report#markets")
                                    print(f"Email sent to {admin.email} for reported market review")
                                except Exception as e:
                                    print(f"Error sending email to {admin.email}: {e}")

                            # Send SMS notification if enabled
                            if admin_settings.text_report_review and admin.phone:
                                try:
                                    send_sms_admin_reported_market_review(admin.phone, admin, market, review)
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

            # existing_notification = session.query(UserNotification).filter(
            #     UserNotification.user_id == user.id,
            #     UserNotification.vendor_id == vendor.id,
            #     UserNotification.created_at >= datetime.now(timezone.utc).date(),
            #     UserNotification.subject == "New Baskets from Your Favorite Vendor!"
            # ).first()

            # if existing_notification:
            #     continue

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
            is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
            if not is_dev_mode:
                if settings.email_fav_vendor_new_basket and market:
                    try:
                        send_email_user_fav_vendor_new_basket(
                            user.email, user, market, vendor, 
                            f"user/markets/{market.id}?day={target.market_day_id}#vendors", 
                            f"user/vendors/{vendor.id}"
                        )
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
        
        # If it's today or in the past, send immediately
        if target.post_date <= now:
            task_id = str(uuid4())
            print(f"Type of send_blog_notifications: {type(send_blog_notifications)}")
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
    insp = inspect(target)
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

# Vendor User - New Market Event     
# @listens_for(Event, 'after_insert')
# def vendor_market_new_event(mapper, connection, target):
#     session = Session(bind=connection)
#     # print(inspect.currentframe().f_code.co_name)
#     try:
#         # Retrieve the market day associated with the event
#         market_day = session.query(MarketDay).filter_by(market_id=target.market_id).first()
#         if not market_day:
#             print(f"Market Day not found for Market ID: {target.market_id}")
#             return

#         # Retrieve vendors associated with the market
#         vendors = session.query(Vendor).join(VendorMarket).join(MarketDay).filter(
#             MarketDay.market_id == target.market_id
#         ).all()

#         if not vendors:
#             print(f"No vendors found for Market ID {target.market_id}. No notifications will be created.")
#             return

#         # Prepare notifications for vendors who have enabled new event notifications
#         notifications = []
#         for vendor in vendors:
#             vendor_users = session.query(VendorUser).join(SettingsVendor).filter(
#                 SettingsVendor.vendor_user_id == VendorUser.id,
#                 SettingsVendor.site_market_new_event == True
#             ).all()

#             for vendor_user in vendor_users:
#                 if not vendor_user.vendor_id or not isinstance(vendor_user.vendor_id, dict):
#                     continue

#                 if str(vendor.id) not in vendor_user.vendor_id:
#                     continue
                
#                 # Ensure vendor user is associated with the correct market day
#                 settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()
#                 if not settings or not settings.market_locations:
#                     continue

#                 if market_day.id not in settings.market_locations:
#                     continue

#                 notifications.append(VendorNotification(
#                     subject="New Event in Your Market!",
#                     message=f"The market, {market_day.market.name}, has created a new event: {target.title}.",
#                     link=f"/user/markets/{market_day.market.id}",
#                     vendor_id=vendor.id,
#                     vendor_user_id=vendor_user.id,
#                     market_id=market_day.market.id,
#                     created_at=datetime.now(timezone.utc),
#                     is_read=False
#                 ))
#                 # Create site notification
#                 notifications.append(VendorNotification(
#                     subject="New Event in Your Market!",
#                     message=f"The market, {market_day.market.name}, has created a new event: {target.title}.",
#                     link=f"/user/markets/{market_day.market.id}",
#                     vendor_id=vendor.id,
#                     vendor_user_id=vendor_user.id,
#                     market_id=market_day.market.id,
#                     created_at=datetime.now(timezone.utc),
#                     is_read=False
#                 ))

#         if notifications:
#             session.bulk_save_objects(notifications)
#             session.commit()
#                 # Send email notification if enabled
                # # Check if in dev mode
                # is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
                # if not is_dev_mode:
    #                 if settings.email_market_new_event:
    #                     try:
    #                         send_email_vendor_market_new_event(
    #                             vendor_user.email, vendor_user, market_day.market, target, 
    #                             f"user/markets/{market_day.market.id}"
    #                         )
    #                         print(f"Email sent to {vendor_user.email} for new market event")
    #                     except Exception as e:
    #                         print(f"Error sending email to {vendor_user.email}: {e}")

#         if notifications:
#             session.bulk_save_objects(notifications)
#             session.commit()

#     except Exception as e:
#         session.rollback()
#         print(f"Error in vendor_market_new_event: {e}")
#     finally:
#         session.close()

# Vendor User - Basket Sold   
@listens_for(Basket, 'after_update')
def vendor_basket_sold(mapper, connection, target):
    session = Session(bind=connection)
    try:
        # Check if is_sold changed from False to True
        state = inspect(target)
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
                                is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
                                if not is_dev_mode:
                                    if settings and settings.email_basket_sold and basket_market:
                                        try:
                                            send_email_vendor_basket_sold(
                                                vendor_user.email, vendor_user, basket_market, vendor, 
                                                total_sold, basket_info.pickup_start, basket_info.pickup_end, sale_date
                                            )
                                            print(f"Summary email sent to {vendor_user.email} for {total_sold} baskets sold")
                                        except Exception as e:
                                            print(f"Error sending summary email to {vendor_user.email}: {e}")

                                    # Send SMS notification if enabled
                                    if settings and settings.text_basket_sold and vendor_user.phone:
                                        try:
                                            send_sms_vendor_basket_sold(
                                                vendor_user.phone, vendor_user, vendor, total_sold, sale_date
                                            )
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
            is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
            if not is_dev_mode:
                if settings and settings.email_basket_sold:
                    try:
                        send_email_vendor_basket_sold(
                            vendor_user.email, vendor_user, market_day.market, vendor, 
                            1, target.pickup_start, target.pickup_end, sale_date
                        )
                        print(f"Email sent to {vendor_user.email} for basket sold")
                    except Exception as e:
                        print(f"Error sending email to {vendor_user.email}: {e}")

                # Send SMS notification if enabled
                if settings and settings.text_basket_sold and vendor_user.phone:
                    try:
                        send_sms_vendor_basket_sold(
                            vendor_user.phone, vendor_user, vendor, 1, sale_date
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
        # existing_notification = session.query(UserNotification).filter(
        #     UserNotification.market_id == market.id,
        #     UserNotification.subject == "New Baskets for Sale!",
        #     UserNotification.created_at >= datetime.now(timezone.utc).date()
        # ).first()

        # if existing_notification:
        #     return

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
            is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
            if not is_dev_mode:
                if settings.email_fav_market_new_basket:
                    try:
                        send_email_user_fav_market_new_basket(
                            user.email, user, market, vendor,
                            f"user/markets/{market.id}?day={target.market_day_id}#vendors",
                            f"user/vendors/{vendor.id}"
                        )
                        print(f"Email sent to {user.email} for new basket in favorite market")
                    except Exception as e:
                        print(f"Error sending email to {user.email}: {e}")

                # Send SMS notification if enabled
                if settings.text_fav_market_new_basket and user.phone:
                    try:
                        send_sms_user_fav_market_new_basket(user.phone, user, market, vendor)
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
                        is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
                        if not is_dev_mode:
                            if settings.email_basket_pickup_time:
                                try:
                                    send_email_user_basket_pickup_time(
                                        user.email, user, market, vendor, basket,
                                        f"user/markets/{market.id}?day={basket.market_day_id}#vendors",
                                        f"user/vendors/{vendor.id}"
                                    )
                                    print(f"Pickup email sent to {user.email}")
                                except Exception as e:
                                    print(f"Error sending pickup email to {user.email}: {e}")

                            # Send SMS notification if enabled
                            if settings.text_basket_pickup_time and user.phone:
                                try:
                                    send_sms_user_basket_pickup_time(
                                        user.phone, user, vendor, basket.pickup_start, basket.pickup_end
                                    )
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
                link=f"/user/vendor/{vendor.id}#reviews",
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
        is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
        if not is_dev_mode:
            if settings.email_vendor_review_response:
                try:
                    send_email_user_vendor_review_response(
                        user.email, user, vendor, target, f"user/vendor/{vendor.id}#reviews"
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
            is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
            if not is_dev_mode:
                if settings.email_new_market_in_city:
                    try:
                        send_email_user_new_market_in_city(
                            user.email, user, target, f"user/markets/{target.id}"
                        )
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
            is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
            if not is_dev_mode:
                if settings.email_new_review:
                    try:
                        send_email_vendor_new_review(
                            vendor_user.email, vendor_user, vendor, target, f"vendor/dashboard?tab=reviews"
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
            is_dev_mode = os.environ.get('IS_DEV_MODE', 'False').lower() == 'true'
            if not is_dev_mode:
                if settings.email_new_vendor:
                    try:
                        send_email_admin_new_vendor(
                            admin.email, admin, target, f"admin/vendors/{target.id}"
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
        # Delete user notifications for this event (match by vendor_id, market_id, message, and subject)
        connection.execute(
            UserNotification.__table__.delete().where(
                and_(
                    UserNotification.vendor_id == target.vendor_id,
                    UserNotification.market_id == target.market_id,
                    UserNotification.message == target.message,
                    UserNotification.subject.in_([
                        "New Event from Your Favorite Vendor!",
                        "Vendor Schedule Change",
                        "Market Schedule Change",
                        "New Event in Your Market!"
                    ])
                )
            )
        )

        # Delete vendor notifications for this event (match by vendor_id, market_id, message, and subject)
        connection.execute(
            VendorNotification.__table__.delete().where(
                and_(
                    VendorNotification.vendor_id == target.vendor_id,
                    VendorNotification.market_id == target.market_id,
                    VendorNotification.message == target.message,
                    VendorNotification.subject.in_([
                        "New Event in Your Market!",
                        "Market Schedule Change"
                    ])
                )
            )
        )
    except Exception as e:
        print(f"Error deleting event notifications: {e}")

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
            if admin_settings.email_product_request:
                try:
                    send_email_admin_product_request(
                        admin.email, admin, vendor, new_product, target.link or "/admin/vendors?tab=products"
                    )
                    print(f"Email sent to {admin.email} for product request")
                except Exception as e:
                    print(f"Error sending email to {admin.email}: {e}")

            # Send SMS notification if enabled
            if admin_settings.text_product_request and admin.phone:
                try:
                    send_sms_admin_product_request(admin.phone, admin, vendor, new_product)
                    print(f"SMS sent to {admin.phone} for product request")
                except Exception as e:
                    print(f"Error sending SMS to {admin.phone}: {e}")

    except Exception as e:
        print(f"Error in notify_admin_product_request: {e}")
    finally:
        session.close()

def get_vendor_users(vendor_id: int, session: Session) -> List[VendorUser]:
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

def send_notification_vendor_market_schedule_change(vendor_id: int, market_id: int, schedule_id: int) -> None:
    """Send notification for vendor market schedule change."""
    try:
        session = Session()
        vendor = session.query(Vendor).get(vendor_id)
        market = session.query(Market).get(market_id)
        market_day = session.query(MarketDay).get(schedule_id)
        
        if not all([vendor, market, market_day]):
            print("Missing required data for notification")
            return
            
        vendor_users = get_vendor_users(vendor_id, session)
        if not vendor_users:
            print(f"No vendor users found for Vendor ID {vendor_id}")
            return
            
        notifications: List[VendorNotification] = []
        for vendor_user in vendor_users:
            settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()
            if not settings or not settings.site_market_schedule_change:
                continue
                
            if market_day.id not in (settings.market_locations or []):
                continue
                
            notification = VendorNotification(
                subject="Market Schedule Change",
                message=f"The market, {market.name}, has updated its schedule.",
                link=f"/user/markets/{market.id}",
                vendor_id=vendor.id,
                vendor_user_id=vendor_user.id,
                market_id=market.id,
                created_at=datetime.now(timezone.utc),
                is_read=False
            )
            notifications.append(notification)
            
            if settings.email_market_schedule_change:
                try:
                    send_email_vendor_market_schedule_change(
                        vendor_user.email, vendor_user, market, market_day, f"user/markets/{market.id}"
                    )
                except Exception as e:
                    print(f"Error sending email to {vendor_user.email}: {e}")
                    
            if settings.text_market_schedule_change and vendor_user.phone:
                try:
                    send_sms_vendor_market_schedule_change(vendor_user.phone, vendor_user, market, market_day)
                except Exception as e:
                    print(f"Error sending SMS to {vendor_user.phone}: {e}")
                    
        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()
            
    except Exception as e:
        print(f"Error in send_notification_vendor_market_schedule_change: {e}")
        if session:
            session.rollback()
    finally:
        if session:
            session.close()