# from sqlalchemy import event
# from sqlalchemy.orm import Session
# from sqlalchemy.event import listens_for
# from datetime import datetime
# from models import ( db, User, Market, MarketDay, Vendor, MarketReview, 
#                     VendorReview, ReportedReview, MarketReviewRating, 
#                     VendorReviewRating, MarketFavorite, VendorFavorite, 
#                     VendorMarket, VendorUser, AdminUser, Basket, Event, 
#                     Product, UserNotification, VendorNotification, 
#                     AdminNotification, QRCode, FAQ, Blog, Receipt, 
#                     SettingsUser, SettingsVendor, SettingsAdmin, bcrypt )


# @listens_for(VendorFavorite, 'after_insert')
# def track_vendor_favorite(mapper, connection, target):
#     try:
#         # print(f"New favorite detected: User ID={target.user_id}, Vendor ID={target.vendor_id}")

#         # Retrieve the vendor
#         vendor = connection.execute(
#             Vendor.__table__.select().where(Vendor.id == target.vendor_id)
#         ).fetchone()
#         if not vendor:
#             print(f"Vendor not found for Vendor ID: {target.vendor_id}")
#             return

#         # Retrieve the user
#         user = connection.execute(
#             User.__table__.select().where(User.id == target.user_id)
#         ).fetchone()
#         if not user:
#             print(f"User not found for User ID: {target.user_id}")
#             return

#         # Create a notification
#         subject = "Favorite Vendor Added"
#         message = f"{user.first_name} added {vendor.name} to their favorites!"
#         # print(f"Creating notification for User ID={user.id} about Vendor ID={vendor.id}")

#         connection.execute(
#             VendorNotification.__table__.insert().values(
#                 subject=subject,
#                 message=message,
#                 user_id=user.id,
#                 vendor_id=vendor.id,
#                 created_at=datetime.utcnow(),
#                 is_read=False
#             )
#         )
#         # print("Notification successfully created.")
#     except Exception as e:
#         print(f"Error in track_vendor_favorite: {e}")

# @listens_for(Event, 'after_insert')
# def vendor_market_event_or_schedule_change(mapper, connection, target):
#     session = Session(bind=connection)
#     try:
#         print(f"Market Event detected: ID={target.id}, Title='{target.title}', Market ID={target.market_id}")

#         # Retrieve the market
#         market = session.query(Market).get(target.market_id)
#         if not market:
#             print(f"Market with ID {target.market_id} not found. Aborting notification creation.")
#             return
#         print(f"Market found: ID={market.id}, Name='{market.name}'")

#         # Retrieve vendors associated with the market
#         vendors = session.query(Vendor).join(VendorMarket).join(MarketDay).filter(
#             MarketDay.market_id == market.id
#         ).all()
#         print(f"Vendors associated with Market ID {market.id}: {len(vendors)} vendors found.")

#         if not vendors:
#             print(f"No vendors found for Market ID {market.id}. No notifications will be created.")
#             return

#         # Check if the event is a schedule change
#         is_schedule_change = target.schedule_change

#         # Prepare notifications for vendors
#         notifications = []
#         for vendor in vendors:
#             existing_notification = session.query(VendorNotification).filter(
#                 VendorNotification.vendor_id == vendor.id,
#                 VendorNotification.market_id == market.id,
#                 VendorNotification.created_at >= datetime.utcnow().date(),
#                 VendorNotification.subject.in_([
#                     "New Event in Your Market!",
#                     "Act of God: Market Schedule Change"
#                 ])
#             ).first()

#             if existing_notification:
#                 print(f"Notification already exists for Vendor ID={vendor.id}, Market ID={market.id}. Skipping.")
#                 continue

