import os
import json
import smtplib
from flask import Flask, request, jsonify, session, send_from_directory, redirect, url_for
from models import ( db, User, Market, MarketDay, Vendor, MarketReview, 
                    VendorReview, ReportedReview, MarketReviewRating, 
                    VendorReviewRating, MarketFavorite, VendorFavorite, 
                    VendorMarket, VendorUser, AdminUser, Basket, Event, 
                    Product, UserNotification, VendorNotification, 
                    AdminNotification, QRCode, FAQ, Blog, BlogFavorite,
                    Receipt, SettingsUser, SettingsVendor, SettingsAdmin, 
                    bcrypt )
from dotenv import load_dotenv
from sqlalchemy import func, desc
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from sqlalchemy.dialects.postgresql import JSONB
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
import utils.events as events
from utils.emails import send_contact_email, send_user_password_reset_email, send_vendor_password_reset_email, send_admin_password_reset_email, send_user_confirmation_email, send_vendor_confirmation_email, send_admin_confirmation_email
import subprocess
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

load_dotenv()

app = Flask(__name__)

USER_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/user-images')
VENDOR_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/vendor-images')
MARKET_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/market-images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'svg', 'heic'}
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
        "avatar-apricot-1.jpg", "avatar-avocado-1.jpg", "avatar-cabbage-1.jpg", 
        "avatar-kiwi-1.jpg", "avatar-kiwi-2.jpg", "avatar-lime-1.jpg", "avatar-melon-1.jpg",
        "avatar-mangosteen-1.jpg", "avatar-mangosteen-2.jpg", "avatar-nectarine-1.jpg", 
        "avatar-onion-1.jpg", "avatar-onion-2.jpg", "avatar-onion-3.jpg", "avatar-peach-1.jpg", 
        "avatar-pomegranate-1.jpg", "avatar-radish-1.jpg", "avatar-tomato-1.jpg",
        "avatar-watermelon-1.jpg"
    ]

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def resize_image(image, max_size=MAX_SIZE, resolution=MAX_RES, step=0.9):
    image.thumbnail(resolution, Image.LANCZOS)

    temp_output = BytesIO()

    if image.format == 'PNG':
        image.save(temp_output, format='PNG', optimize=True)
    else:
        image.save(temp_output, format='JPEG', quality=50)

    file_size = temp_output.tell()

    while file_size > max_size:
        temp_output = BytesIO()
        if image.format == 'PNG':
            image.save(temp_output, format='PNG', optimize=True)
        else:
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

        # Check whether the upload is for a user, vendor, or market
        user_id = request.form.get('user_id')
        vendor_id = request.form.get('vendor_id')
        market_id = request.form.get('market_id')
        upload_type = request.form.get('type')
        if upload_type == 'vendor':
            upload_folder = os.path.join(os.getcwd(), f'../client/public/vendor-images/{vendor_id}')
        elif upload_type == 'market':
            upload_folder = os.path.join(os.getcwd(), f'../client/public/market-images/{market_id}')
        elif upload_type == 'user':
            upload_folder = os.path.join(os.getcwd(), f'../client/public/user-images/{user_id}')
        else:
            return {'error': 'Invalid type specified. Must be "vendor", "market", or "user"'}, 400

        # Ensure the upload folder exists
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        # Check if there's an existing image and delete it
        existing_files = [f for f in os.listdir(upload_folder) if os.path.isfile(os.path.join(upload_folder, f))]
        for existing_file in existing_files:
            os.remove(os.path.join(upload_folder, existing_file))
            print(f"Deleted existing file: {existing_file}")

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
            if upload_type == 'user':
                user_id = request.form.get('user_id')
                if not user_id:
                    return {'error': 'User ID is required'}, 400

                user = User.query.get(user_id)
                if not user:
                    return {'error': 'User not found'}, 404

                user.avatar = f'{user_id}/{os.path.basename(file_path)}'
                db.session.commit()

            elif upload_type == 'vendor':
                vendor_id = request.form.get('vendor_id')
                if not vendor_id:
                    return {'error': 'Vendor ID is required'}, 400

                vendor = Vendor.query.get(vendor_id)
                if not vendor:
                    return {'error': 'Vendor not found'}, 404

                vendor.image = f'{vendor_id}/{os.path.basename(file_path)}'
                db.session.commit()

            elif upload_type == 'market':
                market_id = request.form.get('market_id')
                if not market_id:
                    return {'error': 'Market ID is required'}, 400

                market = Market.query.get(market_id)
                if not market:
                    return {'error': 'Market not found'}, 404

                market.image = f'{market_id}/{os.path.basename(file_path)}'
                db.session.commit()

            return {'message': 'File successfully uploaded', 'filename': os.path.basename(file_path)}, 201

        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to upload image: {str(e)}'}, 500

    return {'error': 'File type not allowed'}, 400

@app.route('/api/delete-image', methods=['DELETE'])
@jwt_required()
def delete_image():
    if not (check_role('admin') or check_role('vendor') or check_role('user')):
        return {'error': "Access forbidden: Unauthorized user"}, 403

    data = request.get_json()
    filename = data.get('filename')
    file_type = data.get('type')

    if not filename or not file_type:
        return {'error': 'Filename and type are required'}, 400

    # Get relevant ID based on the type
    user_id = data.get('user_id')
    vendor_id = data.get('vendor_id')
    market_id = data.get('market_id')

    # Base directory for your project
    base_dir = os.path.abspath(os.path.join(os.getcwd(), "../client/public"))

    # Determine the upload folder based on the type
    if file_type == 'vendor' and vendor_id:
        upload_folder = os.path.join(base_dir, f'vendor-images/{vendor_id}')
    elif file_type == 'market' and market_id:
        upload_folder = os.path.join(base_dir, f'market-images/{market_id}')
    elif file_type == 'user' and user_id:
        upload_folder = os.path.join(base_dir, f'user-images/{user_id}')
    else:
        return {'error': 'Invalid type or missing ID. Ensure "type" and respective ID are provided.'}, 400

    # Ensure filename doesn't include the folder path again
    file_path = os.path.join(upload_folder, os.path.basename(filename))

    try:
        print(f"Attempting to delete: {file_path}")  # Log the constructed file path

        if os.path.exists(file_path):
            os.remove(file_path)

            # Update the database to clear the reference
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
            elif file_type == 'user':
                user = User.query.filter_by(avatar=filename).first()
                if user:
                    user.avatar = None
                    db.session.commit()

            return {'message': 'Image deleted successfully'}, 200
        else:
            return {'error': f'File not found at path: {file_path}'}, 404

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
        elif os.path.exists(os.path.join(USER_UPLOAD_FOLDER, filename)):
            return send_from_directory(USER_UPLOAD_FOLDER, filename)
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
        return {'error': ' Incorrect email or password—or both!'}, 401
    
    if user.status == "banned":
        return {'error': ' Account is banned. Please contact support.'}, 403
    
    if not user.authenticate(data['password']):
        return {'error': ' Incorrect email or password—or both!'}, 401
    
    user.last_login = datetime.utcnow()
    user.login_count = (user.login_count or 0) + 1

    db.session.commit()
    
    access_token = create_access_token(identity=user.id, expires_delta=timedelta(hours=12), additional_claims={"role": "user"})
    
    return jsonify(access_token=access_token, user_id=user.id), 200

@app.route('/api/logout', methods=['DELETE'])
def logout():
    session.pop('user_id', None)
    return {}, 204

