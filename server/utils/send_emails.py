import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from emails import (send_email_user_fav_market_new_event, send_email_user_fav_market_schedule_change,
                    send_email_user_fav_market_new_vendor, send_email_user_fav_market_new_basket,
                    send_email_user_fav_vendor_new_event, send_email_user_fav_vendor_schedule_change,
                    send_email_user_fav_vendor_new_basket, send_email_user_basket_pickup_time,
                    send_email_user_vendor_review_response, send_email_user_new_blog,
                    send_email_user_new_market_in_city, send_email_vendor_market_new_event,
                    send_email_vendor_market_schedule_change, send_email_vendor_basket_sold,
                    send_email_vendor_new_review, send_email_vendor_new_blog,
                    send_email_vendor_new_statement, send_email_admin_reported_review,
                    send_email_admin_new_blog)
from models import (User, Market, Vendor, Event, Basket, VendorReview, Blog)

email = 'zak@mufo.nyc'

with app.app_context():

    user = User.query.get(1)
    market = Market.query.get(1)
    vendor = Vendor.query.get(1)
    event = Event.query.get(1)
    basket = Basket.query.get(1)
    review = VendorReview.query.get(1)
    blog = Blog.query.get(1)

    send_email_user_fav_market_new_event(email=email, user=user, market=market, event=event, link=f"markets/{market.id}")
    send_email_user_fav_market_schedule_change(email=email, user=user, market=market, event=event, link=f"markets/{market.id}")
    send_email_user_fav_market_new_vendor(email=email, user=user, market=market, vendor=vendor, link_market=f"markets/{market.id}", link_vendor=f"vendors/{vendor.id}")
    send_email_user_fav_market_new_basket(email=email, user=user, market=market, vendor=vendor, link_market=f"markets/{market.id}", link_vendor=f"vendors/{vendor.id}")
    send_email_user_fav_vendor_new_event(email=email, user=user, vendor=vendor, event=event, link_vendor=f"vendors/{vendor.id}")
    send_email_user_fav_vendor_schedule_change(email=email, user=user, vendor=vendor, event=event, link_vendor=f"vendors/{vendor.id}")
    send_email_user_fav_vendor_new_basket(email=email, user=user, market=market, vendor=vendor, link_market=f"markets/{market.id}", link_vendor=f"vendors/{vendor.id}")
    send_email_user_basket_pickup_time(email=email, user=user, market=market, vendor=vendor, basket=basket, link_market=f"markets/{market.id}", link_vendor=f"vendors/{vendor.id}")
    send_email_user_vendor_review_response(email=email, user=user, vendor=vendor, review=review, link_review=f"markets/{market.id}#reviews")
    send_email_user_new_blog(email=email, user=user, blog=blog)
    send_email_user_new_market_in_city(email=email, user=user, market=market, link_market=f"markets/{market.id}")

    send_email_vendor_market_new_event(email=email, user=user, market=market, event=event, link=f"markets/{market.id}")
    send_email_vendor_market_schedule_change(email=email, user=user, market=market, event=event, link=f"markets/{market.id}")
    send_email_vendor_basket_sold(email=email, user=user, market=market, vendor=vendor, basket_count=4, pickup_start=basket.pickup_start, pickup_end=basket.pickup_end, sale_date=basket.sale_date)
    send_email_vendor_new_review(email=email, user=user, vendor=vendor, review=review, link_review=f"markets/{market.id}#reviews")
    send_email_vendor_new_blog(email=email, user=user, blog=blog)
    send_email_vendor_new_statement(email=email, user=user, vendor=vendor, month=3, year=2025)

    send_email_admin_reported_review(email=email, user=user, vendor=vendor, market='', review=review, link_review=f"markets/{market.id}#reviews")
    send_email_admin_new_blog(email=email, user=user, blog=blog)