from app import app
from faker import Faker
from random import random, choice, randint
from models import db, User, Market, Vendor, MarketReview, VendorReview, MarketFavorite, VendorFavorite, VendorMarket, VendorUser, AdminUser, Basket, bcrypt
import json
from datetime import date, time

fake = Faker()

def run():
    User.query.delete()
    Market.query.delete()
    Vendor.query.delete()
    MarketReview.query.delete()
    VendorReview.query.delete()
    MarketFavorite.query.delete()
    VendorFavorite.query.delete()
    VendorMarket.query.delete()
    VendorUser.query.delete()
    AdminUser.query.delete()
    Basket.query.delete()

    db.session.commit()

    markets = [
        Market(
            name='175th Street Greenmarket',
            location='W. 175th St. bet. Wadsworth Ave. & Broadway',
            zipcode='10033',
            coordinates={"lat": "40.84607450953993", "lng": "-73.93808039940272"},
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week='Thursdayrsday',
            year_round=False,
            season_start=date(2024, 6, 27),
            season_end=date(2024, 11, 21)
        ),
        Market(
            name='57th Street Greenmarket',
            location='W. 57th St. & 10th Ave.',
            zipcode='10019',
            coordinates={"lat": "40.769140743893075", "lng": "-73.98836576430834"},
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Saturday',
            year_round=False,
            season_start=date(2024, 6, 1),
            season_end=date(2024, 11, 23)
        ),
        Market(
            name='79th Street Greenmarket',
            location='79th St. & Columbus Ave.',
            zipcode='10024',
            coordinates={"lat": "40.782040858828", "lng": "-73.9759752811397"},
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week='Sunday',
            year_round=True
        ),
        Market(
            name='82nd Street Greenmarket',
            location=' 82nd St. bet. 1st & York Aves.',
            zipcode='10028',
            coordinates={"lat": "40.77397099020891", "lng": "-73.95064361322936"},
            hour_start=time(9, 0, 0),
            hour_end=time(14, 30, 0),
            day_of_week='Saturday',
            year_round=True
        ),
        Market(
            name='94th Street Greenmarket',
            location='E. 94th St. & 1st Ave.',
            zipcode='10128',
            coordinates={"lat": "40.78180268440337", "lng": "-73.94555998335593"},
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week='Sunday',
            year_round=False,
            season_start=date(2024, 6, 18),
            season_end=date(2024, 11, 19)
        ),
        Market(
            name='97th Street Greenmarket',
            location='W. 97th St. bet. Columbus & Amsterdam Aves.',
            zipcode='10025',
            coordinates={"lat": "40.79433392796688", "lng": "-73.96852339557134"},
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week='Friday',
            year_round=True
        ),
        Market(
            name='Abingdon Square Greenmarket',
            location='Hudson St. & W. 12th St.',
            zipcode='10014',
            coordinates={"lat": "40.737268845844085", "lng": "-74.00531736212757"},
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week='Saturday',
            year_round=True
        ),
        Market(
            name='Astor Place Greenmarket',
            location='E. 8th St. & Lafayette St.',
            zipcode='10003',
            coordinates={"lat": "40.729830818573944", "lng": "-73.99109568735417"},
            hour_start=time(8, 0, 0),
            hour_end=time(17, 0, 0),
            day_of_week='Tuesday',
            year_round=False,
            season_start=date(2024, 6, 4),
            season_end=date(2024, 11, 26)
        ),
        Market(
            name='Bowling Green Greenmarket',
            location='Broadway & Battery Pl.',
            zipcode='10004',
            coordinates={"lat": "40.704724320402526", "lng": "-74.01342009247573"},
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week='Tuesday',
            year_round=False,
            season_start=date(2024, 4, 16),
            season_end=date(2024, 11, 26)
        ),
        Market(
            name='Bowling Green Greenmarket',
            location='Broadway & Battery Pl.',
            zipcode='10004',
            coordinates={"lat": "40.704724320402526", "lng": "-74.01342009247573"},
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week='Thursday',
            year_round=False,
            season_start=date(2024, 6, 13),
            season_end=date(2024, 11, 28)
        ),
        Market(
            name='Bro Sis Green Youth Market',
            location='Amsterdam Ave. bet. W. 143rd & 144th Sts. (Johnny Hartman Plaza)',
            zipcode='10031',
            coordinates={"lat": "40.824268847996954", "lng": "-73.94880767347686"},
            hour_start=time(10, 30, 0),
            hour_end=time(18, 0, 0),
            day_of_week='Wednesday',
            year_round=False,
            season_start=date(2024, 7, 8),
            season_end=date(2024, 11, 25)
        ),
        Market(
            name="Chelsea’s Down to Earth Farmers Market",
            location='W. 23rd St. bet. 8th & 9th Aves.',
            zipcode='10011',
            coordinates={"lat": "40.74610601822501", "lng": "-74.00012495281699"},
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week='Saturday',
            year_round=False,
            season_start=date(2024, 4, 20),
            season_end=date(2024, 12, 21)
        ),
        Market(
            name="Children’s Aid Go!Healthy Food Box + Farmstand - Milbank Center",
            location='14-32 W. 118th St.',
            zipcode='10026',
            coordinates={"lat": "40.80245205041825", "lng": "-73.94675905810875"},
            hour_start=time(14, 0, 0),
            hour_end=time(16, 30, 0),
            day_of_week='Wednesday',
            year_round=False,
            season_start=date(2024, 7, 10),
            season_end=date(2024, 11, 20)
        ),
        Market(
            name='Columbia Greenmarket',
            location='Broadway & 114th St.',
            zipcode='10025',
            coordinates={"lat": "40.80711550674964", "lng": "-73.9643334908912"},
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week='Thursday',
            year_round=True
        ),
        Market(
            name='Columbia Greenmarket',
            location='Broadway & 114th St.',
            zipcode='10025',
            coordinates={"lat": "40.80711550674964", "lng": "-73.9643334908912"},
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week='Sunday',
            year_round=True
        ),
        Market(
            name='Dag Hammarskjold Greenmarket',
            location='E. 47th St. & 2nd Ave.',
            zipcode='10017',
            coordinates={"lat": "40.752106980482026", "lng": "-73.96813449641382"},
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Wednesday',
            year_round=True
        ),
        Market(
            name='Fort Washington Greenmarket',
            location='W. 168th St. & Ft. Washington Ave.',
            zipcode='10032',
            coordinates={"lat": "40.842308310821956", "lng": "-73.94211665674466"},
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week='Tuesday',
            year_round=False,
            season_start=date(2024, 6, 4),
            season_end=date(2024, 11, 26)
        ),
        Market(
            name='Fulton Stall Market (Indoor Farmers Market)',
            location='91 South St.',
            zipcode='10038',
            coordinates={"lat": "40.70614940342313", "lng": "-74.00349962702734"},
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week='Monday',
            year_round=True
        ),
        Market(
            name='Fulton Stall Market (Indoor Farmers Market)',
            location='91 South St.',
            zipcode='10038',
            coordinates={"lat": "40.70614940342313", "lng": "-74.00349962702734"},
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week='Tuesday',
            year_round=True
        ),
        Market(
            name='Fulton Stall Market (Indoor Farmers Market)',
            location='91 South St.',
            zipcode='10038',
            coordinates={"lat": "40.70614940342313", "lng": "-74.00349962702734"},
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week='Wednesday',
            year_round=True
        ),
        Market(
            name='Fulton Stall Market (Indoor Farmers Market)',
            location='91 South St.',
            zipcode='10038',
            coordinates={"lat": "40.70614940342313", "lng": "-74.00349962702734"},
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week='Thursday',
            year_round=True
        ),
        Market(
            name='Fulton Stall Market (Indoor Farmers Market)',
            location='91 South St.',
            zipcode='10038',
            coordinates={"lat": "40.70614940342313", "lng": "-74.00349962702734"},
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week='Friday',
            year_round=True
        ),
        Market(
            name='Fulton Stall Market (Indoor Farmers Market)',
            location='91 South St.',
            zipcode='10038',
            coordinates={"lat": "40.70614940342313", "lng": "-74.00349962702734"},
            hour_start=time(11, 30, 0),
            hour_end=time(17, 0, 0),
            day_of_week='Saturday',
            year_round=True
        ),
        Market(
            name='Gouverneur Health Farmstand',
            location='Madison St. bet. Clinton & Jefferson Sts.',
            zipcode='10002',
            coordinates={"lat": "40.71266393582476", "lng": "-73.98847487671178"},
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week='Thursday',
            year_round=False,
            season_start=date(2024, 7, 5),
            season_end=date(2024, 11, 22)
        ),
        Market(
            name='Grass Roots Farmers Market',
            location='W. 145th St. bet. Edgecombe & Bradhurst Aves. (Jackie Robinson Park)',
            zipcode='10039',
            coordinates={"lat": "40.82373611412579", "lng": "-73.9435495760123"},
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week='Tuesday',
            year_round=False
        ),
        Market(
            name='Grass Roots Farmers Market',
            location='W. 145th St. bet. Edgecombe & Bradhurst Aves. (Jackie Robinson Park)',
            zipcode='10039',
            coordinates={"lat": "40.82373611412579", "lng": "-73.9435495760123"},
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week='Saturday',
            year_round=False
        ),
        Market(
            name='Greenmarket at the Oculus',
            location='Church & Fulton Sts. (Oculus Plaza)',
            zipcode='10006',
            coordinates={"lat": "40.71142490993184", "lng": "-74.01076962766949"},
            hour_start=time(8, 0, 0),
            hour_end=time(17, 0, 0),
            day_of_week='Tuesday',
            year_round=False,
            season_start=date(2024, 6, 18),
            season_end=date(2024, 10, 29)
        ),
        Market(
            name='Harlem Meer Farmstand',
            location='Central Park N. & Malcom X Blvd.',
            zipcode='10026',
            coordinates={"lat": "40.79815888129796", "lng": "-73.95254032492262"},
            hour_start=time(10, 00, 0),
            hour_end=time(14, 0, 0),
            day_of_week='Saturday',
            year_round=False,
            season_start=date(2024, 7, 20),
            season_end=date(2024, 11, 30)
        ),
        Market(
            name='Harvest Home East Harlem Farmers Market',
            location='E. 104th St. & 3rd Ave.',
            zipcode='10029',
            coordinates={"lat": "40.79001677902627", "lng": "-73.94559282721028"},
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Thursday',
            year_round=False,
            season_start=date(2024, 6, 13),
            season_end=date(2024, 11, 14)
        ),
        Market(
            name='Harvest Home Harlem Hospital Farmers Market',
            location='W. 137th St. & Lenox Ave.',
            zipcode='10030',
            coordinates={"lat": "40.81542139191092", "lng": "-73.93994201397497"},
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Friday',
            year_round=False,
            season_start=date(2024, 6, 14),
            season_end=date(2024, 11, 15)
        ),
        Market(
            name='Harvest Home Lenox Avenue Farm Stand',
            location='Lenox Ave. bet. W. 117th & 118th Sts.',
            zipcode='10026',
            coordinates={"lat": "40.80272354850676", "lng": "-73.94895981440956"},
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Saturday',
            year_round=False,
            season_start=date(2024, 6, 22),
            season_end=date(2024, 11, 16)
        ),
        Market(
            name='Harvest Home Metropolitan Hospital Farmers Market',
            location='97th St. & 2nd Ave.',
            zipcode='10029',
            coordinates={"lat": "40.784947665352576", "lng": "-73.94660106093569"},
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Friday',
            year_round=False,
            season_start=date(2024, 6, 14),
            season_end=date(2024, 11, 15)
        ),
        Market(
            name='Inwood Park Greenmarket',
            location='Isham St. bet. Seaman Ave. & Cooper St.',
            zipcode='10034',
            coordinates={"lat": "40.86911825882977", "lng": "-73.92025906885881"},
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Saturday',
            year_round=True
        ),
        Market(
            name='Lower East Side Farmstand',
            location='Grand St. bet. Pitt & Willett Sts. (outside of Abrons Arts Center)',
            zipcode='10002',
            coordinates={"lat": "40.715117290409026", "lng": "-73.98348650666313"},
            hour_start=time(8, 30, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Thursday',
            year_round=False,
            season_start=date(2024, 7, 5),
            season_end=date(2024, 11, 22)
        ),
        Market(
            name='Morningside Park’s Down to Earth Farmers Market',
            location='W. 110th St. & Manhattan Ave.',
            zipcode='10026',
            coordinates={"lat": "40.801382884379336", "lng": "-73.95970142371496"},
            hour_start=time(9, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week='Saturday',
            year_round=True
        ),
        Market(
            name='Mount Sinai Greenmarket',
            location='Madison Ave. & 99th St.',
            zipcode='10029',
            coordinates={"lat": "40.78944510836953", "lng": "-73.95271330705022"},
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Wednesday',
            year_round=False,
            season_start=date(2024, 6, 19),
            season_end=date(2024, 11, 27)
        ),
        Market(
            name='NYP Youth Market - Audoban',
            location='21 Audoban Ave.',
            zipcode='10032',
            coordinates={"lat": "40.839630140355446", "lng": "-73.93889062898364"},
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Thursday',
            year_round=False
        ),
        Market(
            name='NYP Youth Market - Broadway',
            location='4781-4783 Broadway',
            zipcode='10034',
            coordinates={"lat": "40.86600006214813", "lng": "-73.9263264427691"},
            hour_start=time(9, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Wednesday',
            year_round=False
        ),
        Market(
            name='Project EATS Farm Stand at Essex Crossing',
            location='115 Delancey St.',
            zipcode='10002',
            coordinates={"lat": "40.718268229915765", "lng": "-73.98822774526953"},
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week='Wednesday',
            year_round=False
        ),
        Market(
            name='Project EATS Farm Stand at Essex Crossing',
            location='115 Delancey St.',
            zipcode='10002',
            coordinates={"lat": "40.718268229915765", "lng": "-73.98822774526953"},
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week='Thursday',
            year_round=False
        ),
        Market(
            name='Project EATS Farm Stand at Essex Crossing',
            location='115 Delancey St.',
            zipcode='10002',
            coordinates={"lat": "40.718268229915765", "lng": "-73.98822774526953"},
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week='Friday',
            year_round=False
        ),
        Market(
            name='Project EATS Farm Stand at Essex Crossing',
            location='115 Delancey St.',
            zipcode='10002',
            coordinates={"lat": "40.718268229915765", "lng": "-73.98822774526953"},
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week='Saturday',
            year_round=False
        ),
        Market(
            name='Project EATS Farm Stand at Essex Crossing',
            location='115 Delancey St.',
            zipcode='10002',
            coordinates={"lat": "40.718268229915765", "lng": "-73.98822774526953"},
            hour_start=time(11, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week='Sunday',
            year_round=False
        ),
        Market(
            name='P.S. 11 Farm Market',
            location='320 W. 21st St.',
            zipcode='10011',
            coordinates={"lat": "40.74443551076143", "lng": "-74.00056543152783"},
            hour_start=time(8, 0, 0),
            hour_end=time(10, 00, 0),
            day_of_week='Wednesday',
            year_round=False,
            season_start=date(2024, 6, 11),
            season_end=date(2024, 11, 12)
        ),
        Market(
            name='P.S. 57 Farmstand',
            location='115th St. & 3rd Ave. (SW corner)',
            zipcode='10029',
            coordinates={"lat": "40.797300330819134", "lng": "-73.94074817230118"},
            hour_start=time(9, 30, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Wednesday',
            year_round=True
        ),
        Market(
            name='Stuyvesant Town Greenmarket',
            location='South end of Stuyvesant Town Oval',
            zipcode='10009',
            coordinates={"lat": "40.73200566470982", "lng": "-73.97761240821589"},
            hour_start=time(9, 30, 0),
            hour_end=time(16, 0, 0),
            day_of_week='Sunday',
            year_round=False,
            season_start=date(2024, 5, 12),
            season_end=date(2024, 12, 15)
        ),
        Market(
            name='Tompkins Square Greenmarket',
            location='E. 7th St. & Avenue A',
            zipcode='10003',
            coordinates={"lat": "40.72606737678102", "lng": "-73.98333751481684"},
            hour_start=time(9, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week='Sunday',
            year_round=True
        ),
        Market(
            name='Tribeca Greenmarket',
            location='Greenwich & Chambers Sts.',
            zipcode='10013',
            coordinates={"lat": "40.71690089948348", "lng": "-74.01090464424209"},
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week='Wednesday',
            year_round=False,
            season_start=date(2024, 4, 17),
            season_end=date(2024, 11, 27)
        ),
        Market(
            name='Tribeca Greenmarket',
            location='Greenwich & Chambers Sts.',
            zipcode='10013',
            coordinates={"lat": "40.71690089948348", "lng": "-74.01090464424209"},
            hour_start=time(8, 0, 0),
            hour_end=time(14, 0, 0),
            day_of_week='Saturday',
            year_round=True
        ),
        Market(
            name='Tucker Square Greenmarket',
            location='Columbus Ave. & 66th St.',
            zipcode='10023',
            coordinates={"lat": "40.77367979894632", "lng": "-73.9819555713842"},
            hour_start=time(8, 0, 0),
            hour_end=time(15, 0, 0),
            day_of_week='Thursday',
            year_round=True
        ),
        Market(
            name='Tucker Square Greenmarket',
            location='Columbus Ave. & 66th St.',
            zipcode='10023',
            coordinates={"lat": "40.77367979894632", "lng": "-73.9819555713842"},
            hour_start=time(8, 0, 0),
            hour_end=time(16, 0, 0),
            day_of_week='Saturday',
            year_round=True
        ),
        Market(
            name='Two Bridges Youth Market',
            location='50 Madison St.',
            zipcode='10010',
            coordinates={"lat": "40.86600289682479", "lng": "-73.92633729986045"},
            hour_start=time(10, 30, 0),
            hour_end=time(15, 30, 0),
            day_of_week='Sunday',
            year_round=False,
            season_start=date(2024, 5, 26),
            season_end=date(2024, 12, 15)
        ),
        Market(
            name='Union Square Greenmarket',
            location='E. 17th St. & Union Square W.',
            zipcode='10003',
            coordinates={"lat": "40.736358642578125", "lng": "-73.99076080322266"},
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week='Monday',
            year_round=True
        ),
        Market(
            name='Union Square Greenmarket',
            location='E. 17th St. & Union Square W.',
            zipcode='10003',
            coordinates={"lat": "40.736358642578125", "lng": "-73.99076080322266"},
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week='Wednesday',
            year_round=True
        ),
        Market(
            name='Union Square Greenmarket',
            location='E. 17th St. & Union Square W.',
            zipcode='10003',
            coordinates={"lat": "40.736358642578125", "lng": "-73.99076080322266"},
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week='Friday',
            year_round=True
        ),
        Market(
            name='Union Square Greenmarket',
            location='E. 17th St. & Union Square W.',
            zipcode='10003',
            coordinates={"lat": "40.736358642578125", "lng": "-73.99076080322266"},
            hour_start=time(8, 0, 0),
            hour_end=time(18, 0, 0),
            day_of_week='Saturday',
            year_round=True
        ),
        Market(
            name='Uptown Good Food Farm Stand',
            location='330 St. Nicholas Ave. (St. Nicholas Miracle Garden)',
            zipcode='10027',
            coordinates={"lat": "40.811760800653175", "lng": "-73.95159181329969"},
            hour_start=time(16, 0, 0),
            hour_end=time(19, 0, 0),
            day_of_week='Thursday',
            year_round=False,
            season_start=date(2024, 6, 1),
            season_end=date(2024, 11, 23)
        )
    ]
    db.session.add_all(markets)
    db.session.commit()


    vendors = []
    products = ['Art', 'Baked Goods', 'Cheese', 'Cider', 'Ceramics', 'Coffee/Tea', 'Fish', 'Flowers', 'Fruit', 'Gifts', 'Honey', 'International', 'Juice', 'Maple Syrup', 'Meats', 'Mushrooms', 'Nuts', 'Pasta', 'Pickles', 'Spirits', 'Vegetables']
    companies = ['Goods', 'Produce', 'Farms', 'Organics', 'and Son', 'and Daughter', 'Market', 'Apothecary', 'Orchard']
    states = ['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT']
    images = [
        'https://www.opkansas.org/wp-content/uploads/2019/06/opfm-vendor-web2.jpg',
        'https://static.wixstatic.com/media/05bd2f_2b30b89b49eb4b2e95810360a9357bd2~mv2_d_7360_4912_s_4_2.jpeg/v1/fill/w_640,h_434,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/05bd2f_2b30b89b49eb4b2e95810360a9357bd2~mv2_d_7360_4912_s_4_2.jpeg',
        'https://www.merriam.org/files/sharedassets/public/v/1/1.-photos/parks/farmers-market-1.jpg?dimension=pageimage&w=480',
        'https://c8.alamy.com/comp/2R82FT1/st-jacobs-farmers-market-fruit-and-vegetable-vendors-ontario-canada-2R82FT1.jpg',
        'https://www.fairburn.com/sites/default/files/uploads/ParksAndRecreation/document_2.jpg',
        'https://www.lanecountyfarmersmarket.org/wp-content/uploads/2022/02/Vendor-Slider-3-scaled.jpg',
        'https://frontierefarmhouse.wordpress.com/wp-content/uploads/2019/09/66422240_2392773677468030_9162452177778638848_o.jpg?w=1024',
        'https://cdn.vox-cdn.com/Thursdaymbor/K7pJk3lLSH60zEbktRL0AQ-jNfA=/0x0:4500x2994/1200x900/filters:focal(1890x1137:2610x1857)/cdn.vox-cdn.com/uploads/chorus_image/image/65219436/6329735393_3a905a118a_o.0.jpg',
        'https://dims.apnews.com/dims4/default/92713da/2147483647/strip/true/crop/5919x3946+0+0/resize/599x399!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Faf%2F66%2F8e201f3644029f81124542a80a6b%2F128f5a1ca1754f77b141d34c6a199894',
        'https://i2.pickpik.com/photos/363/418/522/market-stand-vegetables-market-stall-preview.jpg',
        'https://freerangestock.com/sample/161930/fresh-fruit-assortment-on-a-market-stall.jpg',
        'https://live.staticflickr.com/1450/24575912061_08b77ec267_b.jpg',
        'https://cdn12.picryl.com/photo/2016/12/31/market-market-stall-seller-food-drink-29aa05-1024.jpg',
        'https://islandinthenet.com/wp-content/uploads/2020/06/Fujifilm_X-T2_20200607_DSCF3839_blog.jpg',
        'https://images.squarespace-cdn.com/content/v1/51e5766be4b05a1c36b7f6d2/1629745183504-2SQ6R20JGVU0GUZPH5WV/Michael_Greenmarket-1.jpg',
        'https://live.staticflickr.com/1039/1095728401_01526e79b1_b.jpg',
        'https://live.staticflickr.com/8172/8045956113_b76fd52b44_b.jpg',
        'https://upload.wikimedia.org/wikipedia/comMondays/f/f0/Mushroom_stand_at_the_Campbell_farmers%27_market.gk.jpg',
        'https://live.staticflickr.com/3369/3223915584_8caf5935aa_b.jpg',
        'https://upload.wikimedia.org/wikipedia/comMondays/d/d6/Ballard_Farmers%27_Market_-_flowers.jpg'
    ]
    for i in range(150):
        name = f"{fake.first_name_nonbinary()}'s {choice(companies)}"
        city = str(fake.city())
        state = str(choice(states))
        locations = str([randint(1, 57) for _ in range(randint(2, 3))])
        product = str(choice(products))
        image = str(choice(images))

        v = Vendor(
            name=name,
            city=city,
            state=state,
            locations=locations,
            product=product,
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
        address="11 Broadway New York, NY 10004",
    )
    db.session.add(user_demo)
    db.session.commit()

    # add fake users
    users = []
    for i in range(50):
        email = fake.ascii_free_email()
        password = fake.password()
        first_name = fake.first_name()
        last_name = fake.last_name()
        address = fake.address()

        u = User(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            address=address,
        )
        users.append(u)

    db.session.add_all(users)
    db.session.commit()

    # add fake market reviews
    market_revs = []
    for i in range(101):
        rev_len = randint(2, 5)

        review_text = str(fake.paragraph(nb_sentences=rev_len))
        market_id = str(randint(1, 40))
        user_id = str(randint(1, 50))

        mr = MarketReview(
            review_text=review_text,
            market_id=market_id,
            user_id=user_id,
        )
        market_revs.append(mr)

    db.session.add_all(market_revs)
    db.session.commit()

    # add fake vendor reviews
    vendor_revs = []
    for i in range(101):
        rev_len = randint(2, 5)

        review_text = fake.paragraph(nb_sentences=rev_len)
        vendor_id = str(randint(1, 40))
        user_id = str(randint(1, 50))

        vr = VendorReview(
            review_text=review_text,
            vendor_id=vendor_id,
            user_id=user_id,
        )
        vendor_revs.append(vr)

    db.session.add_all(vendor_revs)
    db.session.commit()

    # market_favs = []
    # for i in range(200):
    #     market_id = randint(1, 40)
    #     user_id = randint(1, 50)

    #     mf = MarketFavorite(
    #         market_id=market_id,
    #         user_id=user_id,
    #     )
    #     market_favs.append(mf)

    # db.session.add_all(market_favs)
    # db.session.commit()

    # vendor_favs = []
    # for i in range(900):
    #     vendor_id = randint(1, 151)
    #     user_id = randint(1, 50)

    #     vf = VendorFavorite(
    #         vendor_id=vendor_id,
    #         user_id=user_id,
    #     )
    #     vendor_favs.append(vf)

    # db.session.add_all(vendor_favs)
    # db.session.commit()

    # add fake vendor markets
    vendor_markets = []
    for i in range(500):

        vendor_id = str(randint(1, 150))
        market_id = str(randint(1, 57))

        vm = VendorMarket(
            vendor_id=vendor_id,
            market_id=market_id
        )
        vendor_markets.append(vm)

    db.session.add_all(vendor_markets)
    db.session.commit()


    # add fake users
    # user for demo
    vendor_user_demo = VendorUser(
        email="hello@gingham.nyc",
        password="lol",
        first_name="Ham-man",
        last_name="Gingy",
        phone="2095553880",
        vendor_id="1"
    )
    db.session.add(vendor_user_demo)
    db.session.commit()

    vendor_users = []
    for i in range(50):
        email = fake.ascii_free_email()
        password = fake.password()
        first_name = fake.first_name()
        last_name = fake.last_name()
        # phone = fake.phone_number()
        phone = str(randint(1000000000,9999999999))
        vendor_id = str(randint(1, 151))


        vu = VendorUser(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            vendor_id=vendor_id
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

    baskets = []
    for i in range(500):
        rand_user = [None, randint(1, 50)]

        vendor_id = str(randint(1, 151))
        market_id = str(randint(1, 57))
        sale_date = date.today()
        pickup_time = fake.time_object()
        user_id = choice(rand_user)
        is_sold = bool(fake.boolean())
        is_grabbed = bool(fake.boolean())

        bsk = Basket(
            vendor_id=vendor_id,
            market_id=market_id,
            sale_date=sale_date,
            pickup_time=pickup_time,
            user_id=user_id,
            is_sold=is_sold,
            is_grabbed=is_grabbed
        )
        baskets.append(bsk)

    db.session.add(baskets)
    db.session.commit()

    
if __name__ == '__main__':
    with app.app_context():
        run()
