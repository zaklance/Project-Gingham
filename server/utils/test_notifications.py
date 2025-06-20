from app import app, db
from models import Event, Market, Vendor, VendorUser, SettingsVendor, VendorNotification, MarketDay, VendorMarket
from datetime import date, timezone, datetime
import time
import random

def test_event_notification_deletion():
    with app.app_context():
        try:
            # Use unique email to avoid conflicts
            unique_id = str(random.randint(10000, 99999))
            vendor_email = f"test_vendor_{unique_id}@example.com"

            # Create test market
            market = Market(
                name="Test Market",
                location="Test Location",
                city="Test City",
                state="NY",
                zipcode="10001",
                image_default="market-default-6_1600px.jpg",
                is_current=True,
                is_visible=True
            )
            db.session.add(market)
            db.session.commit()

            # Create test market day
            market_day = MarketDay(market_id=market.id, day_of_week=1)
            db.session.add(market_day)
            db.session.commit()

            # Create test vendor
            vendor = Vendor(
                name="Test Vendor",
                city="Test City",
                state="NY",
                products=[1, 2, 3],
                image_default="vendor-default-1_1600px.jpg"
            )
            db.session.add(vendor)
            db.session.commit()

            # Create test vendor user
            vendor_user = VendorUser(
                email=vendor_email,
                first_name="Test",
                last_name="User",
                phone="1234567890",
                vendor_id={"id": vendor.id}
            )
            vendor_user.password = "testpassword"
            db.session.add(vendor_user)
            db.session.commit()

            # Create vendor settings
            vendor_settings = SettingsVendor(
                vendor_user_id=vendor_user.id,
                site_market_schedule_change=True,
                site_market_new_event=True,
                market_locations=[market_day.id]
            )
            db.session.add(vendor_settings)
            db.session.commit()

            # Create test event
            event = Event(
                title="Test Event",
                message="Test Message",
                market_id=market.id,
                vendor_id=vendor.id,
                start_date=date.today(),
                end_date=date.today(),
                schedule_change=True
            )
            db.session.add(event)
            db.session.commit()

            # Wait for notification to be created
            time.sleep(2)

            # Check vendor notifications for this event
            vendor_notifications = VendorNotification.query.filter_by(
                vendor_id=vendor.id,
                market_id=market.id
            ).all()
            print(f"Vendor notifications after event creation: {len(vendor_notifications)}")
            for notif in vendor_notifications:
                print(f"  Notification: {notif.subject} | {notif.message}")

            # Create vendor-market association
            vendor_market = VendorMarket(vendor_id=vendor.id, market_day_id=market_day.id)
            db.session.add(vendor_market)
            db.session.commit()

            # Delete the event
            db.session.delete(event)
            db.session.commit()

            # Wait for notification to be deleted
            time.sleep(2)

            # Check vendor notifications again
            remaining_vendor_notifications = VendorNotification.query.filter_by(
                vendor_id=vendor.id,
                market_id=market.id
            ).all()
            print(f"Vendor notifications after event deletion: {len(remaining_vendor_notifications)}")

            # Clean up
            db.session.delete(vendor_settings)
            db.session.delete(vendor_user)
            db.session.delete(vendor)
            db.session.delete(vendor_market)
            db.session.delete(market_day)
            db.session.delete(market)
            db.session.commit()

        except Exception as e:
            print(f"Error during test: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    test_event_notification_deletion() 