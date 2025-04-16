import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app
from faker import Faker
from random import random, choice, randint, sample
from models import ( db, User, Market, MarketDay, Vendor, MarketReview, 
                    VendorReview, ReportedReview, MarketReviewRating, 
                    VendorReviewRating, MarketFavorite, VendorFavorite, 
                    VendorMarket, VendorUser, AdminUser, Basket, Event, 
                    Product, UserNotification, VendorNotification, 
                    AdminNotification, QRCode, FAQ, Blog, BlogFavorite,
                    Receipt, SettingsUser, SettingsVendor, SettingsAdmin,
                    UserIssue
                    )
import json
from datetime import datetime, timedelta, timezone, time, date
import datetime as dt
from pytz import timezone

fake = Faker()

def run():
    MarketReviewRating.query.delete()
    VendorReviewRating.query.delete()
    MarketReview.query.delete()
    VendorReview.query.delete()
    VendorMarket.query.delete()
    MarketDay.query.delete()
    ReportedReview.query.delete()
    MarketFavorite.query.delete()
    VendorFavorite.query.delete()
    Basket.query.delete()
    Event.query.delete()
    Product.query.delete()
    UserNotification.query.delete()
    VendorNotification.query.delete()
    AdminNotification.query.delete()
    QRCode.query.delete()
    FAQ.query.delete()
    BlogFavorite.query.delete()
    Blog.query.delete()
    Receipt.query.delete()
    Market.query.delete()
    Vendor.query.delete()
    UserIssue.query.delete()
    SettingsUser.query.delete()
    SettingsVendor.query.delete()
    SettingsAdmin.query.delete()
    User.query.delete()
    VendorUser.query.delete()
    AdminUser.query.delete()

    db.session.commit()


    # add fake users
    users = []
    users_settings = []
    states = [
         'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FM', 'FL', 'GA', 
         'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA', 
         'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 
         'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 
         'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY'
         ]
    apartment = ['Apt', 'Suite', 'Floor', 'Building']
    avatars = [
        "avatar-apricot-1.jpg", "avatar-avocado-1.jpg", "avatar-cabbage-1.jpg", 
        "avatar-kiwi-1.jpg", "avatar-kiwi-2.jpg", "avatar-lime-1.jpg", "avatar-melon-1.jpg",
        "avatar-mangosteen-1.jpg", "avatar-mangosteen-2.jpg", "avatar-nectarine-1.jpg", 
        "avatar-onion-1.jpg", "avatar-onion-2.jpg", "avatar-peach-1.jpg", 
        "avatar-pomegranate-1.jpg", "avatar-radish-1.jpg", "avatar-tomato-1.jpg",
        "avatar-watermelon-1.jpg"
    ]

    for i in range(50):
        email = fake.ascii_safe_email()
        # password = fake.password()
        password = "lol"
        first_name = fake.first_name()
        last_name = fake.last_name()
        phone = f'+1 {str(randint(1000000000,9999999999))}'
        address_1 = fake.street_address()
        address_2 = f'{choice(apartment)} {randint(1, 200)}'
        city = choice(['Brooklyn', 'Brooklyn', 'Brooklyn', 'Bronx', 'Bronx', 'Far Rockaway', 'New York', 'New York', 'New York', 'New York', 'Queens', 'Queens', 'Staten Island'])
        state = 'NY'
        zipcode = fake.postcode()
        # avatar = choice(avatars)
        # avatar = f'_default-images/{choice(avatars)}'

        u = User(
            id=(i + 1),
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            address_1=address_1,
            address_2=address_2,
            city=city,
            state=state,
            zipcode=zipcode,
            coordinates={"lat": 40.726586, "lng": -73.988734}
            # avatar=avatar
        )
        users.append(u)

        # su = SettingsUser(
        #     user_id=(i + 1)
        # )
        # users_settings.append(su)

    db.session.add_all(users)
    # db.session.add_all(users_settings)
    db.session.commit()


    # user for demo
    user_demo = User(
        email="hamging@gingham.nyc",
        password="lol",
        first_name="Ham-man",
        last_name="Gingy",
        phone="+12095553880",
        address_1="11 Broadway",
        address_2="Floor 2",
        city="New York",
        state="NY",
        zipcode="10004",
        coordinates={"lat": 40.726586, "lng": -73.988734}
    )
    # user_settings_demo = SettingsUser(
    #     user_id=51
    # )
    db.session.add(user_demo)
    # db.session.add(user_settings_demo)
    db.session.commit()


    markets = [
        Market(
            id=1,
            name='175th Street Greenmarket',
            image='10292023_Broadway_farmers_market_Columbia_NYC.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/175th-street",
            location='W. 175th St. bet. Wadsworth Ave. & Broadway',
            city="New York",
            state="NY",
            zipcode='10033',
            coordinates={"lat": "40.84607450953993", "lng": "-73.93808039940272"},
            schedule='Thursday (8 AM - 4 PM)',
            year_round=False,
            season_start=date(2025, 6, 26),
            season_end=date(2025, 11, 20),
            is_current=True
        ),
        Market(
            id=2,
            name='57th Street Greenmarket',
            image='6329735393_3a905a118a_o.0.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/57th-street-sa",
            location='W. 57th St. & 10th Ave.',
            city="New York",
            state="NY",
            zipcode='10019',
            coordinates={"lat": "40.769140743893075", "lng": "-73.98836576430834"},
            schedule='Saturday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 6, 7),
            season_end=date(2025, 11, 22),
            is_current=True
        ),
        Market(
            id=3,
            name='79th Street Greenmarket',
            bio="Clothing Collection Hours: 9:00 AM - 12:00 PM",
            image='image.jpeg',
            website="https://www.grownyc.org/greenmarket/manhattan/79th-street",
            location='79th St. & Columbus Ave.',
            city="New York",
            state="NY",
            zipcode='10024',
            coordinates={"lat": "40.782040858828", "lng": "-73.9759752811397"},
            schedule='Sunday (9 AM - 4 PM)',
            year_round=True,
            is_current=True,
            is_flagship=True
        ),
        Market(
            id=4,
            name='82nd Street Greenmarket',
            image='bronxborhall_shaylahunter_re_xy4a4543.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/82nd-street",
            location=' 82nd St. bet. 1st & York Aves.',
            city="New York",
            state="NY",
            zipcode='10028',
            coordinates={"lat": "40.77397099020891", "lng": "-73.95064361322936"},
            schedule='Saturday (9 AM - 2:30 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=5,
            name='94th Street Greenmarket',
            image='c.-Martin-Seck-GAP-1-768x531.jpg',
            location='E. 94th St. & 1st Ave.',
            city="New York",
            state="NY",
            zipcode='10128',
            coordinates={"lat": "40.78180268440337", "lng": "-73.94555998335593"},
            schedule='Sunday (9 AM - 4 PM)',
            year_round=False,
            season_start=date(2024, 6, 18),
            season_end=date(2024, 11, 19),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=6,
            name='97th Street Greenmarket',
            image='farmers-market.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/west-97",
            location='W. 97th St. bet. Columbus & Amsterdam Aves.',
            city="New York",
            state="NY",
            zipcode='10025',
            coordinates={"lat": "40.79433392796688", "lng": "-73.96852339557134"},
            schedule='Friday (8 AM - 2 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=7,
            name='Abingdon Square Greenmarket',
            image='flatten;crop;webp=auto;jpeg_quality=60.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/abingdon-square",
            location='Hudson St. & W. 12th St.',
            city="New York",
            state="NY",
            zipcode='10014',
            coordinates={"lat": "40.737268845844085", "lng": "-74.00531736212757"},
            schedule='Saturday (8 AM - 2 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=8,
            name='Astor Place Greenmarket',
            image='greenmarket-grownyc-768x512.jpeg',
            website="https://www.grownyc.org/greenmarket/manhattan/astorplace",
            location='E. 8th St. & Lafayette St.',
            city="New York",
            state="NY",
            zipcode='10003',
            coordinates={"lat": "40.729830818573944", "lng": "-73.99109568735417"},
            schedule='Tuesday (8 AM - 5 PM)',
            year_round=False,
            season_start=date(2025, 6, 3),
            season_end=date(2025, 11, 25),
            is_current=True
        ),
        Market(
            id=9,
            name='Bowling Green Greenmarket',
            image='image.jpeg',
            website="https://www.grownyc.org/greenmarket/manhattan/bowling-green-tu",
            location='Broadway & Battery Pl.',
            city="New York",
            state="NY",
            zipcode='10004',
            coordinates={"lat": "40.704724320402526", "lng": "-74.01342009247573"},
            schedule='Tuesday & Thursday (8 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 4, 15),
            season_end=date(2024, 11, 25),
            is_current=True
        ),
        Market(
            id=10,
            name='Bro Sis Green Youth Market',
            image='Union_Square_Farmers_Market.jpg',
            website="https://brotherhood-sistersol.org/events/brosis-green-youth-market-2024/",
            location='Amsterdam Ave. bet. W. 143rd & 144th St. (Johnny Hartman Plaza)',
            city="New York",
            state="NY",
            zipcode='10031',
            coordinates={"lat": "40.824268847996954", "lng": "-73.94880767347686"},
            schedule='Wednesday (10:30 AM - 6 PM)',
            year_round=False,
            season_start=date(2024, 7, 8),
            season_end=date(2024, 11, 25),
            is_current=False
        ),
        Market(
            id=11,
            name="Chelsea’s Down to Earth Farmers Market",
            image='unnamed.jpg',
            website="https://downtoearthmarkets.com/markets?region=Manhattan&market=Chelsea+Farmers+Market",
            location='W. 23rd St. bet. 8th & 9th Aves.',
            city="New York",
            state="NY",
            zipcode='10011',
            coordinates={"lat": "40.74610601822501", "lng": "-74.00012495281699"},
            schedule='Saturday (9 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 4, 20),
            season_end=date(2024, 12, 21),
            is_current=False
        ),
        Market(
            id=12,
            name="Children’s Aid Go!Healthy Food Box + Farmstand - Milbank Center",
            image='6329735393_3a905a118a_o.0.jpg',
            website="",
            location='14-32 W. 118th St.',
            city="New York",
            state="NY",
            zipcode='10026',
            coordinates={"lat": "40.80245205041825", "lng": "-73.94675905810875"},
            schedule='Wednesday (2 - 4:30 PM)',
            year_round=False,
            season_start=date(2024, 7, 10),
            season_end=date(2024, 11, 20),
            is_current=False
        ),
        Market(
            id=13,
            name='Columbia Greenmarket',
            bio="Clothing Collection Hours: 9:00 AM - 12:00 PM *Sundays only",
            image='Union_Square_Farmers_Market.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/columbia-su",
            location='Broadway & 114th St.',
            city="New York",
            state="NY",
            zipcode='10025',
            coordinates={"lat": "40.80711550674964", "lng": "-73.9643334908912"},
            schedule='Thursday & Sunday (8 AM - 4 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=14,
            name='Dag Hammarskjold Greenmarket',
            # image='c.-Martin-Seck-GAP-1-768x531.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/dag-hammarskjold",
            location='E. 47th St. & 2nd Ave.',
            city="New York",
            state="NY",
            zipcode='10017',
            coordinates={"lat": "40.752106980482026", "lng": "-73.96813449641382"},
            schedule='Wednesday (8 AM - 3 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=15,
            name='Fort Washington Greenmarket',
            image='farmers-market.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/fort-washington",
            location='W. 168th St. & Ft. Washington Ave.',
            city="New York",
            state="NY",
            zipcode='10032',
            coordinates={"lat": "40.842308310821956", "lng": "-73.94211665674466"},
            schedule='Tuesday (8 AM - 4 PM)',
            year_round=False,
            season_start=date(2025, 6, 3),
            season_end=date(2025, 11, 23),
            is_current=True
        ),
        Market(
            id=16,
            name='Fulton Stall Market (Indoor Farmers Market)',
            bio="Indoor Market Hours:  Monday - Saturday 11:30 AM to 5:00 PM, year round. CSA Pick-Up Hours:  Thursday 4:00 PM to 6:00 PM Friday 11:30 AM to 5:00 PM. Outdoor Market:  Saturday 11:30 AM to 5:00 PM, Fulton St. at South St., May through Thanksgiving.",
            image='flatten;crop;webp=auto;jpeg_quality=60.jpg',
            website="https://fultonstallmarket.org",
            location='91 South St.',
            city="New York",
            state="NY",
            zipcode='10038',
            coordinates={"lat": "40.70614940342313", "lng": "-74.00349962702734"},
            schedule='Monday - Saturday (11:30 AM - 5 PM)',
            year_round=True,
            is_current=True,
            is_flagship=True
        ),
        Market(
            id=17,
            name='Gouverneur Health Farmstand',
            image='greenmarket-grownyc-768x512.jpeg',
            website="https://www.grownyc.org/farmstand/gouverneur",
            location='Madison St. bet. Clinton & Jefferson St.',
            city="New York",
            state="NY",
            zipcode='10002',
            coordinates={"lat": "40.71266393582476", "lng": "-73.98847487671178"},
            schedule='Thursday (9 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 7, 5),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=18,
            name='Grass Roots Farmers Market',
            image='image.jpeg',
            website="https://www.harlemonestop.com/organization/448/grassroots-farmers-market",
            location='W. 145th St. bet. Edgecombe & Bradhurst Aves. (Jackie Robinson Park)',
            city="New York",
            state="NY",
            zipcode='10039',
            coordinates={"lat": "40.82373611412579", "lng": "-73.9435495760123"},
            schedule='Tuesday & Saturday (9 AM - 4 PM)',
            year_round=False,
            is_current=False
        ),
        Market(
            id=19,
            name='Greenmarket at the Oculus',
            image='Union_Square_Farmers_Market.jpg',
            website="https://www.grownyc.org/greenmarket-oculus-plaza",
            location='Church & Fulton St. (Oculus Plaza)',
            city="New York",
            state="NY",
            zipcode='10006',
            coordinates={"lat": "40.71142490993184", "lng": "-74.01076962766949"},
            schedule='Tuesday (8 AM - 5 PM)',
            year_round=False,
            season_start=date(2024, 6, 18),
            season_end=date(2024, 10, 29),
            is_current=False
        ),
        Market(
            id=20,
            name='Harlem Meer Farmstand',
            image='unnamed.jpg',
            website="https://www.centralparknyc.org/locations/110th-street-malcolm-x-boulevard",
            location='Central Park N. & Malcom X Blvd.',
            city="New York",
            state="NY",
            zipcode='10026',
            coordinates={"lat": "40.79815888129796", "lng": "-73.95254032492262"},
            schedule='Saturday (10 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 7, 20),
            season_end=date(2024, 11, 30),
            is_current=False
        ),
        Market(
            id=21,
            name='Harvest Home East Harlem Farmers Market',
            # image='10292023_Broadway_farmers_market_Columbia_NYC.jpg',
            website="https://www.harvesthomefm.org/manhattan-markets",
            location='E. 104th St. & 3rd Ave.',
            city="New York",
            state="NY",
            zipcode='10029',
            coordinates={"lat": "40.79001677902627", "lng": "-73.94559282721028"},
            schedule='Thursday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 13),
            season_end=date(2024, 11, 14),
            is_current=False
        ),
        Market(
            id=22,
            name='Harvest Home Harlem Hospital Farmers Market',
            image='6329735393_3a905a118a_o.0.jpg',
            website="https://www.harvesthomefm.org/manhattan-markets",
            location='W. 137th St. & Lenox Ave.',
            city="New York",
            state="NY",
            zipcode='10030',
            coordinates={"lat": "40.81542139191092", "lng": "-73.93994201397497"},
            schedule='Friday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 14),
            season_end=date(2024, 11, 15),
            is_current=False
        ),
        Market(
            id=23,
            name='Harvest Home Lenox Avenue Farm Stand',
            image='unnamed.jpg',
            website="https://www.harvesthomefm.org/manhattan-markets",
            location='Lenox Ave. bet. W. 117th & 118th St.',
            city="New York",
            state="NY",
            zipcode='10026',
            coordinates={"lat": "40.80272354850676", "lng": "-73.94895981440956"},
            schedule='Saturday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 22),
            season_end=date(2024, 11, 16),
            is_current=False
        ),
        Market(
            id=24,
            name='Harvest Home Metropolitan Hospital Farmers Market',
            image='bronxborhall_shaylahunter_re_xy4a4543.jpg',
            website="https://www.harvesthomefm.org/manhattan-markets",
            location='97th St. & 2nd Ave.',
            city="New York",
            state="NY",
            zipcode='10029',
            coordinates={"lat": "40.784947665352576", "lng": "-73.94660106093569"},
            schedule='Friday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 14),
            season_end=date(2024, 11, 15),
            is_current=False
        ),
        Market(
            id=25,
            name='Inwood Park Greenmarket',
            bio="Clothing Collection Hours: 9:30 AM - 12:30 PM ",
            image='c.-Martin-Seck-GAP-1-768x531.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/inwood",
            location='Isham St. bet. Seaman Ave. & Cooper St.',
            city="New York",
            state="NY",
            zipcode='10034',
            coordinates={"lat": "40.86911825882977", "lng": "-73.92025906885881"},
            schedule='Saturday (8 AM - 3 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=26,
            name='Lower East Side Farmstand',
            image='farmers-market.jpg',
            website="https://www.grownyc.org/farmstand/les",
            location='Grand St. bet. Pitt & Willett St. (outside of Abrons Arts Center)',
            city="New York",
            state="NY",
            zipcode='10002',
            coordinates={"lat": "40.715117290409026", "lng": "-73.98348650666313"},
            schedule='Thursday (8:30 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 7, 5),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=27,
            name="Morningside Park’s Down to Earth Farmers Market",
            image='flatten;crop;webp=auto;jpeg_quality=60.jpg',
            website="https://www.morningsidepark.org/farmers-market",
            location='W. 110th St. & Manhattan Ave.',
            city="New York",
            state="NY",
            zipcode='10026',
            coordinates={"lat": "40.801382884379336", "lng": "-73.95970142371496"},
            schedule='Saturday (9 AM - 2 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=28,
            name='Mount Sinai Greenmarket',
            image='greenmarket-grownyc-768x512.jpeg',
            website="https://www.grownyc.org/greenmarket/manhattan/mount-sinai",
            location='Madison Ave. & 99th St.',
            city="New York",
            state="NY",
            zipcode='10029',
            coordinates={"lat": "40.78944510836953", "lng": "-73.95271330705022"},
            schedule='Wednesday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 6, 18),
            season_end=date(2025, 11, 26),
            is_current=True
        ),
        Market(
            id=29,
            name='NYP Youth Market - Audoban',
            # image='image.jpeg',
            website="",
            location='21 Audoban Ave.',
            city="New York",
            state="NY",
            zipcode='10032',
            coordinates={"lat": "40.839630140355446", "lng": "-73.93889062898364"},
            schedule='Thursday (9 AM - 3 PM)',
            year_round=False,
            is_current=False
        ),
        Market(
            id=30,
            name='NYP Youth Market - Broadway',
            image='Union_Square_Farmers_Market.jpg',
            website="",
            location='4781-4783 Broadway',
            city="New York",
            state="NY",
            zipcode='10034',
            coordinates={"lat": "40.86600006214813", "lng": "-73.9263264427691"},
            schedule='Wednesday (9 AM - 3 PM)',
            year_round=False,
            is_current=False
        ),
        Market(
            id=31,
            name='Project EATS Farm Stand at Essex Crossing',
            image='unnamed.jpg',
            website="https://www.projecteats.org/farm-1",
            location='115 Delancey St.',
            city="New York",
            state="NY",
            zipcode='10002',
            coordinates={"lat": "40.718268229915765", "lng": "-73.98822774526953"},
            schedule='Wednesday - Sunday (11 AM - 7 PM)',
            year_round=False,
            is_current=False
        ),
        Market(
            id=32,
            name='P.S. 11 Farm Market',
            image='10292023_Broadway_farmers_market_Columbia_NYC.jpg',
            website="https://www.justfood.org/ps-11-farm-market",
            location='320 W. 21st St.',
            city="New York",
            state="NY",
            zipcode='10011',
            coordinates={"lat": "40.74443551076143", "lng": "-74.00056543152783"},
            schedule='Wednesday (8 AM - 10 AM)',
            year_round=False,
            season_start=date(2024, 6, 11),
            season_end=date(2024, 11, 12),
            is_current=False
        ),
        Market(
            id=33,
            name='P.S. 57 Farmstand',
            image='6329735393_3a905a118a_o.0.jpg',
            website="https://www.grownyc.org/farmstand/ps57",
            location='115th St. & 3rd Ave. (SW corner)',
            city="New York",
            state="NY",
            zipcode='10029',
            coordinates={"lat": "40.797300330819134", "lng": "-73.94074817230118"},
            schedule='Wednesday (9:30 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 1),
            season_end=date(2024, 11, 21),
            is_current=False
        ),
        Market(
            id=34,
            name='Stuyvesant Town Greenmarket',
            # image='flatten;crop;webp=auto;jpeg_quality=60.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/stuyvesant-town",
            location='South end of Stuyvesant Town Oval',
            city="New York",
            state="NY",
            zipcode='10009',
            coordinates={"lat": "40.73200566470982", "lng": "-73.97761240821589"},
            schedule='Sunday (9:30 AM - 4 PM)',
            year_round=False,
            season_start=date(2025, 5, 11),
            season_end=date(2025, 12, 14),
            is_current=True
        ),
        Market(
            id=35,
            name='Tompkins Square Greenmarket',
            bio="Compost Program Hours: 9:00 AM - 5:00 PM In partnership with LES Ecology Center. Clothing Collection Hours: 9:00 AM - 1:00 PM ",
            image='bronxborhall_shaylahunter_re_xy4a4543.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/tompkins-square",
            location='E. 7th St. & Avenue A',
            city="New York",
            state="NY",
            zipcode='10003',
            coordinates={"lat": "40.72606737678102", "lng": "-73.98333751481684"},
            schedule='Sunday (9 AM - 4 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=36,
            name='Tribeca Greenmarket',
            bio="Clothing Collection Hours: 8:30 AM - 1:30 PM",
            image='c.-Martin-Seck-GAP-1-768x531.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/tribeca-sa",
            location='Greenwich & Chambers St.',
            city="New York",
            state="NY",
            zipcode='10013',
            coordinates={"lat": "40.71690089948348", "lng": "-74.01090464424209"},
            schedule='Wednesday & Saturday (8 AM - 2 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=37,
            name='Tucker Square Greenmarket',
            # image='farmers-market.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/tuckersaturday",
            location='Columbus Ave. & 66th St.',
            city="New York",
            state="NY",
            zipcode='10023',
            coordinates={"lat": "40.77367979894632", "lng": "-73.9819555713842"},
            schedule='Thursday (8 AM - 3 PM); Saturday (8 AM - 4 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=38,
            name='Two Bridges Youth Market',
            image='flatten;crop;webp=auto;jpeg_quality=60.jpg',
            website="https://www.manhattanbp.nyc.gov/events/two-bridges-youth-farmers-market-2/",
            location='50 Madison St.',
            city="New York",
            state="NY",
            zipcode='10010',
            coordinates={"lat": "40.71160138343196", "lng": "-73.99773475060357"},
            schedule='Sunday (10:30 AM - 3:30 PM)',
            year_round=False,
            season_start=date(2024, 5, 26),
            season_end=date(2024, 12, 15),
            is_current=False
        ),
        Market(
            id=39,
            name='Union Square Greenmarket',
            image='Union_Square_Farmers_Market.jpg',
            bio="Compost Program Hours: 8:00 a.m. - 5:00 p.m. In partnership with LES Ecology Center.",
            website="https://www.grownyc.org/greenmarket/manhattan-union-square-sa",
            location='E. 17th St. & Union Square W.',
            city="New York",
            state="NY",
            zipcode='10003',
            coordinates={"lat": "40.736358642578125", "lng": "-73.99076080322266"},
            schedule='Monday, Wednesday, Friday & Saturday (8 AM - 6 PM)',
            year_round=True,
            maps_organizer="GrowNYC",
            maps={"1": "https://www.grownyc.org/files/gmkt/usqmaps/unsq-mon.pdf", "3": "https://www.grownyc.org/files/gmkt/usqmaps/unsq-wed.pdf","5": "https://www.grownyc.org/files/gmkt/usqmaps/unsq-fri.pdf", "6": "https://www.grownyc.org/files/gmkt/usqmaps/unsq-sat.pdf"},
            is_current=True,
            is_flagship=True
        ),
        Market(
            id=40,
            name='Uptown Good Food Farm Stand',
            image='greenmarket-grownyc-768x512.jpeg',
            website="https://www.uptowngoodfood.com",
            location='330 St. Nicholas Ave. (St. Nicholas Miracle Garden)',
            city="New York",
            state="NY",
            zipcode='10027',
            coordinates={"lat": "40.811760800653175", "lng": "-73.95159181329969"},
            schedule='Thursday (4 - 7 PM)',
            year_round=False,
            season_start=date(2025, 6, 12),
            season_end=date(2025, 10, 30),
            is_current=True
        ),
        Market(
            id=41,
            name="City Hall Greenmarket",
            image='farmers-market.jpg',
            website="https://www.grownyc.org/city-hall-greenmarket-tuesday",
            location='Chambers St. & Warren St.',
            city="New York",
            state="NY",
            zipcode='10007',
            coordinates={"lat": "40.713888983534495", "lng": "-74.00644264735783"},
            schedule='Tuesday (9 AM - 4 PM)',
            year_round=False,
            season_start=date(2025, 4, 15),
            season_end=date(2025, 11, 25),
            is_current=True
        ),
        Market(
            id=42,
            name='Uptown Grand Central Farm Stand',
            image='unnamed.jpg',
            website="https://www.grownyc.org/uptowngrandcentralfarmstand",
            location='125th Street & Park Ave.',
            city="New York",
            state="NY",
            zipcode='10035',
            coordinates={"lat": "40.80493954076873", "lng": "-73.93903600281972"},
            schedule='Wednesday (1:30 - 7 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=43,
            name='Lenox Hill Farm Stand',
            image='image.jpeg',
            website="https://www.grownyc.org/lenoxhillfarmstand",
            location='70th St. & 1st Ave.',
            city="New York",
            state="NY",
            zipcode='10021',
            coordinates={"lat": "40.76668271329556", "lng": "-73.95721258190501"},
            schedule='Thursday (12 AM - 5 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=44,
            name='92nd Street Greenmarket',
            website="https://www.grownyc.org/greenmarket/manhattan/92nd-street",
            location='E 92th St. & 1st Ave.',
            city="New York",
            state="NY",
            zipcode='10025',
            coordinates={"lat": "40.78093568496837", "lng": "-73.94626236967947"},
            schedule='Sunday (9 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 6, 22),
            season_end=date(2025, 11, 23),
            is_current=True
        ),
        Market(
            id=45,
            name='Rockefeller Greenmarket',
            image='10292023_Broadway_farmers_market_Columbia_NYC.jpg',
            website="https://www.grownyc.org/greenmarket/manhattan/rockefeller-w",
            location='Rockefeller Plaza at 50th St.',
            city="New York",
            state="NY",
            zipcode='10011',
            coordinates={"lat": "40.75921762876115", "lng": "-73.9783109644037"},
            schedule='Wednesday (8 AM - 5 PM)',
            year_round=False,
            season_start=date(2025, 8, 13),
            season_end=date(2025, 10, 29),
            is_current=True
        ),
        Market(
            id=46,
            name='4th Ave Sunset Park Greenmarket',
            website="https://www.grownyc.org/4AveSunsetParkGreenmarket",
            location='4th Ave. btw. 59th & 60th St.',
            city="Brooklyn",
            state="NY",
            zipcode='11220',
            coordinates={"lat": "40.641355855453725", "lng": "-74.01786898937985"},
            schedule='Saturday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 7, 19),
            season_end=date(2025, 11, 22),
            is_current=True
        ),
        Market(
            id=47,
            name='7th Ave Sunset Park Greenmarket & Farmstand',
            bio='GrowNYC Farmstand Hours: December 7 - March 29, 8:30 AM - 2:00 PM',
            website="https://www.grownyc.org/7aveSunsetParkGreenmarket",
            location='7th Ave. and 44th St.',
            city="Brooklyn",
            state="NY",
            zipcode='11232',
            coordinates={"lat": "40.64611854880164", "lng": "-74.00210232700428"},
            schedule='Saturday (8 AM - 3 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=48,
            name='Bartel-Pritchard Square Greenmarket',
            bio='Open Sundays, 9 AM - 2 PM, May 4 - December 28 (2025). Clothing Collection Hours: 8:00 AM - 2:00 PM *Sundays only',
            website="https://www.grownyc.org/greenmarket/brooklyn/bartel-pritchard-square-sun",
            location='Prospect Park West at 15th St.',
            city="Brooklyn",
            state="NY",
            zipcode='11215',
            coordinates={"lat": "40.66093347326259", "lng": "-73.97983995813392"},
            schedule='Wednesday & Sunday (8 AM - 2 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=49,
            name='Bay Ridge Greenmarket',
            website="https://www.grownyc.org/greenmarket/brooklyn/bay-ridge",
            location="3rd Ave & 95th Street (Walgreen's parking lot)",
            city="Brooklyn",
            state="NY",
            zipcode='11209',
            coordinates={"lat": "40.61747641086637", "lng": "-74.03382578460307"},
            schedule='Saturday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 5, 3),
            season_end=date(2025, 11, 22),
            is_current=True
        ),
        Market(
            id=50,
            name='Bensonhurst Greenmarket',
            website="https://www.grownyc.org/greenmarket/brooklyn/bensonhurst",
            location="18th Ave. btw 81st & 82nd St.",
            city="Brooklyn",
            state="NY",
            zipcode='11214',
            coordinates={"lat": "40.60962923768487", "lng": "-73.99964841122642"},
            schedule='Sunday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 6, 1),
            season_end=date(2025, 11, 23),
            is_current=True
        ),
        Market(
            id=51,
            name='Boro Park Greenmarket',
            website="https://www.grownyc.org/greenmarket/brooklyn/boro-park",
            location="14th Ave. btw 49th St & 50th St.",
            city="Brooklyn",
            state="NY",
            zipcode='11219',
            coordinates={"lat": "40.6332003298811", "lng": "-73.990434076326"},
            schedule='Thursday (8 AM - 2 PM)',
            year_round=False,
            season_start=date(2025, 7, 10),
            season_end=date(2025, 11, 20),
            is_current=True
        ),
        Market(
            id=52,
            name='Brooklyn Borough Hall Greenmarket',
            bio="Clothing Collection Hours: 8:00 AM - 2:00 PM *Saturdays only",
            website="https://www.grownyc.org/greenmarket/brooklyn/boro-hall-sa",
            location="Plaza at Court St. and Montague St.",
            city="Brooklyn",
            state="NY",
            zipcode='11201',
            coordinates={"lat": "40.69373734346325", "lng": "-73.99028138467902"},
            schedule='Tuesday & Saturday (8 AM - 3 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=53,
            name='Carroll Gardens Greenmarket',
            website="https://www.grownyc.org/greenmarket/brooklyn/carroll-gardens",
            location="Carroll St., between Smith and Court St.",
            city="Brooklyn",
            state="NY",
            zipcode='11231',
            coordinates={"lat": "40.68066564582587", "lng": "-73.99492222793602"},
            schedule='Sunday (8 AM - 2 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=54,
            name='Cortelyou Greenmarket',
            bio="Clothing Collection Hours: 8:00 AM - 2:00 PM ",
            website="https://www.grownyc.org/greenmarket/brooklyn/cortelyou",
            location="Cortelyou Rd. btw. Argyle & Rugby",
            city="Brooklyn",
            state="NY",
            zipcode='11226',
            coordinates={"lat": "40.64066550667735", "lng": "-73.96617270509422"},
            schedule='Sunday (8 AM - 2 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=55,
            name='Domino Park Greenmarket',
            bio="Compost Program Hours: 8:00 AM - 3:00 PM In partnership with Domino Park",
            website="https://www.grownyc.org/greenmarket/brooklyn/dominopark",
            location="River St. between S 2nd & S 3rd St.",
            city="Brooklyn",
            state="NY",
            zipcode='11211',
            coordinates={"lat": "40.71454659991076", "lng": "-73.96789782065231"},
            schedule='Sunday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 6, 15),
            season_end=date(2025, 11, 23),
            is_current=True
        ),
        Market(
            id=56,
            name='Fort Greene Park Greenmarket',
            bio="Clothing Collection Hours: 8:00 AM - 1:30 PM",
            website="https://www.grownyc.org/greenmarket/brooklyn/fort-greene",
            location="Southeast corner of Fort Greene Park",
            city="Brooklyn",
            state="NY",
            zipcode='11217',
            coordinates={"lat": "40.68975009223109", "lng": "-73.97325242641791"},
            schedule='Saturday (8 AM - 3 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=57,
            name='Grand Army Plaza Greenmarket',
            bio="Clothing Collection Hours: 8:00 AM - 2:00 PM (access road)",
            website="https://www.grownyc.org/greenmarket/brooklyn-grand-army-plaza",
            location="Prospect Park West & Flatbush Ave.",
            city="Brooklyn",
            state="NY",
            zipcode='11215',
            coordinates={"lat": "40.67245689931319", "lng": "-73.96983563878808"},
            schedule='Saturday (8 AM - 4 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=58,
            name='McCarren Park Greenmarket',
            bio="Winter Market Hours (Dec-June): 8:00 AM - 2:00 PM, Clothing Collection Hours: 8:30 AM - 1:00 PM ",
            website="https://www.grownyc.org/greenmarket/brooklyn/greenpoint-sa",
            location="North 12th St. & Union Ave.",
            city="Brooklyn",
            state="NY",
            zipcode='11206',
            coordinates={"lat": "40.719618944319244", "lng": "-73.95254269383604"},
            schedule='Saturday (8 AM - 3 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=59,
            name='Bed-Stuy Farmstand',
            website="https://www.grownyc.org/bedstuyfarmstand",
            location="Decatur St. and Lewis Ave. (NW corner)",
            city="Brooklyn",
            state="NY",
            zipcode='11233',
            coordinates={"lat": "40.681341936525094", "lng": "-73.93488186255223"},
            schedule='Saturday (9 AM - 2:30 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=60,
            name='Brownsville Pitkin Farmstand',
            website="https://www.grownyc.org/farmstand/brownsville-pitkin",
            location="Zion Triangle Plaza, Pitkin Ave. and Legion St.",
            city="Brooklyn",
            state="NY",
            zipcode='11212',
            coordinates={"lat": "40.668716736959446", "lng": "-73.91863750511548"},
            schedule='Saturday (8:30 AM - 1:30 PM)',
            year_round=False,
            season_start=date(2025, 7, 6),
            season_end=date(2025, 11, 23),
            is_current=True
        ),
        Market(
            id=61,
            name='Cypress Hills Farmstand',
            website="https://www.grownyc.org/farmstand/cypresshills",
            location="Fulton St. btw. Richmond and Logan St.",
            city="Brooklyn",
            state="NY",
            zipcode='11208',
            coordinates={"lat": "40.68219369806769", "lng": "-73.87707168852842"},
            schedule='Friday (9 AM - 2 PM)',
            year_round=False,
            season_start=date(2025, 7, 5),
            season_end=date(2025, 11, 22),
            is_current=True
        ),
        Market(
            id=62,
            name='Woodhull Farmstand',
            website="https://www.grownyc.org/farmstand/woodhull",
            location="Broadway and Graham Ave.",
            city="Brooklyn",
            state="NY",
            zipcode='11206',
            coordinates={"lat": "40.700986782517276", "lng": "-73.94208330001895"},
            schedule='Wednesday (9 AM - 2 PM)',
            year_round=False,
            season_start=date(2025, 7, 3),
            season_end=date(2025, 11, 27),
            is_current=True
        ),
        Market(
            id=63,
            name='Crown Heights Farmstand',
            website="https://www.grownyc.org/farmstand/crownheights",
            location="Nostrand Ave. and Crown St.",
            city="Brooklyn",
            state="NY",
            zipcode='11225',
            coordinates={"lat": "40.66642777862011", "lng": "-73.95098824442748"},
            schedule='Friday (9 AM - 2:30 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=64,
            name='Uptown Good Food Farmers Market',
            website="https://www.uptowngoodfood.com",
            location='St Nichlas Ave & W 137th St',
            city="New York",
            state="NY",
            zipcode='10030',
            coordinates={"lat": "40.81846114132001", "lng": "-73.94716123494268"},
            schedule='Saturday (9 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 6, 14),
            season_end=date(2025, 11, 22),
            is_current=True
        ),
        Market(
            id=65,
            name='Bronx Borough Hall Greenmarket',
            website="https://www.grownyc.org/greenmarket/bronx/bronx-borough-hall",
            location="161st and Grand Concourse",
            city="Bronx",
            state="NY",
            zipcode='11451',
            coordinates={"lat": "40.82712761948003", "lng": "-73.92291257503476"},
            schedule='Tuesday (8 AM - 4 PM)',
            year_round=False,
            season_start=date(2025, 6, 3),
            season_end=date(2025, 11, 25),
            is_current=True
        ),
        Market(
            id=66,
            name='Lincoln Hospital Greenmarket',
            website="https://www.grownyc.org/greenmarket/bronx/lincoln-hospital-fr",
            location="E 149th St. between Park and Morris Ave.",
            city="Bronx",
            state="NY",
            zipcode='11451',
            coordinates={"lat": "40.81767598142591", "lng": "-73.92456971708086"},
            schedule='Tuesday & Friday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 20),
            season_end=date(2024, 11, 25),
            is_current=False
        ),
        Market(
            id=67,
            name='Parkchester Greenmarket',
            website="https://www.grownyc.org/greenmarket/bronx/parkchester",
            location="Westchester Ave. & White Plains Rd.",
            city="Bronx",
            state="NY",
            zipcode='11472',
            coordinates={"lat": "40.83317410448814", "lng": "-73.86260641367636"},
            schedule='Friday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 28),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=68,
            name='Poe Park Greenmarket',
            website="https://www.grownyc.org/greenmarket/bronx/poe-park",
            location="E 192nd St. btw. Grand Concourse & Valentine",
            city="Bronx",
            state="NY",
            zipcode='11458',
            coordinates={"lat": "40.86416971566585", "lng": "-73.89571072742248"},
            schedule='Tuesday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 6, 24),
            season_end=date(2025, 11, 25),
            is_current=True
        ),
        Market(
            id=69,
            name='Eastchester Farmstand',
            website="https://www.grownyc.org/farmstand/eastchester",
            location="E 229th St, btw. Schieffelin Pl. and Needham Ave. (in front of Northeast Bronx YMCA)",
            city="Bronx",
            state="NY",
            zipcode='11466',
            coordinates={"lat": "40.88321727756723", "lng": "-73.84186826636773"},
            schedule='Wednesday (9:30 AM - 2:30 PM)',
            year_round=False,
            season_start=date(2024, 7, 3),
            season_end=date(2024, 11, 27),
            is_current=False
        ),
        Market(
            id=70,
            name='Morrisania Farmstand',
            website="https://www.grownyc.org/farmstand/morrisania",
            location="169th S. & Boston Rd. at McKinley Sq.",
            city="Bronx",
            state="NY",
            zipcode='11456',
            coordinates={"lat": "40.831096591339886", "lng": "-73.90074501323292"},
            schedule='Wednesday (10 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 5, 13),
            season_end=date(2024, 11, 29),
            is_current=False
        ),
        Market(
            id=71,
            name='Norwood Farmstand',
            website="https://www.grownyc.org/farmstand/norwood",
            location="E Gun Hill Rd. & Dekalb Ave. (SE corner)",
            city="Bronx",
            state="NY",
            zipcode='11467',
            coordinates={"lat": "40.88205803262807", "lng": "-73.88043055713167"},
            schedule='Thursday (9:30 AM - 3 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=72,
            name='Corona Greenmarket',
            website="https://www.grownyc.org/greenmarket/queens/corona",
            location="Roosevelt Ave. & 103rd St.",
            city="Queens",
            state="NY",
            zipcode='11368',
            coordinates={"lat": "40.749703950923625", "lng": "-73.86243001581482"},
            schedule='Wednesday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 6, 13),
            season_end=date(2025, 11, 29),
            is_current=True
        ),
        Market(
            id=73,
            name='Elmhurst Greenmarket',
            website="https://www.grownyc.org/greenmarket/queens/elmhurst",
            location="41st Avenue btw. 80th and 81st St.",
            city="Queens",
            state="NY",
            zipcode='11373',
            coordinates={"lat": "40.745766752804975", "lng": "-73.88548117820142"},
            schedule='Tuesday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 6, 10),
            season_end=date(2025, 11, 25),
            is_current=True
        ),
        Market(
            id=74,
            name='Flushing Greenmarket',
            website="https://www.grownyc.org/greenmarket/queens/flushing",
            location="Sanford Ave & Union St (Bowne Playground)",
            city="Queens",
            state="NY",
            zipcode='11355',
            coordinates={"lat": "40.75799958731366", "lng": "-73.82478622250639"},
            schedule='Wednesday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 7, 16),
            season_end=date(2025, 11, 26),
            is_current=True
        ),
        Market(
            id=75,
            name='Forest Hills Greenmarket',
            bio="Clothing Collection Hours: 9:30 AM - 12:30 PM",
            website="https://www.grownyc.org/greenmarket/queens/forest-hills",
            location="South side of Queens Blvd. at 70th Ave.",
            city="Queens",
            state="NY",
            zipcode='11375',
            coordinates={"lat": "40.72188032218282", "lng": "-73.84677718219234"},
            schedule='Sunday (8 AM - 2 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=76,
            name='Jackson Heights Greenmarket',
            bio="Winter Market Hours (Jan-May): 8:00 AM - 2:00 PM Summer Market Hours (June-Dec): 8:00 AM - 3:00 PM Clothing Collection Hours: 9 AM - 1 PM",
            website="https://www.grownyc.org/greenmarket/queens/jackson-heights",
            location="34th Ave. between 79th & 80th St.",
            city="Queens",
            state="NY",
            zipcode='11372',
            coordinates={"lat": "40.75356895340519", "lng": "-73.88775343357531"},
            schedule='Sunday (8 AM - 3 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=77,
            name='Sunnyside Greenmarket',
            bio="Winter Market Hours (Jan-April): 8:00 AM - 2:00 PM Summer Market Hours (May-Dec): 8:00 AM - 3:00 PM Clothing Collection Hours: 9:30 AM - 12:30 PM",
            website="https://www.grownyc.org/greenmarket/queens/sunnyside",
            location="Skillman Ave. btw. 42nd & 43rd St.",
            city="Queens",
            state="NY",
            zipcode='11104',
            coordinates={"lat": "40.74702085787132", "lng": "-73.92090207753752"},
            schedule='Saturday (8 AM - 3 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=78,
            name='Forest Park Farmstand',
            website="https://www.grownyc.org/farmstand/forest-park",
            location="Park Ln. South and Myrtle Ave. (My Buddy Statue Plaza)",
            city="Queens",
            state="NY",
            zipcode='11418',
            coordinates={"lat": "40.70119996340413", "lng": "-73.84164046638213"},
            schedule='Saturday (8:30 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 7, 5),
            season_end=date(2024, 11, 23),
            is_current=False
        ),
        Market(
            id=79,
            name='Ridgewood Farmstand',
            website="https://www.grownyc.org/farmstand/ridgewood",
            location="Cypress Ave. btw. Myrtle and Putnam Ave.",
            city="Queens",
            state="NY",
            zipcode='11385',
            coordinates={"lat": "40.700180513908236", "lng": "-73.90654389324352"},
            schedule='Saturday (9 AM - 1:30 PM)',
            year_round=False,
            season_start=date(2024, 7, 6),
            season_end=date(2024, 11, 23),
            is_current=False
        ),
        Market(
            id=80,
            name='St. George Greenmarket',
            website="https://www.grownyc.org/greenmarket/staten-island/saint-george",
            location="St. Mark's Pl. and Hyatt St.",
            city="Staten Island",
            state="NY",
            zipcode='11301',
            coordinates={"lat": "40.64152934585844", "lng": "-74.07776631907625"},
            schedule='Saturday (8 AM - 1 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=81,
            name='Staten Island Mall Greenmarket',
            website="https://www.grownyc.org/greenmarket/staten-island/si-mall",
            location="Marsh Ave. & Ring Rd. (Commuter Lot Behind Macy's)",
            city="Staten Island",
            state="NY",
            zipcode='11314',
            coordinates={"lat": "40.583886817878415", "lng": "-74.16145661866804"},
            schedule='Saturday (8 AM - 2 PM)',
            year_round=False,
            season_start=date(2025, 6, 7),
            season_end=date(2025, 11, 22),
            is_current=True
        ),
        Market(
            id=82,
            name='Brooklyn Grange Farm Stand',
            bio="May 19, June 30, July 28, August 25, September 29 & October 20",
            website="https://www.brooklyngrangefarm.com/our-produce",
            location="850 3rd Ave., take Elevator to the roof",
            city="Brooklyn",
            state="NY",
            zipcode='11232',
            coordinates={"lat": "40.658603712876335", "lng": "-74.0039953678789"},
            schedule='Sunday (10 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 5, 19),
            season_end=date(2024, 10, 20),
            is_current=False
        ),
        Market(
            id=83,
            name='East New York Farmers Market',
            website="https://ucceny.org/farmers-market/",
            location="Schenck Ave. btw. New Lots & Livonia Ave.",
            city="Brooklyn",
            state="NY",
            zipcode='11207',
            coordinates={"lat": "40.66544054820623", "lng": "-73.88654539914037"},
            schedule='Saturday (9 AM - 3 PM)',
            year_round=False,
            season_start=date(2025, 6, 28),
            season_end=date(2025, 11, 22),
            is_current=True
        ),
        Market(
            id=84,
            name='East New York Farm Stand',
            website="https://ucceny.org/farmers-market/",
            location="Pitkin and Euclid Ave",
            city="Brooklyn",
            state="NY",
            zipcode='11208',
            coordinates={"lat": "40.67547846337546", "lng": "-73.87205259517035"},
            schedule='Thursday (1 PM - 4 PM)',
            year_round=False,
            season_start=date(2024, 7, 3),
            season_end=date(2024, 10, 30),
            is_current=True
        ),
        Market(
            id=85,
            name="Edible Schoolyard NYC’s Farm Stand at P.S. 216",
            website="http://www.ps216.com/edible_schoolyard",
            location="350 Ave. X",
            city="Brooklyn",
            state="NY",
            zipcode='11223',
            coordinates={"lat": "40.59047723057764", "lng": "-73.96983383981433"},
            schedule='Friday (1:30 PM - 3:30 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=86,
            name="Harvest Home Brower Park Farm Stand",
            website="https://www.harvesthomefm.org/brooklyn-markets",
            location="Brooklyn Ave. & Prospect Pl. next to Brooklyn Children’s Museum",
            city="Brooklyn",
            state="NY",
            zipcode='11213',
            coordinates={"lat": "40.673987771729664", "lng": "-73.9444573166313"},
            schedule='Thursday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=87,
            name="Harvest Home Coney Island Hospital Farmers Market",
            website="https://www.harvesthomefm.org/brooklyn-markets",
            location="Ocean Pkwy. btw. Ave. Z & Shore Pkwy.",
            city="Brooklyn",
            state="NY",
            zipcode='11235',
            coordinates={"lat": "40.585795836899834", "lng": "-73.9659587369936"},
            schedule='Saturday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=88,
            name="Harvest Home Kings County Hospital Farmers Market",
            website="https://www.harvesthomefm.org/brooklyn-markets",
            location="Clarkson Ave. btw. E. 37th & 38th St.",
            city="Brooklyn",
            state="NY",
            zipcode='11203',
            coordinates={"lat": "40.65598806425044", "lng": "-73.94289164964654"},
            schedule='Wednesday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=89,
            name="Harvest Home Utica Avenue Farmers Market",
            website="https://www.harvesthomefm.org/brooklyn-markets",
            location="Eastern Pkwy. btw. Utica & Rochester Ave.",
            city="Brooklyn",
            state="NY",
            zipcode='11213',
            coordinates={"lat": "40.66874275775454", "lng": "-73.92968969228987"},
            schedule='Wednesday (11 AM - 6 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=90,
            name="Hattie Carthan Community Market",
            website="https://www.hattiecarthancommunitymarket.com",
            location="353 Clifton Pl. & Marcy Ave.",
            city="Brooklyn",
            state="NY",
            zipcode='11221',
            coordinates={"lat": "40.68957174501995", "lng": "-73.94816289846196"},
            schedule='Saturday (9 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=91,
            name="Isabahlia Farmers Market at ISO Student Farm",
            website="https://www.isabahlialoefinc.org/farmer-market",
            location="514 Rockaway Ave.",
            city="Brooklyn",
            state="NY",
            zipcode='11212',
            coordinates={"lat": "40.66743340513307", "lng": "-73.91033922502044"},
            schedule='Friday & Saturday (8 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 7, 5),
            season_end=date(2024, 10, 26),
            is_current=False
        ),
        Market(
            id=92,
            name="Isabahlia Farmers Market at Powell Street Garden",
            website="https://www.isabahlialoefinc.org/farmer-market",
            location="410 Livonia Ave. (in front of Powell St. Garden)",
            city="Brooklyn",
            state="NY",
            zipcode='11212',
            coordinates={"lat": "40.66350280988085", "lng": "-73.9020937315257"},
            schedule='Saturday (8 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 7, 6),
            season_end=date(2024, 10, 26),
            is_current=False
        ),
        Market(
            id=93,
            name="McGolrick Park’s Down to Earth Farmers Market",
            website="https://downtoearthmarkets.com/markets?region=Brooklyn&market=McGolrick+Park+Farmers+Market",
            location="Russell St. & Nassau Ave. (center of park)",
            city="Brooklyn",
            state="NY",
            zipcode='11222',
            coordinates={"lat": "40.72446645270602", "lng": "-73.9433875621265"},
            schedule='Sunday (9 AM - 2 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=94,
            name="Park Slope’s Down to Earth Farmers Market",
            website="https://downtoearthmarkets.com",
            location="4th St. off 5th Ave. at Washington Park",
            city="Brooklyn",
            state="NY",
            zipcode='11215',
            coordinates={"lat": "40.6728301883349", "lng": "-73.98508204366652"},
            schedule='Saturday (9 AM - 2 PM)',
            year_round=True,
            is_current=True
        ),
        Market(
            id=95,
            name="Project EATS Brownsville Farm Stand",
            website="https://www.projecteats.org/farm-mgx",
            location="300 Chester St.",
            city="Brooklyn",
            state="NY",
            zipcode='11212',
            coordinates={"lat": "40.6642529872224", "lng": "-73.91043622740402"},
            schedule='Thursday (11 AM - 4 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=96,
            name="Red Hook Farm Stand",
            website="https://www.rhicenter.org/red-hook-farms/the-farms/",
            location="560 Columbia St.",
            city="Brooklyn",
            state="NY",
            zipcode='11231',
            coordinates={"lat": "40.67211589153621", "lng": "-74.00977507418773"},
            schedule='Saturday (10 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 6, 14),
            season_end=date(2024, 11, 15),
            is_current=True
        ),
        Market(
            id=97,
            name="RiseBoro Farmers Markets at Hope Ballfield",
            website="https://riseboro.org/program/nutrition/",
            location="Knickerbocker Ave. btw. Menahan & Grove St.",
            city="Brooklyn",
            state="NY",
            zipcode='11237',
            coordinates={"lat": "40.69785601981549", "lng": "-73.91680524720076"},
            schedule='Wednesday (9 AM - 3 PM)',
            year_round=False,
            season_start=date(2023, 5, 1),
            season_end=date(2023, 11, 22),
            is_current=False
        ),
        Market(
            id=98,
            name="RiseBoro Farmers Markets at Irving Square Park",
            website="https://riseboro.org/program/nutrition/",
            location="Knickerbocker Ave. btw. Weirfield & Halsey St",
            city="Brooklyn",
            state="NY",
            zipcode='11207',
            coordinates={"lat": "40.69315497167523", "lng": "-73.90853103766422"},
            schedule='Sunday (8 AM - 1 PM)',
            year_round=False,
            season_start=date(2023, 5, 1),
            season_end=date(2023, 11, 22),
            is_current=False
        ),
        Market(
            id=99,
            name="RiseBoro Farmers Markets at Maria Hernandez Park",
            website="https://riseboro.org/program/nutrition/",
            location="Knickerbocker Ave. btw. Sudyam & Starr St",
            city="Brooklyn",
            state="NY",
            zipcode='11237',
            coordinates={"lat": "40.70241423519391", "lng": "-73.92451629262568"},
            schedule='Saturday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2023, 5, 1),
            season_end=date(2023, 11, 22),
            is_current=False
        ),
        Market(
            id=100,
            name="Saratoga Farm Stand",
            website="https://www.tcahfarms.org/saratoga/",
            location="1965-1971 Fulton St.",
            city="Brooklyn",
            state="NY",
            zipcode='11233',
            coordinates={"lat": "40.678669685381664", "lng": "-73.91620868726326"},
            schedule='Saturday (10 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 7, 1),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=101,
            name="Wyckoff House Museum Farmstand",
            website="https://wyckoffmuseum.org/farm-programs/",
            location="5816 Clarendon Rd.",
            city="Brooklyn",
            state="NY",
            zipcode='11203',
            coordinates={"lat": "40.64446579672035", "lng": "-73.92062534203895"},
            schedule='Saturday (11 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=102,
            name="Floyd Bennett Field",
            website="https://www.tcahnyc.org/farmers-market/",
            location="Turn on Aviation Road, then turn right at the guardhouse into the parking lot",
            city="Brooklyn",
            state="NY",
            zipcode='11234',
            coordinates={"lat": "40.5909569852828", "lng": "-73.89054647765155"},
            schedule='Saturday (9 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=103,
            name="Eastern Parkway Farm",
            website="https://www.tcahnyc.org/farmers-market/",
            location="1426 Eastern Pkwy",
            city="Brooklyn",
            state="NY",
            zipcode='11233',
            coordinates={"lat": "40.66892072260058", "lng": "-73.92095618743215"},
            schedule='Saturday (10 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 7, 8),
            season_end=date(2024, 11, 16),
            is_current=False
        ),
        Market(
            id=104,
            name="Canarsie Pier",
            website="https://www.tcahnyc.org/farmers-market/",
            location="Canarsie Veterans Cir.",
            city="Brooklyn",
            state="NY",
            zipcode='11236',
            coordinates={"lat": "40.62877688110069", "lng": "-73.8840767769125"},
            schedule='Tuesday (9 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 6, 4),
            season_end=date(2024, 10, 29),
            is_current=False
        ),
        Market(
            id=105,
            name="Far Rockaway Farm",
            website="https://www.tcahnyc.org/farmers-market/",
            location="45-55 Beach Channel Drive",
            city="Far Rockaway",
            state="NY",
            zipcode='11691',
            coordinates={"lat": "40.595500115417565", "lng": "-73.77692742792141"},
            schedule='Saturday (10 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=106,
            name="170 Farm Stand",
            website="https://newsettlement.org/food/170farmstand/",
            location="1406 Townsend Ave. & E. 170th St",
            city="Bronx",
            state="NY",
            zipcode='10452',
            coordinates={"lat": "40.84008243970398", "lng": "-73.91660195771881"},
            schedule='Wednesday (2 PM - 6 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=107,
            name="Bissel Gardens Farmers Market",
            website="https://bisselgardens.wordpress.com/farmers-market/",
            location="Baychester Ave. & E. 241st St.",
            city="Bronx",
            state="NY",
            zipcode='11466',
            coordinates={"lat": "40.90081958733627", "lng": "-73.8467930467495"},
            schedule='Saturday (10 AM - 4 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=108,
            name="Bronx Park East Farmers Market",
            website="https://bronxparkeastcsa.com",
            location="2045 Bronx Park E. (near Bradley Playground)",
            city="Bronx",
            state="NY",
            zipcode='11462',
            coordinates={"lat": "40.85144498203592", "lng": "-73.86857536150443"},
            schedule='Sunday (9 AM - 4 PM)',
            year_round=False,
            season_start=date(2024, 6, 2),
            season_end=date(2024, 11, 24),
            is_current=False
        ),
        Market(
            id=109,
            name="BronxWorks Community Farm Stand",
            website="https://bronxworks.org/our-services/health-wellness/farm-stands/",
            location="1130 Grand Concourse",
            city="Bronx",
            state="NY",
            zipcode='11456',
            coordinates={"lat": "40.832748026808055", "lng": "-73.91889109918448"},
            schedule='Thursday (10 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 7, 10),
            season_end=date(2024, 11, 20),
            is_current=False
        ),
        Market(
            id=110,
            name="BronxWorks Mott Haven Farm Stand",
            website="https://bronxworks.org/our-services/health-wellness/farm-stands/",
            location="Padre Plaza, E. 139th St.",
            city="Bronx",
            state="NY",
            zipcode='11454',
            coordinates={"lat": "40.807860277089766", "lng": "-73.91752625453873"},
            schedule='Wednesday (9 AM - 2 PM)',
            year_round=False,
            season_start=date(2024, 7, 10),
            season_end=date(2024, 11, 20),
            is_current=False
        ),
        Market(
            id=111,
            name="Children’s Aid Go!Healthy Food Box + Farmstand - C.S. 211",
            website="https://www.childrensaidnyc.org/sites/default/files/document/food%20box%20distribution.pdf",
            location="1919 Prospect Ave.",
            city="Bronx",
            state="NY",
            zipcode='11457',
            coordinates={"lat": "40.84340908749188", "lng": "-73.89007433850004"},
            schedule='Thursday (1:30 PM - 4 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=112,
            name="Harvest Home Co-op City Farm Stand",
            website="https://www.harvesthomefm.org/bronx-markets",
            location="Asch Loop & Aldrich St.",
            city="Bronx",
            state="NY",
            zipcode='11475',
            coordinates={"lat": "40.870137295597594", "lng": "-73.83100530004411"},
            schedule='Wednesday & Saturday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=113,
            name="Harvest Home Hunts Point Farm Stand",
            website="https://www.harvesthomefm.org/bronx-markets",
            location="Southern Blvd. bet. Barretto & Tiffany St. (Luis Suarez Memorial Park)",
            city="Bronx",
            state="NY",
            zipcode='11459',
            coordinates={"lat": "40.81914718163816", "lng": "-73.89284149875978"},
            schedule='Wednesday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=114,
            name="Harvest Home Jacobi Hospital Farmers Market",
            website="https://www.harvesthomefm.org/bronx-markets",
            location="1400 Pelham Pkwy.",
            city="Bronx",
            state="NY",
            zipcode='11461',
            coordinates={"lat": "40.85645339756476", "lng": "-73.8472416711181"},
            schedule='Friday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=115,
            name="Harvest Home Mt. Eden Malls Farmers Market",
            website="https://www.harvesthomefm.org/bronx-markets",
            location="Mt. Eden & Morris Aves. (Claremont Park)",
            city="Bronx",
            state="NY",
            zipcode='11457',
            coordinates={"lat": "40.84252584710911", "lng": "-73.90924547567244"},
            schedule='Tuesday & Thursday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=116,
            name="Harvest Home North Central Bronx Farmers Market",
            website="https://www.harvesthomefm.org/bronx-markets",
            location="Mosholu Pkwy. & Jerome Ave.",
            city="Bronx",
            state="NY",
            zipcode='11467',
            coordinates={"lat": "40.880500651822814", "lng": "-73.88397233907608"},
            schedule='Wednesday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=117,
            name="Harvest Home St. Mary’s Park Farm Stand",
            website="https://www.harvesthomefm.org/bronx-markets",
            location="E. 149th St. & Eagle Ave. (St. Mary’s Park)",
            city="Bronx",
            state="NY",
            zipcode='11455',
            coordinates={"lat": "40.813785889485175", "lng": "-73.91191145758599"},
            schedule='Thursday (8 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=118,
            name="JBOLC Garden Community Farmers Market",
            website="https://www.jamesbaldwinoutdoorlearningcenter.org/market.php",
            location="Sedgwick & Goulden Aves. in front of DeWitt Clinton High School",
            city="Bronx",
            state="NY",
            zipcode='11468',
            coordinates={"lat": "40.8823936873972", "lng": "-73.88781613437803"},
            schedule='Saturday (10 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=119,
            name="La Familia Verde Farmers Market",
            website="http://www.lafamiliaverde.org",
            location="E. Tremont Ave. btw. Arthur & LaFontaine Ave.",
            city="Bronx",
            state="NY",
            zipcode='11457',
            coordinates={"lat": "40.846389789357445", "lng": "-73.89388575164935"},
            schedule='Tuesday (9 AM - 3 PM)',
            year_round=False,
            season_start=date(2023, 7, 11),
            season_end=date(2023, 11, 14),
            is_current=False
        ),
        Market(
            id=120,
            name="La Familia Verde/Highbridge Farmers Market",
            website="",
            location="1430 Plimpton Ave.",
            city="Bronx",
            state="NY",
            zipcode='11452',
            coordinates={"lat": "40.84331187693673", "lng": "-73.922371001349"},
            schedule='Wednesday (10 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 7, 10),
            season_end=date(2024, 11, 13),
            is_current=False
        ),
        Market(
            id=121,
            name="The Market at Preston",
            website="",
            location="2780 Schurz Ave. (Preston High School)",
            city="Bronx",
            state="NY",
            zipcode='11465',
            coordinates={"lat": "40.814076997115805", "lng": "-73.81950362035406"},
            schedule='Thursday (4 PM - 7 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=122,
            name="Morning Glory Market at the New York Botanical Gardens",
            website="https://www.nybg.org/event/farmers-market/",
            location="2900 Southern Blvd. (inside Mosholu Gate Entrance)",
            city="Bronx",
            state="NY",
            zipcode='11458',
            coordinates={"lat": "40.866361652053406", "lng": "-73.88071465375813"},
            schedule='Wednesday (10 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 5, 22),
            season_end=date(2024, 10, 23),
            is_current=False
        ),
        Market(
            id=123,
            name="Morris Heights Farmstand",
            website="https://www.grownyc.org/farmstand/morris-heights",
            location="University Ave. & 85 W. Burnside Ave.",
            city="Bronx",
            state="NY",
            zipcode='11453',
            coordinates={"lat": "40.85469926602106", "lng": "-73.91043435054169"},
            schedule='Wednesday (9:30 AM - 2:30 PM)',
            year_round=False,
            season_start=date(2024, 7, 3),
            season_end=date(2024, 11, 27),
            is_current=False
        ),
        Market(
            id=124,
            name="New Roots Farm Stand",
            website="",
            location="670 Grand Concourse",
            city="Bronx",
            state="NY",
            zipcode='11451',
            coordinates={"lat": "40.82114727191027", "lng": "-73.9250238695277"},
            schedule='Saturday (10 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=125,
            name="Project EATS & St. Barnabas Hospital Farm Stand",
            website="https://www.projecteats.org/farm-sbh",
            location="4507 3rd Ave.",
            city="Bronx",
            state="NY",
            zipcode='11457',
            coordinates={"lat": "40.85356725992537", "lng": "-73.89155766100113"},
            schedule='Wednesday (11 AM - 4 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=126,
            name="Riverdale Neighborhood House Youth Market",
            website="https://www.riverdaleonline.org/food-and-farm",
            location="5521 Mosholu Ave.",
            city="Bronx",
            state="NY",
            zipcode='11471',
            coordinates={"lat": "40.90328965744233", "lng": "-73.90370804941696"},
            schedule='Thursday (1 PM - 6 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=127,
            name="Riverdale Y Sunday Farmers Market",
            website="https://riverdaley.org/sunday-market/",
            location="4545 Independence Ave.",
            city="Bronx",
            state="NY",
            zipcode='11471',
            coordinates={"lat": "40.89165743558674", "lng": "-73.9125025643584"},
            schedule='Sunday (9 AM - 2 PM)',
            year_round=False,
            season_start=date(2025, 3, 30),
            season_end=date(2025, 11, 22),
            is_current=False
        ),
        Market(
            id=128,
            name="Van Cortlandt Park Alliance Amalgamated Housing Youth Farmstand",
            website="",
            location="Orloff Ave. & Gale Pl.",
            city="Bronx",
            state="NY",
            zipcode='11463',
            coordinates={"lat": "40.884525161614604", "lng": "-73.89216096954496"},
            schedule='Wednesday (2 PM - 7 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=129,
            name="White Plains Road Farmers Market",
            website="https://wprmarket.com",
            location="White Plains Rd. & E. 211th St. (Williamsbridge Square)",
            city="Bronx",
            state="NY",
            zipcode='11467',
            coordinates={"lat": "40.877613518407365", "lng": "-73.86654582979328"},
            schedule='Saturday (9 AM - 4 PM)',
            year_round=False,
            season_start=date(2024, 6, 1),
            season_end=date(2024, 11, 30),
            is_current=False
        ),
        Market(
            id=130,
            name="Cunningham Park’s Down to Earth Farmers Market",
            website="https://downtoearthmarkets.com",
            location="Union Turnpike & 196th Pl. parking lot near the tennis courts",
            city="Queens",
            state="NY",
            zipcode='11366',
            coordinates={"lat": "40.730521140002736", "lng": "-73.77349135507096"},
            schedule='Sunday (9 AM - 2 PM)',
            year_round=False,
            season_start=date(2025, 4, 20),
            season_end=date(2025, 11, 22),
            is_current=False
        ),
        Market(
            id=131,
            name="Edgemere Farm Market",
            website="https://www.edgemerefarm.org",
            location="385 Beach 45th St.",
            city="Far Rockaway",
            state="NY",
            zipcode='11691',
            coordinates={"lat": "40.59526586421859", "lng": "-73.77693633732733"},
            schedule='Friday (3 PM - 7 PM)',
            year_round=False,
            season_start=date(2024, 5, 24),
            season_end=date(2024, 11, 8),
            is_current=False
        ),
        Market(
            id=132,
            name="Perez Farm Stand",
            website="https://jamaicahospital.org/weekly-farmers-market/",
            location="134-20 Jamaica Ave. (by the Axel Building)",
            city="Queens",
            state="NY",
            zipcode='11418',
            coordinates={"lat": "40.70182134451585", "lng": "-73.81756955699235"},
            schedule='Wednesday (10 AM - 4 PM)',
            year_round=False,
            season_start=date(2024, 6, 26),
            season_end=date(2024, 11, 6),
            is_current=False
        ),
        Market(
            id=133,
            name="Queens County Farm Museum Farm Stand",
            website="https://www.queensfarm.org/farmstand/",
            location="73-50 Little Neck Pkwy.",
            city="Queens",
            state="NY",
            zipcode='11004',
            coordinates={"lat": "40.74765239446399", "lng": "-73.72240623401233"},
            schedule='Wednesday - Sunday (10 AM - 4 PM)',
            year_round=False,
            season_start=date(2024, 6, 7),
            season_end=date(2024, 11, 22),
            is_current=False
        ),
        Market(
            id=134,
            name="Queens Farm at Jamaica Hospital",
            website="https://www.facebook.com/queenscountyfarmmuseum/posts/the-jamaica-hospital-medical-center-farmstand-is-officially-open-for-the-season-/885210616979191/",
            location="134-20 Jamaica Ave. (by the Axel Building)",
            city="Queens",
            state="NY",
            zipcode='11418',
            coordinates={"lat": "40.70182134451585", "lng": "-73.81756955699235"},
            schedule='Friday (10 AM - 3 PM)',
            year_round=False,
            season_start=date(2024, 6, 21),
            season_end=date(2024, 11, 1),
            is_current=False
        ),
        Market(
            id=135,
            name="Rockaway Market at Beach 60th",
            website="https://rockawaymarket.org",
            location="Rockaway Freeway btw. Beach 59th & 60th St.",
            city="Queens",
            state="NY",
            zipcode='11692',
            coordinates={"lat": "40.59224461426349", "lng": "-73.78929086235438"},
            schedule='Saturday (10 AM - 1 PM)',
            year_round=False,
            season_start=date(2024, 6, 10),
            season_end=date(2024, 10, 7),
            is_current=False
        ),
        Market(
            id=136,
            name="Children’s Aid Society Go!Healthy Food Box + Farmstand - Goodhue Center",
            website="https://www.childrensaidnyc.org/programs/gohealthy",
            location="304 Prospect Ave.",
            city="Staten Island",
            state="NY",
            zipcode='11310',
            coordinates={"lat": "40.63806894884074", "lng": "-74.09791587870322"},
            schedule='Tuesday (2:30 PM - 4:30 PM)',
            year_round=False,
            season_start=date(2024, 7, 9),
            season_end=date(2024, 11, 19),
            is_current=False
        )
    ]
    db.session.add_all(markets)
    db.session.commit()

    market_day_list = [
        # 175th Street Greenmarket
        MarketDay(
            id=1,
            market_id=1,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=4,
        ),
        # 57th Street Greenmarket
        MarketDay(
            id=2,
            market_id=2,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6,
        ),
        # 79th Street Greenmarket
        MarketDay(
            id=3,
            market_id=3,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0,
        ),
        # 82nd Street Greenmarket
        MarketDay(
            id=4,
            market_id=4,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 30, 0),
            day_of_week=6,
        ),
        # 94th Street Greenmarket
        MarketDay(
            id=5,
            market_id=5,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0
        ),
        # 97th Street Greenmarket
        MarketDay(
            id=6,
            market_id=6,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=5,
        ),
        # Abingdon Square Greenmarket
        MarketDay(
            id=7,
            market_id=7,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6,
        ),
        # Astor Place Greenmarket
        MarketDay(
            id=8,
            market_id=8,
            hour_start=time(8, 0, 0),
            hour_end=time(17, 0, 0),
            day_of_week=2,
        ),
        # Bowling Green Greenmarket
        MarketDay(
            id=9,
            market_id=9,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=2,
        ),
        # Bowling Green Greenmarket
        MarketDay(
            id=10,
            market_id=9,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=4,
        ),
        # Bro Sis Green Youth Market
        MarketDay(
            id=11,
            market_id=10,
            hour_start=time(10, 30, 0),
            hour_end=time(18, 0, 0),
            day_of_week=3,
        ),
        # Chelsea’s Down to Earth Farmers Market
        MarketDay(
            id=12,
            market_id=11,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6,
        ),
        # Children’s Aid Go!Healthy Food Box + Farmstand - Milbank Center
        MarketDay(
            id=13,
            market_id=12,
            hour_start=time(14, 0, 0),
            hour_end=time(16, 30, 0),
            day_of_week=3,
        ),
        # Columbia Greenmarket
        MarketDay(
            id=14,
            market_id=13,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=4,
        ),
        # Columbia Greenmarket
        MarketDay(
            id=15,
            market_id=13,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0,
        ),
        # Dag Hammarskjold Greenmarket
        MarketDay(
            id=16,
            market_id=14,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3,
        ),
        # Fort Washington Greenmarket
        MarketDay(
            id=17,
            market_id=15,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=2,
        ),
        # Fulton Stall Market (Indoor Farmers Market)
        MarketDay(
            id=18,
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=1,
        ),
        # Fulton Stall Market (Indoor Farmers Market)
        MarketDay(
            id=19,
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=2,
        ),
        # Fulton Stall Market (Indoor Farmers Market)
        MarketDay(
            id=20,
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=3,
        ),
        # Fulton Stall Market (Indoor Farmers Market)
        MarketDay(
            id=21,
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=4,
        ),
        # Fulton Stall Market (Indoor Farmers Market)
        MarketDay(
            id=22,
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=5,
        ),
        # Fulton Stall Market (Indoor Farmers Market)
        MarketDay(
            id=23,
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=6,
        ),
        # Gouverneur Health Farmstand
        MarketDay(
            id=24,
            market_id=17,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=4,
        ),
        # Grass Roots Farmers Market
        MarketDay(
            id=25,
            market_id=18,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=2,
        ),
        # Grass Roots Farmers Market
        MarketDay(
            id=26,
            market_id=18,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=6,
        ),
        # Greenmarket at the Oculus
        MarketDay(
            id=27,
            market_id=19,
            hour_start=time(8, 0, 0),
            hour_end=time(17, 0, 0),
            day_of_week=2,
        ),
        # Harlem Meer Farmstand
        MarketDay(
            id=28,
            market_id=20,
            hour_start=time(10, 00, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6,
        ),
        # Harvest Home East Harlem Farmers Market
        MarketDay(
            id=29,
            market_id=21,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4,
        ),
        # Harvest Home Harlem Hospital Farmers Market
        MarketDay(
            id=30,
            market_id=22,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=5,
        ),
        # Harvest Home Lenox Avenue Farm Stand
        MarketDay(
            id=31,
            market_id=23,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6,
        ),
        # Harvest Home Metropolitan Hospital Farmers Market
        MarketDay(
            id=32,
            market_id=24,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=5,
        ),
        # Inwood Park Greenmarket
        MarketDay(
            id=33,
            market_id=25,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6,
        ),
        # Lower East Side Farmstand
        MarketDay(
            id=34,
            market_id=26,
            hour_start=time(8, 30, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4,
        ),
        # Morningside Park’s Down to Earth Farmers Market
        MarketDay(
            id=35,
            market_id=27,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6,
        ),
        # Mount Sinai Greenmarket
        MarketDay(
            id=36,
            market_id=28,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3,
        ),
        # NYP Youth Market - Audoban
        MarketDay(
            id=37,
            market_id=29,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4,
        ),
        # NYP Youth Market - Broadway
        MarketDay(
            id=38,
            market_id=30,
            hour_start=time(9, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3,
        ),
        # Project EATS Farm Stand at Essex Crossing
        MarketDay(
            id=39,
            market_id=31,
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=3,
        ),
        # Project EATS Farm Stand at Essex Crossing
        MarketDay(
            id=40,
            market_id=31,
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=4,
        ),
        # Project EATS Farm Stand at Essex Crossing
        MarketDay(
            id=41,
            market_id=31,
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=5,
        ),
        # Project EATS Farm Stand at Essex Crossing
        MarketDay(
            id=42,
            market_id=31,
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=6,
        ),
        # Project EATS Farm Stand at Essex Crossing
        MarketDay(
            id=43,
            market_id=31,
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=0,
        ),
        # P.S. 11 Farm Market
        MarketDay(
            id=44,
            market_id=32,
            hour_start=time(8, 0, 0),
            hour_end=time(10, 00, 0),
            day_of_week=3,
        ),
        # P.S. 57 Farmstand
        MarketDay(
            id=45,
            market_id=33,
            hour_start=time(9, 30, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3,
        ),
        # Stuyvesant Town Greenmarket
        MarketDay(
            id=46,
            market_id=34,
            hour_start=time(9, 30, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0,
        ),
        # Tompkins Square Greenmarket
        MarketDay(
            id=47,
            market_id=35,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0,
        ),
        # Tribeca Greenmarket
        MarketDay(
            id=48,
            market_id=36,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6,
        ),
        # Tucker Square Greenmarket
        MarketDay(
            id=49,
            market_id=37,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4,
        ),
        # Tucker Square Greenmarket
        MarketDay(
            id=50,
            market_id=37,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=6,
        ),
        # Two Bridges Youth Market
        MarketDay(
            id=51,
            market_id=38,
            hour_start=time(10, 30, 0),
            hour_end=time(15, 30, 0),
            day_of_week=0,
        ),
        # Union Square Greenmarket
        MarketDay(
            id=52,
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=1,
        ),
        # Union Square Greenmarket
        MarketDay(
            id=53,
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=3,
        ),
        # Union Square Greenmarket
        MarketDay(
            id=54,
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=5,
        ),
        # Union Square Greenmarket
        MarketDay(
            id=55,
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=6,
        ),
        # Uptown Good Food Farm Stand
        MarketDay(
            id=56,
            market_id=40,
            hour_start=time(16, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=4,
        ),
        # City Hall Greenmarket
        MarketDay(
            id=57,
            market_id=41,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=2
        ),
        # Uptown Grand Central Farm Stand
        MarketDay(
            id=58,
            market_id=42,
            hour_start=time(1, 30, 0),
            hour_end=time(19, 0, 0),
            day_of_week=3
        ),
        # Lenox Hill Farm Stand
        MarketDay(
            id=59,
            market_id=43,
            hour_start=time(12, 0, 0),
            hour_end=time(17, 0, 0),
            day_of_week=4
        ),
        # 92nd Street Greenmarket
        MarketDay(
            id=60,
            market_id=44,
            hour_start=time(9, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=1
        ),
        # Rockefeller Center Greenmarket
        MarketDay(
            id=61,
            market_id=45,
            hour_start=time(8, 0, 0),
            hour_end=time(17, 0, 0),
            day_of_week=3
        ),
        # 4th Ave Sunset Park Greenmarket
        MarketDay(
            id=62,
            market_id=46,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # 7th Ave Sunset Park Greenmarket & Farmstand
        MarketDay(
            id=63,
            market_id=47,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Bartel-Pritchard Square Greenmarket
        MarketDay(
            id=64,
            market_id=48,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3
        ),
        # Bartel-Pritchard Square Greenmarket
        MarketDay(
            id=65,
            market_id=48,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=0
        ),
        # Bay Ridge Greenmarket
        MarketDay(
            id=66,
            market_id=49,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Bensonhurst Greenmarket
        MarketDay(
            id=67,
            market_id=50,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=0
        ),
        # Boro Park Greenmarket
        MarketDay(
            id=68,
            market_id=51,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=4
        ),
        # Brooklyn Borough Hall Greenmarket
        MarketDay(
            id=69,
            market_id=52,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=2
        ),
        # Brooklyn Borough Hall Greenmarket
        MarketDay(
            id=70,
            market_id=52,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Carroll Gardens Greenmarket
        MarketDay(
            id=71,
            market_id=53,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=0
        ),
        # Cortelyou Greenmarket
        MarketDay(
            id=72,
            market_id=54,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=0
        ),
        # Domino Park Greenmarket
        MarketDay(
            id=73,
            market_id=55,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=0
        ),
        # Fort Greene Park Greenmarket
        MarketDay(
            id=74,
            market_id=56,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Grand Army Plaza Greenmarket
        MarketDay(
            id=75,
            market_id=57,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=6
        ),
        # McCarren Park Greenmarket
        MarketDay(
            id=76,
            market_id=58,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Bed-Stuy Farmstand
        MarketDay(
            id=77,
            market_id=59,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 30, 0),
            day_of_week=6
        ),
        # Brownsville Pitkin Farmstand
        MarketDay(
            id=78,
            market_id=60,
            hour_start=time(8, 30, 0),
            hour_end=time(13, 30, 0),
            day_of_week=6
        ),
        # Cypress Hills Farmstand
        MarketDay(
            id=79,
            market_id=61,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=5
        ),
        # Woodhull Farmstand
        MarketDay(
            id=80,
            market_id=62,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=3
        ),
        # Crown Heights Farmstand
        MarketDay(
            id=81,
            market_id=63,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 30, 0),
            day_of_week=5
        ),
        # Uptown Good Food Farmers Market
        MarketDay(
            id=82,
            market_id=64,
            hour_start=time(9, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Bronx Borough Hall Greenmarket
        MarketDay(
            id=83,
            market_id=65,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=2
        ),
        # Lincoln Hospital Greenmarket
        MarketDay(
            id=84,
            market_id=66,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=2
        ),
        # Lincoln Hospital Greenmarket
        MarketDay(
            id=85,
            market_id=66,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=5
        ),
        # Parkchester Greenmarket
        MarketDay(
            id=86,
            market_id=67,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=5
        ),
        # Poe Park Greenmarket
        MarketDay(
            id=87,
            market_id=68,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=2
        ),
        # Eastchester Farmstand
        MarketDay(
            id=88,
            market_id=69,
            hour_start=time(9, 30, 0),
            hour_end=time(14, 30, 0),
            day_of_week=3
        ),
        # Morrisania Farmstand
        MarketDay(
            id=89,
            market_id=70,
            hour_start=time(10, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=3
        ),
        # Norwood Farmstand
        MarketDay(
            id=90,
            market_id=71,
            hour_start=time(9, 30, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4
        ),
        # Corona Greenmarket
        MarketDay(
            id=91,
            market_id=72,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3
        ),
        # Elmhurst Greenmarket
        MarketDay(
            id=92,
            market_id=73,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=2
        ),
        # Flushing Greenmarket
        MarketDay(
            id=93,
            market_id=74,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3
        ),
        # Forest Hills Greenmarket
        MarketDay(
            id=94,
            market_id=75,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=0
        ),
        # Jackson Heights Greenmarket
        MarketDay(
            id=95,
            market_id=76,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=0
        ),
        # Sunnyside Greenmarket
        MarketDay(
            id=96,
            market_id=77,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Forest Park Farmstand
        MarketDay(
            id=97,
            market_id=78,
            hour_start=time(8, 30, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6
        ),
        # Ridgewood Farmstand
        MarketDay(
            id=98,
            market_id=79,
            hour_start=time(9, 0, 0),
            hour_end=time(13, 30, 0),
            day_of_week=6
        ),
        # St. George Greenmarket
        MarketDay(
            id=99,
            market_id=80,
            hour_start=time(8, 0, 0),
            hour_end=time(13, 0, 0),
            day_of_week=6
        ),
        # Staten Island Mall Greenmarket
        MarketDay(
            id=100,
            market_id=81,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6
        ),
        # Brooklyn Grange Farm Stand
        MarketDay(
            id=101,
            market_id=82,
            hour_start=time(10, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=0
        ),
        # East New York Farmers Market
        MarketDay(
            id=102,
            market_id=83,
            hour_start=time(9, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # East New York Farm Stand
        MarketDay(
            id=103,
            market_id=84,
            hour_start=time(13, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=4
        ),
        # Edible Schoolyard NYC’s Farm Stand at P.S. 216
        MarketDay(
            id=104,
            market_id=85,
            hour_start=time(13, 30, 0),
            hour_end=time(15, 30, 0),
            day_of_week=5
        ),
        # Harvest Home Brower Park Farm Stand
        MarketDay(
            id=105,
            market_id=86,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4
        ),
        # Harvest Home Coney Island Hospital Farmers Market
        MarketDay(
            id=106,
            market_id=87,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Harvest Home Kings County Hospital Farmers Market
        MarketDay(
            id=107,
            market_id=88,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3
        ),
        # Harvest Home Utica Avenue Farmers Market
        MarketDay(
            id=108,
            market_id=89,
            hour_start=time(11, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=3
        ),
        # Hattie Carthan Community Market
        MarketDay(
            id=109,
            market_id=90,
            hour_start=time(9, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Isabahlia Farmers Market at ISO Student Farm
        MarketDay(
            id=110,
            market_id=91,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=5
        ),
        # Isabahlia Farmers Market at ISO Student Farm
        MarketDay(
            id=111,
            market_id=91,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6
        ),
        # Isabahlia Farmers Market at Powell Street Garden
        MarketDay(
            id=112,
            market_id=92,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6
        ),
        # McGolrick Park’s Down to Earth Farmers Market
        MarketDay(
            id=113,
            market_id=93,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=0
        ),
        # Park Slope’s Down to Earth Farmers Market
        MarketDay(
            id=114,
            market_id=94,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6
        ),
        # Project EATS Brownsville Farm Stand
        MarketDay(
            id=115,
            market_id=95,
            hour_start=time(11, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=4
        ),
        # Red Hook Farm Stand
        MarketDay(
            id=116,
            market_id=96,
            hour_start=time(10, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6
        ),
        # RiseBoro Farmers Markets at Hope Ballfield
        MarketDay(
            id=117,
            market_id=97,
            hour_start=time(9, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3
        ),
        # RiseBoro Farmers Markets at Irving Square Park
        MarketDay(
            id=118,
            market_id=98,
            hour_start=time(8, 0, 0),
            hour_end=time(13, 0, 0),
            day_of_week=0
        ),
        # RiseBoro Farmers Markets at Maria Hernandez Park
        MarketDay(
            id=119,
            market_id=99,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Saratoga Farm Stand
        MarketDay(
            id=120,
            market_id=100,
            hour_start=time(10, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Wyckoff House Museum Farmstand
        MarketDay(
            id=121,
            market_id=101,
            hour_start=time(11, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Floyd Bennett Field
        MarketDay(
            id=122,
            market_id=102,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6
        ),
        # Eastern Parkway Farm
        MarketDay(
            id=123,
            market_id=103,
            hour_start=time(10, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Canarsie Pier
        MarketDay(
            id=124,
            market_id=104,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=2
        ),
        # Far Rockaway Farm
        MarketDay(
            id=125,
            market_id=105,
            hour_start=time(10, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # 170 Farm Stand
        MarketDay(
            id=126,
            market_id=106,
            hour_start=time(14, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=3
        ),
        # Bissel Gardens Farmers Market
        MarketDay(
            id=127,
            market_id=107,
            hour_start=time(10, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=6
        ),
        # Bronx Park East Farmers Market
        MarketDay(
            id=128,
            market_id=108,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0
        ),
        # BronxWorks Farm Stand
        MarketDay(
            id=129,
            market_id=109,
            hour_start=time(10, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=4
        ),
        # BronxWorks Mott Haven Farm Stand
        MarketDay(
            id=130,
            market_id=110,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=3
        ),
        # Children’s Aid Go!Healthy Food Box + Farmstand - C.S. 211
        MarketDay(
            id=131,
            market_id=111,
            hour_start=time(1, 30, 0),
            hour_end=time(16, 0, 0),
            day_of_week=4
        ),
        # Harvest Home Co-op City Farm Stand
        MarketDay(
            id=132,
            market_id=112,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3
        ),
        # Harvest Home Co-op City Farm Stand
        MarketDay(
            id=133,
            market_id=112,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Harvest Home Hunts Point Farm Stand
        MarketDay(
            id=134,
            market_id=113,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3
        ),
        # Harvest Home Jacobi Hospital Farmers Market
        MarketDay(
            id=135,
            market_id=114,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=5
        ),
        # Harvest Home Mt. Eden Malls Farmers Market
        MarketDay(
            id=136,
            market_id=115,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=2
        ),
        # Harvest Home Mt. Eden Malls Farmers Market
        MarketDay(
            id=137,
            market_id=115,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4
        ),
        # Harvest Home North Central Bronx Farmers Market
        MarketDay(
            id=138,
            market_id=116,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3
        ),
        # Harvest Home St. Mary’s Park Farm Stand
        MarketDay(
            id=139,
            market_id=117,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4
        ),
        # JBOLC Garden Community Farmers Market
        MarketDay(
            id=140,
            market_id=118,
            hour_start=time(10, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # La Familia Verde Farmers Market
        MarketDay(
            id=141,
            market_id=119,
            hour_start=time(9, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=2
        ),
        # La Familia Verde/Highbridge Farmers Market
        MarketDay(
            id=142,
            market_id=120,
            hour_start=time(10, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3
        ),
        # The Market at Preston
        MarketDay(
            id=143,
            market_id=121,
            hour_start=time(16, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=4
        ),
        # Morning Glory Market at the New York Botanical Gardens
        MarketDay(
            id=144,
            market_id=122,
            hour_start=time(10, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3
        ),
        # Morris Heights Farmstand
        MarketDay(
            id=145,
            market_id=123,
            hour_start=time(9, 30, 0),
            hour_end=time(14, 30, 0),
            day_of_week=3
        ),
        # New Roots Farm Stand
        MarketDay(
            id=146,
            market_id=124,
            hour_start=time(10, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6
        ),
        # Project EATS & St. Barnabas Hospital Farm Stand
        MarketDay(
            id=147,
            market_id=125,
            hour_start=time(11, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=3
        ),
        # Riverdale Neighborhood House Youth Market
        MarketDay(
            id=148,
            market_id=126,
            hour_start=time(13, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=4
        ),
        # Riverdale Y Sunday Farmers Market
        MarketDay(
            id=149,
            market_id=127,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=0
        ),
        # Van Cortlandt Park Alliance Amalgamated Housing Youth Farmstand
        MarketDay(
            id=150,
            market_id=128,
            hour_start=time(14, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=3
        ),
        # White Plains Road Farmers Market
        MarketDay(
            id=151,
            market_id=129,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=6
        ),
        # Cunningham Park’s Down to Earth Farmers Market
        MarketDay(
            id=152,
            market_id=130,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=0
        ),
        # Edgemere Farm Market
        MarketDay(
            id=153,
            market_id=131,
            hour_start=time(15, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=5
        ),
        # Perez Farm Stand
        MarketDay(
            id=154,
            market_id=132,
            hour_start=time(10, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=3
        ),
        # Queens County Farm Museum Farm Stand
        MarketDay(
            id=155,
            market_id=133,
            hour_start=time(10, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=3
        ),
        # Queens County Farm Museum Farm Stand
        MarketDay(
            id=156,
            market_id=133,
            hour_start=time(10, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=4
        ),
        # Queens County Farm Museum Farm Stand
        MarketDay(
            id=157,
            market_id=133,
            hour_start=time(10, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=5
        ),
        # Queens County Farm Museum Farm Stand
        MarketDay(
            id=158,
            market_id=133,
            hour_start=time(10, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=6
        ),
        # Queens County Farm Museum Farm Stand
        MarketDay(
            id=159,
            market_id=133,
            hour_start=time(10, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0
        ),
        # Queens Farm at Jamaica Hospital
        MarketDay(
            id=160,
            market_id=134,
            hour_start=time(10, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=5
        ),
        # Rockaway Market at Beach 60th
        MarketDay(
            id=161,
            market_id=135,
            hour_start=time(10, 0, 0),
            hour_end=time(13, 0, 0),
            day_of_week=6
        ),
        # Children’s Aid Society Go!Healthy Food Box + Farmstand - Goodhue Center
        MarketDay(
            id=162,
            market_id=136,
            hour_start=time(14, 30, 0),
            hour_end=time(16, 30, 0),
            day_of_week=2
        )
    ]
    db.session.add_all(market_day_list)
    db.session.commit()

    test_stripe_account=["acct_1Qs7KP08nIrce1x4", "acct_1Qs6bKCG2V9M9wlj", "acct_1QtWhdCRg0B3Emg5"]

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

    ve = Vendor(
        name="Lance's Big Mixed Nuts",
        city="New York",
        state="NY",
        products=sample(range(1, 34), randint(1, 3)),
        products_subcategories=["Tomatoes"],
        bio=str(fake.paragraph(nb_sentences=rev_len)),
        website='https://www.google.com/',
        stripe_account_id=str(choice(test_stripe_account)),
        stripe_is_onboarded=True,
        stripe_charges_enabled=True,
        stripe_payouts_enabled=True
    )
    vendors.append(ve)

    for i in range(149):
        products_subcat_a = choice([None, None, choice(['Almonds', 'Apples', 'Berries', 'Garlic', 'Tomatoes', 'Vodka'])])
        products_subcat_b = choice([None, None, choice(['Almonds', 'Apples', 'Berries', 'Garlic', 'Tomatoes', 'Vodka'])])
        subcat_dirty = sample([products_subcat_a, products_subcat_b], 2)
        subcat_clean = [item for item in subcat_dirty if item is not None]
        if not subcat_clean:
            subcat_clean = None
        name = f"{fake.first_name_nonbinary()}'s {choice(companies)}"
        city = str(fake.city())
        state = str(choice(states_ne))
        products = sample(range(1, 34), randint(1, 3))
        products_subcategories = subcat_clean
        bio = str(fake.paragraph(nb_sentences=rev_len))
        image = choice(images) if randint(1, 8) > 1 else None
        stripe_account_id = str(choice(test_stripe_account))

        v = Vendor(
            name=name,
            city=city,
            state=state,
            products=products,
            products_subcategories=products_subcategories,
            bio=bio,
            image=image,
            website='https://www.google.com/',
            stripe_account_id=stripe_account_id
        )
        vendors.append(v)

    db.session.add_all(vendors)
    db.session.commit()


    # add fake market reviews
    market_revs = []
    reported = (False, False, False, False, False, False, False, False, False, True)
    for i in range(250):
        rev_len = randint(2, 5)

        review_text = str(fake.paragraph(nb_sentences=rev_len))
        market_id = str(randint(1, 81))
        user_id = str(randint(1, 50))
        is_reported = choice(reported)
        last_year = randint(0, 365)
        post_date = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=last_year)

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
    for i in range(250):
        rev_len = randint(2, 5)

        review_text = fake.paragraph(nb_sentences=rev_len)
        vendor_id = str(randint(1, 150))
        user_id = str(randint(1, 50))
        is_reported = choice(reported)
        last_year = randint(0, 365)
        post_date = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=last_year)
        
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
    for i in range(300):
        market_id = randint(1, 45)
        user_id = randint(1, 51)

        mf = MarketFavorite(
            market_id=market_id,
            user_id=user_id,
        )
        market_favs.append(mf)

    db.session.add_all(market_favs)
    db.session.commit()

    vendor_favs = []
    for i in range(400):
        vendor_id = randint(1, 150)
        user_id = randint(1, 51)

        vf = VendorFavorite(
            vendor_id=vendor_id,
            user_id=user_id,
        )
        vendor_favs.append(vf)

    db.session.add_all(vendor_favs)
    db.session.commit()

    blog_favs = []
    for i in range(60):
        blog_id = randint(1, 3)
        user_id = randint(1, 51)

        bf = BlogFavorite(
            blog_id=blog_id,
            user_id=user_id,
        )
        blog_favs.append(bf)

    db.session.add_all(blog_favs)
    db.session.commit()


    # add fake vendor markets
    vendor_markets = []
    for i in range(500):

        vendor_id = str(randint(1, 150))
        market_day_id = str(randint(1, 61))

        vm = VendorMarket(
            vendor_id=vendor_id,
            market_day_id=market_day_id
        )
        vendor_markets.append(vm)

    db.session.add_all(vendor_markets)
    db.session.commit()


    # add fake users
    vendor_users = []
    vendor_users_settings = []
    for i in range(50):
        rand_vendor_id = randint(1, 200)
        rand_vendor_id_2 = randint(1, 200)
        choice_num = choice([0, 1])
        choice_id = [{ rand_vendor_id: rand_vendor_id}, { rand_vendor_id: rand_vendor_id, rand_vendor_id_2: rand_vendor_id_2}]
        choice_role = [{ rand_vendor_id: randint(0, 1)}, { rand_vendor_id: randint(0, 1), rand_vendor_id_2: randint(0, 1)}]
        email = fake.ascii_safe_email()
        # password = fake.password()
        password = "lol"
        first_name = fake.first_name()
        last_name = fake.last_name()
        # phone = fake.phone_number()
        phone = f'+1 {str(randint(1000000000,9999999999))}'
        active_vendor = rand_vendor_id
        vendor_id = choice_id[choice_num]
        vendor_role = choice_role[choice_num]


        vu = VendorUser(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            active_vendor=active_vendor,
            vendor_id=vendor_id,
            vendor_role=vendor_role
        )
        vendor_users.append(vu)

        # svu = SettingsVendor(
        #     vendor_user_id=(i + 1)
        # )
        # vendor_users_settings.append(svu)

    db.session.add_all(vendor_users)
    # db.session.add_all(vendor_users_settings)
    db.session.commit()

    # user for demo
    vendor_user_demo = VendorUser(
        email="hello@gingham.nyc",
        password="lol",
        first_name="Ham-man",
        last_name="Gingy",
        phone="+12095553880",
        active_vendor=1,
        vendor_id={1:1},
        vendor_role={1:0},
    )
    # vendor_user_settings_demo = SettingsVendor(
    #     vendor_user_id=51
    # )
    
    # vendor_user_demo_2 = VendorUser(
    #     email="zak@mufo.nyc",
    #     password="lol",
    #     first_name="Zak",
    #     last_name="Lance",
    #     phone="+12095553880",
    #     active_vendor=1,
    #     vendor_id={1:1, 2:2},
    #     vendor_role={1:0, 2:1}
    # )
    # vendor_user_settings_demo_2 = SettingsVendor(
    #     vendor_user_id=52
    # )
    
    # vendor_user_demo_3 = VendorUser(
    #     email="sandro@mufo.nyc",
    #     password="lol",
    #     first_name="Sand",
    #     last_name="Man",
    #     phone="+12095553880",
    #     active_vendor=1,
    #     vendor_id={1:1},
    #     vendor_role={1:1}
    # )
    # vendor_user_settings_demo_3 = SettingsVendor(
    #     vendor_user_id=53
    # )
    
    # vendor_user_demo_4 = VendorUser(
    #     email="vinh@mufo.nyc",
    #     password="lol",
    #     first_name="Vinh",
    #     last_name="Cent",
    #     phone="+12095553880",
    #     active_vendor=2,
    #     vendor_id={2:2},
    #     vendor_role={2:1}
    # )
    # vendor_user_settings_demo_4 = SettingsVendor(
    #     vendor_user_id=54
    # )

    db.session.add(vendor_user_demo)
    # db.session.add(vendor_user_settings_demo)
    # db.session.add(vendor_user_demo_2)
    # db.session.add(vendor_user_settings_demo_2)
    # db.session.add(vendor_user_demo_3)
    # db.session.add(vendor_user_settings_demo_3)
    # db.session.add(vendor_user_demo_4)
    # db.session.add(vendor_user_settings_demo_4)
    db.session.commit()

    admin_user_demo = [
        AdminUser(
            email="admin@gingham.nyc",
            password="lol",
            first_name="Ham-man",
            last_name="Gingy",
            phone="+12095553880",
            admin_role=0
        ),
        # SettingsAdmin(
        #     admin_id=1
        # ),
        AdminUser(
            email="zak@mufo.nyc",
            password="lol",
            first_name="Zak",
            last_name="Wosewick",
            phone="+10000000000",
            admin_role=1
        ),
        # SettingsAdmin(
        #     admin_id=2
        # ),
        AdminUser(
            email="sandro@mufo.nyc",
            password="lol",
            first_name="Sand",
            last_name="Man",
            phone="+10000000000",
            admin_role=1
        ),
        # SettingsAdmin(
        #     admin_id=3
        # ),
        AdminUser(
            email="vinh@mufo.nyc",
            password="lol",
            first_name="Vinh",
            last_name="Cent",
            phone="+10000000000",
            admin_role=1
        ),
        # SettingsAdmin(
        #     admin_id=4
        # ),
        AdminUser(
            email="hello@mufo.nyc",
            password="lol",
            first_name="Hell",
            last_name="Oh",
            phone="+10000000000",
            admin_role=2
        ),
        # SettingsAdmin(
        #     admin_id=5
        # ),
    ]
    
    db.session.add_all(admin_user_demo)
    db.session.commit()

    baskets = []
    est = timezone('US/Eastern')  # Define the EST timezone.

    for i in range(2000):
        rand_user = [None, randint(1, 51)]

        selected_vm = choice(vendor_markets)
        selected_market_day = next(item for item in market_day_list if item.id == selected_vm.market_day_id)
        day_of_week = selected_market_day.day_of_week
        current_date = datetime.now(est).date()

        def find_matching_date(day_of_week, reference_date):
            difference = (day_of_week - reference_date.weekday()) % 7
            return reference_date + timedelta(days=difference)

        possible_dates = [
            find_matching_date(day_of_week, current_date + timedelta(days=delta))
            for delta in range(-4, 5)
        ]

        sale_date = min(possible_dates, key=lambda x: abs(x - current_date))

        sale_date -= timedelta(days=1)

        sale_date = datetime.combine(sale_date, time.min).date()

        rand_hour = randint(10, 14)
        rand_minute = choice([0, 0, 30])
        date_time = est.localize(datetime(sale_date.year, sale_date.month, sale_date.day, rand_hour, rand_minute))

        pickup_start = date_time
        random_duration_minutes = choice([30, 60, 90, 120, 240, 360])
        pickup_end = pickup_start + timedelta(minutes=random_duration_minutes)

        user_id = choice(rand_user)
        is_sold = user_id is not None
        is_grabbed = bool(fake.boolean()) if is_sold else False
        price = randint(8, 20)
        value = price + randint(4, 8)

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
            value=value
        )
        baskets.append(bsk)
    try:
        db.session.add_all(baskets)
        db.session.flush()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error during flush/commit: {e}")
        raise
    
    for i in range(12):
        rand_user = [None, randint(1, 51)]

        selected_vm = choice(vendor_markets)
        selected_market_day = next(item for item in market_day_list if item.id == selected_vm.market_day_id)
        day_of_week = selected_market_day.day_of_week
        current_date = datetime.now(est).date()

        def find_matching_date(day_of_week, reference_date):
            difference = (day_of_week - reference_date.weekday()) % 7
            return reference_date + timedelta(days=difference)

        possible_dates = [
            find_matching_date(day_of_week, current_date + timedelta(days=delta))
            for delta in range(-4, 5)
        ]

        sale_date = min(possible_dates, key=lambda x: abs(x - current_date))

        sale_date -= timedelta(days=1)

        sale_date = datetime.combine(sale_date, time.min).date()

        rand_hour = randint(10, 14)
        rand_minute = choice([0, 0, 30])
        date_time = est.localize(datetime(sale_date.year, sale_date.month, sale_date.day, rand_hour, rand_minute))

        pickup_start = date_time
        random_duration_minutes = choice([30, 60, 90, 120, 240, 360])
        pickup_end = pickup_start + timedelta(minutes=random_duration_minutes)

        user_id = choice(rand_user)
        is_sold = user_id is not None
        is_grabbed = bool(fake.boolean()) if is_sold else False
        price = randint(8, 20)
        value = price + randint(4, 8)

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
            value=value
        )
        baskets.append(bsk2)
    
    bsk3 = Basket(
        vendor_id=1,
        market_day_id=1,
        sale_date=date(2024, 10, 15),
        pickup_start=time(14, 0, 0),
        pickup_end=time(18, 0, 0),
        user_id=1,
        is_sold=True,
        is_grabbed=True,
        price=16.5, 
        value=24
    )
    baskets.append(bsk3)
    
    bsk4 = Basket(
        vendor_id=1,
        market_day_id=1,
        sale_date=date(2024, 11, 15),
        pickup_start=time(14, 0, 0),
        pickup_end=time(18, 0, 0),
        user_id=1,
        is_sold=True,
        is_grabbed=True,
        price=16.5, 
        value=24
    )
    baskets.append(bsk4)
    
    bsk5 = Basket(
        vendor_id=1,
        market_day_id=1,
        sale_date=date(2024, 12, 15),
        pickup_start=time(14, 0, 0),
        pickup_end=time(18, 0, 0),
        user_id=1,
        is_sold=True,
        is_grabbed=True,
        price=16.5, 
        value=24
    )
    baskets.append(bsk5)
    
    bsk6 = Basket(
        vendor_id=1,
        market_day_id=1,
        sale_date=date(2025, 1, 15),
        pickup_start=time(14, 0, 0),
        pickup_end=time(18, 0, 0),
        user_id=1,
        is_sold=True,
        is_grabbed=True,
        price=16.5, 
        value=24
    )
    baskets.append(bsk6)
    

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

    for i in range(100):
        heading = randint(1, 2)
        msg_len = randint(2, 5)
        rand_market = choice([None, randint(1, 81)])
        if rand_market is None:
            rand_vendor = randint(1, 200)
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


    # add fake market review ratings
    market_rev_ratings = []
    for i in range(200):
        rand_bool = choice([True, False])

        review_id = str(randint(1, 200))
        user_id = str(randint(1, 50))
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
        user_id = str(randint(1, 50))
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
        'Other', 'Art', 'Baked Goods', 'Beer', 'Cheese', 'Cider', 
        'Craft Goods', 'Coffee/Tea', 'Dairy', 'Eggs', 'Flowers', 'Fruit', 
        'Gluten-Free', 'Herbs & Spices', 'Honey', 'International', 
        'Jams & Preserves', 'Juice', 'Kimchi', 'Maple Syrup', 'Meat', 
        'Microgreens', 'Mushrooms', 'Nuts', 'Oil & Vinegar', 'Plants', 
        'Pickles', 'Poultry', 'Prepared Foods', 'Seafood', 'Spirits', 
        'Vegetables', 'Wine'
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

    blogs = [
        Blog(
            type="Recipe",
            title="Butternut Squash Soup",
            body="""
                <div class="column-3">
                    <h5 class="divider-b">Prep Time: 10 mins | Cook Time: 35 mins | Total: 45 mins | Serves: 6</h5>
                    <br/>
                    <article class="first-letter">
                        <p>
                            This vegan butternut squash soup is the perfect fall comfort food! Store in the fridge for 4 days or freeze for months.
                        </p>
                    </article>
                    <h5 class="text-underline">Ingredients</h5>
                    <ul class="ul-bullet">
                        <li>2 tbsp olive oil</li>
                        <li>1 large yellow onion, chopped</li>
                        <li>½ tsp sea salt</li>
                        <li>1 (3-lb) butternut squash, peeled, seeded, cubed</li>
                        <li>3 garlic cloves, chopped</li>
                        <li>1 tbsp fresh sage, chopped</li>
                        <li>½ tbsp fresh rosemary, minced</li>
                        <li>1 tsp fresh ginger, grated</li>
                        <li>3–4 cups vegetable broth</li>
                        <li>Freshly ground black pepper</li>
                    </ul>
                    <h5 class="text-underline">Instructions</h5>
                    <ol class="ul-numbers">
                        <li>Heat oil in a large pot over medium heat. Add onion, salt, and pepper; sauté 5–8 mins. Add squash and cook 8–10 mins, stirring.</li>
                        <li>Add garlic, sage, rosemary, and ginger; cook 30 secs to 1 min until fragrant. Add 3 cups broth, bring to a boil, cover, and simmer 20–30 mins until squash is tender.</li>
                        <li>Cool slightly, blend until smooth (in batches if needed). Adjust thickness with more broth, season, and serve.</li>
                    </ol>
                    <article>
                        <p>
                            Enjoy this creamy, cozy soup!
                        </p>
                    </article>
                    <article>
                        <p>
                            <span class='font-gingham text-size-1'>—The Gin<span class="kern-1-5">g</span><span class="kern-05">h</span>am Team</span>
                        </p>
                    </article>
                    <img class="img-blog" src="/site-images/GINGHAM_VENDOR_FARMERSMARKET.png" alt="logo" />
                </div>
            """,
            post_date=datetime.strptime("2025-01-10 00:00:00", "%Y-%m-%d %H:%M:%S"),
            admin_user_id=1,
            for_user=True
        ),
        Blog(
            type="General",
            title="Discover Gingham: Fresh, Local, and Impactful",
            body="""
                <div class="column-3">
                    <article class="first-letter">
                        <p>
                            Do you love supporting local farmers, enjoying fresh produce, and finding great 
                            deals? Meet Gingham, the innovative platform that connects you with discounted 
                            baskets from farmers market vendors while helping reduce food waste.
                        </p>
                    </article>
                    <article>
                        <p>
                            Here’s how it works: Farmers market vendors often have surplus items at the end 
                            of the day. With Gingham, they bundle these items into discounted baskets for you 
                            to browse, reserve, and pick up at your convenience. Think of it as your personal 
                            gateway to fresh, local, and sustainable food.
                        </p>
                    </article>
                    <article>
                        <p>
                            Gingham isn’t just about savings—it’s about creating a positive impact. By 
                            purchasing a basket, you’re rescuing perfectly good food from going to waste, 
                            supporting local businesses, and embracing a more sustainable way of living. Plus, 
                            with fresh ingredients at your fingertips, you can enjoy cooking, meal prep, or 
                            even a spontaneous picnic with ease.
                        </p>
                    </article>
                    <article>
                        <p>
                            Signing up is quick and simple. Join the Gingham community today to start saving, 
                            reducing waste, and supporting your local farmers markets. Together, we can create 
                            a more sustainable future—one basket at a time!
                        </p>
                    </article>
                    <article>
                        <p>
                            <span class='font-gingham text-size-1'>—The Gin<span class="kern-1-5">g</span><span class="kern-05">h</span>am Team</span>
                        </p>
                    </article>
                    <img class="img-blog" src="/site-images/GINGHAM_VENDOR_FARMERSMARKET.png" alt="logo" />
                </div>
            """,
            post_date=datetime.strptime("2025-01-06 00:00:00", "%Y-%m-%d %H:%M:%S"),
            admin_user_id=1,
            for_user=True
        ), 
        Blog(
            type="Market Spotlight",
            title="Union Square Greenmarket",
            body="""
                <div class="column-3">
                    <article class="first-letter">
                        <p>
                            The world-famous Union Square Greenmarket began with just a few farmers in 1976, has grown 
                            exponentially; in peak season 140 regional farmers, fishers, and bakers sell their products 
                            to a dedicated legion of city dwellers. 
                        </p>
                    </article>
                    <article>
                        <p>
                            As Greenmarket's flagship market, the seasonal bounty is unparalleled, with hundreds of 
                            varieties to choose from during any given season. From just-picked fresh fruits and vegetables, 
                            to heritage meats and award-winning farmstead cheeses, artisan breads, jams, pickles, a profusion 
                            of cut flowers and plants, wine, ciders, maple syrup and much more. 
                        </p>
                    </article>
                    <article>
                        <p>
                            Located in one of New York City's great public spaces, the atmosphere at Union Square on a market 
                            day is electric: 60,000 market shoppers shop and chat with farmers; students of all ages tour the 
                            market and learn about seasonality; visitors watch and taste cooking demonstrations by some of 
                            New York's hottest local chefs. 
                        </p>
                    </article>
                    <article>
                        <p>
                            <span class='font-gingham text-size-1'>—The Gin<span class="kern-1-5">g</span><span class="kern-05">h</span>am Team</span>
                        </p>
                    </article>
                </div>
            """,
            post_date=datetime.strptime("2025-01-18 00:00:00", "%Y-%m-%d %H:%M:%S"),
            admin_user_id=1,
            for_user=True
        )
    ]

    db.session.add_all(blogs)
    db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        run()