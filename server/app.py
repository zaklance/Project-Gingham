import os
import json
import smtplib
from flask import Flask, request, jsonify, session, send_from_directory, redirect, url_for
from models import db, User, Market, MarketDay, Vendor, VendorUser, MarketReview, VendorReview, ReportedReview, VendorReviewRating, MarketReviewRating, MarketFavorite, VendorFavorite, VendorMarket, VendorVendorUser, AdminUser, Basket, Event, Product, UserNotification, VendorNotification, AdminNotification, QRCode, bcrypt
from dotenv import load_dotenv
from sqlalchemy import func, desc
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.utils import secure_filename
from datetime import datetime, date, time, timedelta
from PIL import Image
from io import BytesIO
from random import choice
import stripe
from itsdangerous import URLSafeTimedSerializer, SignatureExpired

load_dotenv()

app = Flask(__name__)

VENDOR_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/vendor-images')
MARKET_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/market-images')
USER_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/user-images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'svg'}
MAX_SIZE = 1.5 * 1024 * 1024
MAX_RES = (1800, 1800)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URI']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = os.environ['SECRET_KEY']

# Serializer to create tokens
serializer = URLSafeTimedSerializer(os.environ['SECRET_KEY'])

db.init_app(app)
Migrate(app, db)
CORS(app, supports_credentials=True)

jwt = JWTManager(app)

avatars = [
        "avatar-apricot.jpg", "avatar-avocado-1.jpg", "avatar-avocado-2.jpg", "avatar-cabbage.jpg",
        "avatar-kiwi-1.jpg", "avatar-kiwi-2.jpg", "avatar-lime.jpg", "avatar-melon.jpg",
        "avatar-nectarine.jpg", "avatar-onion-1.jpg", "avatar-onion-2.jpg", "avatar-onion-3.jpg",
        "avatar-peach.jpg", "avatar-pomegranate.jpg", "avatar-radish.jpg", "avatar-tomato.jpg",
        "avatar-watermelon.jpg"
    ]

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

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return {'error': 'No file part in the request'}, 400

    file = request.files['file']

    if file.filename == '':
        return {'error': 'No file selected'}, 400

    if file and allowed_file(file.filename):
        # Use the original filename
        original_filename = secure_filename(file.filename)

        # Check whether the upload is for a vendor or market
        upload_type = request.form.get('type')
        if upload_type == 'vendor':
            upload_folder = VENDOR_UPLOAD_FOLDER
        elif upload_type == 'market':
            upload_folder = MARKET_UPLOAD_FOLDER
        else:
            return {'error': 'Invalid type specified. Must be "vendor" or "market"'}, 400

        # Ensure the upload folder exists
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        file_path = os.path.join(upload_folder, original_filename)

        # Prevent overwriting files by appending a number to the filename if it already exists
        if os.path.exists(file_path):
            base, ext = os.path.splitext(original_filename)
            counter = 1
            while os.path.exists(file_path):
                file_path = os.path.join(upload_folder, f"{base}_{counter}{ext}")
                counter += 1

        try:
            if original_filename.rsplit('.', 1)[1].lower() == 'svg':
                # Save the SVG file directly without resizing or compressing
                file.save(file_path)
            else:
                # Process and resize image for non-SVG files
                image = Image.open(file)
                image = resize_image(image)
                image.save(file_path)

            # Update the database record based on upload type
            if upload_type == 'vendor':
                vendor_id = request.form.get('vendor_id')
                if not vendor_id:
                    return {'error': 'Vendor ID is required'}, 400

                vendor = Vendor.query.get(vendor_id)
                if not vendor:
                    return {'error': 'Vendor not found'}, 404

                vendor.image = os.path.basename(file_path)
                db.session.commit()

            elif upload_type == 'market':
                market_id = request.form.get('market_id')
                if not market_id:
                    return {'error': 'Market ID is required'}, 400

                market = Market.query.get(market_id)
                if not market:
                    return {'error': 'Market not found'}, 404

                market.image = os.path.basename(file_path)
                db.session.commit()

            return {'message': 'File successfully uploaded', 'filename': os.path.basename(file_path)}, 201

        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to upload image: {str(e)}'}, 500

    return {'error': 'File type not allowed'}, 400

@app.route('/api/delete-image', methods=['POST'])
@jwt_required()
def delete_image():
    if not (check_role('admin') or check_role('vendor')):
        return {'error': "Access forbidden: Admin only"}, 403

    data = request.get_json()
    filename = data.get('filename')
    file_type = data.get('type')

    if not filename or not file_type:
        return {'error': 'Filename and type are required'}, 400

    # Determine the folder based on type
    if file_type == 'vendor':
        folder = VENDOR_UPLOAD_FOLDER
    elif file_type == 'market':
        folder = MARKET_UPLOAD_FOLDER
    else:
        return {'error': 'Invalid type. Must be "vendor" or "market"'}, 400

    try:
        file_path = os.path.join(folder, filename)

        # Delete the file from the file system
        if os.path.exists(file_path):
            os.remove(file_path)

        if file_type == 'vendor':
            vendor = Vendor.query.filter_by(image=filename).first()
            if vendor:
                vendor.image = None
                db.session.commit()
        elif file_type == 'market':
            market = Market.query.filter_by(image=filename).first()
            if market:
                market.image = None
                db.session.commit()

        return {'message': 'Image deleted successfully'}, 200
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to delete image: {str(e)}'}, 500

@app.route('/api/images/<filename>', methods=['GET'])
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

# Handle expired token for all account types
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token has expired',
        'message': 'Your session has expired. Please log in again.'
    }), 401

# Handle invalid or malformed token for all account types
@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'error': 'Invalid token',
        'message': 'The token provided is invalid. Please log in again.'
    }), 401

# Handle unauthorized access for all account types
@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'error': 'Authorization required',
        'message': 'No token provided. Please log in to continue.'
    }), 401

# User Portal
@app.route('/api/', methods=['GET'])
def homepage():
    return {"message": "Welcome to the homepage!"}, 200

