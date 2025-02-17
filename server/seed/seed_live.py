from app import app
from faker import Faker
from random import random, choice, randint
from models import ( db, User, Market, MarketDay, Vendor, MarketReview, 
                    VendorReview, ReportedReview, MarketReviewRating, 
                    VendorReviewRating, MarketFavorite, VendorFavorite, 
                    VendorMarket, VendorUser, AdminUser, Basket, Event, 
                    Product, UserNotification, VendorNotification, 
                    AdminNotification, QRCode, FAQ, Blog, BlogFavorite,
                    Receipt, SettingsUser, SettingsVendor, SettingsAdmin, 
                    )
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
    AdminUser.query.delete()
    Basket.query.delete()
    Event.query.delete()
    Product.query.delete()
    UserNotification.query.delete()
    VendorNotification.query.delete()
    AdminNotification.query.delete()
    QRCode.query.delete()
    FAQ.query.delete()
    Blog.query.delete()
    BlogFavorite.query.delete()
    Receipt.query.delete()
    SettingsUser.query.delete()
    SettingsVendor.query.delete()
    SettingsAdmin.query.delete()

    db.session.commit()

    markets = [
        Market(
            id=1,
            name='175th Street Greenmarket',
            location='W. 175th St. bet. Wadsworth Ave. & Broadway',
            city="New York",
            state="NY",
            zipcode='10033',
            coordinates={"lat": "40.84607450953993", "lng": "-73.93808039940272"},
            schedule='Thursday (8 a.m. - 4 p.m.)',
            year_round=False,
            season_start=date(2025, 6, 26),
            season_end=date(2025, 11, 20),
            is_visible=False,
            is_current=True
        ),
        Market(
            id=2,
            name='57th Street Greenmarket',
            location='W. 57th St. & 10th Ave.',
            city="New York",
            state="NY",
            zipcode='10019',
            coordinates={"lat": "40.769140743893075", "lng": "-73.98836576430834"},
            schedule='Saturday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2025, 6, 7),
            season_end=date(2025, 11, 22),
            is_visible=False,
            is_current=True
        ),
        Market(
            id=3,
            name='79th Street Greenmarket',
            location='79th St. & Columbus Ave.',
            city="New York",
            state="NY",
            zipcode='10024',
            coordinates={"lat": "40.782040858828", "lng": "-73.9759752811397"},
            schedule='Sunday (9 a.m. - 4 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=4,
            name='82nd Street Greenmarket',
            location=' 82nd St. bet. 1st & York Aves.',
            city="New York",
            state="NY",
            zipcode='10028',
            coordinates={"lat": "40.77397099020891", "lng": "-73.95064361322936"},
            schedule='Saturday (9 a.m. - 2:30 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=5,
            name='94th Street Greenmarket',
            location='E. 94th St. & 1st Ave.',
            city="New York",
            state="NY",
            zipcode='10128',
            coordinates={"lat": "40.78180268440337", "lng": "-73.94555998335593"},
            schedule='Sunday (9 a.m. - 4 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 18),
            season_end=date(2024, 11, 19),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=6,
            name='97th Street Greenmarket',
            location='W. 97th St. bet. Columbus & Amsterdam Aves.',
            city="New York",
            state="NY",
            zipcode='10025',
            coordinates={"lat": "40.79433392796688", "lng": "-73.96852339557134"},
            schedule='Friday (8 a.m. - 2 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=7,
            name='Abingdon Square Greenmarket',
            location='Hudson St. & W. 12th St.',
            city="New York",
            state="NY",
            zipcode='10014',
            coordinates={"lat": "40.737268845844085", "lng": "-74.00531736212757"},
            schedule='Saturday (8 a.m. - 2 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=8,
            name='Astor Place Greenmarket',
            location='E. 8th St. & Lafayette St.',
            city="New York",
            state="NY",
            zipcode='10003',
            coordinates={"lat": "40.729830818573944", "lng": "-73.99109568735417"},
            schedule='Tuesday (8 a.m. - 5 p.m.)',
            year_round=False,
            season_start=date(2025, 6, 3),
            season_end=date(2025, 11, 25),
            is_visible=False,
            is_current=True
        ),
        Market(
            id=9,
            name='Bowling Green Greenmarket',
            location='Broadway & Battery Pl.',
            city="New York",
            state="NY",
            zipcode='10004',
            coordinates={"lat": "40.704724320402526", "lng": "-74.01342009247573"},
            schedule='Tuesday & Thursday (8 a.m. - 2 p.m.)',
            year_round=False,
            season_start=date(2025, 4, 15),
            season_end=date(2024, 11, 25),
            is_visible=False,
            is_current=True
        ),
        Market(
            id=10,
            name='Bro Sis Green Youth Market',
            location='Amsterdam Ave. bet. W. 143rd & 144th Sts. (Johnny Hartman Plaza)',
            city="New York",
            state="NY",
            zipcode='10031',
            coordinates={"lat": "40.824268847996954", "lng": "-73.94880767347686"},
            schedule='Wednesday (10:30 a.m. - 6 p.m.)',
            year_round=False,
            season_start=date(2024, 7, 8),
            season_end=date(2024, 11, 25),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=11,
            name="Chelsea’s Down to Earth Farmers Market",
            location='W. 23rd St. bet. 8th & 9th Aves.',
            city="New York",
            state="NY",
            zipcode='10011',
            coordinates={"lat": "40.74610601822501", "lng": "-74.00012495281699"},
            schedule='Saturday (9 a.m. - 2 p.m.)',
            year_round=False,
            season_start=date(2024, 4, 20),
            season_end=date(2024, 12, 21),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=12,
            name="Children’s Aid Go!Healthy Food Box + Farmstand - Milbank Center",
            location='14-32 W. 118th St.',
            city="New York",
            state="NY",
            zipcode='10026',
            coordinates={"lat": "40.80245205041825", "lng": "-73.94675905810875"},
            schedule='Wednesday (2 - 4:30 p.m.)',
            year_round=False,
            season_start=date(2024, 7, 10),
            season_end=date(2024, 11, 20),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=13,
            name='Columbia Greenmarket',
            location='Broadway & 114th St.',
            city="New York",
            state="NY",
            zipcode='10025',
            coordinates={"lat": "40.80711550674964", "lng": "-73.9643334908912"},
            schedule='Thursday & Sunday (8 a.m. - 4 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=14,
            name='Dag Hammarskjold Greenmarket',
            location='E. 47th St. & 2nd Ave.',
            city="New York",
            state="NY",
            zipcode='10017',
            coordinates={"lat": "40.752106980482026", "lng": "-73.96813449641382"},
            schedule='Wednesday (8 a.m. - 3 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=15,
            name='Fort Washington Greenmarket',
            location='W. 168th St. & Ft. Washington Ave.',
            city="New York",
            state="NY",
            zipcode='10032',
            coordinates={"lat": "40.842308310821956", "lng": "-73.94211665674466"},
            schedule='Tuesday (8 a.m. - 4 p.m.)',
            year_round=False,
            season_start=date(2025, 6, 3),
            season_end=date(2025, 11, 23),
            is_visible=False,
            is_current=True
        ),
        Market(
            id=16,
            name='Fulton Stall Market (Indoor Farmers Market)',
            location='91 South St.',
            city="New York",
            state="NY",
            zipcode='10038',
            coordinates={"lat": "40.70614940342313", "lng": "-74.00349962702734"},
            schedule='Monday - Saturday (11:30 a.m. - 5 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=17,
            name='Gouverneur Health Farmstand',
            location='Madison St. bet. Clinton & Jefferson Sts.',
            city="New York",
            state="NY",
            zipcode='10002',
            coordinates={"lat": "40.71266393582476", "lng": "-73.98847487671178"},
            schedule='Thursday (9 a.m. - 2 p.m.)',
            year_round=False,
            season_start=date(2024, 7, 5),
            season_end=date(2024, 11, 22),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=18,
            name='Grass Roots Farmers Market',
            location='W. 145th St. bet. Edgecombe & Bradhurst Aves. (Jackie Robinson Park)',
            city="New York",
            state="NY",
            zipcode='10039',
            coordinates={"lat": "40.82373611412579", "lng": "-73.9435495760123"},
            schedule='Tuesday & Saturday (9 a.m. - 4 p.m.)',
            year_round=False,
            is_visible=False,
            is_current=False
        ),
        Market(
            id=19,
            name='Greenmarket at the Oculus',
            location='Church & Fulton Sts. (Oculus Plaza)',
            city="New York",
            state="NY",
            zipcode='10006',
            coordinates={"lat": "40.71142490993184", "lng": "-74.01076962766949"},
            schedule='Tuesday (8 a.m. - 5 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 18),
            season_end=date(2024, 10, 29),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=20,
            name='Harlem Meer Farmstand',
            location='Central Park N. & Malcom X Blvd.',
            city="New York",
            state="NY",
            zipcode='10026',
            coordinates={"lat": "40.79815888129796", "lng": "-73.95254032492262"},
            schedule='Saturday (10 a.m. - 2 p.m.)',
            year_round=False,
            season_start=date(2024, 7, 20),
            season_end=date(2024, 11, 30),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=21,
            name='Harvest Home East Harlem Farmers Market',
            location='E. 104th St. & 3rd Ave.',
            city="New York",
            state="NY",
            zipcode='10029',
            coordinates={"lat": "40.79001677902627", "lng": "-73.94559282721028"},
            schedule='Thursday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 13),
            season_end=date(2024, 11, 14),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=22,
            name='Harvest Home Harlem Hospital Farmers Market',
            location='W. 137th St. & Lenox Ave.',
            city="New York",
            state="NY",
            zipcode='10030',
            coordinates={"lat": "40.81542139191092", "lng": "-73.93994201397497"},
            schedule='Friday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 14),
            season_end=date(2024, 11, 15),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=23,
            name='Harvest Home Lenox Avenue Farm Stand',
            location='Lenox Ave. bet. W. 117th & 118th Sts.',
            city="New York",
            state="NY",
            zipcode='10026',
            coordinates={"lat": "40.80272354850676", "lng": "-73.94895981440956"},
            schedule='Saturday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 22),
            season_end=date(2024, 11, 16),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=24,
            name='Harvest Home Metropolitan Hospital Farmers Market',
            location='97th St. & 2nd Ave.',
            city="New York",
            state="NY",
            zipcode='10029',
            coordinates={"lat": "40.784947665352576", "lng": "-73.94660106093569"},
            schedule='Friday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 14),
            season_end=date(2024, 11, 15),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=25,
            name='Inwood Park Greenmarket',
            location='Isham St. bet. Seaman Ave. & Cooper St.',
            city="New York",
            state="NY",
            zipcode='10034',
            coordinates={"lat": "40.86911825882977", "lng": "-73.92025906885881"},
            schedule='Saturday (8 a.m. - 3 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=26,
            name='Lower East Side Farmstand',
            location='Grand St. bet. Pitt & Willett Sts. (outside of Abrons Arts Center)',
            city="New York",
            state="NY",
            zipcode='10002',
            coordinates={"lat": "40.715117290409026", "lng": "-73.98348650666313"},
            schedule='Thursday (8:30 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 7, 5),
            season_end=date(2024, 11, 22),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=27,
            name='Morningside Park’s Down to Earth Farmers Market',
            location='W. 110th St. & Manhattan Ave.',
            city="New York",
            state="NY",
            zipcode='10026',
            coordinates={"lat": "40.801382884379336", "lng": "-73.95970142371496"},
            schedule='Saturday (9 a.m. - 2 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=28,
            name='Mount Sinai Greenmarket',
            location='Madison Ave. & 99th St.',
            city="New York",
            state="NY",
            zipcode='10029',
            coordinates={"lat": "40.78944510836953", "lng": "-73.95271330705022"},
            schedule='Wednesday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 18),
            season_end=date(2024, 11, 26),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=29,
            name='NYP Youth Market - Audoban',
            location='21 Audoban Ave.',
            city="New York",
            state="NY",
            zipcode='10032',
            coordinates={"lat": "40.839630140355446", "lng": "-73.93889062898364"},
            schedule='Thursday (9 a.m. - 3 p.m.)',
            year_round=False,
            is_visible=False,
            is_current=False
        ),
        Market(
            id=30,
            name='NYP Youth Market - Broadway',
            location='4781-4783 Broadway',
            city="New York",
            state="NY",
            zipcode='10034',
            coordinates={"lat": "40.86600006214813", "lng": "-73.9263264427691"},
            schedule='Wednesday (9 a.m. - 3 p.m.)',
            year_round=False,
            is_visible=False,
            is_current=False
        ),
        Market(
            id=31,
            name='Project EATS Farm Stand at Essex Crossing',
            location='115 Delancey St.',
            city="New York",
            state="NY",
            zipcode='10002',
            coordinates={"lat": "40.718268229915765", "lng": "-73.98822774526953"},
            schedule='Wednesday-Sunday (11 a.m. - 7 p.m.)',
            year_round=False,
            is_visible=False,
            is_current=False
        ),
        Market(
            id=32,
            name='P.S. 11 Farm Market',
            location='320 W. 21st St.',
            city="New York",
            state="NY",
            zipcode='10011',
            coordinates={"lat": "40.74443551076143", "lng": "-74.00056543152783"},
            schedule='Wednesday (8 a.m. - 10 a.m.)',
            year_round=False,
            season_start=date(2024, 6, 11),
            season_end=date(2024, 11, 12),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=33,
            name='P.S. 57 Farmstand',
            location='115th St. & 3rd Ave. (SW corner)',
            city="New York",
            state="NY",
            zipcode='10029',
            coordinates={"lat": "40.797300330819134", "lng": "-73.94074817230118"},
            schedule='Wednesday (9:30 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 1),
            season_end=date(2024, 11, 21),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=34,
            name='Stuyvesant Town Greenmarket',
            location='South end of Stuyvesant Town Oval',
            city="New York",
            state="NY",
            zipcode='10009',
            coordinates={"lat": "40.73200566470982", "lng": "-73.97761240821589"},
            schedule='Sunday (9:30 a.m. - 4 p.m.)',
            year_round=False,
            season_start=date(2024, 5, 11),
            season_end=date(2024, 12, 14),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=35,
            name='Tompkins Square Greenmarket',
            location='E. 7th St. & Avenue A',
            city="New York",
            state="NY",
            zipcode='10003',
            coordinates={"lat": "40.72606737678102", "lng": "-73.98333751481684"},
            schedule='Sunday (9 a.m. - 4 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=36,
            name='Tribeca Greenmarket',
            location='Greenwich & Chambers Sts.',
            city="New York",
            state="NY",
            zipcode='10013',
            coordinates={"lat": "40.71690089948348", "lng": "-74.01090464424209"},
            schedule='Saturday (8 a.m. - 2 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=37,
            name='Tucker Square Greenmarket',
            location='Columbus Ave. & 66th St.',
            city="New York",
            state="NY",
            zipcode='10023',
            coordinates={"lat": "40.77367979894632", "lng": "-73.9819555713842"},
            schedule='Thursday (8 a.m. - 3 p.m.); Saturday (8 a.m. - 4 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=False
        ),
        Market(
            id=38,
            name='Two Bridges Youth Market',
            location='50 Madison St.',
            city="New York",
            state="NY",
            zipcode='10010',
            coordinates={"lat": "40.71160138343196", "lng": "-73.99773475060357"},
            schedule='Sunday (10:30 a.m. - 3:30 p.m.)',
            year_round=False,
            season_start=date(2024, 5, 26),
            season_end=date(2024, 12, 15),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=39,
            name='Union Square Greenmarket',
            location='E. 17th St. & Union Square W.',
            city="New York",
            state="NY",
            zipcode='10003',
            coordinates={"lat": "40.736358642578125", "lng": "-73.99076080322266"},
            schedule='Monday, Wednesday, Friday & Saturday (8 a.m. - 6 p.m.)',
            year_round=True,
            is_visible=True,
            is_current=True
        ),
        Market(
            id=40,
            name='Uptown Good Food Farm Stand',
            location='330 St. Nicholas Ave. (St. Nicholas Miracle Garden)',
            city="New York",
            state="NY",
            zipcode='10027',
            coordinates={"lat": "40.811760800653175", "lng": "-73.95159181329969"},
            schedule='Thursday (4 - 7 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 1),
            season_end=date(2024, 11, 23),
            is_visible=False,
            is_current=False
        ),
        Market(
            id=41,
            name="City Hall Greenmarket",
            location='Chambers St. & Warren St.',
            city="New York",
            state="NY",
            zipcode='10007',
            coordinates={"lat": "40.713888983534495", "lng": "-74.00644264735783"},
            schedule='Tuesday (9 a.m. - 4 p.m.)',
            year_round=False,
            season_start=date(2025, 4, 15),
            season_end=date(2025, 11, 25),
            is_visible=False,
            is_current=True
        ),
        Market(
            id=42,
            name='Uptown Grand Central Farm Stand',
            location='125th Street & Park Ave.',
            city="New York",
            state="NY",
            zipcode='10035',
            coordinates={"lat": "40.80493954076873", "lng": "-73.93903600281972"},
            schedule='Wednesday (1:30 - 7 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=43,
            name='Lenox Hill Farm Stand',
            location='70th St. & 1st Ave.',
            city="New York",
            state="NY",
            zipcode='10021',
            coordinates={"lat": "40.76668271329556", "lng": "-73.95721258190501"},
            schedule='Thursday (12 a.m. - 5 p.m.)',
            year_round=True,
            is_visible=False,
            is_current=True
        ),
        Market(
            id=44,
            name='92nd Street Greenmarket',
            location='E 92th St. & 1st Ave.',
            city="New York",
            state="NY",
            zipcode='10025',
            coordinates={"lat": "40.78093568496837", "lng": "-73.94626236967947"},
            schedule='Sunday (9 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2025, 6, 22),
            season_end=date(2025, 11, 23),
            is_visible=False,
            is_current=True
        ),
        Market(
            id=45,
            name='Rockefeller Greenmarket',
            location='Rockefeller Plaza at 50th St.',
            city="New York",
            state="NY",
            zipcode='10011',
            coordinates={"lat": "40.75921762876115", "lng": "-73.9783109644037"},
            schedule='Wednesday (8 a.m. - 5 p.m.)',
            year_round=False,
            season_start=date(2025, 8, 13),
            season_end=date(2025, 10, 29),
            is_visible=False,
            is_current=True
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
        )
    ]
    db.session.add_all(market_day_list)
    db.session.commit()


    admin_user_demo = [
        AdminUser(
            email="admin@gingham.nyc",
            password="lol",
            first_name="Ham-man",
            last_name="Gingy",
            phone="+12095053880",
            admin_role=0
        ),
        SettingsAdmin(
            admin_id=1
        ),
        AdminUser(
            email="zak@mufo.nyc",
            password="lol",
            first_name="Zak",
            last_name="Wosewick",
            phone="+10000000000",
            admin_role=1
        ),
        SettingsAdmin(
            admin_id=2
        ),
        AdminUser(
            email="sandro@mufo.nyc",
            password="lol",
            first_name="Sand",
            last_name="Man",
            phone="+10000000000",
            admin_role=1
        ),
        SettingsAdmin(
            admin_id=3
        ),
        AdminUser(
            email="vinh@mufo.nyc",
            password="lol",
            first_name="Vinh",
            last_name="Cent",
            phone="+10000000000",
            admin_role=1
        ),
        SettingsAdmin(
            admin_id=4
        ),
    ]
    
    db.session.add_all(admin_user_demo)
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

    
if __name__ == '__main__':
    with app.app_context():
        run()