#             if is_schedule_change:
#                 notification = VendorNotification(
#                     subject="Act of God: Market Schedule Change",
#                     message=f"The market '{market.name}' has updated its schedule due to unforeseen circumstances.",
#                     link=f"/vendors/{vendor.id}/markets/{market.id}/schedule",
#                     vendor_id=vendor.id,
#                     market_id=market.id,
#                     created_at=datetime.utcnow(),
#                     is_read=False
#                 )
#             else:
#                 notification = VendorNotification(
#                     subject="New Event in Your Market!",
#                     message=f"The market '{market.name}' has added a new event: {target.title}.",
#                     link=f"/vendors/{vendor.id}/markets/{market.id}/events/{target.id}",
#                     vendor_id=vendor.id,
#                     market_id=market.id,
#                     created_at=datetime.utcnow(),
#                     is_read=False
#                 )

#             notifications.append(notification)
#             print(f"Prepared notification for Vendor ID={vendor.id}, Name='{vendor.name}'")

#         # Save notifications
#         if notifications:
#             session.bulk_save_objects(notifications)
#             session.commit()
#             print(f"Successfully created {len(notifications)} notifications for Market ID={market.id}")

#     except Exception as e:
#         session.rollback()
#         print(f"Error in vendor_market_event_or_schedule_change: {e}")
#     finally:
#         session.close()
        
# @listens_for(Event, 'after_insert')
# def track_fav_vendor_event(mapper, connection, target):
#     if not target.vendor_id:  # Ensure the event is associated with a vendor
#         print(f"Event ID={target.id} is not associated with a vendor. Skipping vendor notifications.")
#         return

#     session = Session(bind=connection)
#     try:
#         print(f"Vendor Event detected: ID={target.id}, Title='{target.title}', Vendor ID={target.vendor_id}")

#         # Retrieve users who favorited the vendor
#         favorited_users = session.query(User).join(VendorFavorite).filter(
#             VendorFavorite.vendor_id == target.vendor_id
#         ).all()
#         print(f"Favorited users for Vendor ID {target.vendor_id}: {len(favorited_users)} users found.")

#         if not favorited_users:
#             print(f"No favorited users for Vendor ID {target.vendor_id}. No notifications will be created.")
#             return

#         # Retrieve the vendor for the event
#         vendor = session.query(Vendor).get(target.vendor_id)
#         if not vendor:
#             print(f"Vendor with ID {target.vendor_id} not found.")
#             return
#         print(f"Vendor found: ID={vendor.id}, Name='{vendor.name}'")

#         # Check if the event is a schedule change
#         is_schedule_change = target.schedule_change

#         # Prepare notifications
#         notifications = []
#         for user in favorited_users:
#             existing_notification = session.query(UserNotification).filter(
#                 UserNotification.user_id == user.id,
#                 UserNotification.vendor_id == vendor.id,
#                 UserNotification.created_at >= datetime.utcnow().date(),
#                 UserNotification.subject.in_([
#                     "New Event from Your Favorite Vendor!",
#                     "Act of God: Vendor Schedule Change"
#                 ])
#             ).first()

#             if existing_notification:
#                 print(f"Notification already exists for User ID={user.id}, Vendor ID={vendor.id}. Skipping.")
#                 continue

#             if is_schedule_change:
#                 notification = UserNotification(
#                     subject="Act of God: Vendor Schedule Change",
#                     message=f"The vendor '{vendor.name}' has updated their schedule due to unforeseen circumstances.",
#                     link=f"/user/vendors/{vendor.id}/schedule",
#                     user_id=user.id,
#                     vendor_id=vendor.id,
#                     created_at=datetime.utcnow(),
#                     is_read=False
#                 )
#             else:
#                 notification = UserNotification(
#                     subject="New Event from Your Favorite Vendor!",
#                     message=f"The vendor '{vendor.name}' has added a new event: {target.title}",
#                     link=f"/user/vendors/{vendor.id}/events/{target.id}",
#                     user_id=user.id,
#                     vendor_id=vendor.id,
#                     created_at=datetime.utcnow(),
#                     is_read=False
#                 )

#             notifications.append(notification)
#             print(f"Prepared notification for User ID={user.id}, Email='{user.email}'")

#         # Save notifications
#         if notifications:
#             session.bulk_save_objects(notifications)
#             session.commit()
#             print(f"Successfully created {len(notifications)} notifications for Vendor ID={vendor.id}")

