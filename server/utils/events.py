from sqlalchemy import event, func
from sqlalchemy.orm import Session
from sqlalchemy.event import listens_for
from datetime import datetime, date , timezone, timedelta
import json
from threading import Timer
from datetime import datetime, timedelta, timezone, time
from models import ( db, User, Market, MarketDay, Vendor, MarketReview, 
                    VendorReview, ReportedReview, MarketReviewRating, 
                    VendorReviewRating, MarketFavorite, VendorFavorite, 
                    VendorMarket, VendorUser, AdminUser, Basket, Event, 
                    Product, UserNotification, VendorNotification, 
                    AdminNotification, QRCode, FAQ, Blog, BlogFavorite,
                    Receipt, SettingsUser, SettingsVendor, SettingsAdmin, 
                    )

def time_converter(time24):
    if isinstance(time24, time):
        time24 = time24.strftime("%H:%M:%S")

    try:
        hours, minutes, _ = map(int, time24.split(':'))
        period = "AM" if hours < 12 else "PM"
        hours = hours if 1 <= hours <= 12 else (hours - 12 if hours > 12 else 12)
        return f"{hours}:{minutes:02d} {period}"
    except Exception as e:
        print(f"Error converting time: {e}")
        return time24

@listens_for(VendorFavorite, 'after_insert')
def track_vendor_favorite(mapper, connection, target):
    try:

        # Retrieve the vendor
        vendor = connection.execute(
            Vendor.__table__.select().where(Vendor.id == target.vendor_id)
        ).fetchone()
        if not vendor:
            print(f"Vendor not found for Vendor ID: {target.vendor_id}")
            return

        # Retrieve the user
        user = connection.execute(
            User.__table__.select().where(User.id == target.user_id)
        ).fetchone()
        if not user:
            print(f"User not found for User ID: {target.user_id}")
            return

        # Create a notification
        subject = "Favorite Vendor Added"
        message = f"{user.first_name} added {vendor.name} to their favorites!"

        connection.execute(
            VendorNotification.__table__.insert().values(
                subject=subject,
                message=message,
                user_id=user.id,
                vendor_id=vendor.id,
                created_at=datetime.utcnow(),
                is_read=False
            )
        )
    except Exception as e:
        print(f"Error in track_vendor_favorite: {e}")

# User - New Event in Fav Market 
@listens_for(Event, 'after_insert')
def vendor_market_event_or_schedule_change(mapper, connection, target):
    session = Session(bind=connection)
    try:
        # Retrieve the market day associated with the event
        market_day = session.query(MarketDay).filter_by(market_id=target.market_id).first()
        if not market_day:
            print(f"Market Day not found for Market ID: {target.market_id}")
            return

        # Retrieve vendors associated with the market
        vendors = session.query(Vendor).join(VendorMarket).join(MarketDay).filter(
            MarketDay.market_id == target.market_id
        ).all()

        if not vendors:
            print(f"No vendors found for Market ID {target.market_id}. No notifications will be created.")
            return

        is_schedule_change = target.schedule_change

        notifications = []
        for vendor in vendors:
            vendor_users = session.query(VendorUser).join(SettingsVendor).filter(
                SettingsVendor.vendor_user_id == VendorUser.id
            ).all()

            matched_vendor_users = []
            for vendor_user in vendor_users:
                try:
                    # Get the vendor_user's settings
                    settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()

                    if not settings:
                        print(f"No settings found for Vendor User ID={vendor_user.id}, skipping notification.")
                        continue

                    # Check if the user has notifications enabled for this type
                    if is_schedule_change and not settings.site_market_schedule_change:
                        print(f"Vendor User ID={vendor_user.id} has schedule change notifications disabled.")
                        continue

                    if not is_schedule_change and not settings.site_market_new_event:
                        print(f"Vendor User ID={vendor_user.id} has new event notifications disabled.")
                        continue

                    # Ensure the vendor user's `market_locations` include the relevant `market_day_id`
                    if market_day.id not in (settings.market_locations or []):
                        # print(f"Skipping Vendor User {vendor_user.id} - MarketDay ID {market_day.id} not in their market locations.")
                        continue

                    matched_vendor_users.append(vendor_user)

                except Exception as e:
                    print(f"Error processing vendor_user {vendor_user.id}: {e}")

            if not matched_vendor_users:
                # print(f"No vendor users with valid settings found for Vendor ID={vendor.id}, skipping notification.")
                continue

            for vendor_user in matched_vendor_users:
                vendor_user_id = vendor_user.id

                # Check for existing notifications
                existing_notification = session.query(VendorNotification).filter(
                    VendorNotification.vendor_user_id == vendor_user_id,
                    VendorNotification.vendor_id == vendor.id,
                    VendorNotification.market_id == market_day.market.id,
                    VendorNotification.created_at >= datetime.utcnow().date(),
                    VendorNotification.subject.in_([
                        "New Event in Your Market!",
                        "Market Schedule Change"
                    ])
                ).first()

                if existing_notification:
                    continue

                # Create notification
                notification = VendorNotification(
                    subject="Market Schedule Change" if is_schedule_change else "New Event in Your Market!",
                    message=f"The market, {market_day.market.name}, has updated its schedule temporarily."
                    if is_schedule_change
                    else f"The market, {market_day.market.name}, has added a new event: {target.title}.",
                    link=f"/user/markets/{market_day.market.id}",
                    vendor_id=vendor.id,
                    vendor_user_id=vendor_user_id,
                    market_id=market_day.market.id,
                    created_at=datetime.utcnow(),
                    is_read=False
                )

                notifications.append(notification)

        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()
            
    except Exception as e:
        session.rollback()
        print(f"Error in vendor_market_event_or_schedule_change: {e}")
    finally:
        session.close()

