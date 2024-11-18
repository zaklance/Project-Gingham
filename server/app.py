import os
import json
import smtplib
from flask import Flask, request, jsonify, session, send_from_directory, redirect, url_for
from models import db, User, Market, MarketDay, Vendor, VendorUser, MarketReview, VendorReview, MarketFavorite, VendorFavorite, VendorMarket, VendorVendorUser, AdminUser, Basket, bcrypt, VendorNotifications
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.utils import secure_filename
from datetime import datetime
from PIL import Image
from io import BytesIO
import stripe
from itsdangerous import URLSafeTimedSerializer, SignatureExpired


load_dotenv()

app = Flask(__name__)

VENDOR_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/vendor-images')
MARKET_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/market-images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_SIZE = 1 * 1024 * 1024
MAX_RES = (100, 100)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URI']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = os.environ['SECRET_KEY']

# Serializer to create tokens
serializer = URLSafeTimedSerializer(os.environ['SECRET_KEY'])

db.init_app(app)
Migrate(app, db)
CORS(app, supports_credentials=True)

jwt = JWTManager(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def resize_image(image, max_size=MAX_SIZE, resolution=MAX_RES, step=0.9):
    if image.mode != 'RGB':
        image = image.convert('RGB')
        
    image.thumbnail(resolution, Image.LANCZOS)
    
    temp_output = BytesIO()
    image.save(temp_output, format='JPEG', quality=50)
    file_size = temp_output.tell()
    
    while file_size > max_size:
        temp_output = BytesIO()
        quality = max(10, int(85 * step))
        image.save(temp_output, format='JPEG', quality=quality)
        
        file_size = temp_output.tell()
        step -= 0.05

    temp_output.seek(0)
    return Image.open(temp_output)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return {'error': 'No file part in the request'}, 400

    file = request.files['file']

    if file.filename == '':
        return {'error': 'No file selected'}, 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)

        # Check whether the upload is for a vendor or market
        upload_type = request.form.get('type')
        if upload_type == 'vendor':
            file_path = os.path.join(VENDOR_UPLOAD_FOLDER, filename)
        elif upload_type == 'market':
            file_path = os.path.join(MARKET_UPLOAD_FOLDER, filename)
        else:
            return {'error': 'Invalid type specified. Must be "vendor" or "market"'}, 400

        try:
            image = Image.open(file)
            image = resize_image(image)
            image.save(file_path)

            if upload_type == 'vendor':
                vendor_id = request.form.get('vendor_id')
                if not vendor_id:
                    return {'error': 'Vendor ID is required'}, 400

                vendor = Vendor.query.get(vendor_id)
                if not vendor:
                    return {'error': 'Vendor not found'}, 404

                vendor.image = filename
                db.session.commit()

            elif upload_type == 'market':
                market_id = request.form.get('market_id')
                if not market_id:
                    return {'error': 'Market ID is required'}, 400

                market = Market.query.get(market_id)
                if not market:
                    return {'error': 'Market not found'}, 404

                market.image = filename
                db.session.commit()

            return {'message': 'File successfully uploaded', 'filename': filename}, 201

        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to upload image: {str(e)}'}, 500

    return {'error': 'File type not allowed'}, 400

@app.route('/images/<filename>', methods=['GET'])
def serve_image(filename):
    try:
        if os.path.exists(os.path.join(VENDOR_UPLOAD_FOLDER, filename)):
            return send_from_directory(VENDOR_UPLOAD_FOLDER, filename)
        elif os.path.exists(os.path.join(MARKET_UPLOAD_FOLDER, filename)):
            return send_from_directory(MARKET_UPLOAD_FOLDER, filename)
        else:
            raise FileNotFoundError

    except FileNotFoundError:
        return {'error': 'Image not found'}, 404

def check_role(expected_role):
    claims = get_jwt()
    if claims.get('role') != expected_role:
        return False
    return True

# User Portal
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
    
    access_token = create_access_token(identity=user.id, expires_delta=timedelta(hours=12), additional_claims={"role": "user"})
    
    return jsonify(access_token=access_token, user_id=user.id), 200

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
            address_1=data['address1'],
            address_2=data.get('address2', ''),
            city=data['city'],
            state=data['state'],
            zip=data['zip']
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

@app.route('/logout', methods=['DELETE'])
def logout():
    session.pop('user_id', None)
    return {}, 204

