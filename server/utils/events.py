from sqlalchemy import event
from sqlalchemy.orm.attributes import get_history
from models import (
    db, User, Market, MarketDay, Vendor, MarketReview,
    VendorReview, ReportedReview, MarketReviewRating,
    VendorReviewRating, MarketFavorite, VendorFavorite,
    VendorMarket, VendorUser, VendorVendorUser, AdminUser,
    Basket, Event, Product, UserNotification, VendorNotification,
    AdminNotification, QRCode, FAQ, bcrypt
)


def track_vendor_favorite(mapper, connection, target):
    try:
        # print(f"Processing VendorFavorite insert: User ID {target.user_id}, Vendor ID {target.vendor_id}")

        # Retrieve the vendor
        vendor = Vendor.query.get(target.vendor_id)
        if not vendor:
            print(f"Vendor not found for Vendor ID: {target.vendor_id}")
            return

        # Retrieve the user who favorited the vendor
        user = User.query.get(target.user_id)
        if not user:
            print(f"User not found for User ID: {target.user_id}")
            return 
        # print(f"Vendor found: {vendor.name} (Vendor ID: {vendor.id})")
        # print(f"User found: {user.first_name} {user.last_name} (User ID: {user.id})")

        # Create the notification
        subject = "favorite"
        message = f"{user.first_name} has added {vendor.name} to their favorites!"
        link = f"/vendor/dashboard"  # Adjust link as needed.

        # print(f"Creating notification with message: '{message}' and link: '{link}'")

        notification = VendorNotification(
            subject=subject,
            message=message,
            # link=link,
            vendor_id=vendor.id,
            created_at=db.func.now(),  
            is_read=False
        )

        connection.execute(
            VendorNotification.__table__.insert().values(
                subject=notification.subject,
                message=notification.message,
                # link=notification.link,
                vendor_id=notification.vendor_id,
                created_at=notification.created_at,
                is_read=notification.is_read
            )
        )
        
        # print(f"Notification successfully added for Vendor ID {vendor.id}")
    except Exception as e:
        print(f"Error occurred in track_vendor_favorite: {e}")

event.listen(VendorFavorite, 'after_insert', track_vendor_favorite)