#     except Exception as e:
#         session.rollback()
#         print(f"Error in track_fav_vendor_event: {e}")
#     finally:
#         session.close()

# @listens_for(VendorMarket, 'after_insert')
# def notify_new_vendor_in_favorite_market(mapper, connection, target):
#     try:
#         # print(f"New vendor detected: Vendor ID={target.vendor_id}, Market Day ID={target.market_day_id}")

#         # Retrieve the market associated with the market day
#         market_day = connection.execute(
#             MarketDay.__table__.select().where(MarketDay.id == target.market_day_id)
#         ).fetchone()
#         if not market_day:
#             print(f"Market Day not found for Market Day ID: {target.market_day_id}")
#             return

#         market = connection.execute(
#             Market.__table__.select().where(Market.id == market_day.market_id)
#         ).fetchone()
#         if not market:
#             print(f"Market not found for Market ID associated with Market Day ID: {target.market_day_id}")
#             return
#         # print(f"Market found: ID={market.id}, Name='{market.name}'")

#         # Retrieve the vendor
#         vendor = connection.execute(
#             Vendor.__table__.select().where(Vendor.id == target.vendor_id)
#         ).fetchone()
#         if not vendor:
#             print(f"Vendor not found for Vendor ID: {target.vendor_id}")
#             return
#         # print(f"Vendor found: ID={vendor.id}, Name='{vendor.name}'")

#         # Retrieve users who have favorited this market
#         favorited_users = connection.execute(
#             User.__table__.join(MarketFavorite, MarketFavorite.user_id == User.id)
#             .select()
#             .where(MarketFavorite.market_id == market.id)
#         ).fetchall()

#         # print(f"Favorited users for Market ID {market.id}: {len(favorited_users)} users found.")

#         if not favorited_users:
#             print(f"No users have favorited Market ID {market.id}. No notifications will be created.")
#             return

#         # Prepare and insert notifications
#         notifications = []
#         for user in favorited_users:
#             notifications.append({
#                 "subject": "New Vendor in Your Favorite Market!",
#                 "message": f"The vendor '{vendor.name}' has been added to your favorite market '{market.name}'.",
#                 "link": f"/user/markets/{market.id}",
#                 "user_id": user.id,
#                 "market_id": market.id,
#                 "vendor_id": vendor.id,
#                 "created_at": datetime.utcnow(),
#                 "is_read": False
#             })
#             # print(f"Prepared notification for User ID={user.id}, Email='{user.email}'")

#         if notifications:
#             connection.execute(UserNotification.__table__.insert(), notifications)
#             # print(f"Successfully created {len(notifications)} notifications for Market ID={market.id}")

#     except Exception as e:
#         print(f"Error in notify_new_vendor_in_favorite_market: {e}")
        
# @listens_for(VendorReview, 'after_update')
# def notify_admin_vendor_review_reported(mapper, connection, target):
#     if target.is_reported:
#         try:
#             # print(f"Vendor Review reported: ID={target.id}, Vendor ID={target.vendor_id}")

#             # Retrieve the vendor
#             vendor = connection.execute(
#                 Vendor.__table__.select().where(Vendor.id == target.vendor_id)
#             ).fetchone()
#             if not vendor:
#                 print(f"Vendor not found for Vendor ID: {target.vendor_id}")
#                 return

#             # Create admin notification
#             subject = "Reported Vendor Review"
#             message = f"A review for vendor '{vendor.name}' has been reported."
#             link = f"/admin/report"  # Adjust this link as per your app's routing

#             connection.execute(
#                 AdminNotification.__table__.insert().values(
#                     subject=subject,
#                     link=link,
#                     message=message,
#                     vendor_id=vendor.id,
#                     created_at=datetime.utcnow(),
#                     is_read=False
#                 )
#             )
#             # print("Admin notification created for reported Vendor Review.")
#         except Exception as e:
#             print(f"Error creating admin notification for Vendor Review: {e}")


# @listens_for(MarketReview, 'after_update')
# def notify_admin_market_review_reported(mapper, connection, target):
#     if target.is_reported:
#         try:
#             # print(f"Market Review reported: ID={target.id}, Market ID={target.market_id}")