# User - New Event for Fav Vendor
@listens_for(Event, 'after_insert')
def track_fav_vendor_event(mapper, connection, target):
    if not target.vendor_id:  # Ensure the event is associated with a vendor
        print(f"Event ID={target.id} is not associated with a vendor. Skipping user notifications.")
        return

    session = Session(bind=connection)
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
                UserNotification.created_at >= datetime.utcnow().date(),
                UserNotification.subject.in_([
                    "New Event from Your Favorite Vendor!",
                    "Vendor Schedule Change"
                ])
            ).first()

            if existing_notification:
                continue

            # Create notification
            notification = UserNotification(
                subject="Vendor Schedule Change" if is_schedule_change else "New Event from Your Favorite Vendor!",
                message=f"The vendor, {vendor.name}, has updated their schedule temporarily."
                if is_schedule_change
                else f"The vendor, {vendor.name}, has added a new event: {target.title}",
                link=f"/user/vendors/{vendor.id}",
                user_id=user.id,
                vendor_id=vendor.id,
                created_at=datetime.utcnow(),
                is_read=False
            )

            notifications.append(notification)

        # Save notifications
        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()
            
    except Exception as e:
        session.rollback()
        print(f"Error in track_fav_vendor_event: {e}")
    finally:
        session.close()

# User - New Vendor in Fav Market
@listens_for(VendorMarket, 'after_insert')
def notify_new_vendor_in_favorite_market(mapper, connection, target):
    session = Session(bind=connection)
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
            # print(f"No users have favorited Market ID {market.id}. No notifications will be created.")
            return

        # Prepare and insert notifications
        notifications = []
        for user in favorited_users:
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
                UserNotification.created_at >= datetime.utcnow().date(),
                UserNotification.subject == "New Vendor in Your Favorite Market!"
            ).first()

            if existing_notification:
                continue

            notifications.append(UserNotification(
                subject="New Vendor in Your Favorite Market!",
                message=f"The vendor, {vendor.name}, has been added to one of your favorite markets: {market.name}.",
                link=f"/user/markets/{market.id}?day={market_day.id}#vendors",
                user_id=user.id,
                market_id=market.id,
                vendor_id=vendor.id,
                created_at=datetime.utcnow(),
                is_read=False
            ))

        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()
            # print(f"Successfully created {len(notifications)} notifications for Market ID={market.id}")

    except Exception as e:
        session.rollback()
        print(f"Error in notify_new_vendor_in_favorite_market: {e}")
    finally:
        session.close()

