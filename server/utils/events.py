from sqlalchemy import event
from sqlalchemy.orm import Session
from sqlalchemy.event import listens_for
from datetime import datetime
from models import ( db, User, Market, MarketDay, Vendor, MarketReview, 
                    VendorReview, ReportedReview, MarketReviewRating, 
                    VendorReviewRating, MarketFavorite, VendorFavorite, 
                    VendorMarket, VendorUser, AdminUser, Basket, Event, 
                    Product, UserNotification, VendorNotification, 
                    AdminNotification, QRCode, FAQ, Blog, Receipt, bcrypt )


@listens_for(VendorFavorite, 'after_insert')
def track_vendor_favorite(mapper, connection, target):
    try:
        print(f"New favorite detected: User ID={target.user_id}, Vendor ID={target.vendor_id}")

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
        print(f"Creating notification for User ID={user.id} about Vendor ID={vendor.id}")

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
        print("Notification successfully created.")
    except Exception as e:
        print(f"Error in track_vendor_favorite: {e}")
        
@listens_for(MarketFavorite, 'after_insert')
def track_market_favorite(mapper, connection, target):
    try:
        print(f"New favorite detected: User ID={target.user_id}, Market ID={target.market_id}")

        # Retrieve the market
        market = connection.execute(
            Market.__table__.select().where(Market.id == target.market_id)
        ).fetchone()
        if not market:
            print(f"Market not found for Market ID: {target.market_id}")
            return

        # Retrieve the user
        user = connection.execute(
            User.__table__.select().where(User.id == target.user_id)
        ).fetchone()
        if not user:
            print(f"User not found for User ID: {target.user_id}")
            return

        # Create a notification
        subject = "Favorite Market Added"
        message = f"{user.first_name} added {market.name} to their favorites!"
        print(f"Creating notification for User ID={user.id} about Market ID={market.id}")

        connection.execute(
            UserNotification.__table__.insert().values(
                subject=subject,
                message=message,
                user_id=user.id,
                market_id=market.id,
                created_at=datetime.utcnow(),
                is_read=False
            )
        )
        print("Notification successfully created.")
    except Exception as e:
        print(f"Error in track_market_favorite: {e}")

@listens_for(Event, 'after_insert')
def track_fav_market_event(mapper, connection, target):
    session = Session(bind=connection)
    try:
        print(f"Event detected: ID={target.id}, Title='{target.title}', Market ID={target.market_id}")

        # Notify users who favorited the market
        favorited_users = session.query(User).join(MarketFavorite).filter(
            MarketFavorite.market_id == target.market_id
        ).all()
        print(f"Favorited users for Market ID {target.market_id}: {len(favorited_users)} users found.")

        if not favorited_users:
            print(f"No favorited users for Market ID {target.market_id}. No user notifications will be created.")

        # Retrieve the market
        market = session.query(Market).get(target.market_id)
        if not market:
            print(f"Market with ID {target.market_id} not found. Aborting notification creation.")
            return
        print(f"Market found: ID={market.id}, Name='{market.name}'")

        # Notify vendors associated with the market
        vendors = session.query(Vendor).join(VendorMarket).join(MarketDay).filter(
            MarketDay.market_id == market.id
        ).all()
        print(f"Vendors associated with Market ID {market.id}: {len(vendors)} vendors found.")

        # Prepare user notifications
        user_notifications = []
        for user in favorited_users:
            user_notification = UserNotification(
                subject="New Event in Your Favorite Market!",
                message=f"The market '{market.name}' has added a new event: {target.title}",
                link=f"/markets/{market.id}/events/{target.id}",
                user_id=user.id,
                market_id=market.id,
                created_at=datetime.utcnow(),
                is_read=False
            )
            user_notifications.append(user_notification)
            print(f"Prepared user notification for User ID={user.id}, Email='{user.email}'")

        # Prepare vendor notifications
        vendor_notifications = []
        for vendor in vendors:
            vendor_notification = VendorNotification(
                subject="New Event at a Market You Attend!",
                message=f"A new event '{target.title}' has been added to the market '{market.name}'.",
                link=f"/vendors/{vendor.id}/events/{target.id}",
                vendor_id=vendor.id,
                market_id=market.id,
                created_at=datetime.utcnow(),
                is_read=False
            )
            vendor_notifications.append(vendor_notification)
            print(f"Prepared vendor notification for Vendor ID={vendor.id}, Name='{vendor.name}'")

        # Save all notifications
        if user_notifications:
            session.bulk_save_objects(user_notifications)
            print(f"Successfully created {len(user_notifications)} user notifications for Market ID={market.id}")

        if vendor_notifications:
            session.bulk_save_objects(vendor_notifications)
            print(f"Successfully created {len(vendor_notifications)} vendor notifications for Market ID={market.id}")

        session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error in track_fav_market_event: {e}")
    finally:
        session.close()
        