@app.route('/api/change-email', methods=['POST'])
def change_email():
    try:
        data = request.get_json()

        email = data.get('email')
        if not email:
            return jsonify({'error': 'Email is required'}), 400

        result = send_user_confirmation_email(email, data)

        if 'error' in result:
            return jsonify({"error": result["error"]}), 500

        return jsonify({"message": result["message"]}), 200

    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'This email is already registered. Please log in or use a different email.'}), 400

        all_users = User.query.all()
        for user in all_users:
            if bcrypt.check_password_hash(user.password, password):
                return jsonify({'error': 'This password has already been used. Please choose a different password.'}), 400

        result = send_user_confirmation_email(email, data)

        if 'error' in result:
            return jsonify({"error": result["error"]}), 500

        return jsonify({"message": result["message"]}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/user/confirm-email/<token>', methods=['GET', 'POST', 'PATCH'])
def confirm_email(token):
    try:
        # Decode the token (itsdangerous generates URL-safe tokens by default)
        print(f"Received token: {token}")
        data = serializer.loads(token, salt='user-confirmation-salt', max_age=3600)

        user_id = data.get('user_id')  # Extract user ID
        email = data.get('email')  # Extract new email

        if request.method == 'GET':
            print(f"GET request: Token verified, email extracted: {email}")
            return redirect(f'http://localhost:5173/user/confirm-email/{token}')

        if request.method == 'POST':
            print(f"POST request: Token verified, user data extracted: {data}")

            # Check if the user already exists by ID
            existing_user = User.query.get(user_id)

            if existing_user:
                # If user exists, update the email instead of creating a new account
                print(f"POST request: User {user_id} exists, updating email to {email}")

                # Prevent duplicate email usage
                if User.query.filter(User.email == email, User.id != user_id).first():
                    return jsonify({"error": "This email is already in use by another account."}), 400

                existing_user.email = email
                existing_user.email_verified = False  # Require re-verification
                db.session.commit()

                return jsonify({
                    "message": "Email updated successfully. Verification required for the new email.",
                    "isNewUser": False,
                    "user_id": existing_user.id,
                    "email": existing_user.email
                }), 200

            # If the user does not exist, prevent creating a new account without required fields
            if "password" not in data:
                print("POST request failed: Missing password field for new account creation.")
                return jsonify({"error": "Password is required to create a new account."}), 400

            # Create a new user (only if password and required fields exist)
            new_user = User(
                email=email,
                password=data['password'],
                first_name=data.get('first_name', ""),
                last_name=data.get('last_name', ""),
                phone=data.get('phone', ""),
                address_1=data.get('address1', ""),
                address_2=data.get('address2', ""),
                city=data.get('city', ""),
                state=data.get('state', ""),
                zipcode=data.get('zipcode', ""),
                coordinates=data.get('coordinates'),
                email_verified=True
            )
            db.session.add(new_user)
            db.session.commit()

            print("POST request: New user created and committed to the database")
            return jsonify({
                'message': 'Email confirmed and account created successfully.',
                'isNewUser': True,
                'user_id': new_user.id
            }), 201

    except SignatureExpired:
        print("Request: The token has expired")
        return jsonify({'error': 'The token has expired'}), 400

    except Exception as e:
        print(f"Request: An error occurred: {str(e)}")
        return jsonify({'error': f'Failed to confirm or update email: {str(e)}'}), 500

# VENDOR PORTAL
@app.route('/api/vendor/login', methods=['POST'])
def vendorLogin():

    data = request.get_json()
    vendor_user = VendorUser.query.filter(VendorUser.email == data['email']).first()
    if not vendor_user:
        return {'error': ' Incorrect email or password—or both!'}, 401
    
    if not vendor_user.authenticate(data['password']):
        return {'error': ' Incorrect email or password—or both!'}, 401
    
    vendor_user.last_login = datetime.utcnow()
    vendor_user.login_count = (vendor_user.login_count or 0) + 1

    db.session.commit()
    
    access_token = create_access_token(identity=vendor_user.id, expires_delta=timedelta(hours=12), additional_claims={"role": "vendor"})

    return jsonify(access_token=access_token, vendor_user_id=vendor_user.id), 200

@app.route('/api/vendor-signup', methods=['POST'])
def vendorSignup():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return {'error': 'Email is required'}, 400
    
    result = send_vendor_confirmation_email(email, data)
    
    if 'error' in result:
        return jsonify({'error': result["error"]}), 500
    return jsonify({'message': result['message']}), 200

@app.route('/api/vendor/confirm-email/<token>', methods=['GET', 'POST'])
def confirm_vendor_email(token):
    try:
        
        print(f'Received token: {token}')
        data = serializer.loads(token, salt='vendor-confirmation-salt', max_age=3600)
        
        if request.method == 'GET':
            print(f"GET request: Token verified, email extracted: {data['email']}")
            # Redirect to the frontend with the token
            return redirect(f'http://localhost:5173/vendor/confirm-email/{token}')
        
        if request.method == 'POST':
            print(f"POST request: Token verified, user data extracted: {data}")
            
            if VendorUser.query.filter_by(email=data['email']).first():
                print("POST request: Email already confirmed or in use")
                return {'error': 'Email already confirmed or in use.'}, 400
            
            new_vendor_user = VendorUser(
                email=data['email'],
                password=data['password'], 
                first_name=data['first_name'],
                last_name=data['last_name'],
                phone=data['phone'],
                email_verified=True
            )
            db.session.add(new_vendor_user)
            db.session.commit()
            
            print("POST request: VendorUser created and committed to the database")
            return {'message': 'Email confirmed and account created successfully.'}, 201

    except SignatureExpired:
        print("Request: The token has expired")
        return {'error': 'The token has expired'}, 400

    except Exception as e:
        print(f"Request: An error occurred: {str(e)}")
        return {'error': f'Failed to confirm email: {str(e)}'}, 500
    
@app.route('/api/vendor/logout', methods=['DELETE'])
def vendorLogout():
    session.pop('vendor_user_id', None)
    return {}, 204
    
    # ADMIN PORTAL
@app.route('/api/admin/login', methods=['POST'])
def adminLogin():

    data = request.get_json()
    admin_user = AdminUser.query.filter(AdminUser.email == data['email']).first()
    if not admin_user:
        return {'error': ' Incorrect email or password—or both!'}, 401
    
    if not admin_user.authenticate(data['password']):
        return {'error': ' Incorrect email or password—or both!'}, 401
    
    admin_user.last_login = datetime.utcnow()
    admin_user.login_count = (admin_user.login_count or 0) + 1

    db.session.commit()
    
    access_token = create_access_token(identity=admin_user.id, expires_delta=timedelta(hours=12), additional_claims={"role": "admin"})

    return jsonify(access_token=access_token, admin_user_id=admin_user.id), 200

@app.route('/api/admin-signup', methods=['POST'])
def adminSignup():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return {'error': 'Email is required'}, 400
    
    result = send_admin_confirmation_email(email, data)
    
    if 'error' in result:
        return jsonify({'error': result["error"]}), 500
    return jsonify({'message': result['message']}), 200

from itsdangerous import BadSignature, SignatureExpired

@app.route('/api/admin/confirm-email/<token>', methods=['GET', 'POST'])
def confirm_admin_email(token):
    try:
        print(f'Received token: {token}')
        data = serializer.loads(token, salt='admin-confirmation-salt', max_age=3600)

        if request.method == 'GET':
            print(f"GET request: Token verified, email extracted: {data['email']}")
            return redirect(f'http://localhost:5173/admin/confirm-email/{token}')
        
        if request.method == 'POST':
            print(f"POST request: Token verified, user data extracted: {data}")
            
            # Check if admin user already exists
            if AdminUser.query.filter_by(email=data['email']).first():
                print("POST request: Email already confirmed or in use")
                return {'error': 'Email already confirmed or in use.'}, 400
            
            # Create new admin user
            new_admin_user = AdminUser(
                email=data['email'],
                password=data['password'], 
                first_name=data['first_name'],
                last_name=data['last_name'],
                phone=data['phone'],
                email_verified=True
            )
            db.session.add(new_admin_user)
            db.session.commit()
            
            print("POST request: AdminUser created and committed to the database")
            return {'message': 'Email confirmed and account created successfully.'}, 201

    except SignatureExpired:
        print("Request: The token has expired")
        return {'error': 'The token has expired'}, 400

    except BadSignature:
        print("Request: The token is invalid")
        return {'error': 'Invalid token'}, 400

    except Exception as e:
        print(f"Request: An error occurred: {str(e)}")
        return {'error': f'Failed to confirm email: {str(e)}'}, 500
        
        
    
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

@app.route('/api/settings-users', methods=['GET', 'POST'])
@jwt_required()
def post_settings_user():

    try:
        if request.method == 'GET':

            user_id = request.args.get('user_id', type=int)
            query = SettingsUser.query

            if user_id is not None:
                user_result = query.filter(SettingsUser.user_id == user_id).first()
                if user_result:
                    return jsonify(user_result.to_dict()), 200
                return jsonify({'error': 'Settings not found for this user'}), 404
            else:
                users_settings = query.all()

            if not users_settings:
                return jsonify({'message': 'No user found'}), 404
            return jsonify([user.to_dict() for user in query]), 200
        
    except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    if request.method =='POST':
        data = request.get_json()

        try:
            user = SettingsUser.query.filter(SettingsUser.user_id == data['user_id']).first()
            if user:
                return {'error': 'user settings already exists'}, 400

            new_user_settings = SettingsUser(
                user_id=data['user_id'],
            )

            db.session.add(new_user_settings)
            db.session.commit()

            return new_user_settings.to_dict(), 201

        except IntegrityError as e:
            db.session.rollback()
            return {'error': f'IntegrityError: {str(e)}'}, 400 

        except ValueError as e:
            return {'error': f'ValueError: {str(e)}'}, 400

        except Exception as e:
            return {'error': f'Exception: {str(e)}'}, 500

@app.route('/api/settings-users/<int:id>', methods=['GET', 'PATCH'])
@jwt_required()
def settings_user(id):
    
    if not check_role('user') and not check_role('admin'):
        return {'error': "Access forbidden: User only"}, 403
    
    if request.method == 'GET':
        settings = SettingsUser.query.filter_by(id=id).first()
        if not settings:
            return {'error': 'user not found'}, 404
        settings_data = settings.to_dict()
        return jsonify(settings_data), 200

    elif request.method == 'PATCH':
        settings = SettingsUser.query.filter_by(id=id).first()
        if not settings:
            return {'error': 'user not found'}, 404
        try:
            data = request.get_json()
            for key, value in data.items():
                setattr(settings, key, value)

            db.session.commit()
            return jsonify(settings.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

@app.route('/api/settings-vendor-users', methods=['GET', 'POST'])
@jwt_required()
def post_settings_vendor_user():

    try:
        if request.method == 'GET':

            vendor_user_id = request.args.get('vendor_user_id', type=int)
            query = SettingsVendor.query

            if vendor_user_id is not None:
                vendor_user_result = query.filter(SettingsVendor.vendor_user_id == vendor_user_id).first()
                print('vendor user result', vendor_user_result)
                if vendor_user_result:
                    return jsonify(vendor_user_result.to_dict()), 200
                return jsonify({'error': 'Settings not found for this user'}), 404
            else:
                vendor_users_settings = query.all()

            if not vendor_users_settings:
                return jsonify({'message': 'No vendor user found'}), 404
            return jsonify([user.to_dict() for user in query]), 200
        
    except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    if request.method =='POST':
        data = request.get_json()

        try:
            vendor_user = SettingsVendor.query.filter(SettingsVendor.vendor_user_id == data['vendor_user_id']).first()
            if vendor_user:
                return {'error': 'user settings already exists'}, 400

            new_vendor_user_settings = SettingsVendor(
                vendor_user_id=data['vendor_user_id'],
            )

            db.session.add(new_vendor_user_settings)
            db.session.commit()

            return new_vendor_user_settings.to_dict(), 201

        except IntegrityError as e:
            db.session.rollback()
            return {'error': f'IntegrityError: {str(e)}'}, 400 

        except ValueError as e:
            return {'error': f'ValueError: {str(e)}'}, 400

        except Exception as e:
            return {'error': f'Exception: {str(e)}'}, 500

@app.route('/api/settings-vendor-users/<int:id>', methods=['GET', 'PATCH'])
@jwt_required()
def settings_vendor_user(id):
    
    if not check_role('vendor') and not check_role('admin'):
        return {'error': "Access forbidden: Vendor User only"}, 403
    
    if request.method == 'GET':
        settings = SettingsVendor.query.filter_by(id=id).first()
        if not settings:
            return {'error': 'vendor user not found'}, 404
        settings_data = settings.to_dict()
        return jsonify(settings_data), 200

    elif request.method == 'PATCH':
        settings = SettingsVendor.query.filter_by(id=id).first()
        if not settings:
            return {'error': 'vendor user not found'}, 404
        try:
            data = request.get_json()
            for key, value in data.items():
                setattr(settings, key, value)

            db.session.commit()
            return jsonify(settings.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

@app.route('/api/settings-admins', methods=['GET', 'POST'])
@jwt_required()
def post_settings_admin_user():

    try:
        if request.method == 'GET':

            admin_id = request.args.get('admin_id', type=int)
            query = SettingsAdmin.query

            if admin_id is not None:
                admin_result = query.filter(SettingsAdmin.admin_id == admin_id).first()
                if admin_result:
                    return jsonify(admin_result.to_dict()), 200
                return jsonify({'error': 'Settings not found for this admin'}), 404
            else:
                admins_settings = query.all()

            if not admins_settings:
                return jsonify({'message': 'No admin user found'}), 404
            return jsonify([user.to_dict() for user in query]), 200
        
    except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    if request.method =='POST':
        data = request.get_json()

        try:
            admin = SettingsAdmin.query.filter(SettingsAdmin.admin_id == data['admin_id']).first()
            if admin:
                return {'error': 'admin settings already exists'}, 400

            new_admin_settings = SettingsAdmin(
                admin_id=data['admin_id'],
            )

            db.session.add(new_admin_settings)
            db.session.commit()

            return new_admin_settings.to_dict(), 201

        except IntegrityError as e:
            db.session.rollback()
            return {'error': f'IntegrityError: {str(e)}'}, 400 

        except ValueError as e:
            return {'error': f'ValueError: {str(e)}'}, 400

        except Exception as e:
            return {'error': f'Exception: {str(e)}'}, 500

@app.route('/api/settings-admins/<int:id>', methods=['GET', 'PATCH'])
@jwt_required()
def settings_admin(id):
    
    if not check_role('admin') and not check_role('admin'):
        return {'error': "Access forbidden: User only"}, 403
    
    if request.method == 'GET':
        settings = SettingsAdmin.query.filter_by(id=id).first()
        if not settings:
            return {'error': 'user not found'}, 404
        settings_data = settings.to_dict()
        return jsonify(settings_data), 200

    elif request.method == 'PATCH':
        settings = SettingsAdmin.query.filter_by(id=id).first()
        if not settings:
            return {'error': 'user not found'}, 404
        try:
            data = request.get_json()
            for key, value in data.items():
                setattr(settings, key, value)

            db.session.commit()
            return jsonify(settings.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

@app.route('/api/users', methods=['GET'])
@jwt_required()
def all_users():
    try:
        if request.method == 'GET':
            users = User.query.all()
            return jsonify([user.to_dict() for user in users]), 200
        
    except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

@app.route('/api/users/<int:id>', methods=['GET', 'PATCH', 'POST', 'DELETE'])
@jwt_required()
def profile(id):
    
    if not check_role('user') and not check_role('admin'):
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
            if 'first_name' in data:
                user.first_name = data.get('first_name')
            if 'last_name' in data:
                user.last_name = data.get('last_name')
            if 'email' in data:
                user.email = data.get('email')
            if 'phone' in data:
                user.phone = data.get('phone')
            if 'address_1' in data:
                user.address_1 = data.get('address_1')
            if 'address_2' in data:
                user.address_2 = data.get('address_2')
            if 'city' in data:
                user.city = data.get('city')
            if 'state' in data:
                user.state = data.get('state')
            if 'zipcode' in data:
                user.zipcode = data.get('zipcode')
            if 'coordinates' in data:
                user.coordinates = data['coordinates']
            if 'avatar' in data:
                user.avatar = data.get('avatar')
            if 'avatar_default' in data:
                user.avatar_default = data.get('avatar_default')
            if 'status' in data:
                user.status = data.get('status')

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

@app.route('/api/users/<int:id>/password', methods=['PATCH'])
@jwt_required()
def user_password_change(id):
    if not check_role('user') and not check_role('admin'):
        return {'error': "Access forbidden: User only"}, 403
    
    if request.method == 'PATCH':
        data = request.get_json()
        user = User.query.filter(User.id == id).first()
        if not user:
            return {'error': ' User not found'}, 401
        
        if not user.authenticate(data['old_password']):
            return {'error': ' Incorrect password!'}, 401
        
        user.password = data.get('new_password')
        db.session.commit()
        
        return jsonify(user_id=user.id), 200

@app.route('/api/users/count', methods=['GET'])
@jwt_required()
def user_count():
    status = request.args.get('status', type=str)
    city = request.args.get('city', type=str)
    state = request.args.get('state', type=str)
    try:
        count = db.session.query(User).count()
        if status:
            count = db.session.query(User).filter(User.status == status).count()
        if city:
            count = db.session.query(User).filter(User.city == city).count()
        if state:
            count = db.session.query(User).filter(User.state == state).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/top-10-cities', methods=['GET'])
@jwt_required()
def top_10_cities():
    try:
        city_counts = (
            db.session.query(User.city, func.count(User.city).label("count"))
            .group_by(User.city)
            .order_by(func.count(User.city).desc())
            .limit(10)
            .all()
        )

        city_data = {city: count for city, count in city_counts}

        return jsonify(city_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vendor-users', methods=['GET', 'POST', 'PATCH'])
@jwt_required()
def get_vendor_users():
    if request.method == 'GET':
        try:
            vendor_id = request.args.get('vendor_id', type=int)
            email = request.args.get('email', type=str)
            query = VendorUser.query

            if vendor_id is not None:
                vendor_users = query.all()
                vendor_users = [
                    user for user in vendor_users
                    if str(vendor_id) in (user.vendor_id or {}).keys()
                ]
            elif email is not None:
                vendor_users = VendorUser.query.filter_by(email=email).all()
                if not vendor_users:
                    return jsonify([]), 200  # Return empty list instead of 404
            else:
                vendor_users = query.all()

            return jsonify([user.to_dict() for user in vendor_users]), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    elif request.method == 'POST':
        try:
            data = request.get_json()
            email = data.get('email')
            vendor_id = data.get('vendor_id')
            role = data.get('role')
            password = data.get('password', 'temporary_password')

            if not email or not vendor_id:
                return jsonify({'error': 'Email and vendor_id are required'}), 400
            
            vendor_id_dict = {str(vendor_id): vendor_id}
            vendor_role_dict = {str(vendor_id): role}
            
            new_user = VendorUser(
                email=email,
                vendor_id=vendor_id_dict,
                vendor_role=vendor_role_dict,
                active_vendor=vendor_id,
                password=password, 
                first_name="Pending",
                last_name="Pending",
                phone="0000000000"
            )
            db.session.add(new_user)
            db.session.commit()

            return jsonify(new_user.to_dict()), 201 

        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    elif request.method == 'PATCH':
        try:
            delete_vendor_id = request.args.get('delete_vendor_id', type=int)
            if delete_vendor_id:
                vendor_users = VendorUser.query.all()
                vendor_id_str = str(delete_vendor_id)

                for vendor_user in vendor_users:
                    if isinstance(vendor_user.vendor_role, dict) and vendor_id_str in vendor_user.vendor_role:
                        vendor_user.vendor_role.pop(vendor_id_str, None)
                    if isinstance(vendor_user.vendor_id, dict) and vendor_id_str in vendor_user.vendor_id:
                        vendor_user.vendor_id.pop(vendor_id_str, None)

                        remaining_keys = list(vendor_user.vendor_id.keys())
                        vendor_user.active_vendor = int(remaining_keys[0]) if remaining_keys else None

                    db.session.commit()

                return jsonify({'message': 'Vendor updated successfully'}), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/vendor-users/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
@jwt_required()
def get_vendor_user(id):
    if request.method == 'GET':
        vendor_user = VendorUser.query.get(id)
        if not vendor_user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(vendor_user.to_dict()), 200

    elif request.method == 'PATCH':
        vendor_user = VendorUser.query.get(id)
        delete_vendor_id = request.args.get('delete_vendor_id', type=int)
        admin_patch = request.args.get('admin_patch', type=bool)

        if not vendor_user:
            return jsonify({'error': 'User not found'}), 404

        try:
            if delete_vendor_id:
                delete_vendor_id_str = str(delete_vendor_id)
                if isinstance(vendor_user.vendor_role, dict):
                    vendor_user.vendor_role.pop(delete_vendor_id_str, None)
                if isinstance(vendor_user.vendor_id, dict):
                    vendor_user.vendor_id.pop(delete_vendor_id_str, None)

                remaining_keys = list(vendor_user.vendor_id.keys())
                vendor_user.active_vendor = int(remaining_keys[0]) if remaining_keys else None

                db.session.commit()
                return jsonify({'message': 'Vendor updated successfully'}), 200

            data = request.get_json()
            if admin_patch:
                if 'first_name' in data:
                    vendor_user.first_name = data['first_name']
                if 'last_name' in data:
                    vendor_user.last_name = data['last_name']
                if 'email' in data:
                    vendor_user.email = data['email']
                if 'phone' in data:
                    vendor_user.phone = data['phone']
                if 'vendor_role' in data:
                    vendor_user.vendor_role = data['vendor_role']
                if 'vendor_id' in data:
                    vendor_user.vendor_id = data['vendor_id']

                remaining_keys = list(vendor_user.vendor_id.keys())
                vendor_user.active_vendor = int(remaining_keys[0]) if remaining_keys else None

                db.session.commit()
                return jsonify(vendor_user.to_dict()), 200                

            if not delete_vendor_id and not admin_patch:
                if 'first_name' in data:
                    vendor_user.first_name = data['first_name']
                if 'last_name' in data:
                    vendor_user.last_name = data['last_name']
                if 'email' in data:
                    vendor_user.email = data['email']
                if 'phone' in data:
                    vendor_user.phone = data['phone']
                if 'vendor_role' in data:
                    vendor_role_value = data['vendor_role']
                    vendor_id = str(data.get('vendor_id'))
                    if vendor_id is None:
                        return jsonify({'error': 'vendor_id is required when setting vendor_role'}), 400
                    if not isinstance(vendor_user.vendor_role, dict):
                        vendor_user.vendor_role = {}
                    vendor_user.vendor_role[vendor_id] = vendor_role_value
                if 'vendor_id' in data:
                    vendor_id_key = str(data.get('vendor_id'))
                    vendor_id_value = data['vendor_id']
                    if vendor_id_key is None:
                        return jsonify({'error': 'vendor_id is required when setting vendor_id'}), 400
                    if not isinstance(vendor_user.vendor_id, dict):
                        vendor_user.vendor_id = {}
                    vendor_user.vendor_id[vendor_id_key] = vendor_id_value
                if 'active_vendor' in data:
                    vendor_user.active_vendor = data['active_vendor']
                    
                db.session.commit()
                return jsonify(vendor_user.to_dict()), 200

        except Exception as e:
            db.session.rollback()
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
            return jsonify({'error': str(e)}), 500

@app.route('/api/vendor-users/count', methods=['GET'])
@jwt_required()
def vendor_user_count():
    try:
        count = db.session.query(VendorUser).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
            data.pop('last_login', None)
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

@app.route('/api/admin-users/count', methods=['GET'])
@jwt_required()
def admin_user_count():
    try:
        count = db.session.query(AdminUser).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/markets', methods=['GET', 'POST'])
def all_markets():
    if request.method == 'GET':
        is_visible = request.args.get('is_visible')
        if is_visible:
            is_visible_bool = is_visible.lower() == 'true'
            markets = Market.query.filter_by(is_visible=is_visible_bool).all()
        else:
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
            if 'image_default' in data:
                market.image_default = data['image_default']
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
            if 'is_visible' in data:
                if isinstance(data['is_visible'], bool):
                    market.is_visible = data['is_visible']
                elif isinstance(data['is_visible'], str):
                    market.is_visible = data['is_visible'].lower() == 'true'
                else:
                    return {'error': 'Invalid value for is_visible. Must be a boolean or "true"/"false" string.'}, 400
            if 'season_start' in data:
                if data['season_start'] is None:
                    market.season_start = None
                else:
                    try:
                        market.season_start = datetime.strptime(data['season_start'], '%Y-%m-%d').date()
                    except ValueError:
                        return {'error': 'Invalid date format for season_start. Use YYYY-MM-DD or null.'}, 400
            if 'season_end' in data:
                if data['season_end'] is None:
                    market.season_end = None
                else:
                    try:
                        market.season_end = datetime.strptime(data['season_end'], '%Y-%m-%d').date()
                    except ValueError:
                        return {'error': 'Invalid date format for season_end. Use YYYY-MM-DD or null.'}, 400
            
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

@app.route('/api/markets/count', methods=['GET'])
@jwt_required()
def market_count():
    try:
        count = db.session.query(Market).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
        try:
            db.session.delete(market_day)
            db.session.commit()
            return {}, 204
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

@app.route('/api/market-days/count', methods=['GET'])
@jwt_required()
def market_days_count():
    try:
        count = db.session.query(MarketDay).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/vendors', methods=['GET', 'POST', 'PATCH'])
def all_vendors():
    if request.method == 'GET':
        market_day = request.args.get('market_day')
        vendors = Vendor.query.all()
        if market_day:
            vendors = Market.query.filter_by(market_day=market_day).all()
        return jsonify([vendor.to_dict() for vendor in vendors]), 200

    elif request.method == 'POST':
        data = request.get_json()
        new_vendor = Vendor(
            name=data.get('name'),
            city=data.get('city'),
            state=data.get('state'),
            products=data.get('products'),
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
        if 'products' in data:
            vendor.product = data['products']
        if 'city' in data:
            vendor.city = data['city']
        if 'state' in data:
            vendor.state = data['state']
        if 'bio' in data:
            vendor.bio = data['bio']
        if 'image' in data: 
            vendor.image = data['image']
        if 'image_default' in data: 
            vendor.image_default = data['image_default']

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
            if 'products' in data:
                vendor.products = data['products']
            if 'city' in data:
                vendor.city = data['city']
            if 'state' in data:
                vendor.state = data['state']
            if 'bio' in data:
                vendor.bio = data['bio']
            if 'image' in data:
                vendor.image = data['image']
            if 'image_default' in data: 
                vendor.image_default = data['image_default']

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

@app.route('/api/vendors/count', methods=['GET'])
@jwt_required()
def vendor_count():
    try:
        count = db.session.query(Vendor).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
        if 'response_date' in data:
            if data['response_date'] is None:
                data['response_date'] = None
            else:
                try:
                    data['response_date'] = datetime.strptime(data['response_date'], '%Y-%m-%dT%H:%M')
                except ValueError:
                    return {'error': 'Invalid response_date format. Expected format: YYYY-MM-DDTHH:MM'}, 400
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
        .filter(vote_up_counts.c.vote_up_count >= max(percentile_value, 3))
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
        .filter(vote_up_counts.c.vote_up_count >= max(percentile_value, 3))
        .order_by(desc(vote_up_counts.c.vote_up_count))
        .all()
    )
    # print("Percentile value for top reviews:", percentile_value)
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
@jwt_required()
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
@jwt_required()
def del_market_fav(id):
    market_fav = MarketFavorite.query.filter(MarketFavorite.id == id).first()
    if not market_fav:
        return {'error': 'market favorite not found'}, 404
    if request.method == 'GET':
        return market_fav.to_dict(), 200
    if request.method == 'DELETE':
        db.session.delete(market_fav)
        db.session.commit()
        return {}, 204

@app.route('/api/vendor-favorites', methods=['GET', 'POST'])
@jwt_required()
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
@jwt_required()
def del_vendor_fav(id):
    vendor_fav = VendorFavorite.query.filter(VendorFavorite.id == id).first()
    if not vendor_fav:
        return {'error': 'vendor favorite not found'}, 404
    if request.method == 'GET':
        return vendor_fav.to_dict(), 200
    if request.method == 'DELETE':
        db.session.delete(vendor_fav)
        db.session.commit()
        return {}, 204

@app.route('/api/blog-favorites', methods=['GET', 'POST'])
@jwt_required()
def all_blog_favorites():
    if request.method == 'GET':
        user_id = request.args.get('user_id')
        query = BlogFavorite.query
        if user_id:
            query = query.filter_by(user_id=user_id).all()
        return jsonify([q.to_dict() for q in query]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        new_blog_favorite = BlogFavorite(
            user_id=data['user_id'],
            blog_id=data['blog_id']
        )
        db.session.add(new_blog_favorite)
        db.session.commit()
        return new_blog_favorite.to_dict(), 201
    
@app.route('/api/blog-favorites/<int:id>', methods=['GET', 'DELETE'])
@jwt_required()
def del_blog_fav(id):
    blog_fav = BlogFavorite.query.filter(BlogFavorite.id == id).first()
    if not blog_fav:
        return {'error': 'blog favorite not found'}, 404
    if request.method == 'GET':
        return blog_fav.to_dict(), 200
    if request.method == 'DELETE':
        db.session.delete(blog_fav)
        db.session.commit()
        return {}, 204
    
@app.route('/api/vendor-markets', methods=['GET', 'POST'])
def get_vendor_markets():
    if request.method == 'GET':
        vendor_id = request.args.get('vendor_id', type=int)
        market_id = request.args.get('market_id', type=int)
        is_visible = request.args.get('is_visible', type=str)

        query = VendorMarket.query.options(
            db.joinedload(VendorMarket.vendor),
            db.joinedload(VendorMarket.market_day).joinedload(MarketDay.markets)
        )

        if vendor_id:
            query = query.filter(VendorMarket.vendor_id == vendor_id)
        if market_id:
            query = query.filter(VendorMarket.market_day.has(MarketDay.market_id == market_id))
        if is_visible is not None:
            is_visible_bool = is_visible.lower() == 'true'
            query = query.filter(VendorMarket.market_day.has(MarketDay.markets.has(Market.is_visible == is_visible_bool)))
            
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
            market_id = request.args.get('market_id', type=int)

            if not vendor_id and not market_id:
                return jsonify({"error": "At least one of vendor_id or market_id is required"}), 400

            query = Event.query
            if vendor_id:
                query = query.filter_by(vendor_id=vendor_id)
            if market_id:
                query = query.filter_by(market_id=market_id)

            events = query.all()
            return jsonify([event.to_dict() for event in events]), 200
        except Exception as e:
            app.logger.error(f'Error fetching events: {e}')  
            return {'error': f'Exception: {str(e)}'}, 500
        
    if request.method == 'POST':
        data = request.get_json()
        print("Received Data:", data)

        try:
            start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
            end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
        except ValueError as e:
            return jsonify({"error": f"Invalid time format: {str(e)}"}), 400

        vendor_id = data.get('vendor_id')
        if isinstance(vendor_id, dict): 
            try:
                vendor_id = int(list(vendor_id.keys())[0])
            except (ValueError, IndexError):
                return jsonify({"error": "Invalid vendor_id format"}), 400
        else:
            try:
                vendor_id = int(vendor_id) if vendor_id is not None else None
            except (TypeError, ValueError):
                return jsonify({"error": "Invalid vendor_id"}), 400

        market_id = data.get('market_id')

        new_event = Event(
            vendor_id=vendor_id,
            market_id=market_id,
            title=data['title'],
            message=data['message'],
            start_date=start_date,
            end_date=end_date
        )

        db.session.add(new_event)
        db.session.commit()

        return new_event.to_dict(), 201

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
            event.title=data.get('title')
            event.message=data.get('message')
            event.schedule_change=data.get('schedule_change') in [True, 'true', 'True']
            print(event.schedule_change)
            if data.get('start_date'):
                event.start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
            if data.get('end_date'):
                event.end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()            
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
            user_id = request.args.get('user_id', type=int)

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
            if user_id is not None:
                query = query.filter_by(user_id=user_id)

            saved_baskets = query.all()

            if not saved_baskets:
                return jsonify([]), 200

            # app.logger.debug(f"Found {len(saved_baskets)} baskets.")
            return jsonify([basket.to_dict() for basket in saved_baskets]), 200

        except Exception as e:
            return jsonify({'message': 'No saved baskets found'}), 200

    elif request.method == 'POST':
        data = request.get_json()
        app.logger.debug(f'Received data for new basket: {data}')

        # Initialize variables
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
                    return jsonify({'error': 'Price must be a non-negative number'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid price format. Must be a positive number.'}), 400

            try:
                value = float(data['value'])
                if value < 0:
                    return jsonify({'error': 'value must be a non-negative number'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid value format. Must be a number.'}), 400

            new_basket = Basket(
                vendor_id=data['vendor_id'],
                market_day_id=data['market_day_id'],
                sale_date=sale_date,
                pickup_start=pickup_start,
                pickup_end=pickup_end,
                price=price,
                value=value,
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
            if 'value' in data:
                basket.value = data['value']

            db.session.commit()
            return jsonify(basket.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    elif request.method == 'DELETE':
        vendor_id = request.args.get('vendor_id', type=int)
        market_day_id = request.args.get('market_day_id', type=int)
        sale_date = request.args.get('sale_date', type=str)
        
        basket_ids = request.get_json().get('basket_ids', [])
        
        if not basket_ids:
            return jsonify({"error": "No basket IDs provided"}), 400

        try:
            query = Basket.query.filter(Basket.id.in_(basket_ids))

            if vendor_id:
                query = query.filter_by(vendor_id=vendor_id)
            if market_day_id:
                query = query.filter_by(market_day_id=market_day_id)
            if sale_date:
                try:
                    from datetime import datetime
                    sale_date_obj = datetime.strptime(sale_date, '%Y-%m-%d').date()
                    query = query.filter_by(sale_date=sale_date_obj)
                except ValueError:
                    return jsonify({'error': 'Invalid sale_date format. Expected format: YYYY-MM-DD'}), 400

            deleted_count = query.delete(synchronize_session=False)
            db.session.commit()

            if deleted_count > 0:
                return jsonify({"message": f"{deleted_count} baskets deleted successfully"}), 200
            else:
                return jsonify({"message": "No baskets found with the provided IDs"}), 404
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
                "value": basket.value,
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
        vendor_id = request.args.get('vendor_id', type=str)

        if not vendor_id:
            return {'error': 'User not logged in'}, 401

        baskets = Basket.query.filter_by(vendor_id=vendor_id).all()

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
                    "value": basket.value,
                    "price": basket.price,
                    "pickup_start": basket.pickup_start.strftime('%H:%M'),
                    "pickup_end": basket.pickup_end.strftime('%H:%M'),
                    "total_baskets": 0,
                    "sold_baskets": 0,
                }

            sales_history[(sale_date, market_day_id)]["total_baskets"] += 1
            if basket.is_sold:
                sales_history[(sale_date, market_day_id)]["sold_baskets"] += 1

        vendor_sales_history = list(sales_history.values())
        return jsonify(vendor_sales_history), 200

    except Exception as e:
        app.logger.error(f"Error fetching sales history: {e}")
        return {'error': f"Exception: {str(e)}"}, 500

@app.route('/api/baskets/count', methods=['GET'])
@jwt_required()
def basket_count():
    try:
        count = db.session.query(Basket).count()
        sold_count = db.session.query(Basket).filter(Basket.is_sold == True).count()
        grabbed_count = db.session.query(Basket).filter(Basket.is_grabbed == True).count()
        unsold_count = db.session.query(Basket).filter(Basket.is_sold == False).count()

        sold_price = db.session.query(func.sum(Basket.price)).filter(Basket.is_sold == True).scalar() or 0
        sold_value = db.session.query(func.sum(Basket.value)).filter(Basket.is_sold == True).scalar() or 0

        return jsonify({
            "count": count,
            "sold_count": sold_count,
            "grabbed_count": grabbed_count,
            "unsold_count": unsold_count,
            "sold_price": sold_price,
            "sold_value": sold_value
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/baskets/top-10-markets', methods=['GET'])
@jwt_required()
def basket_top_10_markets():
    try:
        market_counts = (
            db.session.query(Market.name, func.count(Basket.id).label("count"))
            .join(MarketDay, MarketDay.id == Basket.market_day_id)
            .join(Market, Market.id == MarketDay.market_id)
            .group_by(Market.name)
            .order_by(func.count(Basket.id).desc())
            .limit(10)
            .all()
        )

        market_data = {market: count for market, count in market_counts}

        return jsonify(market_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/baskets/top-10-users', methods=['GET'])
@jwt_required()
def basket_top_10_users():
    try:
        top_users = db.session.query(
            User.first_name,
            User.last_name,
            User.email,
            db.func.count(Basket.user_id).label('basket_count')
        ).join(Basket, Basket.user_id == User.id).group_by(User.id).order_by(db.desc('basket_count')).limit(10).all()

        users_data = [{
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "basket_count": user.basket_count
        } for user in top_users]

        return jsonify(users_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
@jwt_required()
def qr_codes():
    if request.method == 'GET':
        user_id = request.args.get('user_id', type=int)
        vendor_id = request.args.get('vendor_id', type=str)
        qr_code = request.args.get('qr_code', type=str)
        query = QRCode.query

        if qr_code:
            query = query.filter(QRCode.qr_code == qr_code, QRCode.vendor_id == vendor_id)
            qr_code_result = query.first()
            if qr_code_result:
                return jsonify(qr_code_result.to_dict()), 200
            return jsonify({'error': 'QR code not found'}), 404
        elif user_id:
            query = query.filter(QRCode.user_id == user_id)
            qr_code_result = query.all()
            if qr_code_result:
                return jsonify([qr.to_dict() for qr in qr_code_result]), 200
            return jsonify({'error': 'No QR codes found for the user'}), 404
        elif not user_id and not vendor_id and not qr_code:
            # No parameters: Return all QR codes
            qr_code_result = query.all()
            if qr_code_result:
                return jsonify([qr.to_dict() for qr in qr_code_result]), 200
            return jsonify({'error': 'No QR codes found'}), 404
        return jsonify({'error': 'Invalid query parameters'}), 400

    elif request.method == 'POST':
        data = request.get_json()
        new_qr_code = QRCode(
            qr_code=data.get('qr_code'),
            user_id=data.get('user_id'),
            basket_id=data.get('basket_id'),
            vendor_id=data.get('vendor_id')
        )
        try:
            db.session.add(new_qr_code)
            db.session.commit()
            return jsonify(new_qr_code.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to create QR code: {str(e)}'}, 500

@app.route('/api/qr-codes/<int:id>', methods=['GET', 'DELETE'])
@jwt_required()
def qr_code(id):
    if request.method == 'GET':
        qr_code = QRCode.query.filter_by(id=id).first()
        if not qr_code:
            return {'error': 'QR code not found'}, 404
        qr_code_data = qr_code.to_dict()  # Fixed variable name
        return jsonify(qr_code_data), 200

    elif request.method == 'DELETE':
        qr_code = QRCode.query.filter_by(id=id).first()
        if not qr_code:  # Fixed variable name
            return {'error': 'QR code not found'}, 404
        
        try:
            db.session.delete(qr_code)
            db.session.commit()
            return {'message': 'QR code deleted successfully'}, 200
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to delete QR code: {str(e)}'}, 500

@app.route('/api/contact', methods=['POST'])
def contact(): 
    data = request.get_json()
    print("received data:", data)
    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject')
    message = data.get('message')

    print(f"Name: {name}, Email: {email}, Subject: {subject}, Message: {message}")

    result = send_contact_email(name, email, subject, message)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), 500
    return jsonify({"message": result["message"]}), 200

# MJML Backend
@app.route('/api/preview-email', methods=['POST'])
@jwt_required()
def preview_email():
    data = request.json
    mjml_template = data.get('mjml', '')

    try:
        # Run MJML CLI to compile MJML to HTML
        result = subprocess.run(
            ['mjml', '--stdin'],
            input=mjml_template.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        if result.returncode != 0:
            return jsonify({'error': result.stderr.decode()}), 400

        compiled_html = result.stdout.decode()
        return compiled_html

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/send-mjml-email', methods=['POST'])
@jwt_required()
def send_mjml_email():
    if not check_role('admin'):
        return {'error': "Access forbidden: Admin only"}, 403

    data = request.json
    mjml = data.get('mjml', '')
    subject = data.get('subject', '')
    email_address = data.get('email_address', '')

    try:
        # Run MJML CLI to compile MJML to HTML
        result = subprocess.run(
            ['mjml', '--stdin'],
            input=mjml.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        if result.returncode != 0:
            return jsonify({'error': result.stderr.decode()}), 400

        compiled_html = result.stdout.decode()

        try: 
            sender_email = os.getenv('EMAIL_USER')
            password = os.getenv('EMAIL_PASS')
            recipient_email = email_address

            msg = MIMEMultipart()
            msg['From'] = f'Gingham NYC <{sender_email}>'
            msg['To'] = recipient_email
            msg['Subject'] = subject

            body = compiled_html
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
            # server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(sender_email, password)
            # server.login("wosewick@gmail.com", "A1@s10*77#6O06L3")
            # print("SMTP Server is unreachable")

            try:
                server.sendmail(sender_email, recipient_email, msg.as_string())
                # server.sendmail("wosewick@gmail.com", recipient_email, msg.as_string())
                server.quit()
                return {"message": "Email sent successfully!"}, 201 
            except smtplib.SMTPException as e:
                print("SMTP Error:", e)
                return jsonify({"error": f"SMTP Error: {str(e)}"}), 500
            except Exception as e:
                print("General Error:", e)
                return jsonify({"error": f"General Error: {str(e)}"}), 500
        
        except Exception as e: 
            print("Error occured:", str(e))
            return jsonify({"error": str(e)}), 500

    except Exception as e: 
        print("Error occured:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/send-html-email', methods=['POST'])
@jwt_required()
def send_html_email():
    data = request.json
    html = data.get('html', '')
    subject = data.get('subject', '')
    email_address = data.get('emailAddress', '')

    try: 
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = email_address

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = subject

        body = html
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        # server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, password)
        # server.login("wosewick@gmail.com", "A1@s10*77#6O06L3")
        # print("SMTP Server is unreachable")

        try:
            server.sendmail(sender_email, recipient_email, msg.as_string())
            # server.sendmail("wosewick@gmail.com", recipient_email, msg.as_string())
            server.quit()
            return {"message": "Email sent successfully!"}, 201 
        except smtplib.SMTPException as e:
            print("SMTP Error:", e)
            return jsonify({"error": f"SMTP Error: {str(e)}"}), 500
        except Exception as e:
            print("General Error:", e)
            return jsonify({"error": f"General Error: {str(e)}"}), 500
    
    except Exception as e: 
        print("Error occured:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/sendgrid-email', methods=['POST'])
@jwt_required()
def send_sendgrid_email():
    data = request.json
    html = data.get('html', '')
    subject = data.get('subject', '')
    sender_email = os.getenv('EMAIL_USER')

    try:
        # Run MJML CLI to compile MJML to HTML
        result = subprocess.run(
            ['mjml', '--stdin'],
            input=html.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        if result.returncode != 0:
            return jsonify({'error': result.stderr.decode()}), 400
    
    except Exception as e: 
        print("Error occured:", str(e))
        return jsonify({"error": str(e)}), 500

    compiled_html = result.stdout.decode()
    user_type = request.args.get('user_type')
    single_email = request.args.get('single_email')

    if user_type == 'user':
        try:
            users = User.query.with_entities(User.email).all()
            email_list = [user.email for user in users]
            if not email_list:
                return jsonify({"error": "No users found to send emails to."}), 404
            
        except Exception as e:
            print("Database Error:", str(e))
            return jsonify({"error": str(e)}), 500

    if user_type == 'vendor':
        try:
            users = VendorUser.query.with_entities(VendorUser.email).all()
            email_list = [user.email for user in users]
            if not email_list:
                return jsonify({"error": "No vendor users found to send emails to."}), 404
            
        except Exception as e:
            print("Database Error:", str(e))
            return jsonify({"error": str(e)}), 500

    if user_type == 'admin':
        try:
            users = AdminUser.query.with_entities(AdminUser.email).all()
            email_list = [user.email for user in users]
            if not email_list:
                return jsonify({"error": "No admin users found to send emails to."}), 404
            
        except Exception as e:
            print("Database Error:", str(e))
            return jsonify({"error": str(e)}), 500
    
    if single_email:
        email_list = single_email

    message = Mail(
        from_email=f'Gingham NYC <{sender_email}>',
        to_emails=email_list,
        subject=subject,
        html_content=compiled_html,
        is_multiple=True
        )
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        print(response.status_code)
        print(response.body)
        print(response.headers)
        return jsonify({"message": "Email sent successfully", "status_code": response.status_code}), 202
    except Exception as e:
        print(e.message)
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/sendgrid-email-client', methods=['POST'])
@jwt_required()
def send_sendgrid_email_client():
    data = request.json
    subject = data.get('subject', '')
    body_type = data.get('body_type', '')
    body = data.get('body', '')
    from_email = data.get('from_email', '')
    to_email = data.get('to_email', '')
    
    if body_type == 'plain':
        compiled_html = body

    if body_type == 'html':
        try:
            # Run MJML CLI to compile MJML to HTML
            result = subprocess.run(
                ['mjml', '--stdin'],
                input=body.encode(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            if result.returncode != 0:
                return jsonify({'error': result.stderr.decode()}), 400
        
        except Exception as e: 
            print("Error occured:", str(e))
            return jsonify({"error": str(e)}), 500

        compiled_html = result.stdout.decode()
    
    if body_type == 'plain':
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            plain_text_content=compiled_html,
            )
    if body_type == 'html':
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            html_content=compiled_html,
            )

    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        print(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        print(response.status_code)
        print(response.body)
        print(response.headers)
        return jsonify({"message": "Email sent successfully", "status_code": response.status_code}), 202
    except Exception as e:
        print(e.message)
        return jsonify({"error": str(e)}), 500
    
# Stripe
stripe.api_key = os.getenv('STRIPE_PY_KEY')

@app.route('/api/config', methods=['GET'])
def get_config():
    publishable_key = stripe.api_key
    if not publishable_key:
        return jsonify({'error': 'Stripe publishable key not configured'}), 500
    return jsonify({'publishableKey': publishable_key}), 200

@app.route('/api/create-payment-intent', methods=['POST'])
def create_payment_intent():
    try:
        # Parse request data
        data = request.get_json()
        if not data or 'total_price' not in data:
            return jsonify({'error': {'message': 'Invalid request: Missing total_price.'}}), 400

        # Validate total_price
        total_price = data['total_price']
        if not isinstance(total_price, (int, float)) or total_price <= 0:
            return jsonify({'error': {'message': "'total_price' must be a positive number."}}), 400

        # Create a PaymentIntent
        payment_intent = stripe.PaymentIntent.create(
            currency='usd',
            amount=int(total_price * 100),  # Convert dollars to cents
            automatic_payment_methods={'enabled': True},
        )

        # Return the clientSecret
        return jsonify({'clientSecret': payment_intent['client_secret']}), 200

    except stripe.error.StripeError as e:
        # Stripe-specific error handling
        return jsonify({'error': {'message': str(e.user_message)}}), 400

    except Exception as e:
        # General error handling
        return jsonify({'error': {'message': 'An unexpected error occurred.'}}), 500

# Password reset for User
@app.route('/api/user/password-reset-request', methods=['POST'])
def password_reset_request():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return {'error': 'Email is required'}, 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 400
    else:
        result = send_user_password_reset_email(email)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), 500
    return jsonify({"message": result["message"]}), 200

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

            # Check if the new password is provided
            if not new_password:
                print("POST request: No new password provided")
                return {'error': 'New password is required'}, 400

            # Find user from the database using the email
            user = User.query.filter_by(email=email).first()
            if not user:
                print(f"POST request: User not found for email: {email}")
                return {'error': 'User not found'}, 404

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

    if not email:
        return {'error': 'Email is required'}, 400

    vendor_user = VendorUser.query.filter_by(email=email).first()
    if not vendor_user:
        return jsonify({'error': 'Vendor not found'}), 400
    else:
        result = send_vendor_password_reset_email(email)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), 500
    return jsonify({"message": result["message"]}), 200

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

    if not email:
        return {'error': 'Email is required'}, 400

    admin_user = AdminUser.query.filter_by(email=email).first()
    if not admin_user:
        return jsonify({'error': 'Admin not found'}), 400
    else:
        result = send_admin_password_reset_email(email)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), 500
    return jsonify({"message": result["message"]}), 200
    


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

@app.route('/api/user-notifications', methods=['GET', 'DELETE'])
@jwt_required()
def get_user_notifications():
    user_id = request.args.get('user_id')
    if request.method == 'GET':

        query = UserNotification.query
        if user_id:
            query = query.filter_by(user_id=user_id)

        notifications = query.order_by(UserNotification.created_at.desc()).all()
        
        # notifications = UserNotification.query.all()
        return jsonify([notif.to_dict() for notif in notifications]), 200
    
    if request.method == 'DELETE':
        query = UserNotification.query
        if user_id:
            query = query.filter_by(user_id=user_id)
        
            deleted_count = query.delete()
            db.session.commit()
            return jsonify({'deleted count': deleted_count}), 200
    
@app.route('/api/user-notifications/<int:id>', methods=['PATCH', 'DELETE'])
@jwt_required()
def delete_user_notifications(id):
    if request.method == 'PATCH':
        notification = UserNotification.query.get(id)
        if not notification:
            return jsonify({'message': 'Notification not found'}), 404
        
        data = request.get_json()
        for key, value in data.items():
            setattr(notification, key, value)
        db.session.commit()
        return notification.to_dict(), 202
    
    if request.method == 'DELETE':
        notification = UserNotification.query.filter_by(id=id).first()

        if not notification:
            return jsonify({'message': 'No notifications found'}), 404

        notification_data = {'id': notification.id, 'message': notification.message}
        
        db.session.delete(notification)
        db.session.commit()
        return jsonify({'notifications': notification_data}), 200

@app.route('/api/notify-me-for-more-baskets', methods=['POST'])
@jwt_required()
def notify_me_for_more_baskets():
    data = request.get_json()

    if not data or 'user_id' not in data or 'vendor_id' not in data:
        return jsonify({'message': 'Invalid request data.'}), 400

    try:
        # Retrieve the vendor
        vendor = Vendor.query.get(data['vendor_id'])
        if not vendor:
            return jsonify({'message': f"Vendor with ID {data['vendor_id']} not found."}), 404

        # Retrieve the user
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'message': f"User with ID {data['user_id']} not found."}), 404

        vendor_users = [
            vu for vu in VendorUser.query.all()
            if str(data['vendor_id']) in vu.vendor_id.keys()
        ]

        if not vendor_users:
            return jsonify({'message': f"No vendor users found for vendor ID {data['vendor_id']}."}), 404

        # Create a notification for the vendor
        notifications = []

        for vendor_user in vendor_users:
            new_notification = VendorNotification(
                subject=data.get('subject'),
                message=data.get('message'),
                link=data.get('link'),
                user_id=user.id,
                vendor_id=vendor.id,
                vendor_user_id=vendor_user.id,
                market_id=data.get('market_id'),
                created_at=datetime.utcnow(),
                is_read=False
            )
            notifications.append(new_notification)

        db.session.add_all(notifications)
        db.session.commit()

        return jsonify({
            'message': 'Notifications sent successfully.',
            'notifications': [
                {
                    'id': n.id,
                    'subject': n.subject,
                    'message': n.message,
                    'link': n.link,
                    'user_id': n.user_id,
                    'vendor_id': n.vendor_id,
                    'vendor_user_id': n.vendor_user_id,
                    'market_id': n.market_id,
                    'is_read': n.is_read
                }
                for n in notifications
            ]
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating notification: {str(e)}")
        return jsonify({'message': f'Error creating notification: {str(e)}'}), 500

@app.route('/api/vendor-notifications', methods=['GET', 'DELETE'])
@jwt_required()
def fetch_vendor_notifications():
    vendor_id = request.args.get('vendor_id')
    vendor_user_id = request.args.get('vendor_user_id')
    is_read = request.args.get('is_read', None)
    subject = request.args.get('subject')
    
    if request.method == 'GET':
        query = VendorNotification.query

        if vendor_id:
            query = query.filter_by(vendor_id=vendor_id)
        if vendor_user_id:
            query = query.filter_by(vendor_user_id=vendor_user_id)
        if is_read is not None:
            is_read_bool = is_read.lower() == 'true'
            query = query.filter_by(is_read=is_read_bool)
        if subject:
            query = query.filter_by(subject=subject)

        notifications = query.order_by(VendorNotification.created_at.desc()).all()

        notifications_data = [ {
            'id': n.id,
            'subject': n.subject,
            'message': n.message,
            'link': n.link,
            'is_read': n.is_read,
            'user_id': n.user_id,
            'market_id': n.market_id,
            'vendor_id': n.vendor_id,
            'vendor_user_id': n.vendor_user_id, 
            'created_at': n.created_at,
            'vendor_name': Vendor.query.get(n.vendor_id).name if Vendor.query.get(n.vendor_id) else 'Unknown Vendor',
            } for n in notifications ]
        
        return jsonify({'notifications': notifications_data}), 200
    
    if request.method == 'DELETE':
        query = VendorNotification.query
        if vendor_user_id:
            query = query.filter(
                VendorNotification.vendor_user_id == vendor_user_id,
                VendorNotification.subject != 'team-request'
            )
        
            deleted_count = query.delete()
            db.session.commit()
            return jsonify({'deleted count': deleted_count}), 200

@app.route('/api/vendor-notifications/<int:id>', methods=['PATCH', 'DELETE'])
@jwt_required()
def delete_notification(id):
    if request.method == 'PATCH':
        notification = VendorNotification.query.get(id)
        if not notification:
            return jsonify({'message': 'Notification not found'}), 404
        
        data = request.get_json()
        for key, value in data.items():
            setattr(notification, key, value)
        db.session.commit()
        return notification.to_dict(), 202

    elif request.method == 'DELETE':
        notification = VendorNotification.query.filter_by(id=id).first()

        if not notification:
            return jsonify({'message': 'No notifications found'}), 404

        notification_data = {'id': notification.id, 'message': notification.message}
        
        db.session.delete(notification)
        db.session.commit()
        return jsonify({'notifications': notification_data}), 200
    
@app.route('/api/vendor-notifications/vendor/<int:vendor_id>', methods=['GET'])
@jwt_required()
def get_vendor_notifications(vendor_id):
    notifications = VendorNotification.query.filter_by(vendor_id=vendor_id, is_read=False).all()

    notifications_data = [{'id': n.id, 'message': n.message, 'vendor_id': n.vendor_id, 'vendor_user_id': n.vendor_user_id} for n in notifications]
    return jsonify({'notifications': notifications_data}), 200

@app.route('/api/vendor-notifications/vendor-user/<int:vendor_user_id>', methods=['GET'])
@jwt_required()
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
@jwt_required()
def approve_notification(notification_id):
    data = request.get_json()
    vendor_role = data.get('vendor_role')

    notification = VendorNotification.query.get(notification_id)
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404

    if not notification.vendor_user_id:
        return jsonify({'message': 'No vendor user associated with this notification'}), 400

    user = VendorUser.query.get(notification.vendor_user_id)
    if not user:
        return jsonify({'message': 'Vendor user not found'}), 404

    if not isinstance(user.vendor_id, dict):
        user.vendor_id = {}

    if not isinstance(user.vendor_role, dict):
        user.vendor_role = {}

    user.vendor_id[notification.vendor_id] = notification.vendor_id

    if vendor_role is not None:
        user.vendor_role[notification.vendor_id] = int(vendor_role)
    
    user.active_vendor = int(notification.vendor_id)

    notification.is_read = True
    db.session.commit()

    db.session.delete(notification)
    db.session.commit()

    return jsonify({'message': 'Notification approved and user updated successfully'}), 200


@app.route('/api/vendor-notifications/<int:notification_id>/reject', methods=['DELETE'])
@jwt_required()
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
            subject=data['subject'],
            message=data['message'],
            link=data['link'],
            vendor_user_id=data['vendor_user_id'],
            vendor_id=data['vendor_id'],
            created_at=datetime.utcnow(),
            is_read=False
        )
        db.session.add(new_notification)
        db.session.commit()

        response_data = {
            'id': new_notification.id,
            'subject': new_notification.subject,
            'message': new_notification.message,
            'link': new_notification.link,
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


@app.route('/api/admin-notifications', methods=['GET', 'DELETE'])
@jwt_required()
def get_admin_notifications():
    if request.method == 'GET':
        notifications = AdminNotification.query.all()
        return jsonify([notif.to_dict() for notif in notifications]), 200
    
    if request.method == 'DELETE':
        admin_id = request.args.get('admin_id')
        query = AdminNotification.query
        if admin_id:
            query = query.filter(AdminNotification.subject != "product-request")
        
            deleted_count = query.delete()
            db.session.commit()
            return jsonify({'deleted count': deleted_count}), 200
        

@app.route('/api/admin-notifications/<int:id>', methods=['PATCH', 'DELETE'])
@jwt_required()
def delete_admin_notifications(id):
    if request.method == 'PATCH':
        notification = AdminNotification.query.get(id)
        if not notification:
            return jsonify({'message': 'Notification not found'}), 404
        
        data = request.get_json()
        for key, value in data.items():
            setattr(notification, key, value)
        db.session.commit()
        return notification.to_dict(), 202
    
    if request.method == 'DELETE':
        notification = AdminNotification.query.filter_by(id=id).first()

        if not notification:
            return jsonify({'message': 'No notifications found'}), 404

        notification_data = {'id': notification.id, 'message': notification.message}
        
        db.session.delete(notification)
        db.session.commit()
        return jsonify({'notifications': notification_data}), 200

@app.route('/api/faqs', methods=['GET', 'POST'])
def faqs():
    if request.method == 'GET':
        for_user = request.args.get('for_user', None)
        for_vendor = request.args.get('for_vendor', None)
        for_admin = request.args.get('for_admin', None)
        query = FAQ.query

        if for_user:
            query = query.filter(FAQ.for_user == True)
            user_result = query.all()
            if user_result:
                return jsonify([faq.to_dict() for faq in user_result]), 200
            return jsonify({'error': 'User FAQs not found'}), 404
        elif for_vendor:
            query = query.filter(FAQ.for_vendor == True)
            vendor_result = query.all()
            if vendor_result:
                return jsonify([faq.to_dict() for faq in vendor_result]), 200
            return jsonify({'error': 'Vendor FAQs not found'}), 404
        elif for_admin:
            query = query.filter(FAQ.for_admin == True)
            admin_result = query.all()
            if admin_result:
                return jsonify([faq.to_dict() for faq in admin_result]), 200
            return jsonify({'error': 'Admin FAQs not found'}), 404
        elif not for_user and not for_vendor and not for_admin:
            result = query.all()
            if result:
                return jsonify([faq.to_dict() for faq in result]), 200
            return jsonify({'error': 'No FAQs found'}), 404
        return jsonify({'error': 'Invalid query parameters'}), 400

    elif request.method == 'POST':
        data = request.get_json()
        new_faq = FAQ(
            question=data.get('question'),
            answer=data.get('answer'),
            for_user=data.get('for_user'),
            for_vendor=data.get('for_vendor'),
            for_admin=data.get('for_admin')
        )
        try:
            db.session.add(new_faq)
            db.session.commit()
            return jsonify(new_faq.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to create FAQ: {str(e)}'}, 500

@app.route('/api/faqs/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def faq(id):
    faq = FAQ.query.filter_by(id=id).first()
    if request.method == 'GET':
        if not faq:
            return {'error': 'FAQ not found'}, 404
        faq_data = faq.to_dict()
        return jsonify(faq_data), 200
    
    elif request.method == 'PATCH':
        data = request.get_json()
        for key, value in data.items():
            setattr(faq, key, value)
        db.session.commit()
        return faq.to_dict(), 202

    elif request.method == 'DELETE':
        if not faq: 
            return {'error': 'FAQ not found'}, 404
        try:
            db.session.delete(faq)
            db.session.commit()
            return {'message': 'FAQ deleted successfully'}, 200
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to delete FAQ: {str(e)}'}, 500

@app.route('/api/blogs', methods=['GET', 'POST'])
def blogs():
    if request.method == 'GET':
        for_user = request.args.get('for_user', None)
        for_vendor = request.args.get('for_vendor', None)
        for_admin = request.args.get('for_admin', None)
        query = Blog.query

        if for_user:
            query = query.filter(Blog.for_user == True)
            user_result = query.all()
            if user_result:
                return jsonify([blog.to_dict() for blog in user_result]), 200
            return jsonify({'error': 'User Blogs not found'}), 404
        elif for_vendor:
            query = query.filter(Blog.for_vendor == True)
            vendor_result = query.all()
            if vendor_result:
                return jsonify([blog.to_dict() for blog in vendor_result]), 200
            return jsonify({'error': 'Vendor Blogs not found'}), 404
        elif for_admin:
            query = query.filter(Blog.for_admin == True)
            admin_result = query.all()
            if admin_result:
                return jsonify([blog.to_dict() for blog in admin_result]), 200
            return jsonify({'error': 'Admin Blog not found'}), 404
        elif not for_user and not for_vendor and not for_admin:
            result = query.all()
            if result:
                return jsonify([blog.to_dict() for blog in result]), 200
            return jsonify({'error': 'No Blogs found'}), 404
        return jsonify({'error': 'Invalid query parameters'}), 400

    elif request.method == 'POST':
        data = request.get_json()

        try:
            post_date = datetime.strptime(data['post_date'], '%Y-%m-%d').date()
        except KeyError:
            return {'error': 'Missing post_date field'}, 400
        except ValueError:
            return {'error': 'Invalid date format for post_date. Expected format: YYYY-MM-DD'}, 400

        new_blog = Blog(
            type=data.get('type'),
            title=data.get('title'),
            body=data.get('body'),
            for_user=data.get('for_user', False),
            for_vendor=data.get('for_vendor', False),
            for_admin=data.get('for_admin', False),
            admin_user_id=data.get('admin_user_id'),
            post_date=post_date
        )

        try:
            db.session.add(new_blog)
            db.session.commit()
            return jsonify(new_blog.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to create Blog: {str(e)}'}, 500

@app.route('/api/blogs/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def blog(id):
    blog = Blog.query.filter_by(id=id).first()
    if request.method == 'GET':
        if not blog:
            return {'error': 'Blog not found'}, 404
        blog_data = blog.to_dict()
        return jsonify(blog_data), 200
    
    elif request.method == 'PATCH':
        data = request.get_json()

        if "post_date" in data:
            try:
                blog.post_date = datetime.strptime(data["post_date"], "%Y-%m-%d").date()
            except ValueError:
                return {"error": "Invalid date format for post_date. Use YYYY-MM-DD."}, 400
            
        for key, value in data.items():
            if key == "post_date":
                continue
            
            if key == "created_at" and isinstance(value, str):
                try:
                    value = datetime.fromisoformat(value)
                except ValueError:
                    return {"error": "Invalid datetime format for created_at"}, 400
            
            setattr(blog, key, value)

        db.session.commit()
        return blog.to_dict(), 202

    elif request.method == 'DELETE':
        if not blog: 
            return {'error': 'Blog not found'}, 404
        try:
            db.session.delete(blog)
            db.session.commit()
            return {'message': 'Blog deleted successfully'}, 200
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to delete Blog: {str(e)}'}, 500

if __name__ == '__main__':
    # app.run(host="0.0.0.0", port=5555, debug=True)
    app.run(port=5555, debug=True)