# Admin - Reported Vendor Review
@listens_for(VendorReview, 'after_update')
def notify_admin_vendor_review_reported(mapper, connection, target):
    if target.is_reported:
        session = Session(bind=connection)
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
                if admin.admin_role < 3:
                    continue

                notifications.append(AdminNotification(
                    subject="Reported Vendor Review",
                    message=f"A review for vendor '{vendor.name}' has been reported.",
                    link="/admin/report#vendors",
                    admin_id=admin.id,
                    admin_role=admin.admin_role,
                    vendor_id=vendor.id,
                    created_at=datetime.utcnow(),
                    is_read=False
                ))

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
                if admin.admin_role < 3:
                    continue

                notifications.append(AdminNotification(
                    subject="Reported Market Review",
                    message=f"A review for market, '{market.name}', has been reported.",
                    link="/admin/report#markets",
                    admin_id=admin.id,
                    admin_role=admin.admin_role,
                    market_id=market.id,
                    created_at=datetime.utcnow(),
                    is_read=False
                ))

            if notifications:
                session.bulk_save_objects(notifications)
                session.commit()
                print(f"✅ Sent notifications to {len(notifications)} admins about reported market review.")

        except Exception as e:
            session.rollback()
            print(f"Error creating admin notification for Market Review: {e}")
        finally:
            session.close()

# User Fav Vendor Added Baskets
@listens_for(Basket, 'after_insert')
def fav_vendor_new_baskets(mapper, connection, target):
    session = Session(bind=connection)
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
            Basket.sale_date >= datetime.utcnow().date()
        ).all()

        basket_count = len(recent_baskets)

        if basket_count >= 2:
            # Consolidate notification
            message = f"{vendor.name} has added new baskets today! Check them out before they're gone!"
        else:
            # Individual basket notification
            message = f"{vendor.name} has added a new basket! Check it out before it's gone!"

        # Prepare notifications for favorited users
        notifications = []
        for user in favorited_users:
            existing_notification = session.query(UserNotification).filter(
                UserNotification.user_id == user.id,
                UserNotification.vendor_id == vendor.id,
                UserNotification.created_at >= datetime.utcnow().date(),
                UserNotification.subject == "New Baskets from Your Favorite Vendor!"
            ).first()

            if existing_notification:
                continue

            notification = UserNotification(
                subject="New Baskets from Your Favorite Vendor!",
                message=message,
                link=f"/user/vendors/{vendor.id}#markets",
                user_id=user.id,
                vendor_id=vendor.id,
                created_at=datetime.utcnow(),
                is_read=False
            )
            notifications.append(notification)

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
    try:
        # Ensure the blog post date is today or earlier
        post_date = target.post_date.date()
        if post_date > datetime.utcnow().date():
            return

        # Retrieve users who have notifications enabled
        users = session.query(User).join(SettingsUser).filter(SettingsUser.site_new_blog == True).all()
        admins = session.query(AdminUser).join(SettingsAdmin).filter(SettingsAdmin.site_new_blog == True).all()
        vendor_users = session.query(VendorUser).join(SettingsVendor).filter(SettingsVendor.site_new_blog == True).all()

        if not users and not admins and not vendor_users:
            print("No users have blog notifications enabled. No notifications will be created.")
            return

        # Prepare user notifications
        user_notifications = [
            UserNotification(
                subject="New Blog Post Alert!",
                message=f"A new blog post, {target.title}, has been published. Check it out!",
                link=f"/#blog",
                user_id=user.id,
                created_at=datetime.utcnow(),
                is_read=False
            )
            for user in users
        ]

        # Prepare vendor notifications
        vendor_notifications = [
            VendorNotification(
                subject="New Blog Post Alert!",
                message=f"A new blog post, {target.title}, has been published. Check it out!",
                link=f"/vendor#blog",
                vendor_user_id=vendor_user.id,
                created_at=datetime.utcnow(),
                is_read=False
            )
            for vendor_user in vendor_users
        ]
        
        # Prepare admin notifications, ensuring admin_role is included
        admin_notifications = []
        for admin in admins:
            if not hasattr(admin, "admin_role"):
                print(f"Skipping Admin ID {admin.id} due to missing admin_role.")
                continue

            admin_notifications.append(AdminNotification(
                subject="New Blog Post Alert!",
                message=f"A new blog post, {target.title}, has been published. Check it out!",
                link=f"/admin/profile/{admin.id}#blog",
                admin_role=admin.admin_role,
                created_at=datetime.utcnow(),
                is_read=False
            ))

        # Save notifications
        if user_notifications:
            session.bulk_save_objects(user_notifications)
        if vendor_notifications:
            session.bulk_save_objects(vendor_notifications)
        if admin_notifications:
            session.bulk_save_objects(admin_notifications)

        session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error in schedule_blog_notifications: {e}")
    finally:
        session.close()
        