#             # Retrieve the market
#             market = connection.execute(
#                 Market.__table__.select().where(Market.id == target.market_id)
#             ).fetchone()
#             if not market:
#                 print(f"Market not found for Market ID: {target.market_id}")
#                 return

#             # Create admin notification
#             subject = "Reported Market Review"
#             message = f"A review for market '{market.name}' has been reported."
#             link = f"/admin/report"  # Adjust this link as per your app's routing

#             connection.execute(
#                 AdminNotification.__table__.insert().values(
#                     subject=subject,
#                     message=message,
#                     market_id=market.id,
#                     created_at=datetime.utcnow(),
#                     is_read=False
#                 )
#             )
#             # print("Admin notification created for reported Market Review.")
#         except Exception as e:
#             print(f"Error creating admin notification for Market Review: {e}")

# @listens_for(Basket, 'after_insert')
# def fav_vendor_new_baskets(mapper, connection, target):
#     session = Session(bind=connection)
#     try:
#         print(f"New basket detected: ID={target.id}, Vendor ID={target.vendor_id}")

#         vendor = session.query(Vendor).get(target.vendor_id)
#         if not vendor:
#             print(f"Vendor not found for Vendor ID: {target.vendor_id}")
#             return

#         # Retrieve users who favorited this vendor
#         favorited_users = session.query(User).join(VendorFavorite).filter(
#             VendorFavorite.vendor_id == target.vendor_id
#         ).all()
#         print(f"Users favorited Vendor ID {vendor.id}: {len(favorited_users)} users found.")

#         if not favorited_users:
#             print(f"No users have favorited Vendor ID {vendor.id}. No notifications will be created.")
#             return

#         # Check for existing baskets for this vendor
#         recent_baskets = session.query(Basket).filter(
#             Basket.vendor_id == vendor.id,
#             Basket.sale_date >= datetime.utcnow().date()
#         ).all()

#         basket_count = len(recent_baskets)
#         print(f"Vendor ID {vendor.id} has {basket_count} baskets created today.")

#         if basket_count >= 2:
#             # Consolidate notification
#             message = f"{vendor.name} has added {basket_count} new baskets today! Check them out before they're gone!"
#         else:
#             # Individual basket notification
#             message = f"{vendor.name} has added a new basket! Check it out before it's gone!"

#         # Prepare notifications for favorited users
#         notifications = []
#         for user in favorited_users:
#             existing_notification = session.query(UserNotification).filter(
#                 UserNotification.user_id == user.id,
#                 UserNotification.vendor_id == vendor.id,
#                 UserNotification.created_at >= datetime.utcnow().date(),
#                 UserNotification.subject == "New Baskets from Your Favorite Vendor!"
#             ).first()

#             if existing_notification:
#                 print(f"Notification already exists for User ID={user.id}, Vendor ID={vendor.id}. Skipping.")
#                 continue

#             notification = UserNotification(
#                 subject="New Baskets from Your Favorite Vendor!",
#                 message=message,
#                 link=f"/vendors/{vendor.id}/baskets",
#                 user_id=user.id,
#                 vendor_id=vendor.id,
#                 created_at=datetime.utcnow(),
#                 is_read=False
#             )
#             notifications.append(notification)
#             print(f"Prepared notification for User ID={user.id}, Email='{user.email}'")

#         if notifications:
#             session.bulk_save_objects(notifications)
#             session.commit()
#             print(f"Successfully created {len(notifications)} notifications for Vendor ID={vendor.id}")

#     except Exception as e:
#         session.rollback()
#         print(f"Error in fav_vendor_new_baskets: {e}")
#     finally:
#         session.close()

# @listens_for(Blog, 'after_insert')
# def notify_users_new_blog(mapper, connection, target):
#     session = Session(bind=connection)
#     try:
#         print(f"New blog post detected: ID={target.id}, Title='{target.title}'")

#         # Retrieve all users to notify
#         users = session.query(User).all()
#         print(f"Total users to notify: {len(users)}")

#         if not users:
#             print("No users found. No notifications will be created.")
#             return

