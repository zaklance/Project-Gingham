import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from sms import (send_sms_user_fav_market_schedule_change)
from models import (db, User, VendorUser, AdminUser, Market, Vendor, Event, Basket, VendorReview, Blog)

phone = '+12095053880'

with app.app_context():

    user = db.session.get(User, 51)
    # user = db.session.get(VendorUser, 51)
    # user = db.session.get(AdminUser, 2)
    market = db.session.get(Market, 1)
    vendor = db.session.get(Vendor, 1)
    event = db.session.get(Event, 1)
    basket = db.session.get(Basket, 1)
    review = db.session.get(VendorReview, 1)
    blog = db.session.get(Blog, 1)

    send_sms_user_fav_market_schedule_change(phone=phone, user=user, market=market, event=event, link_market=f"/user/markets/{market.id}")