# if blog is scheduled for the future and deleted before it is published
@listens_for(Blog, 'before_delete')
def delete_scheduled_blog_notifications(mapper, connection, target):
    session = Session(bind=connection)
    try:
        if target.post_date > datetime.utcnow().date():
            notifications = session.query(UserNotification).filter(
                UserNotification.link == f"/#blog",
                UserNotification.subject == "New Blog Post Alert!"
            ).all()

            if notifications:
                for notification in notifications:
                    session.delete(notification)
                session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error deleting scheduled blog notifications: {e}")
    finally:
        session.close()

# Vendor User - New Market Event     
@listens_for(Event, 'after_insert')
def vendor_market_new_event(mapper, connection, target):
    session = Session(bind=connection)
    try:
        # Retrieve the market day associated with the event
        market_day = session.query(MarketDay).filter_by(market_id=target.market_id).first()
        if not market_day:
            print(f"Market Day not found for Market ID: {target.market_id}")
            return

        # Retrieve vendors associated with the market
        vendors = session.query(Vendor).join(VendorMarket).join(MarketDay).filter(
            MarketDay.market_id == target.market_id
        ).all()

        if not vendors:
            print(f"No vendors found for Market ID {target.market_id}. No notifications will be created.")
            return

        # Prepare notifications for vendors who have enabled new event notifications
        notifications = []
        for vendor in vendors:
            vendor_users = session.query(VendorUser).join(SettingsVendor).filter(
                SettingsVendor.vendor_user_id == VendorUser.id,
                SettingsVendor.site_market_new_event == True
            ).all()

            for vendor_user in vendor_users:
                # Ensure vendor user is associated with the correct market day
                settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user.id).first()
                if not settings or not settings.market_locations:
                    continue

                if market_day.id not in settings.market_locations:
                    continue

                notifications.append(VendorNotification(
                    subject="New Event in Your Market!",
                    message=f"The market, {market_day.market.name}, has created a new event: {target.title}.",
                    link=f"/user/markets/{market_day.market.id}",
                    vendor_id=vendor.id,
                    vendor_user_id=vendor_user.id,
                    market_id=market_day.market.id,
                    created_at=datetime.utcnow(),
                    is_read=False
                ))

        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error in vendor_market_new_event: {e}")
    finally:
        session.close()