#         # Prepare notifications
#         notifications = []
#         for user in users:
#             notification = UserNotification(
#                 subject="New Blog Post Alert!",
#                 message=f"A new blog post titled '{target.title}' has been published. Check it out!",
#                 # link=f"/home",
#                 user_id=user.id,
#                 created_at=datetime.utcnow(),
#                 is_read=False
#             )
#             notifications.append(notification)
#             print(f"Prepared notification for User ID={user.id}, Email='{user.email}'")

#         if notifications:
#             session.bulk_save_objects(notifications)
#             session.commit()
#             print(f"Successfully created {len(notifications)} notifications for the new blog post.")

#     except Exception as e:
#         session.rollback()
#         print(f"Error in notify_users_new_blog: {e}")
#     finally:
#         session.close()
        
# @listens_for(Event, 'after_insert')
# def vendor_market_new_event(mapper, connection, target):
#     session = Session(bind=connection)
#     try:
#         print(f"New event detected: ID={target.id}, Title='{target.title}', Market ID={target.market_id}")

#         # Retrieve the market
#         market = session.query(Market).get(target.market_id)
#         if not market:
#             print(f"Market not found for Market ID: {target.market_id}")
#             return
#         print(f"Market found: ID={market.id}, Name='{market.name}'")

#         # Retrieve vendors associated with the market
#         vendors = session.query(Vendor).join(VendorMarket).join(MarketDay).filter(
#             MarketDay.market_id == market.id
#         ).all()
#         print(f"Vendors associated with Market ID {market.id}: {len(vendors)} vendors found.")

#         if not vendors:
#             print(f"No vendors found for Market ID {market.id}. No notifications will be created.")
#             return

#         # Prepare notifications for vendors
#         notifications = []
#         for vendor in vendors:
#             notification = VendorNotification(
#                 subject="New Event in Your Market!",
#                 message=f"The market '{market.name}' has created a new event: '{target.title}'.",
#                 link=f"/markets/{market.id}/events/{target.id}",  # Adjust link as per your routing
#                 vendor_id=vendor.id,
#                 market_id=market.id,
#                 created_at=datetime.utcnow(),
#                 is_read=False
#             )
#             notifications.append(notification)
#             print(f"Prepared notification for Vendor ID={vendor.id}, Name='{vendor.name}'")

#         # Save notifications
#         if notifications:
#             session.bulk_save_objects(notifications)
#             session.commit()
#             print(f"Successfully created {len(notifications)} notifications for Market ID={market.id}")

#     except Exception as e:
#         session.rollback()
#         print(f"Error in vendor_market_new_event: {e}")
#     finally:
#         session.close()
        
# @listens_for(Basket, 'after_update')
# def vendor_basket_sold(mapper, connection, target):
#     session = Session(bind=connection)
#     try:
#         print(f"Checking basket status: ID={target.id}, Vendor ID={target.vendor_id}, Is Sold={target.is_sold}")

#         # Only notify if the basket was just marked as sold
#         if target.is_sold:
#             # Retrieve the vendor
#             vendor = session.query(Vendor).get(target.vendor_id)
#             if not vendor:
#                 print(f"Vendor not found for Vendor ID: {target.vendor_id}")
#                 return
#             print(f"Vendor found: ID={vendor.id}, Name='{vendor.name}'")

#             # Create vendor notification
#             notification = VendorNotification(
#                 subject="Basket Sold!",
#                 message=f"One of your baskets has been sold for ${target.price:.2f}.",
#                 link=f"/vendors/{vendor.id}/baskets/{target.id}",  # Adjust link as per your routing
#                 vendor_id=vendor.id,
#                 created_at=datetime.utcnow(),
#                 is_read=False
#             )

#             # Save the notification
#             session.add(notification)
#             session.commit()
#             print(f"Notification created for Vendor ID={vendor.id}, Basket ID={target.id}")
#         else:
#             print(f"Basket ID={target.id} is not sold. No notification created.")

#     except Exception as e:
#         session.rollback()
#         print(f"Error in vendor_basket_sold: {e}")
#     finally:
#         session.close()