@listens_for(Event, 'after_insert')
def track_fav_vendor_event(mapper, connection, target):
    if not target.vendor_id:  # Ensure the event is associated with a vendor
        print(f"Event ID={target.id} is not associated with a vendor. Skipping vendor notifications.")
        return

    session = Session(bind=connection)
    try:
        (f"Vendor Event detected: ID={target.id}, Title='{target.title}', Vendor ID={target.vendor_id}")

        # Retrieve all users who favorited the vendor related to this event
        favorited_users = session.query(User).join(VendorFavorite).filter(
            VendorFavorite.vendor_id == target.vendor_id
        ).all()
        print(f"Favorited users for Vendor ID {target.vendor_id}: {len(favorited_users)} users found.")

        if not favorited_users:
            print(f"No favorited users for Vendor ID {target.vendor_id}. No notifications will be created.")
            return

        # Retrieve the vendor for the event
        vendor = session.query(Vendor).get(target.vendor_id)
        if not vendor:
            print(f"Vendor with ID {target.vendor_id} not found.")
            return
        print(f"Vendor found: ID={vendor.id}, Name='{vendor.name}'")

        # Prepare notifications
        notifications = []
        for user in favorited_users:
            notification = UserNotification(
                subject="New Event from Your Favorite Vendor!",
                message=f"The vendor '{vendor.name}' has added a new event: {target.title}",
                link=f"/vendors/{vendor.id}/events/{target.id}",  # Adjust this to your app's routing structure
                user_id=user.id,
                vendor_id=vendor.id,
                created_at=datetime.utcnow(),
                is_read=False
            )
            notifications.append(notification)
            print(f"Prepared notification for User ID={user.id}, Email='{user.email}'")

        session.bulk_save_objects(notifications)
        session.commit()
        print(f"Successfully created {len(notifications)} notifications for Vendor ID={target.vendor_id}")

    except Exception as e:
        session.rollback()
        print(f"Error in track_fav_vendor_event: {e}")
    finally:
        session.close()

@listens_for(VendorMarket, 'after_insert')
def notify_new_vendor_in_favorite_market(mapper, connection, target):
    try:
        print(f"New vendor detected: Vendor ID={target.vendor_id}, Market Day ID={target.market_day_id}")

        # Retrieve the market associated with the market day
        market_day = connection.execute(
            MarketDay.__table__.select().where(MarketDay.id == target.market_day_id)
        ).fetchone()
        if not market_day:
            print(f"Market Day not found for Market Day ID: {target.market_day_id}")
            return

        market = connection.execute(
            Market.__table__.select().where(Market.id == market_day.market_id)
        ).fetchone()
        if not market:
            print(f"Market not found for Market ID associated with Market Day ID: {target.market_day_id}")
            return
        print(f"Market found: ID={market.id}, Name='{market.name}'")

        # Retrieve the vendor
        vendor = connection.execute(
            Vendor.__table__.select().where(Vendor.id == target.vendor_id)
        ).fetchone()
        if not vendor:
            print(f"Vendor not found for Vendor ID: {target.vendor_id}")
            return
        print(f"Vendor found: ID={vendor.id}, Name='{vendor.name}'")

        # Retrieve users who have favorited this market
        favorited_users = connection.execute(
            User.__table__.join(MarketFavorite, MarketFavorite.user_id == User.id)
            .select()
            .where(MarketFavorite.market_id == market.id)
        ).fetchall()

        print(f"Favorited users for Market ID {market.id}: {len(favorited_users)} users found.")

        if not favorited_users:
            print(f"No users have favorited Market ID {market.id}. No notifications will be created.")
            return

        # Prepare and insert notifications
        notifications = []
        for user in favorited_users:
            notifications.append({
                "subject": "New Vendor in Your Favorite Market!",
                "message": f"The vendor '{vendor.name}' has been added to your favorite market '{market.name}'.",
                "user_id": user.id,
                "market_id": market.id,
                "vendor_id": vendor.id,
                "created_at": datetime.utcnow(),
                "is_read": False
            })
            print(f"Prepared notification for User ID={user.id}, Email='{user.email}'")

        if notifications:
            connection.execute(UserNotification.__table__.insert(), notifications)
            print(f"Successfully created {len(notifications)} notifications for Market ID={market.id}")

    except Exception as e:
        print(f"Error in notify_new_vendor_in_favorite_market: {e}")
        
@listens_for(VendorReview, 'after_update')
def notify_admin_vendor_review_reported(mapper, connection, target):
    if target.is_reported:
        try:
            print(f"Vendor Review reported: ID={target.id}, Vendor ID={target.vendor_id}")

            # Retrieve the vendor
            vendor = connection.execute(
                Vendor.__table__.select().where(Vendor.id == target.vendor_id)
            ).fetchone()
            if not vendor:
                print(f"Vendor not found for Vendor ID: {target.vendor_id}")
                return

            # Create admin notification
            subject = "Reported Vendor Review"
            message = f"A review for vendor '{vendor.name}' has been reported."
            link = f"/admin/vendors/{vendor.id}/reviews/{target.id}"  # Adjust this link as per your app's routing

            connection.execute(
                AdminNotification.__table__.insert().values(
                    subject=subject,
                    message=message,
                    vendor_id=vendor.id,
                    created_at=datetime.utcnow(),
                    is_read=False
                )
            )
            print("Admin notification created for reported Vendor Review.")
        except Exception as e:
            print(f"Error creating admin notification for Vendor Review: {e}")


@listens_for(MarketReview, 'after_update')
def notify_admin_market_review_reported(mapper, connection, target):
    if target.is_reported:
        try:
            print(f"Market Review reported: ID={target.id}, Market ID={target.market_id}")

            # Retrieve the market
            market = connection.execute(
                Market.__table__.select().where(Market.id == target.market_id)
            ).fetchone()
            if not market:
                print(f"Market not found for Market ID: {target.market_id}")
                return

            # Create admin notification
            subject = "Reported Market Review"
            message = f"A review for market '{market.name}' has been reported."
            link = f"/admin/markets/{market.id}/reviews/{target.id}"  # Adjust this link as per your app's routing

            connection.execute(
                AdminNotification.__table__.insert().values(
                    subject=subject,
                    message=message,
                    market_id=market.id,
                    created_at=datetime.utcnow(),
                    is_read=False
                )
            )
            print("Admin notification created for reported Market Review.")
        except Exception as e:
            print(f"Error creating admin notification for Market Review: {e}")

    