# Vendor User - Basket Sold   
@listens_for(Basket, 'after_update')
def vendor_basket_sold(mapper, connection, target):
    session = Session(bind=connection)
    try:
        # Only notify if the basket was just marked as sold
        if not target.is_sold:
            return

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
                            notifications.append(VendorNotification(
                                subject="Basket Sales Update!",
                                message=f"You have sold {total_sold} baskets so far for today ({sale_date}).",
                                link=f"/vendor/dashboard",
                                vendor_id=vendor.id,
                                vendor_user_id=vendor_user.id,
                                created_at=datetime.utcnow(),
                                is_read=False
                            ))

                        if notifications:
                            notif_session.bulk_save_objects(notifications)
                            notif_session.commit()
                            print(f"✅ Summary notification sent to {len(notifications)} vendor users.")

                    except Exception as e:
                        print(f"Error sending summary notification: {e}")

            # Schedule the summary notification for 6AM on the sale date
            delay = (sale_day_6am_utc - now_utc).total_seconds()
            Timer(delay, send_summary_notification).start()
            return  # Skip the immediate notification in this case

        # If it's after 6AM on sale_date, send an individual notification for each basket sold
        notifications = []
        for vendor_user in matched_vendor_users:
            notifications.append(VendorNotification(
                subject="Basket Sold!",
                message=f"One of your baskets has sold.",
                link=f"/vendor/dashboard",
                vendor_id=vendor.id,
                vendor_user_id=vendor_user.id,
                created_at=datetime.utcnow(),
                is_read=False
            ))

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
    session = Session(bind=connection)
    try:
        # Retrieve all vendor users associated with this vendor
        vendor_users = session.query(VendorUser).filter_by(vendor_id=target.vendor_id).all()

        if not vendor_users:
            # print(f"No vendor users found for Vendor ID={target.vendor_id}. Skipping update.")
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

                    notifications.append(VendorNotification(
                        subject="New Market Location Added",
                        message=f"A new market location has been added to your notifications list: {target.market_day.markets.name}. Go to profile settings to edit market location notifications.",
                        link="/vendor/profile",
                        vendor_id=target.vendor_id,
                        vendor_user_id=vendor_user.id,
                        created_at=datetime.utcnow(),
                        is_read=False
                    ))
                    
        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error notifying vendor users for new VendorMarket entry: {e}")
    finally:
        session.close()
        
# @listens_for(QRCode, "after_insert")
# def handle_qr_code_deletion(mapper, connection, target):
#     session = Session(bind=connection)
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
        existing_notification = session.query(UserNotification).filter(
            UserNotification.market_id == market.id,
            UserNotification.subject == "New Baskets for Sale!",
            UserNotification.created_at >= datetime.utcnow().date()
        ).first()

        if existing_notification:
            return

        # Prepare notifications for favorited users
        notifications = []
        for user in favorited_users:
            # Check user notification settings
            settings = session.query(SettingsUser).filter_by(user_id=user.id).first()
            if not settings or not settings.site_fav_market_new_basket:
                print(f"User ID={user.id} has new basket notifications disabled.")
                continue

            notifications.append(UserNotification(
                subject="New Baskets for Sale!",
                message=f"New baskets have been added to one of your favorite markets, {market.name}, check it out!",
                link=f"/user/markets/{market.id}?day={target.market_day_id}#vendors",
                user_id=user.id,
                market_id=market.id,
                created_at=datetime.utcnow(),
                is_read=False
            ))

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
    try:
        # Ensure basket has a pickup time
        if not target.pickup_start:
            print(f"Skipping notification. No pickup_time found for Basket ID {target.id}.")
            return

        # Get current UTC time
        now_utc = datetime.now(timezone.utc)

        # Ensure pickup_start and pickup_end are timezone-aware (assuming they are stored as naive times)
        pickup_datetime_utc = datetime.combine(now_utc.date(), target.pickup_start).replace(tzinfo=timezone.utc)
        pickup_end_utc = datetime.combine(now_utc.date(), target.pickup_end).replace(tzinfo=timezone.utc)

        # Calculate delay (time remaining until pickup)
        delay = (pickup_datetime_utc - now_utc).total_seconds()

        if delay <= 0:
            # print(f"Skipping notification: Pickup time for Basket ID {target.id} has already passed.")
            return

        # print(f"Notification for Basket ID {target.id} scheduled in {delay} seconds.")

        def send_notification():
            with Session(bind=connection) as notif_session:
                try:
                    basket = notif_session.query(Basket).filter_by(id=target.id).first()
                    if not basket or basket.is_picked_up:
                        print(f"Skipping notification. Basket ID {target.id} does not exist or is already picked up.")
                        return

                    user = notif_session.query(User).filter_by(id=basket.user_id).first()
                    if not user:
                        print(f"User for Basket ID {target.id} not found. Skipping notification.")
                        return

                    # Check user notification settings
                    settings = notif_session.query(SettingsUser).filter_by(user_id=user.id).first()
                    if not settings or not settings.site_basket_pickup_time:
                        print(f"User ID={user.id} has pickup notifications disabled.")
                        return

                    # Convert times for notification message
                    pickup_time_str = time_converter(pickup_datetime_utc.time())
                    pickup_end_str = time_converter(pickup_end_utc.time())
                    current_month = datetime.now(timezone.utc).strftime("%B")
                    current_day = datetime.now(timezone.utc).strftime("%d")

                    # Send pickup reminder notification
                    notification = UserNotification(
                        subject="Time to Pick Up Your Basket!",
                        message=(
                            f"Your purchased basket is ready for pickup! "
                            f"Pick it up between {pickup_time_str} and {pickup_end_str} on {current_month} {current_day}."
                        ),
                        link=f"/user/pick-up",
                        user_id=user.id,
                        created_at=pickup_datetime_utc,
                        is_read=False
                    )

                    notif_session.add(notification)
                    notif_session.commit()
                    print(f"✅ Pickup reminder sent for Basket ID={target.id}")

                except Exception as e:
                    print(f"Error sending basket pickup notification: {e}")

        # Schedule notification
        Timer(delay, send_notification).start()

    except Exception as e:
        print(f"Error scheduling pickup notification: {e}")
        
