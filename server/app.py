import os
import json
import smtplib
from flask import Flask, request, jsonify, session
from models import db, User, Market, Vendor, VendorUser, MarketReview, VendorReview, MarketFavorite, VendorFavorite, VendorMarket, VendorVendorUser, bcrypt
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URI']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = os.environ['SECRET_KEY']

db.init_app(app)
Migrate(app, db)
CORS(app, supports_credentials=True)

jwt = JWTManager(app)

@app.route('/', methods=['GET'])
def homepage():
    return {"message": "Welcome to the homepage!"}, 200

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter(User.email == data['email']).first()
    if not user:
        return {'error': 'login failed'}, 401
    
    if not user.authenticate(data['password']):
        return {'error': 'login failed'}, 401
    
    access_token = create_access_token(identity=user.id, expires_delta=timedelta(hours=12))
    
    return jsonify(access_token=access_token, user_id=user.id), 200

# VENDOR PORTAL
@app.route('/vendor/login', methods=['POST'])
def vendorLogin():
    data = request.get_json()
    vendorUser = VendorUser.query.filter(VendorUser.email == data['email']).first()
    if not vendorUser:
        return {'error': 'login failed'}, 401
    
    if not vendorUser.authenticate(data['password']):
        return {'error': 'login failed'}, 401
    
    access_token = create_access_token(identity=vendorUser.id, expires_delta=timedelta(hours=12))

    return jsonify(access_token=access_token, vendor_user_id=vendorUser.id), 200

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    try:
        user = User.query.filter(User.email == data['email']).first()
        if user:
            return {'error': 'email already exists'}, 400
        
        new_user = User(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            address=data.get('address')
        )

        db.session.add(new_user)
        db.session.commit()

        return new_user.to_dict(), 201

    except IntegrityError as e:
        db.session.rollback()
        return {'error': f'IntegrityError: {str(e)}'}, 400 

    except ValueError as e:
        return {'error': f'ValueError: {str(e)}'}, 400

    except Exception as e:
        return {'error': f'Exception: {str(e)}'}, 500

@app.route('/vendorsignup', methods=['POST'])
def vendorsignup():
    data = request.get_json()

    try:
        vendor_user = VendorUser.query.filter(VendorUser.email == data['email']).first()
        if vendor_user:
            return {'error': 'email already exists'}, 400
        
        new_vendor_user = VendorUser(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            vendor_id=data['vendor_id']
        )

        db.session.add(new_vendor_user)
        db.session.commit()

        return new_vendor_user.to_dict(), 201

    except IntegrityError as e:
        db.session.rollback()
        return {'error': f'IntegrityError: {str(e)}'}, 400

    except ValueError as e:
        return {'error': f'ValueError: {str(e)}'}, 400

    except Exception as e:
        return {'error': f'Exception: {str(e)}'}, 500

@app.route('/logout', methods=['DELETE'])
def logout():
    session.pop('user_id', None)
    return {}, 204

# VENDOR PORTAL
@app.route('/vendor/logout', methods=['DELETE'])
def vendorLogout():
    session.pop('vendor_user_id', None)
    return {}, 204

@app.route('/check_session', methods=['GET'])
@jwt_required()
def check_session():
    user_id = get_jwt_identity()  # Get the user ID from the token
    user = User.query.filter_by(id=user_id).first()

    if not user:
        return {'error': 'authorization failed'}, 401

    return user.to_dict(), 200

@app.route('/markets', methods=['GET', 'POST'])
def all_markets():
    if request.method == 'GET':
        markets = Market.query.all()
        return jsonify([market.to_dict() for market in markets]), 200
    elif request.method == 'POST':
        data = request.get_json()
        new_market = Market(
            name=data['name'],
            location=data['location'],
            hours=data['hours'],
            year_round=data['year_round'],
            zipcode=data['zipcode']
        )
        db.session.add(new_market)
        db.session.commit()
        return new_market.to_dict(), 201

