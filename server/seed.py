from app import app
from faker import Faker
from random import random, choice, randint
from models import db, User, Market, Vendor, MarketReview, VendorReview
import json

fake = Faker()

def run():
    Market.query.delete()
    Vendor.query.delete()
    User.query.delete()
    MarketReview.query.delete()
    VendorReview.query.delete()

    db.session.commit()

    markets = [
        Market(
            name='175th Street Greenmarket',
            location='W. 175th St. bet. Wadsworth Ave. & Broadway',
            zipcode='10033',
            hours='Thursday (8 a.m. - 4 p.m.)',
            year_round=False
        ),
        Market(
            name='57th Street Greenmarket',
            location='W. 57th St. & 10th Ave.',
            zipcode='10019',
            hours='Saturday (8 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='79th Street Greenmarket',
            location='79th St. & Columbus Ave.',
            zipcode='10024',
            hours='Sunday (9 a.m. - 4 p.m.)',
            year_round=True
        ),
        Market(
            name='82nd Street Greenmarket',
            location=' 82nd St. bet. 1st & York Aves.',
            zipcode='10028',
            hours='Saturday (9 a.m. - 2:30 p.m.)',
            year_round=True
        ),
        Market(
            name='94th Street Greenmarket',
            location='E. 94th St. & 1st Ave.',
            zipcode='10128',
            hours='Sunday (9 a.m. - 4 p.m.)',
            year_round=False
        ),
        Market(
            name='97th Street Greenmarket',
            location='W. 97th St. bet. Columbus & Amsterdam Aves.',
            zipcode='10025',
            hours='Friday (8 a.m. - 2 p.m.)',
            year_round=True
        ),
        Market(
            name='Abingdon Square Greenmarket',
            location='Hudson St. & W. 12th St.',
            zipcode='10014',
            hours='Saturday (8 a.m. - 2 p.m.)',
            year_round=True
        ),
        Market(
            name='Astor Place Greenmarket',
            location='E. 8th St. & Lafayette St.',
            zipcode='10003',
            hours='Tuesday (8 a.m. - 5 p.m.)',
            year_round=False
        ),
        Market(
            name='Bowling Green Greenmarket',
            location='Broadway & Battery Pl.',
            zipcode='10004',
            hours='Tuesday & Thursday (8 a.m. - 2 p.m.)',
            year_round=False
        ),
        Market(
            name='Bro Sis Green Youth Market',
            location='Amsterdam Ave. bet. W. 143rd & 144th Sts. (Johnny Hartman Plaza)',
            zipcode='10031',
            hours='Wednesday (10:30 a.m. - 6 p.m.)',
            year_round=False
        ),
        Market(
            name='Chelsea’s Down to Earth Farmers Market',
            location='W. 23rd St. bet. 8th & 9th Aves.',
            zipcode='10011',
            hours='Saturday (9 a.m. - 2 p.m.)',
            year_round=False
        ),
        Market(
            name='Children’s Aid Go!Healthy Food Box + Farmstand - Milbank Center',
            location='14-32 W. 118th St.',
            zipcode='10026',
            hours='Wednesday (2 - 4:30 p.m.)',
            year_round=False
        ),
        Market(
            name='Columbia Greenmarket',
            location='Broadway & 114th St.',
            zipcode='10025',
            hours='Thursday & Sunday (8 a.m. - 4 p.m.)',
            year_round=True
        ),
        Market(
            name='Dag Hammarskjold Greenmarket',
            location='E. 47th St. & 2nd Ave.',
            zipcode='10017',
            hours='Wednesday (8 a.m. - 3 p.m.)',
            year_round=True
        ),
        Market(
            name='Fort Washington Greenmarket',
            location='W. 168th St. & Ft. Washington Ave.',
            zipcode='10032',
            hours='Tuesday (8 a.m. - 4 p.m.)',
            year_round=False
        ),
        Market(
            name='Fulton Stall Market (Indoor Farmers Market)',
            location='91 South St.',
            zipcode='10038',
            hours='Monday - Saturday (11:30 a.m. - 5 p.m.)',
            year_round=True
        ),
        Market(
            name='Gouverneur Health Farmstand',
            location='Madison St. bet. Clinton & Jefferson Sts.',
            zipcode='10002',
            hours='Thursday (9 a.m. - 2 p.m.)',
            year_round=False
        ),
        Market(
            name='Grass Roots Farmers Market',
            location='W. 145th St. bet. Edgecombe & Bradhurst Aves. (Jackie Robinson Park)',
            zipcode='10039',
            hours='Tuesday & Saturday (9 a.m. - 4 p.m.)',
            year_round=False
        ),
        Market(
            name='Greenmarket at the Oculus',
            location='Church & Fulton Sts. (Oculus Plaza)',
            zipcode='10006',
            hours='Tuesday (8 a.m. - 5 p.m.)',
            year_round=False
        ),
        Market(
            name='Harlem Meer Farmstand',
            location='Central Park N. & Malcom X Blvd.',
            zipcode='10026',
            hours='Saturday (10 a.m. - 2 p.m.)',
            year_round=False
        ),
        Market(
            name='Harvest Home East Harlem Farmers Market',
            location='E. 104th St. & 3rd Ave.',
            zipcode='10029',
            hours='Thursday (8 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='Harvest Home Harlem Hospital Farmers Market',
            location='W. 137th St. & Lenox Ave.',
            zipcode='10030',
            hours='Friday (8 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='Harvest Home Lenox Avenue Farm Stand',
            location='Lenox Ave. bet. W. 117th & 118th Sts.',
            zipcode='10026',
            hours='Saturday (8 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='Harvest Home Metropolitan Hospital Farmers Market',
            location='97th St. & 2nd Ave.',
            zipcode='10029',
            hours='Friday (8 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='Inwood Park Greenmarket',
            location='Isham St. bet. Seaman Ave. & Cooper St.',
            zipcode='10034',
            hours='Saturday (8 a.m. - 3 p.m.)',
            year_round=True
        ),
        Market(
            name='Lower East Side Farmstand',
            location='Grand St. bet. Pitt & Willett Sts. (outside of Abrons Arts Center)',
            zipcode='10002',
            hours='Thursday (8:30 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='Morningside Park’s Down to Earth Farmers Market',
            location='W. 110th St. & Manhattan Ave.',
            zipcode='10026',
            hours='Saturday (9 a.m. - 2 p.m.)',
            year_round=True
        ),
        Market(
            name='Mount Sinai Greenmarket',
            location='Madison Ave. & 99th St.',
            zipcode='10029',
            hours='Wednesday (8 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='NYP Youth Market - Audoban',
            location='21 Audoban Ave.',
            zipcode='10032',
            hours='Thursday (9 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='NYP Youth Market - Broadway',
            location='4781-4783 Broadway',
            zipcode='10034',
            hours='Wednesday (9 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='Project EATS Farm Stand at Essex Crossing',
            location='115 Delancey St.',
            zipcode='10002',
            hours='Wednesday-Sunday (11 a.m. - 7 p.m.)',
            year_round=False
        ),
        Market(
            name='P.S. 11 Farm Market',
            location='320 W. 21st St.',
            zipcode='10011',
            hours='Wednesday (8 a.m. - 10 a.m.)',
            year_round=False
        ),
        Market(
            name='P.S. 57 Farmstand',
            location='115th St. & 3rd Ave. (SW corner)',
            zipcode='10029',
            hours='Wednesday (9:30 a.m. - 3 p.m.)',
            year_round=False
        ),
        Market(
            name='Stuyvesant Town Greenmarket',
            location='South end of Stuyvesant Town Oval',
            zipcode='10009',
            hours='Sunday (9:30 a.m. - 4 p.m.)',
            year_round=False
        ),
        Market(
            name='Tompkins Square Greenmarket',
            location='E. 7th St. & Avenue A',
            zipcode='10003',
            hours='Sunday (9 a.m. - 4 p.m.)',
            year_round=True
        ),
        Market(
            name='Tribeca Greenmarket',
            location='Greenwich & Chambers Sts.',
            zipcode='10013',
            hours='Wednesday & Saturday (8 a.m. - 2 p.m.)',
            year_round=False
        ),
        Market(
            name='Tucker Square Greenmarket',
            location='Columbus Ave. & 66th St.',
            zipcode='10023',
            hours='Thursday (8 a.m. - 3 p.m.); Saturday (8 a.m. - 4 p.m.)',
            year_round=True
        ),
        Market(
            name='Two Bridges Youth Market',
            location='50 Madison St.',
            zipcode='10010',
            hours='Sunday (10:30 a.m. - 3:30 p.m.)',
            year_round=False
        ),
        Market(
            name='Union Square Greenmarket',
            location='E. 17th St. & Union Square W.',
            zipcode='10003',
            hours='Monday, Wednesday, Friday & Saturday (8 a.m. - 6 p.m.)',
            year_round=True
        ),
        Market(
            name='Uptown Good Food Farm Stand',
            location='330 St. Nicholas Ave. (St. Nicholas Miracle Garden)',
            zipcode='10027',
            hours='Thursday (4 - 7 p.m.)',
            year_round=False
        )
    ]
    db.session.add_all(markets)
    db.session.commit()


    vendors = []
    products = ['art', 'baked goods', 'cheese', 'cider', 'ceramics', 'coffee/tea', 'fish', 'flowers', 'fruit', 'gifts', 'honey', 'international', 'juice', 'maple syrup', 'meats', 'mushrooms' 'nuts', 'pasta', 'pickles', 'spirits', 'vegetables']
    companies = ['Goods', 'Produce', 'Farms', 'Organics', 'and Son', 'and Daughter', 'Market', 'Apothecary', 'Orchard']
    states = ['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT']
    images = [
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJdUQVqfYHV6YWtlJYuNouSOjUqHSEetAGSg&s',
        'https://www.opkansas.org/wp-content/uploads/2019/06/opfm-vendor-web2.jpg',
        'https://static.wixstatic.com/media/05bd2f_2b30b89b49eb4b2e95810360a9357bd2~mv2_d_7360_4912_s_4_2.jpeg/v1/fill/w_640,h_434,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/05bd2f_2b30b89b49eb4b2e95810360a9357bd2~mv2_d_7360_4912_s_4_2.jpeg',
        'https://www.merriam.org/files/sharedassets/public/v/1/1.-photos/parks/farmers-market-1.jpg?dimension=pageimage&w=480',
        'https://c8.alamy.com/comp/2R82FT1/st-jacobs-farmers-market-fruit-and-vegetable-vendors-ontario-canada-2R82FT1.jpg',
        'https://www.fairburn.com/sites/default/files/uploads/ParksAndRecreation/document_2.jpg',
        'https://www.lanecountyfarmersmarket.org/wp-content/uploads/2022/02/Vendor-Slider-3-scaled.jpg',
        'https://frontierefarmhouse.wordpress.com/wp-content/uploads/2019/09/66422240_2392773677468030_9162452177778638848_o.jpg?w=1024',
        'https://cdn.vox-cdn.com/thumbor/K7pJk3lLSH60zEbktRL0AQ-jNfA=/0x0:4500x2994/1200x900/filters:focal(1890x1137:2610x1857)/cdn.vox-cdn.com/uploads/chorus_image/image/65219436/6329735393_3a905a118a_o.0.jpg',
        'https://dims.apnews.com/dims4/default/92713da/2147483647/strip/true/crop/5919x3946+0+0/resize/599x399!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Faf%2F66%2F8e201f3644029f81124542a80a6b%2F128f5a1ca1754f77b141d34c6a199894',
        'https://i2.pickpik.com/photos/363/418/522/market-stand-vegetables-market-stall-preview.jpg',
        'https://freerangestock.com/sample/161930/fresh-fruit-assortment-on-a-market-stall.jpg',
        'https://live.staticflickr.com/1450/24575912061_08b77ec267_b.jpg',
        'https://cdn12.picryl.com/photo/2016/12/31/market-market-stall-seller-food-drink-29aa05-1024.jpg',
        'https://islandinthenet.com/wp-content/uploads/2020/06/Fujifilm_X-T2_20200607_DSCF3839_blog.jpg',
        'https://images.squarespace-cdn.com/content/v1/51e5766be4b05a1c36b7f6d2/1629745183504-2SQ6R20JGVU0GUZPH5WV/Michael_Greenmarket-1.jpg',
        'https://live.staticflickr.com/1039/1095728401_01526e79b1_b.jpg',
        'https://live.staticflickr.com/8172/8045956113_b76fd52b44_b.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/f/f0/Mushroom_stand_at_the_Campbell_farmers%27_market.gk.jpg',
        'https://live.staticflickr.com/3369/3223915584_8caf5935aa_b.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/d/d6/Ballard_Farmers%27_Market_-_flowers.jpg'
    ]
    for i in range(151):
        name = f"{fake.first_name_nonbinary()}'s {choice(companies)}"
        based_out_of = f"{fake.city()}, {choice(states)}"
        locations = str([randint(1, 41) for _ in range(randint(1, 3))])
        product = str(choice(products))
        image = str(choice(images))

        v = Vendor(
            name=name,
            based_out_of=based_out_of,
            locations=locations,
            product=product,
            image=image
        )
        vendors.append(v)

    db.session.add_all(vendors)
    db.session.commit()

    # user for demo
    user_demo = User(
        username="hamging",
        _password="lol",
        first_name="Ham-man",
        last_name="Gingy",
        address="11 Broadway New York, NY 10004",
        email="ham-man69@proton.me",
        favorite_markets=str([randint(1, 41) for _ in range(randint(2, 4))]),
        favorite_vendors=str([randint(1, 151) for _ in range(randint(3, 9))])
    )
    db.session.add(user_demo)
    db.session.commit()

    # add fake users
    users = []
    for i in range(200):
        username = fake.user_name()
        _password = fake.user_name()
        first_name = fake.first_name()
        last_name = fake.last_name()
        address = fake.address()
        email = fake.ascii_free_email()
        favorite_markets = str([randint(1, 41) for _ in range(randint(2, 4))])
        favorite_vendors = str([randint(1, 151) for _ in range(randint(3, 9))])

        u = User(
            username=username,
            _password=_password,
            first_name=first_name,
            last_name=last_name,
            address=address,
            email=email,
            favorite_markets=favorite_markets,
            favorite_vendors=favorite_vendors
        )
        users.append(u)

    db.session.add_all(users)
    db.session.commit()


    market_revs = []
    for i in range(101):
        rev_len = randint(1, 3)

        review_text = str(fake.paragraph(nb_sentences=rev_len))
        market_id = str(randint(1, 41))
        user_id = str(randint(1, 201))

        mr = MarketReview(
            review_text=review_text,
            market_id=market_id,
            user_id=user_id,
        )
        market_revs.append(mr)

    db.session.add_all(market_revs)
    db.session.commit()


    vendor_revs = []
    for i in range(101):
        rev_len = randint(1, 3)

        review_text = fake.paragraph(nb_sentences=rev_len)
        vendor_id = str(randint(1, 41))
        user_id = str(randint(1, 201))

        vr = VendorReview(
            review_text=review_text,
            vendor_id=vendor_id,
            user_id=user_id,
        )
        vendor_revs.append(vr)

    db.session.add_all(vendor_revs)
    db.session.commit()

    
if __name__ == '__main__':
    with app.app_context():
        run()
