from app import app
from faker import Faker
from random import random, choice, randint
from models import ( db, User, Market, MarketDay, Vendor, MarketReview, 
                    VendorReview, ReportedReview, MarketReviewRating, 
                    VendorReviewRating, MarketFavorite, VendorFavorite, 
                    VendorMarket, VendorUser, VendorVendorUser, AdminUser, 
                    Basket, Event, Product, UserNotification, VendorNotification, 
                    AdminNotification, QRCode, FAQ, bcrypt )
import json
from datetime import datetime, timedelta, timezone, time, date

fake = Faker()

def run():
    User.query.delete()
    Market.query.delete()
    MarketDay.query.delete()
    Vendor.query.delete()
    MarketReview.query.delete()
    VendorReview.query.delete()
    ReportedReview.query.delete()
    MarketReviewRating.query.delete()
    VendorReviewRating.query.delete()
    MarketFavorite.query.delete()
    VendorFavorite.query.delete()
    VendorMarket.query.delete()
    VendorUser.query.delete()
    VendorVendorUser.query.delete()
    AdminUser.query.delete()
    Basket.query.delete()
    Event.query.delete()
    Product.query.delete()
    UserNotification.query.delete()
    VendorNotification.query.delete()
    AdminNotification.query.delete()
    QRCode.query.delete()
    FAQ.query.delete()

    db.session.commit()

    markets = [
        Market(
            name='Astor Place Greenmarket',
            image='greenmarket-grownyc-768x512.jpeg',
            location='E. 8th St. & Lafayette St.',
            zipcode='10003',
            coordinates={"lat": "40.729830818573944", "lng": "-73.99109568735417"},
            schedule='Tuesday (8 a.m. - 5 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 4),
            season_end=date(2024, 11, 26),
            is_visible=True
        ),
        Market(
            name='Dag Hammarskjold Greenmarket',
            # image='c.-Martin-Seck-GAP-1-768x531.jpg',
            location='E. 47th St. & 2nd Ave.',
            zipcode='10017',
            coordinates={"lat": "40.752106980482026", "lng": "-73.96813449641382"},
            schedule='Wednesday (8 a.m. - 3 p.m.)',
            year_round=True,
            is_visible=True
        ),
        Market(
            name='Greenmarket at the Oculus',
            image='Union_Square_Farmers_Market.jpg',
            location='Church & Fulton Sts. (Oculus Plaza)',
            zipcode='10006',
            coordinates={"lat": "40.71142490993184", "lng": "-74.01076962766949"},
            schedule='Tuesday (8 a.m. - 5 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 18),
            season_end=date(2024, 10, 29),
            is_visible=True
        ),
        Market(
            name='Union Square Greenmarket',
            image='Union_Square_Farmers_Market.jpg',
            location='E. 17th St. & Union Square W.',
            zipcode='10003',
            coordinates={"lat": "40.736358642578125", "lng": "-73.99076080322266"},
            schedule='Monday, Wednesday, Friday & Saturday (8 a.m. - 6 p.m.)',
            year_round=True,
            is_visible=True
        )
    ]
    db.session.add_all(markets)
    db.session.commit()

    market_day_list = [
        # Astor Place Greenmarket
        MarketDay(
            market_id=8,
            hour_start=time(8, 0, 0),
            hour_end=time(17, 0, 0),
            day_of_week=2,
        ),
        # Dag Hammarskjold Greenmarket
        MarketDay(
            market_id=14,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3,
        ),
        # Greenmarket at the Oculus
        MarketDay(
            market_id=19,
            hour_start=time(8, 0, 0),
            hour_end=time(17, 0, 0),
            day_of_week=2,
        ),
        # Union Square Greenmarket
        MarketDay(
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=1,
        ),
        # Union Square Greenmarket
        MarketDay(
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=3,
        ),
        # Union Square Greenmarket
        MarketDay(
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=5,
        ),
        # Union Square Greenmarket
        MarketDay(
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=6,
        )
    ]
    db.session.add_all(market_day_list)
    db.session.commit()



    vendors = []
    
    companies = ['Goods', 'Produce', 'Farms', 'Organics', 'and Son', 
                 'and Daughter', 'Market', 'Apothecary', 'Orchard'
                 ]
    states_ne = ['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT']
    rev_len = randint(2, 7)
    images = [
        '05bd2f_2b30b89b49eb4b2e95810360a9357bd2~mv2_d_7360_4912_s_4_2.jpeg',
        '90.jpeg',
        '66422240_2392773677468030_9162452177778638848_o.jpg',
        '1095728401_01526e79b1_b.jpg',
        '3223915584_8caf5935aa_b.jpg',
        '8045956113_b76fd52b44_b.jpg',
        '24575912061_08b77ec267_b.jpg',
        'Ballard_Farmers_Market_-_vegetables.jpg',
        'document_2.jpg',
        'farmers-market-1.jpg',
        'fresh-fruit-assortment-on-a-market-stall.jpg',
        'Fujifilm_X-T2_20200607_DSCF3839_blog.jpg',
        'market-market-stall-seller-food-drink-29aa05-1024.jpg',
        'market-stand-vegetables-market-stall-preview.jpg',
        'Michael_Greenmarket-1.jpg',
        'Mushroom_stand_at_the_Campbell_farmers_market.gk.jpg',
        'opfm-vendor-web2.jpg',
        'st-jacobs-farmers-market-fruit-and-vegetable-vendors-ontario-canada-2R82FT1.jpg',
        'Vendor-Slider-3-scaled.jpg'
    ]


    for i in range(20):
        name = f"{fake.first_name_nonbinary()}'s {choice(companies)}"
        city = str(fake.city())
        state = str(choice(states_ne))
        product = str(randint(1, 23))
        bio = str(fake.paragraph(nb_sentences=rev_len))
        image = choice(images) if randint(1, 8) > 1 else None

        v = Vendor(
            name=name,
            city=city,
            state=state,
            product=product,
            bio=bio,
            image=image
        )
        vendors.append(v)

    db.session.add_all(vendors)
    db.session.commit()

    # add fake users
    users = []
    states = [
         'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FM', 'FL', 'GA', 
         'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA', 
         'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 
         'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 
         'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY'
         ]
    apartment = ['Apt', 'Suite', 'Floor', 'Building']
    avatars = [
        "avatar-apricot.jpg", "avatar-avocado-1.jpg", "avatar-avocado-2.jpg", "avatar-cabbage.jpg",
        "avatar-kiwi-1.jpg", "avatar-kiwi-2.jpg", "avatar-lime.jpg", "avatar-melon.jpg",
        "avatar-nectarine.jpg", "avatar-onion-1.jpg", "avatar-onion-2.jpg", "avatar-onion-3.jpg",
        "avatar-peach.jpg", "avatar-pomegranate.jpg", "avatar-radish.jpg", "avatar-tomato.jpg",
        "avatar-watermelon.jpg"
    ]

    # user for demo
    user_demo = [
        # User(
        #     email="hamging@gingham.nyc",
        #     password="lol",
        #     first_name="Ham-man",
        #     last_name="Gingy",
        #     phone="2095553880",
        #     address_1="11 Broadway",
        #     address_2="Floor 2",
        #     city="New York",
        #     state="NY",
        #     zipcode="10004"
        # ),
        User(
            email="zak@mufo.nyc",
            password="lol",
            first_name="Zak",
            last_name="Lance",
            phone="0000000000",
            address_1="11 Broadway",
            address_2="Floor 2",
            city="New York",
            state="NY",
            zipcode="10004"
        ),
        User(
            email="sandro@mufo.nyc",
            password="lol",
            first_name="Sand",
            last_name="Man",
            phone="0000000000",
            address_1="11 Broadway",
            address_2="Floor 2",
            city="New York",
            state="NY",
            zipcode="10004"
        ),
        User(
            email="vinh@mufo.nyc",
            password="lol",
            first_name="Vinh",
            last_name="Cent",
            phone="0000000000",
            address_1="11 Broadway",
            address_2="Floor 2",
            city="New York",
            state="NY",
            zipcode="10004"
        ),
    ]
    db.session.add_all(user_demo)
    db.session.commit()

    # for i in range(16):
    #     email = fake.ascii_free_email()
    #     # password = fake.password()
    #     password = "lol"
    #     first_name = fake.first_name()
    #     last_name = fake.last_name()
    #     phone = str(randint(1000000000,9999999999))
    #     address_1 = fake.street_address()
    #     address_2 = f'{choice(apartment)} {randint(1, 200)}'
    #     city = fake.city()
    #     state = choice(states)
    #     zipcode = fake.postcode()
    #     # avatar = choice(avatars)
    #     # avatar = f'_default-images/{choice(avatars)}'

    #     u = User(
    #         email=email,
    #         password=password,
    #         first_name=first_name,
    #         last_name=last_name,
    #         phone=phone,
    #         address_1=address_1,
    #         address_2=address_2,
    #         city=city,
    #         state=state,
    #         zipcode=zipcode,
    #         # avatar=avatar
    #     )
    #     users.append(u)

    # db.session.add_all(users)
    # db.session.commit()

    # add fake market reviews
    market_revs = []
    reported = (False, False, False, False, False, False, False, False, False, True)
    for i in range(10):
        rev_len = randint(2, 5)

        review_text = str(fake.paragraph(nb_sentences=rev_len))
        market_id = str(randint(1, 4))
        user_id = str(randint(1, 3))
        is_reported = choice(reported)
        last_year = randint(0, 365)
        post_date = datetime.now(timezone.utc) - timedelta(days=last_year)

        mr = MarketReview(
            review_text=review_text,
            market_id=market_id,
            user_id=user_id,
            post_date=post_date,
            is_reported=is_reported
        )
        market_revs.append(mr)

    db.session.add_all(market_revs)
    db.session.commit()

    # add fake vendor reviews
    vendor_revs = []
    for i in range(50):
        rev_len = randint(2, 5)

        review_text = fake.paragraph(nb_sentences=rev_len)
        vendor_id = str(randint(1, 20))
        user_id = str(randint(1, 3))
        is_reported = choice(reported)
        last_year = randint(0, 365)
        post_date = datetime.now(timezone.utc) - timedelta(days=last_year)
        
        vr = VendorReview(
            review_text=review_text,
            vendor_id=vendor_id,
            user_id=user_id,
            post_date=post_date,
            is_reported=is_reported
        )
        vendor_revs.append(vr)

    db.session.add_all(vendor_revs)
    db.session.commit()

    market_favs = []
    for i in range(40):
        market_id = randint(1, 4)
        user_id = randint(1, 3)

        mf = MarketFavorite(
            market_id=market_id,
            user_id=user_id,
        )
        market_favs.append(mf)

    db.session.add_all(market_favs)
    db.session.commit()

    vendor_favs = []
    for i in range(80):
        vendor_id = randint(1, 20)
        user_id = randint(1, 3)

        vf = VendorFavorite(
            vendor_id=vendor_id,
            user_id=user_id,
        )
        vendor_favs.append(vf)

    db.session.add_all(vendor_favs)
    db.session.commit()

    # add fake vendor markets
    # vendor_markets = []
    # for i in range(500):

    #     vendor_id = str(randint(1, 150))
    #     market_day_id = str(randint(1, 57))

    #     vm = VendorMarket(
    #         vendor_id=vendor_id,
    #         market_day_id=market_day_id
    #     )
    #     vendor_markets.append(vm)

    # db.session.add_all(vendor_markets)
    # db.session.commit()


    # add fake users
    # user for demo
    vendor_user_demo = VendorUser(
        email="hello@gingham.nyc",
        password="lol",
        first_name="Ham-man",
        last_name="Gingy",
        phone="2095553880",
        vendor_id="1",
        is_admin=True
    )
    db.session.add(vendor_user_demo)
    db.session.commit()

    vendor_users = []
    for i in range(40):
        email = fake.ascii_free_email()
        # password = fake.password()
        password = "lol"
        first_name = fake.first_name()
        last_name = fake.last_name()
        # phone = fake.phone_number()
        phone = str(randint(1000000000,9999999999))
        vendor_id = str(randint(1, 20))
        is_admin = bool(fake.boolean())


        vu = VendorUser(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            vendor_id=vendor_id,
            is_admin=is_admin
        )
        vendor_users.append(vu)

    db.session.add_all(vendor_users)
    db.session.commit()

    admin_user_demo = AdminUser(
        email="admin@gingham.nyc",
        password="lol",
        first_name="Ham-man",
        last_name="Gingy",
        phone="2095553880",
    )
    db.session.add(admin_user_demo)
    db.session.commit()


    vendor_markets = []
    for i in range(40):
        vendor_id = str(randint(1, 20))
        market_day_id = str(randint(1, 7))

        vm = VendorMarket(
            vendor_id=vendor_id,
            market_day_id=market_day_id
        )
        vendor_markets.append(vm)

    db.session.add_all(vendor_markets)
    db.session.commit()


    baskets = []
    for i in range(200):
        rand_user = [None, randint(1, 20)]
        last_month = randint(-4, 4)
        sale_date = (datetime.now() - timedelta(days=last_month)).date()
        pickup_start = datetime.combine(sale_date, fake.time_object())
        random_duration_minutes = randint(30, 120)
        pickup_end = pickup_start + timedelta(minutes=random_duration_minutes)

        user_id = choice(rand_user)
        is_sold = user_id is not None
        is_grabbed = bool(fake.boolean()) if is_sold else bool(False)
        price = int(randint(5, 10))
        basket_value = int(price + randint(2, 8))

        selected_vm = choice(vendor_markets)

        bsk = Basket(
            vendor_id=selected_vm.vendor_id,
            market_day_id=selected_vm.market_day_id,
            sale_date=sale_date,
            pickup_start=pickup_start.time(),
            pickup_end=pickup_end.time(),
            user_id=user_id,
            is_sold=is_sold,
            is_grabbed=is_grabbed,
            price=price, 
            basket_value=basket_value
        )
        baskets.append(bsk)
    
    for i in range(12):
        rand_user = [None, randint(1, 50)]
        last_month = randint(-1, 1)
        sale_date = (datetime.now() - timedelta(days=last_month)).date()
        pickup_start = datetime.combine(sale_date, fake.time_object())
        random_duration_minutes = randint(30, 120)
        pickup_end = pickup_start + timedelta(minutes=random_duration_minutes)

        user_id = choice(rand_user)
        is_sold = user_id is not None
        is_grabbed = bool(fake.boolean()) if is_sold else bool(False)
        price = int(randint(5, 10))
        basket_value = int(price + randint(2, 8))

        selected_vm = choice(vendor_markets)

        bsk2 = Basket(
            vendor_id=1,
            market_day_id=selected_vm.market_day_id,
            sale_date=sale_date,
            pickup_start=pickup_start.time(),
            pickup_end=pickup_end.time(),
            user_id=user_id,
            is_sold=is_sold,
            is_grabbed=is_grabbed,
            price=price, 
            basket_value=basket_value
        )
        baskets.append(bsk2)

    db.session.add_all(baskets)
    db.session.commit()

    qr_codes = []
    # Create QR codes for baskets
    for basket in baskets:
        if basket.is_sold and not basket.is_grabbed:
            qr_code_value = f'{basket.vendor_id} {basket.id} {basket.user_id}'
            qr_code = QRCode(
                qr_code=qr_code_value,
                user_id=basket.user_id,
                vendor_id=basket.vendor_id,
                basket_id=basket.id
            )
            qr_codes.append(qr_code)

    db.session.add_all(qr_codes)
    db.session.commit()  

    #  Events
    events = []
    
    last_month = randint(0, 4)
    few_days = 14
    date_start = (datetime.now() - timedelta(days=last_month)).date()
    date_end = date_start + timedelta(days=few_days)
    schedule_change = bool(fake.boolean())

    holiday = Event(
        title="Holiday Market",
        message=fake.paragraph(nb_sentences=5),
        market_id=1,
        start_date=date_start,
        end_date=date_end,
        schedule_change=False
    )
    events.append(holiday)
    
    special = Event(
        title="Weekly Special",
        message=fake.paragraph(nb_sentences=4),
        vendor_id=1,
        start_date=date_start,
        end_date=date_end,
        schedule_change=True
    )
    events.append(special)

    for i in range(4):
        heading = randint(1, 2)
        msg_len = randint(2, 5)
        rand_market = choice([None, randint(1, 4)])
        if rand_market is None:
            rand_vendor = randint(1, 20)
        else:
            rand_vendor = None
        last_month = randint(0, 31)
        few_days = randint(0, 14)
        date_start = (datetime.now() - timedelta(days=last_month)).date()
        date_end = date_start + timedelta(days=few_days)

        title = fake.sentence(nb_words=heading)
        message = fake.paragraph(nb_sentences=msg_len)
        market_id = rand_market
        vendor_id = rand_vendor
        start_date = date_start
        end_date = date_end
        schedule_change = bool(fake.boolean())
        
        ev = Event(
            title=title,
            message=message,
            market_id=market_id,
            vendor_id=vendor_id,
            start_date=start_date,
            end_date=end_date,
            schedule_change=schedule_change
        )
        events.append(ev)

    db.session.add_all(events)
    db.session.commit()

    user_notifs = []

    # unm = UserNotification(
    #         message=fake.paragraph(nb_sentences=1),
    #         user_id=1,
    #         market_id=1,
    #         is_read=False
    #     )
    # unv = UserNotification(
    #         message=fake.paragraph(nb_sentences=2),
    #         user_id=1,
    #         vendor_id=1,
    #         is_read=False
    #     )
    
    # user_notifs.append(unm)
    # user_notifs.append(unv)

    for i in range(200):
        msg_len = randint(1, 2)
        rand_market = choice([None, randint(1, 40)])
        if rand_market is None:
            rand_vendor = randint(1, 150)
        else:
            rand_vendor = None
        few_days = randint(0, 14)

        subject = choice(["vendor", "market"])
        message = fake.paragraph(nb_sentences=msg_len)
        link = choice (['/user/vendors/1', '/user/markets/1'])
        user_id = randint(1, 3)
        market_id = rand_market
        vendor_id = rand_vendor
        created_at = datetime.now(timezone.utc) - timedelta(days=few_days)
        is_read = bool(False)

        
        un = UserNotification(
            subject=subject,
            message=message,
            link=link,
            user_id=user_id,
            market_id=market_id,
            vendor_id=vendor_id,
            created_at=created_at,
            is_read=is_read
        )
        user_notifs.append(un)

    db.session.add_all(user_notifs)
    db.session.commit()

    # add fake market review ratings
    market_rev_ratings = []
    for i in range(200):
        rand_bool = choice([True, False])

        review_id = str(randint(1, 200))
        user_id = str(randint(1, 3))
        vote_down = rand_bool
        if rand_bool is False:
            vote_up = True
        else:
            vote_up = False

        mrr = MarketReviewRating(
            review_id=review_id,
            user_id=user_id,
            vote_down=vote_down,
            vote_up=vote_up
        )
        market_rev_ratings.append(mrr)

    db.session.add_all(market_rev_ratings)
    db.session.commit()


    # add fake market review ratings
    vendor_rev_ratings = []
    for i in range(800):
        rand_bool = choice([True, False])

        review_id = str(randint(1, 200))
        user_id = str(randint(1, 3))
        vote_down = rand_bool
        if rand_bool is False:
            vote_up = True
        else:
            vote_up = False

        vrr = VendorReviewRating(
            review_id=review_id,
            user_id=user_id,
            vote_down=vote_down,
            vote_up=vote_up
        )
        vendor_rev_ratings.append(vrr)

    db.session.add_all(vendor_rev_ratings)
    db.session.commit()

    products_list = [
        'Other', 'Art', 'Baked Goods', 'Cheese', 'Cider', 'Ceramics', 'Coffee/Tea', 
        'Fish', 'Flowers', 'Fruit', 'Gifts', 'Honey', 'International', 
        'Juice', 'Maple Syrup', 'Meats', 'Mushrooms', 'Nuts', 'Pasta', 
        'Pickles', "Spices", 'Spirits', 'Vegetables'
        ]
    products = []

    for product_name in products_list:
        product = Product(
            product=product_name
            )
        products.append(product)

    db.session.add_all(products)
    db.session.commit()


    user_faqs = [
        FAQ(
            question="How does Gingham work for customers?",
            answer="Browse available baskets from local farmers market vendors, purchase discounted items, and pick them up at a designated time.",
            for_user=True
        ),
        FAQ(
            question="What types of baskets can I purchase?",
            answer="Vendors offer “mystery baskets” of surplus or imperfect goods, including produce, baked items, or packaged foods, often at a discounted price.",
            for_user=True
        ),
        FAQ(
            question="How do I know where to pick up my basket?",
            answer="After purchasing, you’ll receive the pickup location, vendor details, and a specific time to collect your basket.",
            for_user=True
        ),
        FAQ(
            question="Can I choose what’s in my basket?",
            answer="Gingham baskets are pre-bundled by vendors to simplify the process, but they often include a variety of products.",
            for_user=True
        ),
        FAQ(
            question="Is Gingham available at all farmers markets?",
            answer="Gingham is currently launching in select markets, but we’re expanding quickly! Sign up to stay tuned for updates in your area.",
            for_user=True
        ),
        FAQ(
            question="How do I pay for my basket?",
            answer="Payments are made securely through Gingham at the time of purchase, so pick-up is fast and easy.",
            for_user=True
        )
    ]
    vendor_faqs = [
        FAQ(
            question="How do I sign up as a vendor on Gingham?",
            answer="Signing up is quick and easy! Create your vendor profile, choose the farmers markets you participate in, and start listing your surplus baskets.",
            for_vendor=True
        ),
        FAQ(
            question="What types of products can I sell on Gingham?",
            answer="You can sell surplus or produce, baked goods, packaged foods, or other items you would typically sell at farmers markets.",
            for_vendor=True
        ),
        FAQ(
            question="How do I create and manage baskets?",
            answer="Through the Gingham Vendor Dashboard, you can create baskets, set discounted pricing, and schedule pickup times for customers.",
            for_vendor=True
        ),
        FAQ(
            question="How and when do customers pick up their baskets?",
            answer="Customers pick up their pre-ordered baskets at your stall during the time window you choose, typically at the end of the market day.",
            for_vendor=True
        ),
        FAQ(
            question="How does Gingham help me reduce food waste?",
            answer="Gingham helps you sell surplus items that might otherwise go unsold, connecting you directly with customers looking for discounted local goods.",
            for_vendor=True
        ),
        FAQ(
            question="Is there a fee for selling baskets on Gingham?",
            answer="Gingham charges a small service fee on each sale and offers a transparent pricing structure with no hidden costs.",
            for_vendor=True
        ),
        FAQ(
            question="When do I get paid for my sales?",
            answer="Payments are processed securely, and funds for the previous month's sales are typically transferred to your account within the first week of the following month.",
            for_vendor=True
        ),
        FAQ(
            question="Can I edit or cancel my baskets after they are listed?",
            answer="Yes, you can edit or cancel unsold baskets through the Vendor Dashboard up until 9:00 AM on the day of the market.",
            for_vendor=True
        ),
        FAQ(
            question="What happens if the customer doesn't pick up their basket?",
            answer="In case of no-shows, vendors keep the product, and the customer will be charged per Gingham’s policy.",
            for_vendor=True
        )
    ]

    db.session.add_all(user_faqs)
    db.session.add_all(vendor_faqs)
    db.session.commit()


    
if __name__ == '__main__':
    with app.app_context():
        run()