@listens_for(User, 'after_insert')
def create_user_settings(mapper, connection, target):
    session = Session(bind=connection)
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
    try:
        # Ensure the response field has been updated
        if not target.response or target.response.strip() == "":
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
                created_at=datetime.utcnow(),
                is_read=False
            ))
            
        # Save site notifications
        if notifications:
            session.bulk_save_objects(notifications)
            session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error notifying user about vendor review response: {e}")
    finally:
        session.close()

@listens_for(Market, 'after_insert')
def notify_users_new_market_in_state(mapper, connection, target):
    session = Session(bind=connection)
    try:
        # Retrieve users who reside in the same city as the new market
        users_in_state = session.query(User).filter(User.state == target.state).all()

        if not users_in_state:
            print(f"No users found in city {target.state}. No notifications will be created.")
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
                    created_at=datetime.utcnow(),
                    is_read=False
                ))

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
    try:
        # Retrieve vendor users associated with this vendor
        vendor_users = session.query(VendorUser).filter_by(vendor_id=target.vendor_id).all()

        if not vendor_users:
            # print(f"No vendor users found for Vendor ID {target.vendor_id}. No notifications will be created.")
            return

        # Prepare notifications (site, email, text)
        notifications = []
        for vendor_user in vendor_users:
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
                    created_at=datetime.utcnow(),
                    is_read=False
                ))

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
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
# def reset_market_status():
#     session = db.session  # Use the SQLAlchemy session from your app
#     try:
#         # Set all Markets.is_current to False
#         session.query(Market).update({Market.is_current: False})
#         session.commit()
#         print("All markets have been set to is_current=False for the new year.")

#     except Exception as e:
#         session.rollback()
#         print(f"Error resetting market status: {e}")
#     finally:
#         session.close()

# def schedule_new_year_reset():
#     now = datetime.now(timezone.utc)
#     next_reset = datetime(now.year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
#     delay = (next_reset - now).total_seconds()

#     print(f"Market reset scheduled for {next_reset}.")
#     Timer(delay, reset_market_status).start()

# @listens_for(VendorUser, 'after_insert')
# def update_vendor_user_market_locations(mapper, connection, target):
#     session = Session(bind=connection)
#     try:
#         # Retrieve all market_day_ids associated with the vendor
#         market_days = session.query(VendorMarket.market_day_id).filter_by(vendor_id=target.vendor_id).all()
#         market_day_ids = [md.market_day_id for md in market_days]

#         if not market_day_ids:
#             print(f"No market locations found for Vendor ID={target.vendor_id}. Skipping update.")
#             return

#         # Update SettingsVendor for this vendor user
#         settings = session.query(SettingsVendor).filter_by(vendor_user_id=target.id).first()
#         if settings:
#             existing_market_locations = set(settings.market_locations or [])
#             updated_market_locations = list(existing_market_locations.union(set(market_day_ids)))

#             settings.market_locations = updated_market_locations
#             session.commit()

#     except Exception as e:
#         session.rollback()
#         print(f"Error updating market locations for Vendor User ID={target.id}: {e}")
#     finally:
#         session.close()