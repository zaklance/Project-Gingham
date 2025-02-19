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
                    )
import json
from datetime import datetime, timedelta, timezone, time, date
import datetime as dt
from pytz import timezone

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
            is_current=True
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
            location='Amsterdam Ave. bet. W. 143rd & 144th Sts. (Johnny Hartman Plaza)',
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
            is_current=True
        ),
        Market(
            id=17,
            name='Gouverneur Health Farmstand',
            image='greenmarket-grownyc-768x512.jpeg',
            website="https://www.grownyc.org/farmstand/gouverneur",
            location='Madison St. bet. Clinton & Jefferson Sts.',
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
            location='Church & Fulton Sts. (Oculus Plaza)',
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
            location='Lenox Ave. bet. W. 117th & 118th Sts.',
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
            location='Grand St. bet. Pitt & Willett Sts. (outside of Abrons Arts Center)',
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
            location='Greenwich & Chambers Sts.',
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
            website="https://www.grownyc.org/greenmarket/manhattan-union-square-sa",
            location='E. 17th St. & Union Square W.',
            city="New York",
            state="NY",
            zipcode='10003',
            coordinates={"lat": "40.736358642578125", "lng": "-73.99076080322266"},
            schedule='Monday, Wednesday, Friday & Saturday (8 AM - 6 PM)',
            year_round=True,
            is_current=True
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

    for i in range(200):
        name = f"{fake.first_name_nonbinary()}'s {choice(companies)}"
        city = str(fake.city())
        state = str(choice(states_ne))
        products = sample(range(1, 34), randint(1, 3))
        bio = str(fake.paragraph(nb_sentences=rev_len))
        image = choice(images) if randint(1, 8) > 1 else None
        stripe_account_id = str(choice(test_stripe_account))

        v = Vendor(
            name=name,
            city=city,
            state=state,
            products=products,
            bio=bio,
            image=image,
            website='www.google.com/',
            stripe_account_id=stripe_account_id
        )
        vendors.append(v)

    db.session.add_all(vendors)
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
        city = fake.city()
        state = choice(states)
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

        su = SettingsUser(
            user_id=(i + 1)
        )
        users_settings.append(su)

    db.session.add_all(users)
    db.session.add_all(users_settings)
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
    user_settings_demo = SettingsUser(
        user_id=51
    )
    db.session.add(user_demo)
    db.session.add(user_settings_demo)
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
        vendor_id = str(randint(1, 200))
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
    for i in range(800):

        vendor_id = str(randint(1, 200))
        market_day_id = str(randint(1, 100))

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

        svu = SettingsVendor(
            vendor_user_id=(i + 1)
        )
        vendor_users_settings.append(svu)

    db.session.add_all(vendor_users)
    db.session.add_all(vendor_users_settings)
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
        vendor_role={1:0}
    )
    vendor_user_settings_demo = SettingsVendor(
        vendor_user_id=51
    )
    
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
    db.session.add(vendor_user_settings_demo)
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
        AdminUser(
            email="hello@mufo.nyc",
            password="lol",
            first_name="Hell",
            last_name="Oh",
            phone="+10000000000",
            admin_role=2
        ),
        SettingsAdmin(
            admin_id=5
        ),
    ]
    
    db.session.add_all(admin_user_demo)
    db.session.commit()

    baskets = []
    est = timezone('US/Eastern')  # Define the EST timezone.

    for i in range(3000):
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
                        This vegan butternut squash soup is the perfect fall comfort food! Store in the fridge for 4 days or freeze for months.
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
                    <ul class="ul-numbers">
                        <li>Heat oil in a large pot over medium heat. Add onion, salt, and pepper; sauté 5–8 mins. Add squash and cook 8–10 mins, stirring.</li>
                        <li>Add garlic, sage, rosemary, and ginger; cook 30 secs to 1 min until fragrant. Add 3 cups broth, bring to a boil, cover, and simmer 20–30 mins until squash is tender.</li>
                        <li>Cool slightly, blend until smooth (in batches if needed). Adjust thickness with more broth, season, and serve.</li>
                    </ul>
                    <article>
                        Enjoy this creamy, cozy soup!
                    </article>
                    <article>
                        —The Gingham Team
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
                        Do you love supporting local farmers, enjoying fresh produce, and finding great 
                        deals? Meet Gingham, the innovative platform that connects you with discounted 
                        baskets from farmers market vendors while helping reduce food waste.
                    </article>
                    <article>
                        Here’s how it works: Farmers market vendors often have surplus items at the end 
                        of the day. With Gingham, they bundle these items into discounted baskets for you 
                        to browse, reserve, and pick up at your convenience. Think of it as your personal 
                        gateway to fresh, local, and sustainable food.
                    </article>
                    <article>
                        Gingham isn’t just about savings—it’s about creating a positive impact. By 
                        purchasing a basket, you’re rescuing perfectly good food from going to waste, 
                        supporting local businesses, and embracing a more sustainable way of living. Plus, 
                        with fresh ingredients at your fingertips, you can enjoy cooking, meal prep, or 
                        even a spontaneous picnic with ease.
                    </article>
                    <article>
                        Signing up is quick and simple. Join the Gingham community today to start saving, 
                        reducing waste, and supporting your local farmers markets. Together, we can create 
                        a more sustainable future—one basket at a time!
                    </article>
                    <article>
                        —The Gingham Team
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
                        The world-famous Union Square Greenmarket began with just a few farmers in 1976, has grown 
                        exponentially; in peak season 140 regional farmers, fishers, and bakers sell their products 
                        to a dedicated legion of city dwellers. 
                    </article>
                    <article>
                        As Greenmarket's flagship market, the seasonal bounty is unparalleled, with hundreds of 
                        varieties to choose from during any given season. From just-picked fresh fruits and vegetables, 
                        to heritage meats and award-winning farmstead cheeses, artisan breads, jams, pickles, a profusion 
                        of cut flowers and plants, wine, ciders, maple syrup and much more. 
                    </article>
                    <article>
                        Located in one of New York City's great public spaces, the atmosphere at Union Square on a market 
                        day is electric: 60,000 market shoppers shop and chat with farmers; students of all ages tour the 
                        market and learn about seasonality; visitors watch and taste cooking demonstrations by some of 
                        New York's hottest local chefs. 
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