@app.route('/check_user_session', methods=['GET'])
@jwt_required()
def check_user_session():
    if not check_role('user'):
        return {'error': 'Access forbidden: User only'}, 403

    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return {'error': 'authorization failed'}, 401

    return user.to_dict(), 200


@app.route('/check-vendor-session', methods=['GET'])
@jwt_required()
def check_vendor_session():
    if not check_role('vendor'):
        return {'error': 'Access forbidden: Vendor only'}, 403

    vendor_user_id = get_jwt_identity()
    vendor_user = VendorUser.query.filter_by(id=vendor_user_id).first()
    
    if not vendor_user:
        return {'error': 'authorization failed'}, 401

    return vendor_user.to_dict(), 200

@app.route('/markets', methods=['GET', 'POST'])
def all_markets():
    if request.method == 'GET':
        markets = Market.query.all()
        return jsonify([market.to_dict() for market in markets]), 200
    elif request.method == 'POST':
        data = request.get_json()
        season_start = None
        if data.get('season_start'):
            season_start = datetime.strptime(data.get('season_start'), '%Y-%m-%d').date()
        season_end = None
        if data.get('season_end'):
            season_end = datetime.strptime(data.get('season_end'), '%Y-%m-%d').date()

        new_market = Market(
            name=data['name'],
            location=data['location'],
            zipcode=data['zipcode'],
            coordinates={"lat": data.get('coordinates_lat'), "lng": data.get('coordinates_lng')},
            schedule=data['schedule'],
            year_round=data['year_round'],
            season_start=season_start,
            season_end=season_end
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
        market = Market.query.filter_by(id=id).first()
        if not market:
            return {'error': 'user not found'}, 404
        try:
            data = request.get_json()
            # for key, value in data.items():
            #     setattr(user, key, value)
            market.name = data.get('name')
            market.image = data.get('image')
            market.location = data.get('location')
            market.zipcode = data.get('zipcode')
            market.coordinates = {
                "lat": data.get('coordinates', {}).get('lat'),
                "lng": data.get('coordinates', {}).get('lng')
            }
            market.schedule = data.get('schedule')
            market.year_round = data.get('year_round')
            if data.get('season_start'):
                market.season_start = datetime.strptime(data.get('season_start'), '%Y-%m-%d').date()
            if data.get('season_end'):
                market.season_end = datetime.strptime(data.get('season_end'), '%Y-%m-%d').date()            
            db.session.commit()
            return market.to_dict(), 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    elif request.method == 'DELETE':
        db.session.delete(market)
        db.session.commit()
        return {}, 204

@app.route('/market-days', methods=['GET', 'POST'])
def all_market_days():
    if request.method == 'GET':
        market_days = MarketDay.query.all()
        return jsonify([market.to_dict() for market in market_days]), 200
    elif request.method == 'POST':
        data = request.get_json()
        try:
            hour_start = datetime.strptime(data['hour_start'], '%I:%M %p').time()
            hour_end = datetime.strptime(data['hour_end'], '%I:%M %p').time()
        except ValueError as e:
            return jsonify({"error": f"Invalid time format: {str(e)}"}), 400
        new_market_day = MarketDay(
            market_id=data['market_id'],
            day_of_week=data['day_of_week'],
            hour_start=hour_start,
            hour_end=hour_end
        )
        db.session.add(new_market_day)
        db.session.commit()
        return jsonify(new_market_day.to_dict()), 201

@app.route('/market-days/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def market_day_by_id(id):
    market_day = MarketDay.query.filter(MarketDay.id == id).first()
    if not market_day:
        return {'error': 'market not found'}, 404
    if request.method == 'GET':
        return market_day.to_dict(), 200
    elif request.method == 'PATCH':
        if not market_day:
            return {'error': 'user not found'}, 404
        try:
            data = request.get_json()
            market_day.day_of_week=data['day_of_week']
            if 'hour_start' in data:
                market_day.hour_start = datetime.strptime(data['hour_start'], '%H:%M').time()
            if 'hour_end' in data:
                market_day.hour_end = datetime.strptime(data['hour_end'], '%H:%M').time()
            db.session.add(market_day)
            db.session.commit()
            return market_day.to_dict(), 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    elif request.method == 'DELETE':
        db.session.delete(market_day)
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
            name=data.get('name'),
            city=data.get('city'),
            state=data.get('state'),
            product=data.get('product'),
            bio=data.get('bio'),
            image=data.get('image')
        )
        db.session.add(new_vendor)
        db.session.commit()
        return jsonify(new_vendor.to_dict()), 201

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
        if 'city' in data:
            vendor.city = data['city']
        if 'state' in data:
            vendor.state = data['state']
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

@app.route('/vendors/<int:id>', methods=['GET', 'PATCH'])
def vendor_by_id(id):
    if request.method == 'GET':
        vendor = Vendor.query.filter_by(id=id).first()
        if not vendor:
            return {'error': 'vendor not found'}, 404
        vendor_data = vendor.to_dict()
        return jsonify(vendor_data), 200
    
    elif request.method == 'PATCH':
        vendor = Vendor.query.filter_by(id=id).first()
        if not vendor:
            return {'error': 'vendor not found'}, 404

        try:          
            data = request.get_json()

           
            if 'name' in data:
                vendor.name = data['name']
            if 'product' in data:
                vendor.product = data['product']
            if 'city' in data:
                vendor.city = data['city']
            if 'state' in data:
                vendor.state = data['state']
            if 'locations' in data:
                vendor.locations = data['locations']

            db.session.commit()
            return jsonify(vendor.to_dict()), 200
        
        except Exception as e: 
            db.session.rollback()
            return {'error': str(e)}, 500

@app.route('/vendors/<int:vendor_id>/image', methods=['GET'])
def get_vendor_image(vendor_id):
    vendor = Vendor.query.get(vendor_id)
    if vendor and vendor.image:
        try:
            return send_from_directory(app.config['UPLOAD_FOLDER'], vendor.image)
        except FileNotFoundError:
            return {'error': 'Image not found'}, 404
    return {'error': 'Vendor or image not found'}, 404

@app.route('/users/<int:id>', methods=['GET', 'PATCH', 'POST', 'DELETE'])
@jwt_required()
def profile(id):
    
    if not check_role('user'):
        return {'error': "Access forbidden: User only"}, 403
    
    if request.method == 'GET':
        user = User.query.filter_by(id=id).first()
        if not user:
            return {'error': 'user not found'}, 404
        profile_data = user.to_dict()
        return jsonify(profile_data), 200

    elif request.method == 'PATCH':
        user = User.query.filter_by(id=id).first()
        if not user:
            return {'error': 'user not found'}, 404
        try:
            data = request.get_json()
            # for key, value in data.items():
            #     setattr(user, key, value)
            user.first_name = data.get('first_name')
            user.last_name = data.get('last_name')
            user.email = data.get('email')
            user.address = data.get('address')

            db.session.commit()
            return jsonify(user.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
    elif request.method == 'POST':
        data = request.get_json()

        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return {'error': 'Email already in use'}, 400
        
        try: 
            new_user = User(
                email=data['email'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                address=data.get('address')
            )
            db.session.add(new_user)
            db.session.commit()
            return jsonify(new_user.to_dict()), 201
        
        except Exception as e: 
            db.session.rollback()
            return {'error': str(e)}, 500
        
    elif request.method == 'DELETE':
        user = User.query.filter_by(id=id).first()
        if not User: 
            return {'error': 'user not found'}, 404
        
        try: 
            db.session.delete(user)
            db.session.commit()
            return {}, 204
        
        except Exception as e: 
            db.session.rollback()
            return {'error': str(e)}, 500

@app.route('/market-reviews', methods=['GET', 'POST', 'DELETE'])
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
    

@app.route('/market-reviews/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
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

@app.route('/vendor-reviews', methods=['GET', 'POST'])
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

@app.route('/vendor-reviews/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
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

@app.route('/market-favorites', methods=['GET', 'POST'])
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
    
@app.route('/market-favorites/<int:id>', methods=['GET', 'DELETE'])
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

@app.route('/vendor-favorites', methods=['GET', 'POST'])
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
    
@app.route('/vendor-favorites/<int:id>', methods=['GET', 'DELETE'])
def del_vendor_fav(id):
    vendorFav = VendorFavorite.query.filter(VendorFavorite.id == id).first()
    if request.method == 'GET':
        return vendorFav.to_dict(), 200
    if request.method == 'DELETE':
        db.session.delete(vendorFav)
        db.session.commit()
        return {}, 204
    
@app.route("/vendor-markets", methods=['GET'])
def get_vendor_markets():
    vendor_id = request.args.get('vendor_id')
    market_id = request.args.get('market_id')

    query = VendorMarket.query

    if vendor_id: 
        query = query.filter_by(vendor_id=vendor_id).options(db.joinedload(VendorMarket.vendor))
    elif market_id: 
        query = query.filter_by(market_id=market_id).options(db.joinedload(VendorMarket.market))

    vendor_markets = query.all()
    
    return jsonify([vendor_market.to_dict() for vendor_market in vendor_markets]), 200

# VENDOR PORTAL
@app.route('/vendor/login', methods=['POST'])
def vendorLogin():
    data = request.get_json()
    vendorUser = VendorUser.query.filter(VendorUser.email == data['email']).first()
    if not vendorUser:
        return {'error': 'login failed'}, 401
    
    if not vendorUser.authenticate(data['password']):
        return {'error': 'login failed'}, 401
    
    access_token = create_access_token(identity=vendorUser.id, expires_delta=timedelta(hours=12), additional_claims={"role": "vendor"})

    return jsonify(access_token=access_token, vendor_user_id=vendorUser.id), 200

@app.route('/vendor-signup', methods=['POST'])
def vendorSignup():
    data = request.get_json()

    try:
        vendor_user = VendorUser.query.filter(VendorUser.email == data['email']).first()
        if vendor_user:
            return {'error': 'Email already exists'}, 400
        
        new_vendor_user = VendorUser(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data['phone']
        )
        new_vendor_user.password = data['password']

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
    
@app.route('/vendor/logout', methods=['DELETE'])
def vendorLogout():
    session.pop('vendor_user_id', None)
    return {}, 204

@app.route("/vendor-users", methods=['GET'])
def get_vendor_users():
    try:
        vendor_users = VendorUser.query.all()
        return jsonify([vendor_user.to_dict() for vendor_user in vendor_users]), 200
    except Exception as e:
        return {'error': f'Exception: {str(e)}'}, 500
    
@app.route('/vendor-users/<int:id>', methods=['GET', 'PATCH', 'POST', 'DELETE'])
@jwt_required()
def vendorProfile(id):
    if not check_role('vendor'):
        return {'error': "Access forbidden: Vendor only"}, 403
    
    if request.method == 'GET':
        vendorUser = VendorUser.query.filter_by(id = id).first()
        if not vendorUser:
            return {'error': 'user not found'}, 404
        profile_data = vendorUser.to_dict()
        return jsonify(profile_data), 200
    
    elif request.method == 'PATCH':
        vendorUser = VendorUser.query.filter_by(id=id).first()
        if not vendorUser:
            return {'error': 'User not found'}, 404
        
        try:
            data = request.get_json()
            for key, value in data.items():
                setattr(vendorUser, key, value)

            if 'vendor_id' in data:
                vendor = Vendor.query.get(data['vendor_id'])
                if not vendor:
                    return {'error': 'Invalid vendor_id'}, 400
                
                if vendorUser.vendor_id != data['vendor_id']:
                    vendorUser.vendor_id = data['vendor_id']

                    vendor_vendor_user_link = VendorVendorUser.query.filter_by(
                        vendor_id=data['vendor_id'],
                        vendor_user_id=id
                    ).first()

                    if not vendor_vendor_user_link:
                        new_vendor_vendor_user = VendorVendorUser(
                            vendor_id=data['vendor_id'],
                            vendor_user_id=id
                        )
                        db.session.add(new_vendor_vendor_user)

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
        
        vendor = Vendor.query.get(data['vendor_id'])
        if not vendor: 
            return {'error': 'Invalid vendor_id'}, 400
        
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

            vendor_vendor_user_link = VendorVendorUser.query.filter_by(
                vendor_id=data['vendor_id'],
                vendor_user_id=new_vendor_user.id
            ).first()
            
            if not vendor_vendor_user_link:
                new_vendor_vendor_user = VendorVendorUser(
                    vendor_id=data['vendor_id'],
                    vendor_user_id=new_vendor_user.id
                )
                db.session.add(new_vendor_vendor_user)
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

@app.route("/vendor-vendor-users", methods=['GET', 'POST', 'PATCH', 'DELETE'])
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
        
@app.route("/baskets", methods=['GET', 'POST', 'PATCH', 'DELETE'])
def handle_baskets():
    if request.method == 'GET':
        try:
            baskets = Basket.query.all()
            return jsonify([basket.to_dict() for basket in baskets]), 200
        except Exception as e:
            app.logger.error(f'Error fetching baskets: {e}')  
            return {'error': f'Exception: {str(e)}'}, 500

    elif request.method == 'POST':
        data = request.get_json()
        app.logger.debug(f'Received data for new basket: {data}')

        try:
            # Convert string dates to datetime.date objects
            sale_date = datetime.strptime(data['sale_date'], '%Y-%m-%d').date()
            pickup_time = datetime.strptime(data['pickup_time'], '%I:%M %p').time()

            # Validate and convert price
            price = float(data['price'])

            if price < 0:
                return {'error': 'Price must be a non-negative number'}, 400
            
            price = int(price * 100)
           
            new_basket = Basket(
                vendor_id=data['vendor_id'],
                user_id=data.get('user_id'),
                market_id=data['market_id'],
                sale_date=sale_date,
                pickup_time=pickup_time,
                is_sold=data.get('is_sold', False),
                is_grabbed=data.get('is_grabbed', False),
                price=price,
                pickup_duration=data.get('pickup_time_duration', 0.0)
            )
            db.session.add(new_basket)
            db.session.commit()
            return jsonify(new_basket.to_dict()), 201

        except Exception as e:
            db.session.rollback()
            app.logger.error(f'Error creating basket: {e}')
            return {'error': str(e)}, 500

    elif request.method == 'PATCH':
        data = request.get_json()
        app.logger.debug(f'Received data for updating basket: {data}')
        basket_id = data.get('id')

        if not basket_id:
            return {'error': 'Basket ID is required for updating'}, 400

        basket = Basket.query.filter_by(id=basket_id).first()
        if not basket:
            return {'error': 'Basket not found'}, 404

        try:
            if 'vendor_id' in data:
                basket.vendor_id = data['vendor_id']
            if 'user_id' in data:
                basket.user_id = data['user_id']
            if 'market_id' in data:
                basket.market_id = data['market_id']
            if 'sale_date' in data:
                basket.sale_date = datetime.strptime(data['sale_date'], '%Y-%m-%d').date()
            if 'pickup_time' in data:
                basket.pickup_time = datetime.strptime(data['pickup_time'], '%I:%M %p')
            if 'is_sold' in data:
                basket.is_sold = data['is_sold']
            if 'is_grabbed' in data:
                basket.is_grabbed = data['is_grabbed']
            if 'price' in data:
                basket.price = data['price']
            if 'pick_up_duration' in data:
                basket.pick_up_duration = data['pick_up_duration']

            db.session.commit()
            return jsonify(basket.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            app.logger.error(f'Error updating basket: {e}')
            return {'error': str(e)}, 500

    elif request.method == 'DELETE':
        data = request.get_json()
        app.logger.debug(f'Received data for deleting basket: {data}')
        basket_id = data.get('id')

        if not basket_id:
            return {'error': 'Basket ID is required for deletion'}, 400

        basket = Basket.query.filter_by(id=basket_id).first()
        if not basket:
            return {'error': 'Basket not found'}, 404

        try:
            db.session.delete(basket)
            db.session.commit()
            return {}, 204

        except Exception as e:
            db.session.rollback()
            app.logger.error(f'Error deleting basket: {e}') 
            return {'error': str(e)}, 500


@app.route("/baskets/<int:id>", methods=['GET', 'PATCH', 'DELETE'])
def handle_basket_by_id(id):
    basket = Basket.query.filter_by(id=id).first()
    
    if not basket:
        return {'error': 'Basket not found'}, 404

    if request.method == 'GET':
        try:
            return jsonify(basket.to_dict()), 200
        except Exception as e:
            return {'error': f'Exception: {str(e)}'}, 500

    elif request.method == 'PATCH':
        try:
            data = request.get_json()
            for key, value in data.items():
                setattr(basket, key, value)
            db.session.commit()
            return jsonify(basket.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    elif request.method == 'DELETE':
        try:
            db.session.delete(basket)
            db.session.commit()
            return {}, 204

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

@app.route('/baskets/user-sales-history', methods=['GET'])
@jwt_required()
def get_user_sales_history():
    current_user_id = get_jwt_identity()

    if not current_user_id:
        return {'error': 'User not logged in'}, 401
    
    try: 
        baskets = Basket.query.filter_by(user_id=current_user_id, is_sold=True).all()
        app.logger.info(f"Fetched baskets: {baskets}")

        user_sales_history = [
            {
                "vendor_name": basket.vendor.name,
                "vendor_id": basket.vendor.id,
                "sale_date": basket.sale_date.strftime('%Y-%m-%d'),
                "market_name": basket.market_day.markets.name,
                "market_id": basket.market_day.markets.id,
                "price": basket.price,
                "baskets_count": 1
            }
            for basket in baskets or []
        ]
        return jsonify(user_sales_history), 200
    
    except Exception as e: 
        app.logger.error(f"Error fetching sales history: {e}")
        return {'error': f"Exception: {str(e)}"}, 500

# ADMIN PORTAL
@app.route('/admin/login', methods=['POST'])
def adminLogin():
    data = request.get_json()
    adminUser = AdminUser.query.filter(AdminUser.email == data['email']).first()
    if not adminUser:
        return {'error': 'login failed'}, 401
    
    if not adminUser.authenticate(data['password']):
        return {'error': 'login failed'}, 401
    
    access_token = create_access_token(identity=adminUser.id, expires_delta=timedelta(hours=12), additional_claims={"role": "admin"})

    return jsonify(access_token=access_token, admin_user_id=adminUser.id), 200

@app.route('/admin-signup', methods=['POST'])
def adminSignup():
    data = request.get_json()

    try:
        admin_user = AdminUser.query.filter(AdminUser.email == data['email']).first()
        if admin_user:
            return {'error': 'email already exists'}, 400
        
        new_admin_user = AdminUser(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
        )

        db.session.add(new_admin_user)
        db.session.commit()

        return new_admin_user.to_dict(), 201

    except IntegrityError as e:
        db.session.rollback()
        return {'error': f'IntegrityError: {str(e)}'}, 400

    except ValueError as e:
        return {'error': f'ValueError: {str(e)}'}, 400

    except Exception as e:
        return {'error': f'Exception: {str(e)}'}, 500
    
@app.route('/admin/logout', methods=['DELETE'])
def adminLogout():
    session.pop('admin_user_id', None)
    return {}, 204

@app.route("/admin-users", methods=['GET', 'POST'])
@jwt_required()
def handle_admin_users():
    
    if not check_role('admin'):
        return {'error': "Access forbidden: Admin only"}, 403
    
    if request.method == 'GET':
        try:
            admin_users = AdminUser.query.all()
            return jsonify([admin_user.to_dict() for admin_user in admin_users]), 200
        except Exception as e:
            return {'error': f'Exception: {str(e)}'}, 500

    elif request.method == 'POST':
        data = request.get_json()

        # Check if the email already exists
        existing_user = AdminUser.query.filter_by(email=data['email']).first()
        if existing_user:
            return {'error': 'Email already in use'}, 400

        try:
            new_admin_user = AdminUser(
                email=data['email'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                phone=data.get('phone')
            )
            db.session.add(new_admin_user)
            db.session.commit()
            return jsonify(new_admin_user.to_dict()), 201

        except Exception as e:
            db.session.rollback()
            return {'error': f'Exception: {str(e)}'}, 500
    
@app.route('/admin-users/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def handle_admin_user_by_id(id):
    admin_user = AdminUser.query.filter_by(id=id).first()

    if not admin_user:
        return {'error': 'User not found'}, 404

    if request.method == 'GET':
        try:
            return jsonify(admin_user.to_dict()), 200
        except Exception as e:
            return {'error': f'Exception: {str(e)}'}, 500

    elif request.method == 'PATCH':
        try:
            data = request.get_json()
            for key, value in data.items():
                setattr(admin_user, key, value)
            db.session.commit()
            return jsonify(admin_user.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            return {'error': f'Exception: {str(e)}'}, 500

    elif request.method == 'DELETE':
        try:
            db.session.delete(admin_user)
            db.session.commit()
            return {}, 204

        except Exception as e:
            db.session.rollback()
            return {'error': f'Exception: {str(e)}'}, 500


# Email Form
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
        msg['Subject'] = f"GINGHAM.NYC Contact Form Submission: {subject}"

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
    
# Stripe
stripe.api_key = os.getenv('STRIPE_PY_KEY')

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        session = stripe.checkout.Session.create(
            ui_mode = 'embedded',
            line_items=[
                {
                    # Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                    'price': 'price_1QIWBN00T87Ls5h92BGgUbTz',
                    'quantity': 1,
                },
            ],
            mode='payment',
            return_url='http://127.0.0.1:5173' + '/return?session_id={CHECKOUT_SESSION_ID}',
        )
    except Exception as e:
        return str(e)
    return jsonify(clientSecret=session.client_secret)

@app.route('/session-status', methods=['GET'])
def session_status():
  session = stripe.checkout.Session.retrieve(request.args.get('session_id'))
  return jsonify(status=session.status, customer_email=session.customer_details.email)

# Password reset for User
@app.route('/user/password-reset-request', methods=['POST'])
def password_reset_request():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()

    if not user:
        return {'error': 'User not found'}, 404

    # Generate token for the password reset
    token = serializer.dumps(email, salt='password-reset-salt')

    # Generate the reset link
    reset_link = url_for('password_reset', token=token, _external=True)

    try:
        # Email configuration
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = email

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = 'Password Reset Request'

        body = f"Please click the link to reset your password: {reset_link}"
        msg.attach(MIMEText(body, 'plain'))

        # Connect to the SMTP server and send the email
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()

        return {'message': 'Password reset link sent'}, 200

    except Exception as e:
        return {'error': f'Failed to send email: {str(e)}'}, 500

@app.route('/user/password-reset/<token>', methods=['GET', 'POST'])
def password_reset(token):
    if request.method == 'GET':
        print(f"GET request: Received token: {token}")
        
        return redirect(f'http://localhost:5173/user/password-reset/{token}')

    if request.method == 'POST':
        try:
            # Verify token and get email
            email = serializer.loads(token, salt='password-reset-salt', max_age=7200)
            print(f"POST request: Token verified, email extracted: {email}")

            # Get new password from the request
            data = request.get_json()
            new_password = data.get('new_password')
            print(f"POST request: New password: {new_password}")

            # Check if the new password is provided
            if not new_password:
                print("POST request: No new password provided")
                return {'error': 'New password is required'}, 400

            # Find user from the database using the email
            user = User.query.filter_by(email=email).first()
            if not user:
                print(f"POST request: User not found for email: {email}")
                return {'error': 'User not found'}, 404

            # Log the user's first name
            print(f"POST request: User First name: {user.first_name}")

            # Send to password setter in the User model
            user.password = new_password
            db.session.commit()

            print("POST request: Password updated and committed to the database")
            return {'message': 'Password successfully reset'}, 200

        except SignatureExpired:
            print("POST request: The token has expired")
            return {'error': 'The token has expired'}, 400

        except Exception as e:
            print(f"POST request: An error occurred: {str(e)}")
            return {'error': f'Failed to reset password: {str(e)}'}, 500

# Password reset for VendorUser
@app.route('/vendor/password-reset-request', methods=['POST'])
def vendor_password_reset_request():
    data = request.get_json()
    email = data.get('email')
    vendor_user = VendorUser.query.filter_by(email=email).first()

    if not vendor_user:
        return {'error': 'Vendor user not found'}, 404

    token = serializer.dumps(email, salt='vendor-password-reset-salt')
    reset_link = url_for('vendor_password_reset', token=token, _external=True)

    try:
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = email

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = 'Vendor Password Reset Request'

        body = f"Please click the link to reset your password: {reset_link}"
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()

        return {'message': 'Password reset link sent'}, 200

    except Exception as e:
        return {'error': f'Failed to send email: {str(e)}'}, 500

@app.route('/vendor/password-reset/<token>', methods=['GET', 'POST'])
def vendor_password_reset(token):
    if request.method == 'GET':
        return redirect(f'http://localhost:5173/vendor/password-reset/{token}')

    if request.method == 'POST':
        try:
            email = serializer.loads(token, salt='vendor-password-reset-salt', max_age=7200)
            data = request.get_json()
            new_password = data.get('new_password')

            if not new_password:
                return {'error': 'New password is required'}, 400

            vendor_user = VendorUser.query.filter_by(email=email).first()
            if not vendor_user:
                return {'error': 'Vendor user not found'}, 404

            vendor_user.password = new_password
            db.session.commit()

            return {'message': 'Password successfully reset'}, 200

        except SignatureExpired:
            return {'error': 'The token has expired'}, 400

        except Exception as e:
            return {'error': f'Failed to reset password: {str(e)}'}, 500

# Password reset for AdminUser
@app.route('/admin/password-reset-request', methods=['POST'])
def admin_password_reset_request():
    data = request.get_json()
    email = data.get('email')
    admin_user = AdminUser.query.filter_by(email=email).first()

    if not admin_user:
        return {'error': 'Admin user not found'}, 404

    token = serializer.dumps(email, salt='admin-password-reset-salt')
    reset_link = url_for('admin_password_reset', token=token, _external=True)

    try:
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = email

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = 'Admin Password Reset Request'

        body = f"Please click the link to reset your password: {reset_link}"
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()

        return {'message': 'Password reset link sent'}, 200

    except Exception as e:
        return {'error': f'Failed to send email: {str(e)}'}, 500


@app.route('/admin/password-reset/<token>', methods=['GET', 'POST'])
def admin_password_reset(token):
    if request.method == 'GET':
        return redirect(f'http://localhost:5173/admin/password-reset/{token}')

    if request.method == 'POST':
        try:
            email = serializer.loads(token, salt='admin-password-reset-salt', max_age=7200)
            data = request.get_json()
            new_password = data.get('new_password')

            if not new_password:
                return {'error': 'New password is required'}, 400

            admin_user = AdminUser.query.filter_by(email=email).first()
            if not admin_user:
                return {'error': 'Admin user not found'}, 404

            admin_user.password = new_password
            db.session.commit()

            return {'message': 'Password successfully reset'}, 200

        except SignatureExpired:
            return {'error': 'The token has expired'}, 400

        except Exception as e:
            return {'error': f'Failed to reset password: {str(e)}'}, 500
    
@app.route('/create-notification', methods=['POST'])
def create_notification():
    data = request.get_json()

    if not data or 'message' not in data or 'vendor_id' not in data or 'vendor_user_id' not in data:
        return jsonify({'message': 'Invalid request data.'}), 400

    try:
        new_notification = VendorNotifications(
            message=data['message'],
            vendor_id=data['vendor_id'],
            vendor_user_id=data['vendor_user_id'],
            created_at=datetime.utcnow(),
            is_read=False
        )
        db.session.add(new_notification)
        db.session.commit()
        return jsonify({'message': 'Notification created successfully'}), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"Error creating notification: {str(e)}")
        return jsonify({'message': f'Error creating notification: {str(e)}'}), 500

@app.route('/vendor-notifications/<int:vendor_id>', methods=['GET'])
def get_vendor_notifications(vendor_id):
    notifications = VendorNotifications.query.filter_by(vendor_id=vendor_id).all()

    if not notifications:
        return jsonify({'message': 'No notifications found'}), 404

    notifications_data = [{'id': n.id, 'message': n.message} for n in notifications]

    return jsonify({'notifications': notifications_data})

@app.route('/vendor-notifications/<int:notification_id>/approve', methods=['POST'])
def approve_notification(notification_id):
    data = request.get_json()
    is_admin = data.get('is_admin')

    notification = VendorNotifications.query.get(notification_id)
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404

    if not notification.vendor_user_id:
        return jsonify({'message': 'No vendor user associated with this notification'}), 400

    user = VendorUser.query.get(notification.vendor_user_id)
    if not user:
        return jsonify({'message': 'Vendor user not found'}), 404

    user.vendor_id = notification.vendor_id
    user.is_admin = is_admin

    db.session.commit()

    notification.is_read = True
    db.session.commit()

    db.session.delete(notification)
    db.session.commit()

    return jsonify({'message': 'Notification approved and user updated successfully'}), 200

@app.route('/vendor-notifications/<int:notification_id>/reject', methods=['DELETE'])
def reject_notification(notification_id):
    notification = VendorNotifications.query.get(notification_id)
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404

    db.session.delete(notification)
    db.session.commit()

    return jsonify({'message': 'Notification rejected successfully'}), 200

if __name__ == '__main__':
    app.run(port=5555, debug=True)