@app.route('/api/login', methods=['POST'])
def login():
    
    data = request.get_json()
    user = User.query.filter(User.email == data['email']).first()
    if not user:
        return {'error': 'Login failed'}, 401
    
    if not user.authenticate(data['password']):
        return {'error': 'Login failed'}, 401
    
    access_token = create_access_token(identity=user.id, expires_delta=timedelta(hours=12), additional_claims={"role": "user"})
    
    return jsonify(access_token=access_token, user_id=user.id), 200

@app.route('/api/logout', methods=['DELETE'])
def logout():
    session.pop('user_id', None)
    return {}, 204

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()

    try:
        user = User.query.filter(User.email == data['email']).first()
        if user:
            return {'error': 'email already exists'}, 400
        
        avatar = data.get('avatar') or choice(avatars)

        new_user = User(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data['phone'],
            address_1=data['address1'],
            address_2=data.get('address2', ''),
            city=data['city'],
            state=data['state'],
            zipcode=data['zipcode'],
            avatar=avatar
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

# VENDOR PORTAL
@app.route('/api/vendor/login', methods=['POST'])
def vendorLogin():

    data = request.get_json()
    vendorUser = VendorUser.query.filter(VendorUser.email == data['email']).first()
    if not vendorUser:
        return {'error': 'Login failed'}, 401
    
    if not vendorUser.authenticate(data['password']):
        return {'error': 'Login failed'}, 401
    
    access_token = create_access_token(identity=vendorUser.id, expires_delta=timedelta(hours=12), additional_claims={"role": "vendor"})

    return jsonify(access_token=access_token, vendor_user_id=vendorUser.id), 200

@app.route('/api/vendor-signup', methods=['POST'])
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
    
@app.route('/api/vendor/logout', methods=['DELETE'])
def vendorLogout():
    session.pop('vendor_user_id', None)
    return {}, 204
    
    # ADMIN PORTAL
@app.route('/api/admin/login', methods=['POST'])
def adminLogin():

    data = request.get_json()
    adminUser = AdminUser.query.filter(AdminUser.email == data['email']).first()
    if not adminUser:
        return {'error': 'Login failed'}, 401
    
    if not adminUser.authenticate(data['password']):
        return {'error': 'Login failed'}, 401
    
    access_token = create_access_token(identity=adminUser.id, expires_delta=timedelta(hours=12), additional_claims={"role": "admin"})

    return jsonify(access_token=access_token, admin_user_id=adminUser.id), 200

@app.route('/api/admin-signup', methods=['POST'])
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
    
@app.route('/api/admin/logout', methods=['DELETE'])
def adminLogout():
    session.pop('admin_user_id', None)
    return {}, 204

@app.route('/api/check_user_session', methods=['GET'])
@jwt_required()
def check_user_session():
    if not check_role('user'):
        return {'error': 'Access forbidden: User only'}, 403

    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return {'error': 'authorization failed'}, 401

    return user.to_dict(), 200

@app.route('/api/check-vendor-session', methods=['GET'])
@jwt_required()
def check_vendor_session():
    if not check_role('vendor'):
        return {'error': 'Access forbidden: Vendor only'}, 403

    vendor_user_id = get_jwt_identity()
    vendor_user = VendorUser.query.filter_by(id=vendor_user_id).first()
    
    if not vendor_user:
        return {'error': 'authorization failed'}, 401

    return vendor_user.to_dict(), 200

@app.route('/api/check_admin_session', methods=['GET'])
@jwt_required()
def check_admin_session():
    if not check_role('admin'):
        return {'error': 'Access forbidden: Admin only'}, 403

    admin_user_id = get_jwt_identity()
    admin_user = AdminUser.query.filter_by(id=admin_user_id).first()

    if not admin_user:
        return {'error': 'Authorization failed'}, 401

    return admin_user.to_dict(), 200
    
@app.route('/api/users/<int:id>', methods=['GET', 'PATCH', 'POST', 'DELETE'])
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
            user.phone = data.get('phone')
            user.address_1 = data.get('address_1')
            user.address_2 = data.get('address_2')
            user.city = data.get('city')
            user.state = data.get('state')
            user.zipcode = data.get('zipcode')

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

@app.route('/api/vendor-users', methods=['GET'])
def get_vendor_users():
    try:
        vendor_id = request.args.get('vendor_id', type=int)

        if not vendor_id:
            return jsonify({'error': 'Vendor ID is required'}), 400

        vendor_users = VendorUser.query.filter_by(vendor_id=vendor_id).all()

        if not vendor_users:
            return jsonify({'message': 'No team members found for this vendor'}), 404

        return jsonify([{
            'id': vendor_user.id,
            'first_name': vendor_user.first_name,
            'last_name': vendor_user.last_name,
            'email': vendor_user.email,
            'phone': vendor_user.phone,
            'role': 'Admin' if vendor_user.is_admin else 'Employee'
        } for vendor_user in vendor_users]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/vendor-users/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
@jwt_required()
def get_vendor_user(id):
    if not check_role('vendor'):
        return {'error': "Access forbidden: Vendor only"}, 403
    
    if request.method == 'GET':
        vendor_user = VendorUser.query.get(id)
        if not vendor_user:
            return jsonify({'error': 'User not found'}), 404
        profile_data = vendor_user.to_dict()
        return jsonify(profile_data), 200
    
    elif request.method == 'PATCH':
        vendor_user = VendorUser.query.get(id)
        if not vendor_user:
            return jsonify({'error': 'User not found'}), 404

        try:
            data = request.get_json()
            # for key, value in data.items():
            #     setattr(user, key, value)
            vendor_user.first_name = data.get('first_name')
            vendor_user.last_name = data.get('last_name')
            vendor_user.email = data.get('email')
            vendor_user.phone = data.get('phone')

            if 'is_admin' in data:
                if not isinstance(data['is_admin'], bool):
                    return jsonify({'error': 'Invalid value for is_admin, must be true or false'}), 400
                vendor_user.is_admin = data['is_admin']

            if 'vendor_id' in data:
                new_vendor_id = data['vendor_id']
                if new_vendor_id is None:
                    vendor_user.vendor_id = None
                else:
                    vendor = Vendor.query.get(new_vendor_id)
                    if not vendor:
                        return jsonify({'error': 'Invalid vendor_id'}), 400
                    vendor_user.vendor_id = new_vendor_id

            db.session.commit()
            return jsonify(vendor_user.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error updating VendorUser: {str(e)}")
            return jsonify({'error': str(e)}), 500

    elif request.method == 'DELETE':
        vendor_user = VendorUser.query.get(id)
        if not vendor_user:
            return jsonify({'error': 'User not found'}), 404
        
        try:
            db.session.delete(vendor_user)
            db.session.commit()
            return {}, 204
        
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error deleting VendorUser: {str(e)}")
            return jsonify({'error': str(e)}), 500


@app.route('/api/vendor-vendor-users', methods=['GET', 'POST', 'PATCH', 'DELETE'])
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

@app.route('/api/admin-users', methods=['GET', 'POST'])
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
    
@app.route('/api/admin-users/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
@jwt_required()
def handle_admin_user_by_id(id):
    
    if not check_role('admin'):
        return {'error': "Access forbidden: Admin only"}, 403
    
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

@app.route('/api/markets', methods=['GET', 'POST'])
def all_markets():
    if request.method == 'GET':
        markets = Market.query.all()
        return jsonify([market.to_dict() for market in markets]), 200
    
    elif request.method == 'POST':
        data = request.get_json()

        season_start = None
        if data.get('season_start'):
            try:
                season_start = datetime.strptime(data['season_start'], '%Y-%m-%d').date()
            except ValueError:
                return {'error': 'Invalid date format for season_start'}, 400
        
        season_end = None
        if data.get('season_end'):
            try:
                season_end = datetime.strptime(data['season_end'], '%Y-%m-%d').date()
            except ValueError:
                return {'error': 'Invalid date format for season_end'}, 400

        new_market = Market(
            name=data.get('name'),
            location=data.get('location'),
            zipcode=data.get('zipcode'),
            coordinates=data.get('coordinates'),
            schedule=data.get('schedule'),
            year_round=data.get('year_round'),
            season_start=season_start,
            season_end=season_end
        )

        try:
            db.session.add(new_market)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to create market: {str(e)}'}, 500

        return new_market.to_dict(), 201

@app.route('/api/markets/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def market_by_id(id):
    market = Market.query.get(id)
    if not market:
        return {'error': 'Market not found'}, 404

    if request.method == 'GET':
        return market.to_dict(), 200

    elif request.method == 'PATCH':
        data = request.get_json()

        try:
            if 'name' in data:
                market.name = data['name']
            if 'image' in data:
                market.image = data['image']
            if 'location' in data:
                market.location = data['location']
            if 'zipcode' in data:
                market.zipcode = data['zipcode']
            if 'coordinates' in data:
                market.coordinates = data['coordinates']
            if 'schedule' in data:
                market.schedule = data['schedule']
            if 'year_round' in data:
                market.year_round = data['year_round']
            if 'season_start' in data:
                market.season_start = datetime.strptime(data['season_start'], '%Y-%m-%d').date()
            if 'season_end' in data:
                market.season_end = datetime.strptime(data['season_end'], '%Y-%m-%d').date()
            
            db.session.commit()
            return market.to_dict(), 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    elif request.method == 'DELETE':
        try:
            db.session.delete(market)
            db.session.commit()
            return {}, 204
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

@app.route('/api/market-days', methods=['GET', 'POST', 'DELETE'])
def all_market_days():
    if request.method == 'GET':
        market_id = request.args.get('market_id')
        if market_id:
            market_days = MarketDay.query.filter_by(market_id=market_id).all()
        else:
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

@app.route('/api/market-days/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
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
    elif request.method == 'DELETE':
        try:
            db.session.delete(market_day)
            db.session.commit()
            return {}, 204
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
@app.route('/api/vendors', methods=['GET', 'POST', 'PATCH'])
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
        if 'product' in data:
            vendor.product = data['product']
        if 'city' in data:
            vendor.city = data['city']
        if 'state' in data:
            vendor.state = data['state']
        if 'bio' in data:
            vendor.bio = data['bio']
        if 'image' in data: 
            vendor.image = data['image']

        try:
            db.session.commit()
            return jsonify(vendor.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            return {'error': f'Exception: {str(e)}'}, 500

@app.route('/api/vendors/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def vendor_by_id(id):
    vendor = Vendor.query.filter_by(id=id).first()
    if not vendor:
        return {'error': 'vendor not found'}, 404
    if request.method == 'GET':
        vendor_data = vendor.to_dict()
        return jsonify(vendor_data), 200
    elif request.method == 'PATCH':
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
            if 'bio' in data:
                vendor.bio = data['bio']
            if 'image' in data:
                vendor.image = data['image']

            db.session.commit()
            return jsonify(vendor.to_dict()), 200
        except Exception as e: 
            db.session.rollback()
            return {'error': str(e)}, 500
    elif request.method == 'DELETE':
        try:
            db.session.delete(vendor)
            db.session.commit()
            return {}, 204
        except Exception as e:
            db.session.rollback()
            print(f"Exception during DELETE: {e}")
            return {'error': str(e)}, 500

@app.route('/api/vendors/<int:vendor_id>/image', methods=['GET', 'POST'])
def get_vendor_image(vendor_id):
    vendor = Vendor.query.get(vendor_id)
    if vendor and vendor.image:
        try:
            return send_from_directory(app.config['VENDOR_UPLOAD_FOLDER'], vendor.image)
        except FileNotFoundError:
            return {'error': 'Image not found'}, 404
    return {'error': 'Vendor or image not found'}, 404

@app.route('/api/market-reviews', methods=['GET', 'POST', 'DELETE'])
def all_market_reviews():
    if request.method == 'GET':
        market_id = request.args.get('market_id')
        is_reported = request.args.get('is_reported')
        if market_id:
            reviews = MarketReview.query.filter_by(market_id=market_id).options(db.joinedload(MarketReview.user)).all()
        elif is_reported is not None:
            reviews = MarketReview.query.filter_by(is_reported=bool(is_reported)).all()
        else:
            reviews = []  # Default to an empty list if no parameters are provided
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

@app.route('/api/market-reviews/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
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

@app.route('/api/vendor-reviews', methods=['GET', 'POST'])
def all_vendor_reviews():
    if request.method == 'GET':
        vendor_id = request.args.get('vendor_id')
        is_reported = request.args.get('is_reported')
        if vendor_id:
            reviews = VendorReview.query.filter_by(vendor_id=vendor_id).options(db.joinedload(VendorReview.user)).all()
        elif is_reported is not None:
            reviews = VendorReview.query.filter_by(is_reported=bool(is_reported)).all()
        else:
            reviews = []
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


@app.route('/api/vendor-reviews/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
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

@app.route('/api/top-market-reviews', methods=['GET'])
def get_top_market_reviews():
    # Subquery: Calculate total vote_up count per review_id
    vote_up_counts = (
        db.session.query(
            MarketReviewRating.review_id,
            func.count(MarketReviewRating.vote_up).label("vote_up_count")
        )
        .filter(MarketReviewRating.vote_up == True)
        .group_by(MarketReviewRating.review_id)
        .subquery()
    )
    # Fetch all vote_up counts to calculate the 80th percentile manually
    vote_up_values = db.session.query(vote_up_counts.c.vote_up_count).all()
    vote_up_list = [v[0] for v in vote_up_values]
    vote_up_list.sort()

    # Calculate the 80th percentile
    if vote_up_list:
        percentile_index = int(len(vote_up_list) * 0.9) - 1
        percentile_value = vote_up_list[max(0, percentile_index)]
    else:
        percentile_value = 0
    # print("Percentile value for top reviews:", percentile_value)
    # Get reviews with vote_up_count in the top 20%
    top_reviews = (
        db.session.query(MarketReview)
        .join(vote_up_counts, MarketReview.id == vote_up_counts.c.review_id)
        .filter(vote_up_counts.c.vote_up_count >= percentile_value)
        .order_by(desc(vote_up_counts.c.vote_up_count))
        .all()
    )
    # Convert the reviews to dictionaries for JSON response
    response_data = [review.to_dict() for review in top_reviews]
    return jsonify(response_data)


@app.route('/api/top-vendor-reviews', methods=['GET'])
def get_top_vendor_reviews():
    # Subquery: Calculate total vote_up count per review_id
    vote_up_counts = (
        db.session.query(
            VendorReviewRating.review_id,
            func.count(VendorReviewRating.vote_up).label("vote_up_count")
        )
        .filter(VendorReviewRating.vote_up == True)
        .group_by(VendorReviewRating.review_id)
        .subquery()
    )
    # Fetch all vote_up counts to calculate the 80th percentile manually
    vote_up_values = db.session.query(vote_up_counts.c.vote_up_count).all()
    vote_up_list = [v[0] for v in vote_up_values]
    vote_up_list.sort()
    # Calculate the 80th percentile
    if vote_up_list:
        percentile_index = int(len(vote_up_list) * 0.9) - 1
        percentile_value = vote_up_list[max(0, percentile_index)]
    else:
        percentile_value = 0
    # Get reviews with vote_up_count in the top 20%
    top_reviews = (
        db.session.query(VendorReview)
        .join(vote_up_counts, VendorReview.id == vote_up_counts.c.review_id)
        .filter(vote_up_counts.c.vote_up_count >= percentile_value)
        .order_by(desc(vote_up_counts.c.vote_up_count))
        .all()
    )
    print("Percentile value for top reviews:", percentile_value)
    # Convert the reviews to dictionaries for JSON response
    response_data = [review.to_dict() for review in top_reviews]
    return jsonify(response_data)


@app.route('/api/reported-reviews', methods=['GET', 'POST'])
def all_reported_reviews():
    if request.method == 'GET':
        user_id = request.args.get('user_id')
        if user_id:
            reviews = ReportedReview.query.filter_by(user_id=user_id).all()
        else:
            reviews = ReportedReview.query.all()
        return jsonify([review.to_dict() for review in reviews]), 200
    elif request.method == 'POST':
        data = request.get_json()
        new_reported_review = ReportedReview(
            user_id=data['user_id']
        )
        db.session.add(new_reported_review)
        db.session.commit()
        return new_reported_review.to_dict(), 201

@app.route('/api/market-review-ratings', methods=['GET', 'POST', 'DELETE'])
def all_market_review_ratings():
    if request.method == 'GET':
        review_id = request.args.get('review_id')
        user_id = request.args.get('user_id')
        if review_id:
            reviews = MarketReviewRating.query.filter_by(review_id=review_id).all()
        elif user_id:
            reviews = MarketReviewRating.query.filter_by(user_id=user_id).all()
        else:
            reviews = MarketReviewRating.query.all()
        return jsonify([review.to_dict() for review in reviews]), 200
    elif request.method == 'POST':
        data = request.get_json()
        new_review_rating = MarketReviewRating(
            review_id=data['review_id'],
            user_id=data['user_id'],
            vote_down=data['vote_down'],
            vote_up=data['vote_up']
        )
        db.session.add(new_review_rating)
        db.session.commit()
        return new_review_rating.to_dict(), 201

@app.route('/api/market-review-ratings/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def market_review_rating_by_id(id):
    rating = MarketReviewRating.query.filter(MarketReviewRating.id == id).first()
    if not rating:
        return {'error': 'review not found'}, 404
    if request.method == 'GET':
        return rating.to_dict(), 200
    elif request.method == 'PATCH':
        data = request.get_json()
        for key, value in data.items():
            setattr(rating, key, value)
        db.session.commit()
        return rating.to_dict(), 200
    elif request.method == 'DELETE':
        db.session.delete(rating)
        db.session.commit()
        return {}, 204
    
@app.route('/api/vendor-review-ratings', methods=['GET', 'POST', 'DELETE'])
def all_vendor_review_ratings():
    if request.method == 'GET':
        review_id = request.args.get('review_id')
        user_id = request.args.get('user_id')
        if review_id:
            reviews = VendorReviewRating.query.filter_by(review_id=review_id).all()
        elif user_id:
            reviews = VendorReviewRating.query.filter_by(user_id=user_id).all()
        else:
            reviews = VendorReviewRating.query.all()
        return jsonify([review.to_dict() for review in reviews]), 200
    elif request.method == 'POST':
        data = request.get_json()
        new_review_rating = VendorReviewRating(
            review_id=data['review_id'],
            user_id=data['user_id'],
            vote_down=data['vote_down'],
            vote_up=data['vote_up']
        )
        db.session.add(new_review_rating)
        db.session.commit()
        return new_review_rating.to_dict(), 201

@app.route('/api/vendor-review-ratings/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def vendor_review_rating_by_id(id):
    rating = VendorReviewRating.query.filter(VendorReviewRating.id == id).first()
    if not rating:
        return {'error': 'review not found'}, 404
    if request.method == 'GET':
        return rating.to_dict(), 200
    elif request.method == 'PATCH':
        data = request.get_json()
        for key, value in data.items():
            setattr(rating, key, value)
        db.session.commit()
        return rating.to_dict(), 200
    elif request.method == 'DELETE':
        db.session.delete(rating)
        db.session.commit()
        return {}, 204

@app.route('/api/market-favorites', methods=['GET', 'POST'])
def all_market_favorites():
    if request.method == 'GET':
        user_id = request.args.get('user_id')
        query = MarketFavorite.query
        if user_id:
            query = query.filter_by(user_id=user_id).all()
        return jsonify([q.to_dict() for q in query]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        new_market_favorite = MarketFavorite(
            user_id=data['user_id'],
            market_id=data['market_id']
        )
        db.session.add(new_market_favorite)
        db.session.commit()
        return new_market_favorite.to_dict(), 201
    
@app.route('/api/market-favorites/<int:id>', methods=['GET', 'DELETE'])
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

@app.route('/api/vendor-favorites', methods=['GET', 'POST'])
def all_vendor_favorites():
    if request.method == 'GET':
        user_id = request.args.get('user_id')

        query = VendorFavorite.query
        if user_id:
            query = query.filter_by(user_id=user_id).all()
        return jsonify([q.to_dict() for q in query]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        new_vendor_favorite = VendorFavorite(
            user_id=data['user_id'],
            vendor_id=data['vendor_id']
        )
        db.session.add(new_vendor_favorite)
        db.session.commit()
        return new_vendor_favorite.to_dict(), 201
    
@app.route('/api/vendor-favorites/<int:id>', methods=['GET', 'DELETE'])
def del_vendor_fav(id):
    vendorFav = VendorFavorite.query.filter(VendorFavorite.id == id).first()
    if request.method == 'GET':
        user_id = request.args.get('user_id')
        return vendorFav.to_dict(), 200
    if request.method == 'DELETE':
        db.session.delete(vendorFav)
        db.session.commit()
        return {}, 204
    
@app.route('/api/vendor-markets', methods=['GET', 'POST'])
def get_vendor_markets():
    if request.method == 'GET':
        vendor_id = request.args.get('vendor_id')
        market_id = request.args.get('market_id')

        query = VendorMarket.query

        if vendor_id: 
            query = query.filter_by(vendor_id=vendor_id).options(db.joinedload(VendorMarket.vendor))
        elif market_id: 
            query = query.filter_by(market_id=market_id).options(db.joinedload(VendorMarket.market))

        vendor_markets = query.all()
        
        return jsonify([vendor_market.to_dict() for vendor_market in vendor_markets]), 200
    elif request.method == 'POST':
        data = request.get_json()
        print("Received data:", data)
        new_vendor_market = VendorMarket(
            vendor_id=data['vendor_id'],
            market_day_id=data['market_day_id']
        )
        db.session.add(new_vendor_market)
        db.session.commit()
        return new_vendor_market.to_dict(), 201


@app.route('/api/vendor-markets/<int:id>', methods=['GET', 'DELETE'])
def delete_vendor_market(id):
    vendorMarket = VendorMarket.query.filter(VendorMarket.id == id).first()
    if request.method == 'GET':
        return vendorMarket.to_dict(), 200
    if request.method == 'DELETE':
        db.session.delete(vendorMarket)
        db.session.commit()
        return {}, 204

@app.route('/api/events', methods=['GET', 'POST'])
def all_events():
    if request.method == 'GET':
        try:
            vendor_id = request.args.get('vendor_id', type=int)
            query = Event.query
            if vendor_id:
                query = query.filter_by(vendor_id=vendor_id)
            events = query.all()
            return jsonify([event.to_dict() for event in events]), 200
        except Exception as e:
            app.logger.error(f'Error fetching events: {e}')  
            return {'error': f'Exception: {str(e)}'}, 500
        
    elif request.method == 'POST':
        data = request.get_json()
        print("Received data:", data)
        try:
            start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
            end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
        except ValueError as e:
            return jsonify({"error": f"Invalid time format: {str(e)}"}), 400
        
        new_event = Event(
            title=data['title'],
            message=data['message'],
            start_date=start_date,
            end_date=end_date
        )
        if 'vendor_id' in data:
            new_event.vendor_id = data['vendor_id']
        if 'market_id' in data:
            new_event.market_id = data['market_id']
        
        db.session.add(new_event)
        db.session.commit()
        return new_event.to_dict(), 201

@app.route('/api/events/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def event_by_id(id):
    event = Event.query.filter(Event.id == id).first()
    if not event:
        return {'error': 'event not found'}, 404
    if request.method == 'GET':
        return event.to_dict(), 200
    elif request.method == 'PATCH':
        if not event:
            return {'error': 'user not found'}, 404
        try:
            data = request.get_json()
            event.title=data['title']
            event.message=data['message']
            if data.get('start_date'):
                event.season_start = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
            if data.get('end_date'):
                event.season_end = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()            
            if 'vendor_id' in data:
                event.vendor_id = data['vendor_id']
            if 'market_id' in data:
                event.market_id = data['market_id']
            db.session.add(event)
            db.session.commit()
            return event.to_dict(), 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    elif request.method == 'DELETE':
        db.session.delete(event)
        db.session.commit()
        return {}, 204
        
@app.route('/api/baskets', methods=['GET', 'POST', 'PATCH', 'DELETE'])
def handle_baskets():
    if request.method == 'GET':
        try:
            market_day_id = request.args.get('market_day_id', type=int)
            vendor_id = request.args.get('vendor_id', type=int)
            sale_date = request.args.get('sale_date', type=str)

            query = Basket.query

            if market_day_id is not None:
                query = query.filter_by(market_day_id=market_day_id)
            if vendor_id is not None:
                query = query.filter_by(vendor_id=vendor_id)
            if sale_date is not None:
                try:
                    from datetime import datetime
                    sale_date_obj = datetime.strptime(sale_date, '%Y-%m-%d').date()
                    query = query.filter_by(sale_date=sale_date_obj)
                except ValueError:
                    return jsonify({'error': 'Invalid date format. Expected format: YYYY-MM-DD'}), 400

            saved_baskets = query.all()

            if not saved_baskets:
                return jsonify([]), 200

            app.logger.debug(f"Found {len(saved_baskets)} baskets.")
            return jsonify([basket.to_dict() for basket in saved_baskets]), 200

        except Exception as e:
            return jsonify({'message': 'No saved baskets found'}), 200

    elif request.method == 'POST':
        data = request.get_json()
        app.logger.debug(f'Received data for new basket: {data}')
        
        sale_date = None
        pickup_start = None
        pickup_end = None

        try:
            if 'sale_date' in data:
                try:
                    from datetime import datetime
                    sale_date = datetime.strptime(data['sale_date'], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({'error': 'Invalid sale_date format. Expected YYYY-MM-DD.'}), 400

            if 'pickup_start' in data:
                try:
                    from datetime import datetime
                    pickup_start = datetime.strptime(data['pickup_start'], '%H:%M %p').time()
                except ValueError:
                    return jsonify({'error': 'Invalid pickup_start format. Expected HH:MM AM/PM.'}), 400
            
            if 'pickup_end' in data:
                try:
                    from datetime import datetime
                    pickup_end = datetime.strptime(data['pickup_end'], '%H:%M %p').time()
                except ValueError:
                    return jsonify({'error': 'Invalid pickup_end format. Expected HH:MM AM/PM.'}), 400

            try:
                price = float(data['price'])
                if price < 0:
                    return {'error': 'Price must be a non-negative number'}, 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid price format. Must be a positive number.'}), 400

            try:
                basket_value = float(data['basket_value'])
                if basket_value < 0:
                    return {'error': 'basket_value must be a non-negative number'}, 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid basket_value format. Must be a number.'}), 400

            new_basket = Basket(
                vendor_id=data['vendor_id'],
                market_day_id=data['market_day_id'],
                sale_date=sale_date,
                pickup_start=pickup_start,
                pickup_end=pickup_end,
                price=price,
                basket_value=basket_value,
                is_sold=data.get('is_sold', False),
                is_grabbed=data.get('is_grabbed', False)
            )
            db.session.add(new_basket)
            db.session.commit()
            return jsonify(new_basket.to_dict()), 201

        except Exception as e:
            db.session.rollback()
            app.logger.error(f'Error creating basket: {e}')
            return jsonify({'error': 'Failed to create basket due to a server error.'}), 500

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
            if 'market_day_id' in data:
                basket.market_day_id = data['market_day_id']
            if 'sale_date' in data:
                basket.sale_date = datetime.strptime(data['sale_date'], '%Y-%m-%d').date()
            if 'pickup_start' in data:
                basket.pickup_start = datetime.strptime(data['pickup_start'], '%I:%M %p').time()
            if 'pickup_end' in data:
                basket.pickup_end = datetime.strptime(data['pickup_end'], '%I:%M %p').time()
            if 'is_sold' in data:
                basket.is_sold = data['is_sold']
            if 'is_grabbed' in data:
                basket.is_grabbed = data['is_grabbed']
            if 'price' in data:
                basket.price = data['price']
            if 'basket_value' in data:
                basket.basket_value = data['basket_value']

            db.session.commit()
            return jsonify(basket.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    elif request.method == 'DELETE':
        vendor_id = request.args.get('vendor_id', type=int)
        market_day_id = request.args.get('market_day_id', type=int)
        sale_date = request.args.get('sale_date', type=str)

        if not vendor_id or not market_day_id or not sale_date:
            return jsonify({"error": "Missing query parameters"}), 400

    try:
        from datetime import datetime
        sale_date = datetime.strptime(sale_date, '%Y-%m-%d').date()

        deleted_count = Basket.query.filter(
            Basket.vendor_id == vendor_id,
            Basket.market_day_id == market_day_id,
            Basket.sale_date == sale_date
        ).delete()

        db.session.commit()

        if deleted_count > 0:
            return jsonify({"message": "Baskets deleted successfully"}), 200
        else:
            return jsonify({"message": "No baskets found matching criteria"}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
        
@app.route('/api/baskets/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
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

@app.route('/api/todays-baskets', methods=['GET'])
def handle_todays_baskets():
    try:
        today_str = request.args.get('date', type=str)
        if not today_str:
            return jsonify({'error': 'Date parameter is required'}), 400
        try:
            today = datetime.strptime(today_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Expected YYYY-MM-DD.'}), 400

        vendor_id = request.args.get('vendor_id', type=int)
        user_id = request.args.get('user_id', type=int)
        if not vendor_id and not user_id:
            return jsonify({'error': 'At least one of vendor_id or user_id is required'}), 400

        query = db.session.query(Basket).filter(func.date(Basket.sale_date) == today)
        if vendor_id:
            query = query.filter(Basket.vendor_id == vendor_id)
        if user_id:
            query = query.filter(Basket.user_id == user_id)
        baskets = query.all()

        if not baskets:
            return jsonify({'message': 'No baskets found for today'}), 404

        return jsonify([basket.to_dict() for basket in baskets]), 200

    except ValueError as ve:
        app.logger.error(f"Value error in fetching today's baskets: {ve}")
        return jsonify({'error': f'Value error: {str(ve)}'}), 400
    except Exception as e:
        app.logger.error(f"Error fetching today's baskets: {e}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500



@app.route('/api/baskets/user-sales-history', methods=['GET'])
@jwt_required()
def get_user_sales_history():
    current_user_id = get_jwt_identity()

    if not current_user_id:
        return {'error': 'User not logged in'}, 401
    
    try: 
        baskets = Basket.query.filter_by(user_id=current_user_id, is_sold=True).all()
        # app.logger.info(f"Fetched baskets: {baskets}")

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
    
@app.route('/api/baskets/vendor-sales-history', methods=['GET'])
@jwt_required()
def get_vendor_sales_history():
    try:
        current_vendor_id = get_jwt_identity()
        if not current_vendor_id:
            return {'error': 'User not logged in'}, 401

        baskets = Basket.query.filter_by(vendor_id=current_vendor_id).all()

        sales_history = {}
        for basket in baskets:
            sale_date = basket.sale_date
            market_day_id = basket.market_day_id

            if (sale_date, market_day_id) not in sales_history:
                sales_history[(sale_date, market_day_id)] = {
                    "vendor_name": basket.vendor.name,
                    "vendor_id": basket.vendor.id,
                    "sale_date": sale_date.strftime('%Y-%m-%d'),
                    "market_name": basket.market_day.markets.name if basket.market_day else None,
                    "market_id": basket.market_day.markets.id if basket.market_day else None,
                    "basket_value": basket.basket_value,
                    "price": basket.price,
                    "pickup_start": basket.pickup_start.strftime('%H:%M'),
                    "pickup_end": basket.pickup_end.strftime('%H:%M'),
                    "available_baskets": 0,
                    "sold_baskets": 0,
                }

            sales_history[(sale_date, market_day_id)]["available_baskets"] += 1
            if basket.is_sold:
                sales_history[(sale_date, market_day_id)]["sold_baskets"] += 1

        vendor_sales_history = list(sales_history.values())
        return jsonify(vendor_sales_history), 200

    except Exception as e:
        app.logger.error(f"Error fetching sales history: {e}")
        return {'error': f"Exception: {str(e)}"}, 500

@app.route('/api/products', methods=['GET', 'POST'])
def all_products():
    if request.method == 'GET':
        products = Product.query.all()
        return jsonify([product.to_dict() for product in products]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        new_product = Product(
            product=data.get('product'),
        )
        try:
            db.session.add(new_product)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to create market: {str(e)}'}, 500

        return new_product.to_dict(), 201
    
@app.route('/api/products/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def product(id):
    if request.method == 'GET':
        product = Product.query.filter_by(id=id).first()
        if not product:
            return {'error': 'product not found'}, 404
        product_data = product.to_dict()
        return jsonify(product_data), 200

    elif request.method == 'PATCH':
        product = Product.query.filter_by(id=id).first()
        if not product:
            return {'error': 'product not found'}, 404
        try:
            data = request.get_json()
            # for key, value in data.items():
            #     setattr(user, key, value)
            product.product = data.get('product')

            db.session.commit()
            return jsonify(product.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
    elif request.method == 'DELETE':
        product = Product.query.filter_by(id=id).first()
        if not product: 
            return {'error': 'user not found'}, 404
        
        try: 
            db.session.delete(product)
            db.session.commit()
            return {}, 204
        
        except Exception as e: 
            db.session.rollback()
            return {'error': str(e)}, 500

@app.route('/api/qr-codes', methods=['GET', 'POST'])
def qr_codes():
    if request.method == 'GET':
        user_id = request.args.get('user_id', type=int)
        qr_code = request.args.get('qr_code', type=str)
        query = QRCode.query
        if user_id:
            query = query.filter(QRCode.user_id == user_id)
        if qr_code:
            query = query.filter(QRCode.qr_code == qr_code)
        qr_codes = query.all()
        return jsonify([qr_code.to_dict() for qr_code in qr_codes]), 200

    elif request.method == 'POST':
        data = request.get_json()
        new_qr_code = QRCode(
            qr_code=data.get('qr_code'),
            user_id=data.get('user_id'),
            basket_id=data.get('basket_id')
        )
        try:
            db.session.add(new_qr_code)
            db.session.commit()
            return jsonify(new_qr_code.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to create QR code: {str(e)}'}, 500


# Email Form
@app.route('/api/contact', methods=['POST'])
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

@app.route('/api/create-checkout-session', methods=['POST'])
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

@app.route('/api/session-status', methods=['GET'])
def session_status():
  session = stripe.checkout.Session.retrieve(request.args.get('session_id'))
  return jsonify(status=session.status, customer_email=session.customer_details.email)

# Password reset for User
@app.route('/api/user/password-reset-request', methods=['POST'])
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

@app.route('/api/user/password-reset/<token>', methods=['GET', 'POST'])
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
@app.route('/api/vendor/password-reset-request', methods=['POST'])
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

@app.route('/api/vendor/password-reset/<token>', methods=['GET', 'POST'])
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
@app.route('/api/admin/password-reset-request', methods=['POST'])
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


@app.route('/api/admin/password-reset/<token>', methods=['GET', 'POST'])
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

@app.route('/api/user-notifications', methods=['GET'])
def get_user_notifications():
    if request.method == 'GET':
        notifications = UserNotification.query.all()
        return jsonify([notif.to_dict() for notif in notifications]), 200
    
@app.route('/api/user-notifications/<int:id>', methods=['DELETE'])
def delete_user_notifications(id):
    if request.method == 'DELETE':
        notification = UserNotification.query.filter_by(id=id).first()

        if not notification:
            return jsonify({'message': 'No notifications found'}), 404

        notification_data = {'id': notification.id, 'message': notification.message}
        
        db.session.delete(notification)
        db.session.commit()
        return jsonify({'notifications': notification_data})

@app.route('/api/create-vendor-notification', methods=['POST'])
def create_vendor_notification():
    data = request.get_json()

    if not data or 'message' not in data or 'vendor_id' not in data or 'vendor_user_id' not in data:
        return jsonify({'message': 'Invalid request data.'}), 400

    try:
        new_notification = VendorNotification(
            message=data['message'],
            vendor_id=data['vendor_id'],
            vendor_user_id=data['vendor_user_id'],
            created_at=datetime.utcnow(),
            is_read=False
        )
        db.session.add(new_notification)
        db.session.commit()

        return jsonify({
            'id': new_notification.id,
            'message': new_notification.message,
            'vendor_id': new_notification.vendor_id,
            'vendor_user_id': new_notification.vendor_user_id,
            'is_read': new_notification.is_read
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating notification: {str(e)}")
        return jsonify({'message': f'Error creating notification: {str(e)}'}), 500
    
# @app.route('/api/delete-vendor-notification', methods=['DELETE'])
# def delete_notification():
#     data = request.get_json()

#     if not data or 'id' not in data:
#         print("Received data:", data)
#         return jsonify({'message': 'Invalid request data.'}), 400

#     try:
#         notification = VendorNotification.query.get(data['notification_id'])

#         if not notification:
#             return jsonify({'message': 'Notification not found.'}), 404

#         db.session.delete(notification)
#         db.session.commit()

#         return jsonify({'message': 'Notification deleted successfully.'}), 200

#     except Exception as e:
#         db.session.rollback()
#         print(f"Error deleting notification: {str(e)}")
#         return jsonify({'message': f'Error deleting notification: {str(e)}'}), 500

@app.route('/api/vendor-notifications', methods=['GET'])
def fetch_vendor_notifications():
    vendor_id = request.args.get('vendor_id')
    vendor_user_id = request.args.get('vendor_user_id')
    is_read = request.args.get('is_read', None)

    query = VendorNotification.query

    if vendor_id:
        query = query.filter_by(vendor_id=vendor_id)
    if vendor_user_id:
        query = query.filter_by(vendor_user_id=vendor_user_id)
    if is_read is not None:
        is_read_bool = is_read.lower() == 'true'
        query = query.filter_by(is_read=is_read_bool)

    notifications = query.order_by(VendorNotification.created_at.desc()).all()

    notifications_data = [ { 'id': n.id, 'message': n.message, 'is_read': n.is_read, 'vendor_id': n.vendor_id, 'vendor_user_id': n.vendor_user_id, 
        'created_at': n.created_at, 'vendor_name': Vendor.query.get(n.vendor_id).name if Vendor.query.get(n.vendor_id) else 'Unknown Vendor', } for n in notifications ]
    
    return jsonify({'notifications': notifications_data}), 200

@app.route('/api/vendor-notification/<int:id>', methods=['DELETE'])
def delete_notification(id):
    if request.method == 'DELETE':
        notification = VendorNotification.query.filter_by(id=id).first()

        if not notification:
            return jsonify({'message': 'No notifications found'}), 404

        notification_data = {'id': notification.id, 'message': notification.message}
        
        db.session.delete(notification)
        db.session.commit()
        return jsonify({'notifications': notification_data}) 
    
@app.route('/api/vendor-notifications/vendor/<int:vendor_id>', methods=['GET'])
def get_vendor_notifications(vendor_id):
    notifications = VendorNotification.query.filter_by(vendor_id=vendor_id, is_read=False).all()

    notifications_data = [{'id': n.id, 'message': n.message, 'vendor_id': n.vendor_id, 'vendor_user_id': n.vendor_user_id} for n in notifications]
    return jsonify({'notifications': notifications_data}), 200

@app.route('/api/vendor-notifications/vendor-user/<int:vendor_user_id>', methods=['GET'])
def get_vendor_user_notifications(vendor_user_id):
    is_pending = request.args.get('is_pending', None)

    if is_pending:
        notifications = VendorNotification.query.filter_by(vendor_user_id=vendor_user_id, is_read=False).all()
    else:
        notifications = VendorNotification.query.filter_by(vendor_user_id=vendor_user_id).all()

    notifications_data = []
    for n in notifications:
        vendor = Vendor.query.get(n.vendor_id)
        notifications_data.append({
            'id': n.id,
            'message': n.message,
            'is_read': n.is_read,
            'vendor_id': n.vendor_id,
            'vendor_name': vendor.name if vendor else 'Unknown Vendor',
        })
    return jsonify({'notifications': notifications_data}), 200

@app.route('/api/vendor-notifications/<int:notification_id>/approve', methods=['POST'])
def approve_notification(notification_id):
    data = request.get_json()
    is_admin = data.get('is_admin')

    notification = VendorNotification.query.get(notification_id)
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

@app.route('/api/vendor-notifications/<int:notification_id>/reject', methods=['DELETE'])
def reject_notification(notification_id):
    notification = VendorNotification.query.get(notification_id)
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404

    db.session.delete(notification)
    db.session.commit()

    return jsonify({'message': 'Notification rejected successfully'}), 200

@app.route('/api/create-admin-notification', methods=['POST'])
def create_admin_notification():
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({'message': 'Invalid request data.'}), 400

    try:
        new_notification = AdminNotification(
            message=data['message'],
            vendor_user_id=data['vendor_user_id'],
            vendor_id=data['vendor_id'],
            created_at=datetime.utcnow(),
            is_read=False
        )
        db.session.add(new_notification)
        db.session.commit()

        response_data = {
            'id': new_notification.id,
            'message': new_notification.message,
            'is_read': new_notification.is_read
        }

        if new_notification.vendor_id is not None:
            response_data['vendor_id'] = new_notification.vendor_id
        if new_notification.vendor_user_id is not None:
            response_data['vendor_user_id'] = new_notification.vendor_user_id

        return jsonify(response_data), 201


    except Exception as e:
        db.session.rollback()
        print(f"Error creating notification: {str(e)}")
        return jsonify({'message': f'Error creating notification: {str(e)}'}), 500


@app.route('/api/admin-notifications', methods=['GET'])
def get_admin_notifications():
    if request.method == 'GET':
        notifications = AdminNotification.query.all()
        return jsonify([notif.to_dict() for notif in notifications]), 200
    
@app.route('/api/admin-notifications/<int:id>', methods=['DELETE'])
def delete_admin_notifications(id):
    if request.method == 'DELETE':
        notification = AdminNotification.query.filter_by(id=id).first()

        if not notification:
            return jsonify({'message': 'No notifications found'}), 404

        notification_data = {'id': notification.id, 'message': notification.message}
        
        db.session.delete(notification)
        db.session.commit()
        return jsonify({'notifications': notification_data})

if __name__ == '__main__':
    app.run(port=5555, debug=True)