@app.route('/markets/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def market_by_id(id):
    market = Market.query.filter(Market.id == id).first()
    if not market:
        return {'error': 'market not found'}, 404
    if request.method == 'GET':
        return market.to_dict(), 200
    elif request.method == 'PATCH':
        data = request.get_json()
        for key, value in data.items():
            setattr(market, key, value)
        db.session.commit()
        return market.to_dict(), 200
    elif request.method == 'DELETE':
        db.session.delete(market)
        db.session.commit()
        return {}, 204
    
@app.route('/vendors', methods=['GET', 'POST', 'PATCH'])
def all_vendors():
    if request.method == 'GET':
        vendors = Vendor.query.all()
        return jsonify([vendor.to_dict() for vendor in vendors]), 200

    elif request.method == 'POST':
        data = request.get_json()
        new_vendor = Vendor(
            name=data['name'],
            based_out_of=data['based_out_of'],
            locations=data['locations'],
            product=data['product']
        )
        db.session.add(new_vendor)
        db.session.commit()
        return new_vendor.to_dict(), 201

    elif request.method == 'PATCH':
        data = request.get_json()
        vendor_id = data.get('id')

        if not vendor_id:
            return {'error': 'Vendor ID is required for updating'}, 400

        vendor = Vendor.query.filter_by(id=vendor_id).first()

        if not vendor:
            return {'error': 'Vendor not found'}, 404

        if 'name' in data:
            vendor.name = data['name']
        if 'based_out_of' in data:
            vendor.based_out_of = data['based_out_of']
        if 'locations' in data:
            vendor.locations = data['locations']
        if 'product' in data:
            vendor.product = data['product']

        try:
            db.session.commit()
            return jsonify(vendor.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            return {'error': f'Exception: {str(e)}'}, 500

@app.route('/vendors/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def vendor_by_id(id):
    vendor = Vendor.query.filter(Vendor.id == id).first()
    if not vendor:
        return {'error': 'vendor not found'}, 404
    if request.method == 'GET':
        return vendor.to_dict(), 200
    elif request.method == 'PATCH':
        data = request.get_json()
        for key, value in data.items():
            setattr(vendor, key, value)
        db.session.commit()
        return vendor.to_dict(), 200
    elif request.method == 'DELETE':
        db.session.delete(vendor)
        db.session.commit()
        return {}, 204

@app.route('/profile/<int:id>', methods=['GET', 'PATCH'])
def profile(id):
    user = User.query.filter(User.id == id).first()
    if not user:
        return {'error': 'user not found'}, 404

    if request.method == 'GET':
        profile_data = user.to_dict()
    
        return jsonify(profile_data), 200

    elif request.method == 'PATCH':
        try:
            user = User.query.filter_by(id=id).first()
            if not user:
                return {'error': 'User not found'}, 404

            data = request.get_json()
            for key, value in data.items():
                setattr(user, key, value)

            db.session.commit()
            return jsonify(user.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

# VENDOR PORTAL
@app.route('/vendor/profile/<int:id>', methods=['GET', 'PATCH', 'POST', 'DELETE'])
def vendorProfile(id):
    if request.method == 'GET':
        vendorUser = VendorUser.query.filter_by(id == id).first()
        if not vendorUser:
            return {'error': 'user not found'}, 404
        profile_data = vendorUser.to_dict()
        return jsonify(profile_data), 200
    
    elif request.method == 'PATCH':
        vendorUser = VendorUser.query.filter_by(id == id).first()
        if not vendorUser:
            return {'error': 'user not found'}, 404
        
        try:
            data = request.get_json()
            for key, value in data.items():
                setattr(vendorUser, key, value)
            db.session.commit()
            return jsonify(vendorUser.to_dict()), 200
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    elif request.method == 'POST':
        data = request.get_json()
        
        existing_user = VendorUser.query.filter_by(email=data['email']).first()
        if existing_user:
            return {'error': 'Email already in use'}, 400
        
        try:
            new_vendor_user = VendorUser(
                email=data['email'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                phone=data.get('phone'),
                vendor_id=data['vendor_id']
            )
            db.session.add(new_vendor_user)
            db.session.commit()
            return jsonify(new_vendor_user.to_dict()), 201
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    elif request.method == 'DELETE':
        vendorUser = VendorUser.query.filter_by(id=id).first()
        if not vendorUser:
            return {'error': 'user not found'}, 404
        
        try:
            db.session.delete(vendorUser)
            db.session.commit()
            return {}, 204
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

@app.route('/market_reviews', methods=['GET', 'POST'])
def all_market_reviews():
    if request.method == 'GET':
        market_id = request.args.get('market_id')
        if market_id:
            reviews = MarketReview.query.filter_by(market_id=market_id).options(db.joinedload(MarketReview.user)).all()
        else:
            reviews = MarketReview.query.all()
        return jsonify([review.to_dict() for review in reviews]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        new_review = MarketReview(
            review_text=data['review_text'],
            market_id=data['market_id'],
            user_id=data['user_id']
        )
        db.session.add(new_review)
        db.session.commit()
        return new_review.to_dict(), 201


@app.route('/market_reviews/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def market_review_by_id(id):
    review = MarketReview.query.filter(MarketReview.id == id).first()
    if not review:
        return {'error': 'review not found'}, 404
    if request.method == 'GET':
        return review.to_dict(), 200
    elif request.method == 'PATCH':
        data = request.get_json()
        for key, value in data.items():
            setattr(review, key, value)
        db.session.commit()
        return review.to_dict(), 200
    elif request.method == 'DELETE':
        db.session.delete(review)
        db.session.commit()
        return {}, 204

@app.route('/vendor_reviews', methods=['GET', 'POST'])
def all_vendor_reviews():
    if request.method == 'GET':
        vendor_id = request.args.get('vendor_id')
        if vendor_id:
            reviews = VendorReview.query.filter_by(vendor_id=vendor_id).options(db.joinedload(VendorReview.user)).all()
        else:
            reviews = VendorReview.query.options(db.joinedload(VendorReview.user)).all()
        return jsonify([review.to_dict() for review in reviews]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        new_review = VendorReview(
            review_text=data['review_text'],
            vendor_id=data['vendor_id'],
            user_id=data['user_id']
        )
        db.session.add(new_review)
        db.session.commit()
        return new_review.to_dict(), 201

@app.route('/vendor_reviews/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def vendor_review_by_id(id):
    review = VendorReview.query.filter(VendorReview.id == id).first()
    if not review:
        return {'error': 'review not found'}, 404
    if request.method == 'GET':
        return review.to_dict(), 200
    elif request.method == 'PATCH':
        data = request.get_json()
        for key, value in data.items():
            setattr(review, key, value)
        db.session.commit()
        return review.to_dict(), 200
    elif request.method == 'DELETE':
        db.session.delete(review)
        db.session.commit()
        return {}, 204

@app.route('/market_favorites', methods=['GET', 'POST'])
def all_market_favorites():
    if request.method == 'GET':
        marketFavorites = MarketFavorite.query.all()
        return jsonify([marketFavorite.to_dict() for marketFavorite in marketFavorites]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        new_market_favorite = MarketFavorite(
            user_id=data['user_id'],
            market_id=data['market_id']
        )
        db.session.add(new_market_favorite)
        db.session.commit()
        return new_market_favorite.to_dict(), 201
    
@app.route('/market_favorites/<int:id>', methods=['GET', 'DELETE'])
def del_market_fav(id):
    marketFav = MarketFavorite.query.filter(MarketFavorite.id == id).first()
    if not marketFav:
        return {'error': 'market favorite not found'}, 404
    if request.method == 'GET':
        return marketFav.to_dict(), 200
    if request.method == 'DELETE':
        db.session.delete(marketFav)
        db.session.commit()
        return {}, 204


@app.route('/vendor_favorites', methods=['GET', 'POST'])
def all_vendor_favorites():
    if request.method == 'GET':
        vendorFavorites = VendorFavorite.query.all()
        return jsonify([vendorFavorite.to_dict() for vendorFavorite in vendorFavorites]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        new_vendor_favorite = VendorFavorite(
            user_id=data['user_id'],
            vendor_id=data['vendor_id']
        )
        db.session.add(new_vendor_favorite)
        db.session.commit()
        return new_vendor_favorite.to_dict(), 201
    
@app.route('/vendor_favorites/<int:id>', methods=['GET', 'DELETE'])
def del_vendor_fav(id):
    vendorFav = VendorFavorite.query.filter(VendorFavorite.id == id).first()
    if request.method == 'GET':
        return vendorFav.to_dict(), 200
    if request.method == 'DELETE':
        db.session.delete(vendorFav)
        db.session.commit()
        return {}, 204
    
@app.route("/vendor_markets", methods=['GET'])
def get_vendor_markets():
    try:
        vendor_markets = VendorMarket.query.all()
        return jsonify([vendor_market.to_dict() for vendor_market in vendor_markets]), 200
    except Exception as e:
        return {'error': f'Exception: {str(e)}'}, 500

@app.route("/vendor_users", methods=['GET'])
def get_vendor_users():
    try:
        vendor_users = VendorUser.query.all()
        return jsonify([vendor_user.to_dict() for vendor_user in vendor_users]), 200
    except Exception as e:
        return {'error': f'Exception: {str(e)}'}, 500

@app.route("/vendor_vendor_users", methods=['GET', 'POST', 'PATCH', 'DELETE'])
def handle_vendor_vendor_users():
    if request.method == "GET":
        try:
            vendor_vendor_users = VendorVendorUser.query.all()
            return jsonify([vvu.to_dict() for vvu in vendor_vendor_users]), 200
        except Exception as e:
            return {'error': f'Exception: {str(e)}'}, 500

    elif request.method == "POST":
        data = request.get_json()
        
        try:
            if not data.get('vendor_id') or not data.get('vendor_user_id'):
                return {'error': 'vendor_id and vendor_user_id are required'}, 400

            new_vendor_vendor_user = VendorVendorUser(
                vendor_id=data['vendor_id'],
                vendor_user_id=data['vendor_user_id'],
                role=data.get('role')
            )

            db.session.add(new_vendor_vendor_user)
            db.session.commit()

            return new_vendor_vendor_user.to_dict(), 201

        except IntegrityError as e:
            db.session.rollback()
            return {'error': f'IntegrityError: {str(e)}'}, 400
        
        except ValueError as e:
            return {'error': f'ValueError: {str(e)}'}, 400

        except Exception as e:
            db.session.rollback()
            return {'error': f'Exception: {str(e)}'}, 500

    elif request.method == "PATCH":
        data = request.get_json()

        try:
            if not data.get('id'):
                return {'error': 'vendor_vendor_user ID is required for patching'}, 400

            vendor_vendor_user = VendorVendorUser.query.filter_by(id=data['id']).first()

            if not vendor_vendor_user:
                return {'error': 'VendorVendorUser not found'}, 404

            if 'vendor_id' in data:
                vendor_vendor_user.vendor_id = data['vendor_id']
            if 'vendor_user_id' in data:
                vendor_vendor_user.vendor_user_id = data['vendor_user_id']
            if 'role' in data:
                vendor_vendor_user.role = data['role']

            db.session.commit()
            return jsonify(vendor_vendor_user.to_dict()), 200

        except IntegrityError as e:
            db.session.rollback()
            return {'error': f'IntegrityError: {str(e)}'}, 400
        
        except ValueError as e:
            return {'error': f'ValueError: {str(e)}'}, 400

        except Exception as e:
            db.session.rollback()
            return {'error': f'Exception: {str(e)}'}, 500

    elif request.method == "DELETE":
        data = request.get_json()

        try:
            if not data.get('id'):
                return {'error': 'vendor_vendor_user ID is required for deletion'}, 400

            vendor_vendor_user = VendorVendorUser.query.filter_by(id=data['id']).first()

            if not vendor_vendor_user:
                return {'error': 'VendorVendorUser not found'}, 404

            db.session.delete(vendor_vendor_user)
            db.session.commit()

            return {}, 204

        except Exception as e:
            db.session.rollback()
            return {'error': f'Exception: {str(e)}'}, 500
    
@app.route('/contact', methods=['POST'])
def contact(): 
    data = request.get_json()
    print("received data:", data)
    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject')
    message = data.get('message')

    print(f"Name: {name}, Email: {email}, Subject: {subject}, Message: {message}")

    try: 
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = "hello@gingham.nyc"

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = f"Contact Form Submission: {subject}"

        # print("Sender email:", os.getenv('EMAIL_USER'))
        # print("Email password:", os.getenv('EMAIL_PASS'))

        body = f"Name: {name}\nEmail: {email}\n\n Message: \n{message}"
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        # print("SMTP Server is unreachable")

        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()
        
        return jsonify({"message": "Email sent successfully!"}), 200

    except Exception as e: 
        print("Error occured:", str(e))
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(port=5555, debug=True)