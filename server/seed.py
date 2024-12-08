from app import app
from faker import Faker
from random import random, choice, randint
from models import db, User, Market, MarketDay, Vendor, MarketReview, VendorReview, MarketReviewRating, VendorReviewRating, MarketFavorite, VendorFavorite, VendorMarket, VendorUser, AdminUser, Basket, Event, UserNotification, VendorNotification, Product, bcrypt
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
    MarketReviewRating.query.delete()
    VendorReviewRating.query.delete()
    MarketFavorite.query.delete()
    VendorFavorite.query.delete()
    VendorMarket.query.delete()
    VendorUser.query.delete()
    AdminUser.query.delete()
    Basket.query.delete()
    Event.query.delete()
    UserNotification.query.delete()
    VendorNotification.query.delete()
    Product.query.delete()

    db.session.commit()

    markets = [
        Market(
            name='175th Street Greenmarket',
            image='10292023_Broadway_farmers_market_Columbia_NYC.jpg',
            location='W. 175th St. bet. Wadsworth Ave. & Broadway',
            zipcode='10033',
            coordinates={"lat": "40.84607450953993", "lng": "-73.93808039940272"},
            schedule='Thursday (8 a.m. - 4 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 27),
            season_end=date(2024, 11, 21)
        ),
        Market(
            name='57th Street Greenmarket',
            image='6329735393_3a905a118a_o.0.jpg',
            location='W. 57th St. & 10th Ave.',
            zipcode='10019',
            coordinates={"lat": "40.769140743893075", "lng": "-73.98836576430834"},
            schedule='Saturday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 1),
            season_end=date(2024, 11, 23)
        ),
        Market(
            name='79th Street Greenmarket',
            image='image.jpeg',
            location='79th St. & Columbus Ave.',
            zipcode='10024',
            coordinates={"lat": "40.782040858828", "lng": "-73.9759752811397"},
            schedule='Sunday (9 a.m. - 4 p.m.)',
            year_round=True
        ),
        Market(
            name='82nd Street Greenmarket',
            image='bronxborhall_shaylahunter_re_xy4a4543.jpg',
            location=' 82nd St. bet. 1st & York Aves.',
            zipcode='10028',
            coordinates={"lat": "40.77397099020891", "lng": "-73.95064361322936"},
            schedule='Saturday (9 a.m. - 2:30 p.m.)',
            year_round=True
        ),
        Market(
            name='94th Street Greenmarket',
            image='c.-Martin-Seck-GAP-1-768x531.jpg',
            location='E. 94th St. & 1st Ave.',
            zipcode='10128',
            coordinates={"lat": "40.78180268440337", "lng": "-73.94555998335593"},
            schedule='Sunday (9 a.m. - 4 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 18),
            season_end=date(2024, 11, 19)
        ),
        Market(
            name='97th Street Greenmarket',
            image='farmers-market.jpg',
            location='W. 97th St. bet. Columbus & Amsterdam Aves.',
            zipcode='10025',
            coordinates={"lat": "40.79433392796688", "lng": "-73.96852339557134"},
            schedule='Friday (8 a.m. - 2 p.m.)',
            year_round=True
        ),
        Market(
            name='Abingdon Square Greenmarket',
            image='flatten;crop;webp=auto;jpeg_quality=60.jpg',
            location='Hudson St. & W. 12th St.',
            zipcode='10014',
            coordinates={"lat": "40.737268845844085", "lng": "-74.00531736212757"},
            schedule='Saturday (8 a.m. - 2 p.m.)',
            year_round=True
        ),
        Market(
            name='Astor Place Greenmarket',
            image='greenmarket-grownyc-768x512.jpeg',
            location='E. 8th St. & Lafayette St.',
            zipcode='10003',
            coordinates={"lat": "40.729830818573944", "lng": "-73.99109568735417"},
            schedule='Tuesday (8 a.m. - 5 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 4),
            season_end=date(2024, 11, 26)
        ),
        Market(
            name='Bowling Green Greenmarket',
            image='image.jpeg',
            location='Broadway & Battery Pl.',
            zipcode='10004',
            coordinates={"lat": "40.704724320402526", "lng": "-74.01342009247573"},
            schedule='Tuesday & Thursday (8 a.m. - 2 p.m.)',
            year_round=False,
            season_start=date(2024, 4, 16),
            season_end=date(2024, 11, 26)
        ),
        Market(
            name='Bro Sis Green Youth Market',
            image='Union_Square_Farmers_Market.jpg',
            location='Amsterdam Ave. bet. W. 143rd & 144th Sts. (Johnny Hartman Plaza)',
            zipcode='10031',
            coordinates={"lat": "40.824268847996954", "lng": "-73.94880767347686"},
            schedule='Wednesday (10:30 a.m. - 6 p.m.)',
            year_round=False,
            season_start=date(2024, 7, 8),
            season_end=date(2024, 11, 25)
        ),
        Market(
            name="Chelsea’s Down to Earth Farmers Market",
            image='unnamed.jpg',
            location='W. 23rd St. bet. 8th & 9th Aves.',
            zipcode='10011',
            coordinates={"lat": "40.74610601822501", "lng": "-74.00012495281699"},
            schedule='Saturday (9 a.m. - 2 p.m.)',
            year_round=False,
            season_start=date(2024, 4, 20),
            season_end=date(2024, 12, 21)
        ),
        Market(
            name="Children’s Aid Go!Healthy Food Box + Farmstand - Milbank Center",
            image='6329735393_3a905a118a_o.0.jpg',
            location='14-32 W. 118th St.',
            zipcode='10026',
            coordinates={"lat": "40.80245205041825", "lng": "-73.94675905810875"},
            schedule='Wednesday (2 - 4:30 p.m.)',
            year_round=False,
            season_start=date(2024, 7, 10),
            season_end=date(2024, 11, 20)
        ),
        Market(
            name='Columbia Greenmarket',
            image='Union_Square_Farmers_Market.jpg',
            location='Broadway & 114th St.',
            zipcode='10025',
            coordinates={"lat": "40.80711550674964", "lng": "-73.9643334908912"},
            schedule='Thursday & Sunday (8 a.m. - 4 p.m.)',
            year_round=True
        ),
        Market(
            name='Dag Hammarskjold Greenmarket',
            image='c.-Martin-Seck-GAP-1-768x531.jpg',
            location='E. 47th St. & 2nd Ave.',
            zipcode='10017',
            coordinates={"lat": "40.752106980482026", "lng": "-73.96813449641382"},
            schedule='Wednesday (8 a.m. - 3 p.m.)',
            year_round=True
        ),
        Market(
            name='Fort Washington Greenmarket',
            image='farmers-market.jpg',
            location='W. 168th St. & Ft. Washington Ave.',
            zipcode='10032',
            coordinates={"lat": "40.842308310821956", "lng": "-73.94211665674466"},
            schedule='Tuesday (8 a.m. - 4 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 4),
            season_end=date(2024, 11, 26)
        ),
        Market(
            name='Fulton Stall Market (Indoor Farmers Market)',
            image='flatten;crop;webp=auto;jpeg_quality=60.jpg',
            location='91 South St.',
            zipcode='10038',
            coordinates={"lat": "40.70614940342313", "lng": "-74.00349962702734"},
            schedule='Monday - Saturday (11:30 a.m. - 5 p.m.)',
            year_round=True
        ),
        Market(
            name='Gouverneur Health Farmstand',
            image='greenmarket-grownyc-768x512.jpeg',
            location='Madison St. bet. Clinton & Jefferson Sts.',
            zipcode='10002',
            coordinates={"lat": "40.71266393582476", "lng": "-73.98847487671178"},
            schedule='Thursday (9 a.m. - 2 p.m.)',
            year_round=False,
            season_start=date(2024, 7, 5),
            season_end=date(2024, 11, 22)
        ),
        Market(
            name='Grass Roots Farmers Market',
            image='image.jpeg',
            location='W. 145th St. bet. Edgecombe & Bradhurst Aves. (Jackie Robinson Park)',
            zipcode='10039',
            coordinates={"lat": "40.82373611412579", "lng": "-73.9435495760123"},
            schedule='Tuesday & Saturday (9 a.m. - 4 p.m.)',
            year_round=False
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
            season_end=date(2024, 10, 29)
        ),
        Market(
            name='Harlem Meer Farmstand',
            image='unnamed.jpg',
            location='Central Park N. & Malcom X Blvd.',
            zipcode='10026',
            coordinates={"lat": "40.79815888129796", "lng": "-73.95254032492262"},
            schedule='Saturday (10 a.m. - 2 p.m.)',
            year_round=False,
            season_start=date(2024, 7, 20),
            season_end=date(2024, 11, 30)
        ),
        Market(
            name='Harvest Home East Harlem Farmers Market',
            image='10292023_Broadway_farmers_market_Columbia_NYC.jpg',
            location='E. 104th St. & 3rd Ave.',
            zipcode='10029',
            coordinates={"lat": "40.79001677902627", "lng": "-73.94559282721028"},
            schedule='Thursday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 13),
            season_end=date(2024, 11, 14)
        ),
        Market(
            name='Harvest Home Harlem Hospital Farmers Market',
            image='6329735393_3a905a118a_o.0.jpg',
            location='W. 137th St. & Lenox Ave.',
            zipcode='10030',
            coordinates={"lat": "40.81542139191092", "lng": "-73.93994201397497"},
            schedule='Friday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 14),
            season_end=date(2024, 11, 15)
        ),
        Market(
            name='Harvest Home Lenox Avenue Farm Stand',
            image='unnamed.jpg',
            location='Lenox Ave. bet. W. 117th & 118th Sts.',
            zipcode='10026',
            coordinates={"lat": "40.80272354850676", "lng": "-73.94895981440956"},
            schedule='Saturday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 22),
            season_end=date(2024, 11, 16)
        ),
        Market(
            name='Harvest Home Metropolitan Hospital Farmers Market',
            image='bronxborhall_shaylahunter_re_xy4a4543.jpg',
            location='97th St. & 2nd Ave.',
            zipcode='10029',
            coordinates={"lat": "40.784947665352576", "lng": "-73.94660106093569"},
            schedule='Friday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 14),
            season_end=date(2024, 11, 15)
        ),
        Market(
            name='Inwood Park Greenmarket',
            image='c.-Martin-Seck-GAP-1-768x531.jpg',
            location='Isham St. bet. Seaman Ave. & Cooper St.',
            zipcode='10034',
            coordinates={"lat": "40.86911825882977", "lng": "-73.92025906885881"},
            schedule='Saturday (8 a.m. - 3 p.m.)',
            year_round=True
        ),
        Market(
            name='Lower East Side Farmstand',
            image='farmers-market.jpg',
            location='Grand St. bet. Pitt & Willett Sts. (outside of Abrons Arts Center)',
            zipcode='10002',
            coordinates={"lat": "40.715117290409026", "lng": "-73.98348650666313"},
            schedule='Thursday (8:30 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 7, 5),
            season_end=date(2024, 11, 22)
        ),
        Market(
            name='Morningside Park’s Down to Earth Farmers Market',
            image='flatten;crop;webp=auto;jpeg_quality=60.jpg',
            location='W. 110th St. & Manhattan Ave.',
            zipcode='10026',
            coordinates={"lat": "40.801382884379336", "lng": "-73.95970142371496"},
            schedule='Saturday (9 a.m. - 2 p.m.)',
            year_round=True
        ),
        Market(
            name='Mount Sinai Greenmarket',
            image='greenmarket-grownyc-768x512.jpeg',
            location='Madison Ave. & 99th St.',
            zipcode='10029',
            coordinates={"lat": "40.78944510836953", "lng": "-73.95271330705022"},
            schedule='Wednesday (8 a.m. - 3 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 19),
            season_end=date(2024, 11, 27)
        ),
        Market(
            name='NYP Youth Market - Audoban',
            image='image.jpeg',
            location='21 Audoban Ave.',
            zipcode='10032',
            coordinates={"lat": "40.839630140355446", "lng": "-73.93889062898364"},
            schedule='Thursday (9 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='NYP Youth Market - Broadway',
            image='Union_Square_Farmers_Market.jpg',
            location='4781-4783 Broadway',
            zipcode='10034',
            coordinates={"lat": "40.86600006214813", "lng": "-73.9263264427691"},
            schedule='Wednesday (9 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='Project EATS Farm Stand at Essex Crossing',
            image='unnamed.jpg',
            location='115 Delancey St.',
            zipcode='10002',
            coordinates={"lat": "40.718268229915765", "lng": "-73.98822774526953"},
            schedule='Wednesday-Sunday (11 a.m. - 7 p.m.)',
            year_round=False
        ),
        Market(
            name='P.S. 11 Farm Market',
            image='10292023_Broadway_farmers_market_Columbia_NYC.jpg',
            location='320 W. 21st St.',
            zipcode='10011',
            coordinates={"lat": "40.74443551076143", "lng": "-74.00056543152783"},
            schedule='Wednesday (8 a.m. - 10 a.m.)',
            year_round=False,
            season_start=date(2024, 6, 11),
            season_end=date(2024, 11, 12)
        ),
        Market(
            name='P.S. 57 Farmstand',
            image='6329735393_3a905a118a_o.0.jpg',
            location='115th St. & 3rd Ave. (SW corner)',
            zipcode='10029',
            coordinates={"lat": "40.797300330819134", "lng": "-73.94074817230118"},
            schedule='Wednesday (9:30 a.m. - 3 p.m.)',
            year_round=True
        ),
        Market(
            name='Stuyvesant Town Greenmarket',
            image='flatten;crop;webp=auto;jpeg_quality=60.jpg',
            location='South end of Stuyvesant Town Oval',
            zipcode='10009',
            coordinates={"lat": "40.73200566470982", "lng": "-73.97761240821589"},
            schedule='Sunday (9:30 a.m. - 4 p.m.)',
            year_round=False,
            season_start=date(2024, 5, 12),
            season_end=date(2024, 12, 15)
        ),
        Market(
            name='Tompkins Square Greenmarket',
            image='bronxborhall_shaylahunter_re_xy4a4543.jpg',
            location='E. 7th St. & Avenue A',
            zipcode='10003',
            coordinates={"lat": "40.72606737678102", "lng": "-73.98333751481684"},
            schedule='Sunday (9 a.m. - 4 p.m.)',
            year_round=True
        ),
        Market(
            name='Tribeca Greenmarket',
            image='c.-Martin-Seck-GAP-1-768x531.jpg',
            location='Greenwich & Chambers Sts.',
            zipcode='10013',
            coordinates={"lat": "40.71690089948348", "lng": "-74.01090464424209"},
            schedule='Wednesday & Saturday (8 a.m. - 2 p.m.)',
            year_round=False,
            season_start=date(2024, 4, 17),
            season_end=date(2024, 11, 27)
        ),
        Market(
            name='Tucker Square Greenmarket',
            image='farmers-market.jpg',
            location='Columbus Ave. & 66th St.',
            zipcode='10023',
            coordinates={"lat": "40.77367979894632", "lng": "-73.9819555713842"},
            schedule='Thursday (8 a.m. - 3 p.m.); Saturday (8 a.m. - 4 p.m.)',
            year_round=True
        ),
        Market(
            name='Two Bridges Youth Market',
            image='flatten;crop;webp=auto;jpeg_quality=60.jpg',
            location='50 Madison St.',
            zipcode='10010',
            coordinates={"lat": "40.86600289682479", "lng": "-73.92633729986045"},
            schedule='Sunday (10:30 a.m. - 3:30 p.m.)',
            year_round=False,
            season_start=date(2024, 5, 26),
            season_end=date(2024, 12, 15)
        ),
        Market(
            name='Union Square Greenmarket',
            image='Union_Square_Farmers_Market.jpg',
            location='E. 17th St. & Union Square W.',
            zipcode='10003',
            coordinates={"lat": "40.736358642578125", "lng": "-73.99076080322266"},
            schedule='Monday, Wednesday, Friday & Saturday (8 a.m. - 6 p.m.)',
            year_round=True
        ),
        Market(
            name='Uptown Good Food Farm Stand',
            image='greenmarket-grownyc-768x512.jpeg',
            location='330 St. Nicholas Ave. (St. Nicholas Miracle Garden)',
            zipcode='10027',
            coordinates={"lat": "40.811760800653175", "lng": "-73.95159181329969"},
            schedule='Thursday (4 - 7 p.m.)',
            year_round=False,
            season_start=date(2024, 6, 1),
            season_end=date(2024, 11, 23)
        )
    ]
    db.session.add_all(markets)
    db.session.commit()

    market_day_list = [
        MarketDay(
            market_id=1,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=4,
        ),
        MarketDay(
            market_id=2,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=3,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0,
        ),
        MarketDay(
            market_id=4,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 30, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=5,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0
        ),
        MarketDay(
            market_id=6,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=5,
        ),
        MarketDay(
            market_id=7,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=8,
            hour_start=time(8, 0, 0),
            hour_end=time(17, 0, 0),
            day_of_week=2,
        ),
        MarketDay(
            market_id=9,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=2,
        ),
        MarketDay(
            market_id=9,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=4,
        ),
        MarketDay(
            market_id=10,
            hour_start=time(10, 30, 0),
            hour_end=time(18, 0, 0),
            day_of_week=3,
        ),
        MarketDay(
            market_id=11,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=12,
            hour_start=time(14, 0, 0),
            hour_end=time(16, 30, 0),
            day_of_week=3,
        ),
        MarketDay(
            market_id=13,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=4,
        ),
        MarketDay(
            market_id=13,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0,
        ),
        MarketDay(
            market_id=14,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3,
        ),
        MarketDay(
            market_id=15,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=2,
        ),
        MarketDay(
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=1,
        ),
        MarketDay(
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=2,
        ),
        MarketDay(
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=3,
        ),
        MarketDay(
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=4,
        ),
        MarketDay(
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=5,
        ),
        MarketDay(
            market_id=16,
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=17,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=4,
        ),
        MarketDay(
            market_id=18,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=2,
        ),
        MarketDay(
            market_id=18,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=19,
            hour_start=time(8, 0, 0),
            hour_end=time(17, 0, 0),
            day_of_week=2,
        ),
        MarketDay(
            market_id=20,
            hour_start=time(10, 00, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=21,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4,
        ),
        MarketDay(
            market_id=22,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=5,
        ),
        MarketDay(
            market_id=23,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=24,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=5,
        ),
        MarketDay(
            market_id=25,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=26,
            hour_start=time(8, 30, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4,
        ),
        MarketDay(
            market_id=27,
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=28,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3,
        ),
        MarketDay(
            market_id=29,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4,
        ),
        MarketDay(
            market_id=30,
            hour_start=time(9, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3,
        ),
        MarketDay(
            market_id=31,
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=3,
        ),
        MarketDay(
            market_id=31,
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=4,
        ),
        MarketDay(
            market_id=31,
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=5,
        ),
        MarketDay(
            market_id=31,
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=31,
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=0,
        ),
        MarketDay(
            market_id=32,
            hour_start=time(8, 0, 0),
            hour_end=time(10, 00, 0),
            day_of_week=3,
        ),
        MarketDay(
            market_id=33,
            hour_start=time(9, 30, 0),
            hour_end=time(15, 0, 0),
            day_of_week=3,
        ),
        MarketDay(
            market_id=34,
            hour_start=time(9, 30, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0,
        ),
        MarketDay(
            market_id=35,
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=0,
        ),
        MarketDay(
            market_id=36,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=3,
        ),
        MarketDay(
            market_id=36,
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=37,
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week=4,
        ),
        MarketDay(
            market_id=37,
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=38,
            hour_start=time(10, 30, 0),
            hour_end=time(15, 30, 0),
            day_of_week=0,
        ),
        MarketDay(
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=1,
        ),
        MarketDay(
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=3,
        ),
        MarketDay(
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=5,
        ),
        MarketDay(
            market_id=39,
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week=6,
        ),
        MarketDay(
            market_id=40,
            hour_start=time(16, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week=4,
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


    for i in range(150):
        name = f"{fake.first_name_nonbinary()}'s {choice(companies)}"
        city = str(fake.city())
        state = str(choice(states_ne))
        product = str(randint(1, 23))
        bio = str(fake.paragraph(nb_sentences=rev_len))
        image = str(choice(images))

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
    
    # user for demo
    user_demo = User(
        email="hamging@gingham.nyc",
        password="lol",
        first_name="Ham-man",
        last_name="Gingy",
        phone="2095553880",
        address_1="11 Broadway",
        address_2="Floor 2",
        city="New York",
        state="NY",
        zipcode="10004"
    )
    db.session.add(user_demo)
    db.session.commit()

    # add fake users
    users = []
    states = [ 'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FM', 'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY' ];
    apartment = ['Apt', 'Suite', 'Floor', 'Building']

    for i in range(50):
        email = fake.ascii_free_email()
        # password = fake.password()
        password = "lol"
        first_name = fake.first_name()
        last_name = fake.last_name()
        phone = str(randint(1000000000,9999999999))
        address_1 = fake.street_address()
        address_2 = f'{choice(apartment)} {randint(1, 200)}'
        city = fake.city()
        state = choice(states)
        zipcode = fake.postcode()

        u = User(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            address_1=address_1,
            address_2=address_2,
            city=city,
            state=state,
            zipcode=zipcode
        )
        users.append(u)

    db.session.add_all(users)
    db.session.commit()

    # add fake market reviews
    market_revs = []
    reported = (False, False, False, False, False, False, False, False, False, True)
    for i in range(200):
        rev_len = randint(2, 5)

        review_text = str(fake.paragraph(nb_sentences=rev_len))
        market_id = str(randint(1, 40))
        user_id = str(randint(1, 50))
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
    for i in range(200):
        rev_len = randint(2, 5)

        review_text = fake.paragraph(nb_sentences=rev_len)
        vendor_id = str(randint(1, 150))
        user_id = str(randint(1, 50))
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
    for i in range(200):
        market_id = randint(1, 40)
        user_id = randint(1, 50)

        mf = MarketFavorite(
            market_id=market_id,
            user_id=user_id,
        )
        market_favs.append(mf)

    db.session.add_all(market_favs)
    db.session.commit()

    vendor_favs = []
    for i in range(400):
        vendor_id = randint(1, 151)
        user_id = randint(1, 50)

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
    for i in range(50):
        email = fake.ascii_free_email()
        # password = fake.password()
        password = "lol"
        first_name = fake.first_name()
        last_name = fake.last_name()
        # phone = fake.phone_number()
        phone = str(randint(1000000000,9999999999))
        vendor_id = str(randint(1, 150))
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
    for i in range(500):
        vendor_id = str(randint(1, 150))
        market_day_id = str(randint(1, 57))

        vm = VendorMarket(
            vendor_id=vendor_id,
            market_day_id=market_day_id
        )
        vendor_markets.append(vm)

    db.session.add_all(vendor_markets)
    db.session.commit()


    baskets = []
    for i in range(2000):
        rand_user = [None, randint(1, 50)]
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

    #  Events
    events = []
    
    last_month = randint(0, 4)
    few_days = 14
    date_start = (datetime.now() - timedelta(days=last_month)).date()
    date_end = date_start + timedelta(days=few_days)

    holiday = Event(
        title="Holiday Market",
        message=fake.paragraph(nb_sentences=5),
        market_id=1,
        start_date=date_start,
        end_date=date_end
    )
    events.append(holiday)
    
    special = Event(
        title="Weekly Special",
        message=fake.paragraph(nb_sentences=4),
        vendor_id=1,
        start_date=date_start,
        end_date=date_end
    )
    events.append(special)

    for i in range(100):
        heading = randint(1, 2)
        msg_len = randint(2, 5)
        rand_market = choice([None, randint(1, 40)])
        if rand_market is None:
            rand_vendor = randint(1, 150)
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
        
        ev = Event(
            title=title,
            message=message,
            market_id=market_id,
            vendor_id=vendor_id,
            start_date=start_date,
            end_date=end_date
        )
        events.append(ev)

    db.session.add_all(events)
    db.session.commit()

    user_notifs = []

    unm = UserNotification(
            message=fake.paragraph(nb_sentences=1),
            user_id=1,
            market_id=1,
            is_read=False
        )
    unv = UserNotification(
            message=fake.paragraph(nb_sentences=2),
            user_id=1,
            vendor_id=1,
            is_read=False
        )
    
    user_notifs.append(unm)
    user_notifs.append(unv)

    for i in range(200):
        msg_len = randint(1, 2)
        rand_market = choice([None, randint(1, 40)])
        if rand_market is None:
            rand_vendor = randint(1, 150)
        else:
            rand_vendor = None
        few_days = randint(0, 14)

        message = fake.paragraph(nb_sentences=msg_len)
        user_id = randint(1, 51)
        market_id = rand_market
        vendor_id = rand_vendor
        created_at = datetime.now(timezone.utc) - timedelta(days=few_days)
        is_read = bool(False)

        
        un = UserNotification(
            message=message,
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

    
if __name__ == '__main__':
    with app.app_context():
        run()