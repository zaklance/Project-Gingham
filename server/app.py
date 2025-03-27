import os
import json
import smtplib
import csv
from flask import Flask, Response, request, jsonify, session, send_from_directory, send_file, redirect, url_for
from markupsafe import escape
from models import ( db, User, Market, MarketDay, Vendor, MarketReview, 
                    VendorReview, ReportedReview, MarketReviewRating, 
                    VendorReviewRating, MarketFavorite, VendorFavorite, 
                    VendorMarket, VendorUser, AdminUser, Basket, Event, 
                    Product, UserNotification, VendorNotification, 
                    AdminNotification, QRCode, FAQ, Blog, BlogFavorite,
                    Receipt, SettingsUser, SettingsVendor, SettingsAdmin, 
                    UserIssue, bcrypt )
from dotenv import load_dotenv
from sqlalchemy import cast, desc, extract, func, Integer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, Session
from sqlalchemy.dialects.postgresql import JSONB
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.utils import secure_filename
from datetime import datetime, date, time, timedelta
from PIL import Image
from io import BytesIO, StringIO
from random import choice
import stripe
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import utils.events as events
from utils.emails import ( send_contact_email, send_user_password_reset_email, 
                          send_vendor_password_reset_email, send_admin_password_reset_email, 
                          send_user_confirmation_email, send_vendor_confirmation_email, 
                          send_admin_confirmation_email )
import subprocess
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from twilio.twiml.messaging_response import MessagingResponse

load_dotenv()

app = Flask(__name__, static_folder='public')

STRIPE_WEBHOOK_SECRET = "whsec_0fd1e4d74c18b3685bd164fe766c292f8ec7a73a887dd83f598697be422a2875"
STRIPE_ALLOWED_IPS = {
    "3.18.12.63", "3.130.192.231", "13.235.14.237", "13.235.122.149",
    "18.211.135.69", "35.154.171.200", "52.15.183.38", "54.88.130.119",
    "54.88.130.237", "54.187.174.169", "54.187.205.235", "54.187.216.72"
}

USER_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/user-images')
VENDOR_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/vendor-images')
MARKET_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/market-images')
BLOG_UPLOAD_FOLDER = os.path.join(os.getcwd(), '../client/public/blog-images')
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
        "avatar-onion-1.jpg", "avatar-onion-2.jpg", "avatar-peach-1.jpg", 
        "avatar-pomegranate-1.jpg", "avatar-radish-1.jpg", "avatar-tomato-1.jpg",
        "avatar-watermelon-1.jpg"
    ]

def handle_checkout_completed(session):
    """Retrieve purchase details from checkout session."""
    session_id = session["id"]
    session_details = stripe.checkout.Session.retrieve(session_id, expand=["line_items", "payment_intent"])
    
    payment_intent_id = session_details["payment_intent"]
    line_items = session_details["line_items"]["data"]
    customer_email = session_details.get("customer_details", {}).get("email", "N/A")

    # Get the last 4 digits of the card
    payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id, expand=["charges.payment_method"])
    last4 = payment_intent["charges"]["data"][0]["payment_method_details"]["card"]["last4"]

    # Extract receipt data
    purchased_items = [
        {
            "basket_id": item["id"],
            "name": item["description"],
            "quantity": item["quantity"],
            "price": item["amount_total"] / 100,
            "pickup_date": session.get("metadata", {}).get(f"pickup_date_{item['id']}", "Unknown"),
            "pickup_time": session.get("metadata", {}).get(f"pickup_time_{item['id']}", "Unknown"),
            "vendor": session.get("metadata", {}).get(f"vendor_{item['id']}", "Unknown")
        }
        for item in line_items
    ]

    total_amount = session_details["amount_total"] / 100
    currency = session_details["currency"].upper()

    print(f"Checkout Completed for {customer_email} - Total: ${total_amount} {currency} (Card Last 4: {last4})")

    # Generate receipt
    generate_receipt(customer_email, total_amount, currency, purchased_items, last4)

def handle_payment_success(payment_intent):
    """Retrieve payment details from successful payment."""
    payment_intent_id = payment_intent["id"]
    total_amount = payment_intent["amount_received"] / 100  # Convert cents to dollars
    currency = payment_intent["currency"].upper()

    # Get last 4 digits of the card
    last4 = payment_intent["charges"]["data"][0]["payment_method_details"]["card"]["last4"]

    # Get customer email
    customer_email = payment_intent.get("charges", {}).get("data", [{}])[0].get("billing_details", {}).get("email", "N/A")

    # Retrieve metadata for baskets (if stored in frontend during checkout)
    baskets = payment_intent.get("metadata", {}).get("baskets", "[]")

    # print(f"Payment Successful: {payment_intent_id}")
    # print(f"Customer: {customer_email}")
    # print(f"Total Paid: ${total_amount} {currency}")
    # print(f"Card Last 4: {last4}")

    # If baskets metadata exists, convert it from JSON format
    import json
    try:
        basket_data = json.loads(baskets)
    except json.JSONDecodeError:
        basket_data = []

    purchased_items = [
        {
            "basket_id": item.get("id"),
            "name": item.get("name"),
            "price": item.get("price"),
            "quantity": item.get("quantity"),
            "pickup_date": item.get("pickup_date", "Unknown"),
            "pickup_time": item.get("pickup_time", "Unknown"),
            "vendor": item.get("vendor_name", "Unknown")
        }
        for item in basket_data
    ]

    generate_receipt(customer_email, total_amount, currency, purchased_items, last4)

def generate_receipt(email, total, currency, items, last4):
    """Generate structured receipt details."""
    # print("\n **Receipt Details:**")
    # print(f"Customer: {email}")
    # print(f"Total: ${total} {currency}")
    # print(f"Card Last 4: {last4}")
    for item in items:
        print(f"- {item['name']} (Basket ID: {item['basket_id']}) - ${item['price']:.2f}")
        print(f"  Pickup: {item['pickup_date']} {item['pickup_time']} from {item['vendor']}")

def generate_csv(model, fields, filename_prefix):
    """Helper function to generate CSV from a model."""
    try:
        today_date = datetime.today().strftime("%Y-%m-%d")
        filename = f"{filename_prefix}_{today_date}.csv"

        csv_data = ",".join(fields) + "\n"

        records = model.query.all()
        for record in records:
            row = [str(getattr(record, field, "")) for field in fields]
            csv_data += ",".join(row) + "\n"

        return jsonify({"filename": filename, "data": csv_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
        
        # Get the current working directory
        cwd = os.getcwd()
        print(f"Current working directory: {cwd}")  # Debug log
        
        if upload_type == 'vendor':
            base_folder = os.path.join(cwd, '../client/public/vendor-images')
            upload_folder = os.path.join(base_folder, str(vendor_id))
        elif upload_type == 'market':
            base_folder = os.path.join(cwd, '../client/public/market-images')
            upload_folder = os.path.join(base_folder, str(market_id))
        elif upload_type == 'user':
            base_folder = os.path.join(cwd, '../client/public/user-images')
            upload_folder = os.path.join(base_folder, str(user_id))
        else:
            return {'error': 'Invalid type specified. Must be "vendor", "market", or "user"'}, 400

        # Normalize paths for comparison
        base_folder = os.path.normpath(base_folder)
        upload_folder = os.path.normpath(upload_folder)
        
        print(f"Base folder: {base_folder}")  # Debug log
        print(f"Upload folder: {upload_folder}")  # Debug log

        # Ensure the upload folder is within the base folder
        if not upload_folder.startswith(base_folder):
            print(f"Path validation failed: {upload_folder} does not start with {base_folder}")  # Debug log
            return {'error': 'Invalid path specified'}, 400

        # Ensure the upload folder exists
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            print(f"Created upload folder: {upload_folder}")  # Debug log

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

            return {'message': 'File successfully uploaded', 'filename': escape(os.path.basename(file_path))}, 201

        except Exception as e:
            db.session.rollback()
            print(f"Error during file upload: {str(e)}")  # Debug log
            return {'error': f'Failed to upload image: {str(e)}'}, 500

    return {'error': 'File type not allowed'}, 400

@app.route('/api/upload-files', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return {'error': 'No files part in the request'}, 400

    files = request.files.getlist('files')

    if not files or all(file.filename == '' for file in files):
        return {'error': 'No files selected'}, 400

    formatted_date = datetime.now().strftime("%Y-%m%d")
    upload_folder = os.path.join(os.getcwd(), f'../client/public/blog-images/{formatted_date}')

    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    uploaded_files = []

    for file in files:
        if file and allowed_file(file.filename):
            original_filename = secure_filename(file.filename)
            file_path = os.path.join(upload_folder, original_filename)

            if os.path.exists(file_path):
                base, ext = os.path.splitext(original_filename)
                counter = 1
                while os.path.exists(file_path):
                    file_path = os.path.join(upload_folder, f"{base}_{counter}{ext}")
                    counter += 1

            try:
                if original_filename.rsplit('.', 1)[1].lower() == 'svg':
                    file.save(file_path)
                else:
                    image = Image.open(file)
                    image = resize_image(image)
                    image.save(file_path)

                uploaded_files.append(os.path.basename(file_path))

            except Exception as e:
                return {'error': f'Failed to upload image: {str(e)}'}, 500

    return {'message': 'Files successfully uploaded', 'filenames': uploaded_files}, 201

@app.route('/api/blog-images', methods=['GET'])
def get_blog_images():
    blog_folder = os.path.join(os.getcwd(), '../client/public/blog-images')

    if not os.path.exists(blog_folder):
        return {'folders': {}}

    folders = [f for f in os.listdir(blog_folder) if os.path.isdir(os.path.join(blog_folder, f))]

    folders.sort(reverse=True, key=lambda x: int(x.replace("-", "")) if x.replace("-", "").isdigit() else 0)

    images_by_folder = {}

    for folder in folders:
        folder_path = os.path.join(blog_folder, folder)
        images = [f'/blog-images/{folder}/{img}' for img in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, img))]
        
        if images:
            images_by_folder[folder] = images

    return {'folders': images_by_folder}

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
    file_path = os.path.normpath(os.path.join(upload_folder, os.path.basename(filename)))

    # Ensure the file path is within the upload folder
    if not file_path.startswith(upload_folder):
        return {'error': 'Invalid file path'}, 400

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
        filename = secure_filename(filename)
        user_image_path = os.path.normpath(os.path.join(USER_UPLOAD_FOLDER, filename))
        vendor_image_path = os.path.normpath(os.path.join(VENDOR_UPLOAD_FOLDER, filename))
        market_image_path = os.path.normpath(os.path.join(MARKET_UPLOAD_FOLDER, filename))

        if user_image_path.startswith(USER_UPLOAD_FOLDER) and os.path.exists(user_image_path):
            return send_from_directory(USER_UPLOAD_FOLDER, filename)
        elif vendor_image_path.startswith(VENDOR_UPLOAD_FOLDER) and os.path.exists(vendor_image_path):
            return send_from_directory(VENDOR_UPLOAD_FOLDER, filename)
        elif market_image_path.startswith(MARKET_UPLOAD_FOLDER) and os.path.exists(market_image_path):
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
        return {'error': ' Incorrect email or password—or both!'}, 401
    
    if user.status == "banned":
        return {'error': ' Account is banned. Please contact support.'}, 403
    
    if not user.authenticate(data['password']):
        return {'error': ' Incorrect email or password—or both!'}, 401
    
    user.last_login = datetime.utcnow()
    user.login_count = (user.login_count or 0) + 1

    db.session.commit()
    
    access_token = create_access_token(
        identity=user.id, 
        expires_delta=timedelta(hours=12), 
        additional_claims={"role": "user"}
    )
    
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

        # all_users = User.query.all()
        # for user in all_users:
        #     if bcrypt.check_password_hash(user.password, password):
        #         return jsonify({'error': 'This password has already been used. Please choose a different password.'}), 400

        result = send_user_confirmation_email(email, data)

        if 'error' in result:
            return jsonify({"error": result["error"]}), 500

        return jsonify({"message": result["message"]}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/user/confirm-email/<token>', methods=['GET', 'POST', 'PATCH'])
def confirm_email(token):
    try:
        # print(f"Received token: {token}")
        data = serializer.loads(token, salt='user-confirmation-salt', max_age=86400)
        website = os.environ['SITE_URL']

        user_id = data.get('user_id')  # Extract user ID
        email = data.get('email')  # Extract new email

        if request.method == 'GET':
            # print(f"GET request: Token verified, email extracted: {email}")
            return redirect(f'{website}/user/confirm-email/{token}')

        if request.method == 'POST':
            # print(f"POST request: Token verified, user data extracted: {data}")

            existing_user = User.query.get(user_id)

            if existing_user:
                # print(f"POST request: User {user_id} exists, updating email to {email}")

                if User.query.filter(User.email == email, User.id != user_id).first():
                    return jsonify({"error": "This email is already in use by another account."}), 400

                existing_user.email = email
                db.session.commit()

                return jsonify({
                    "message": "Email updated successfully. Verification required for the new email.",
                    "isNewUser": False,
                    "user_id": existing_user.id,
                    "email": existing_user.email
                }), 200

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
                coordinates=data.get('coordinates')
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
    
    access_token = create_access_token(
        identity=vendor_user.id, 
        expires_delta=timedelta(hours=12), 
        additional_claims={"role": "vendor"}
    )

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

@app.route('/api/change-vendor-email', methods=['POST'])
def change_vendor_email():
    try:
        data = request.get_json()

        email = data.get('email')
        if not email:
            return jsonify({'error': 'Email is required'}), 400

        result = send_vendor_confirmation_email(email, data)

        if 'error' in result:
            return jsonify({"error": result["error"]}), 500

        return jsonify({"message": result["message"]}), 200

    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/api/vendor/confirm-email/<token>', methods=['GET', 'POST', 'PATCH'])
def confirm_vendor_email(token):
    try:
        print(f'Received token: {token}')
        data = serializer.loads(token, salt='vendor-confirmation-salt', max_age=86400)
        website = os.environ['SITE_URL']

        vendor_id = data.get('vendor_id')
        email = data.get('email')

        if request.method == 'GET':
            # print(f"GET request: Token verified, email extracted: {email}")
            return redirect(f'{website}/vendor/confirm-email/{token}')
        
        if request.method == 'POST':
            # print(f"POST request: Token verified, user data extracted: {data}")
            
            existing_vendor = VendorUser.query.get(vendor_id)
            
            if existing_vendor:
                print(f"POST request: User {vendor_id} exists, updating email to {email}")
                
                if VendorUser.query.filter(VendorUser.email == email, VendorUser.id != vendor_id).first():
                    return jsonify({"error": "This email is already in use by another account."}), 400
                
                existing_vendor.email = email
                db.session.commit()
                
                return jsonify({
                    "message": "Email updated successfully. Verification required for the new email.",
                    "isNewUser": False,
                    "user_id": existing_vendor.id,
                    "email": existing_vendor.email
                }), 200
            
            if "password" not in data:
                print("POST request failed: Missing password field for new account creation.")
                return jsonify({"error": "Password is required to create a new account."}), 400

            new_vendor_user = VendorUser(
                email=email,
                password=data['password'], 
                first_name=data['first_name'],
                last_name=data['last_name'],
                phone=data['phone'],
            )
            db.session.add(new_vendor_user)
            db.session.commit()

            print("POST request: VendorUser created and committed to the database")
            return jsonify({
                'message': 'Email confirmed and account created successfully.', 
                'isNewVendor': True, 
                'vendor_id': new_vendor_user.id
            }), 201

    except SignatureExpired:
        print("Request: The token has expired")
        return jsonify({'error': 'The token has expired'}), 400

    except Exception as e:
        print(f"Request: An error occurred: {str(e)}")
        return jsonify({'error': f'Failed to confirm or update email: {str(e)}'}), 500
    
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
    
    access_token = create_access_token(
        identity=admin_user.id, 
        expires_delta=timedelta(hours=12), 
        additional_claims={"role": "admin"}
    )

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

@app.route('/api/change-admin-email', methods=['POST'])
def change_admin_email():
    try:
        data = request.get_json()

        email = data.get('email')
        if not email:
            return jsonify({'error': 'Email is required'}), 400

        result = send_admin_confirmation_email(email, data)

        if 'error' in result:
            return jsonify({"error": result["error"]}), 500

        return jsonify({"message": result["message"]}), 200

    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/api/admin/confirm-email/<token>', methods=['GET', 'POST', 'PATCH'])
def confirm_admin_email(token):
    try:
        print(f'Received token: {token}')
        data = serializer.loads(token, salt='admin-confirmation-salt', max_age=86400)
        website = os.environ['SITE_URL']

        admin_id = data.get('admin_id')
        email = data.get('email')

        if request.method == 'GET':
            print(f"GET request: Token verified, email extracted: {email}")
            return redirect(f'{website}/admin/confirm-email/{token}')
        
        if request.method == 'POST':
            print(f"POST request: Token verified, user data extracted: {data}")
            
            existing_admin = AdminUser.query.get(admin_id)
            
            if existing_admin:
                print(f"POST request: User {admin_id} exists, updating email to {email}")
                
                if AdminUser.query.filter(AdminUser.email == email, AdminUser.id != admin_id).first():
                    return jsonify({"error": "This email is already in use by another account."}), 400
                
                existing_admin.email = email
                db.session.commit()
                
                return jsonify({
                    "message": "Email updated successfully. Verification required for the new email.",
                    "isNewUser": False,
                    "user_id": existing_admin.id,
                    "email": existing_admin.email
                }), 200
            
            if "password" not in data:
                print("POST request failed: Missing password field for new account creation.")
                return jsonify({"error": "Password is required to create a new account."}), 400

            new_admin_user = AdminUser(
                email=email,
                password=data['password'], 
                first_name=data['first_name'],
                last_name=data['last_name'],
                phone=data['phone'],
            )
            db.session.add(new_admin_user)
            db.session.commit()

            print("POST request: VendorUser created and committed to the database")
            return jsonify({
                'message': 'Email confirmed and account created successfully.', 
                'isNewVendor': True, 
                'vendor_id': new_admin_user.id
            }), 201

    except SignatureExpired:
        print("Request: The token has expired")
        return jsonify({'error': 'The token has expired'}), 400

    except Exception as e:
        print(f"Request: An error occurred: {str(e)}")
        return jsonify({'error': f'Failed to confirm or update email: {str(e)}'}), 500

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
                if 'join_date' in data:
                    data['join_date'] = datetime.strptime(data['join_date'], "%Y-%m-%d %H:%M:%S")
                if 'last_login' in data:
                    data['last_login'] = datetime.strptime(data['last_login'], "%Y-%m-%d %H:%M:%S")
                    
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

@app.route('/api/vendor-users/<int:id>/password', methods=['PATCH'])
@jwt_required()
def vendor_user_password_change(id):
    if not check_role('vendor') and not check_role('admin'):
        return {'error': "Access forbidden: Vendor User only"}, 403
    
    if request.method == 'PATCH':
        data = request.get_json()
        vendor_user = VendorUser.query.filter(VendorUser.id == id).first()
        if not vendor_user:
            return {'error': ' User not found'}, 401
        
        if not vendor_user.authenticate(data['old_password']):
            return {'error': ' Incorrect password!'}, 401
        
        vendor_user.password = data.get('new_password')
        db.session.commit()
        
        return jsonify(id=vendor_user.id), 200

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

            if 'join_date' in data:
                try:
                    data['join_date'] = datetime.strptime(data['join_date'], "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    return jsonify({'error': 'Invalid date format for join_date. Expected YYYY-MM-DD HH:MM:SS'}), 400

            if 'last_login' in data:
                try:
                    data['last_login'] = datetime.strptime(data['last_login'], "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    return jsonify({'error': 'Invalid date format for last_login. Expected YYYY-MM-DD HH:MM:SS'}), 400

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

@app.route('/api/admin-users/<int:id>/password', methods=['PATCH'])
@jwt_required()
def admin_user_password_change(id):
    if not check_role('admin'):
        return {'error': "Access forbidden: Admin User only"}, 403
    
    if request.method == 'PATCH':
        data = request.get_json()
        admin_user = AdminUser.query.filter(AdminUser.id == id).first()
        if not admin_user:
            return {'error': ' User not found'}, 401
        
        if not admin_user.authenticate(data['old_password']):
            return {'error': ' Incorrect password!'}, 401
        
        admin_user.password = data.get('new_password')
        db.session.commit()
        
        return jsonify(id=admin_user.id), 200

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
            website=data.get('website'),
            bio=data.get('bio'),
            location=data.get('location'),
            city=data.get('city'),
            state=data.get('state'),
            zipcode=data.get('zipcode'),
            coordinates=data.get('coordinates'),
            maps=data.get('maps'),
            maps_organizer=data.get('maps_organizer'),
            schedule=data.get('schedule'),
            year_round=data.get('year_round'),
            season_start=season_start,
            season_end=season_end,
            is_flagship=data.get('is_flagship'),
            is_visible=data.get('is_visible'),
            is_current=data.get('is_current')
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
            if 'website' in data:
                market.website = data['website']
            if 'image' in data:
                market.image = data['image']
            if 'image_default' in data:
                market.image_default = data['image_default']
            if 'bio' in data:
                market.bio = data['bio']
            if 'location' in data:
                market.location = data['location']
            if 'city' in data:
                market.city = data['city']
            if 'state' in data:
                market.state = data['state']
            if 'zipcode' in data:
                market.zipcode = data['zipcode']
            if 'coordinates' in data:
                market.coordinates = data['coordinates']
            if 'maps_organizer' in data:
                market.maps_organizer = data['maps_organizer']
            if 'maps' in data:
                maps_links = data['maps']
                if not isinstance(maps_links, dict):
                    return jsonify({'error': 'maps must be a dictionary'}), 400
                market.maps = maps_links
            if 'schedule' in data:
                market.schedule = data['schedule']
            if 'year_round' in data:
                if isinstance(data['year_round'], bool):
                    market.year_round = data['year_round']
                elif isinstance(data['year_round'], str):
                    market.year_round = data['year_round'].lower() == 'true'
                else:
                    return {'error': 'Invalid value for year_round. Must be a boolean or "true"/"false" string.'}, 400
            if 'is_flagship' in data:
                if isinstance(data['is_flagship'], bool):
                    market.is_flagship = data['is_flagship']
                elif isinstance(data['is_flagship'], str):
                    market.is_flagship = data['is_flagship'].lower() == 'true'
                else:
                    return {'error': 'Invalid value for is_flagship. Must be a boolean or "true"/"false" string.'}, 400
            if 'is_visible' in data:
                if isinstance(data['is_visible'], bool):
                    market.is_visible = data['is_visible']
                elif isinstance(data['is_visible'], str):
                    market.is_visible = data['is_visible'].lower() == 'true'
                else:
                    return {'error': 'Invalid value for is_visible. Must be a boolean or "true"/"false" string.'}, 400
            if 'is_current' in data:
                if isinstance(data['is_current'], bool):
                    market.is_current = data['is_current']
                elif isinstance(data['is_current'], str):
                    market.is_current = data['is_current'].lower() == 'true'
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
            products_subcategories=data.get('products_subcategories'),
            website=data.get('website'),
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
        if 'products' in data:
            vendor.product = data['products']
        if 'products_subcategories' in data:
            vendor.products_subcategories = data['products_subcategories']
        if 'bio' in data:
            vendor.bio = data['bio']
        if 'website' in data:
            vendor.website = data['website']
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
            if 'city' in data:
                vendor.city = data['city']
            if 'state' in data:
                vendor.state = data['state']
            if 'products' in data:
                vendor.products = data['products']
            if 'products_subcategories' in data:
                vendor.products_subcategories = data['products_subcategories']
            if 'bio' in data:
                vendor.bio = data['bio']
            if 'website' in data:
                vendor.website = data['website']
            if 'image' in data:
                vendor.image = data['image']
            if 'image_default' in data: 
                vendor.image_default = data['image_default']
            if 'stripe_is_onboarded' in data:
                vendor.stripe_is_onboarded = data['stripe_is_onboarded']
                
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
            reviews = VendorReview.query.all()
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
    query = (
        db.session.query(MarketReview)
        .join(vote_up_counts, MarketReview.id == vote_up_counts.c.review_id)
        .filter(vote_up_counts.c.vote_up_count >= max(percentile_value, 3))
        .order_by(desc(vote_up_counts.c.vote_up_count))
    )
    market_id = request.args.get('market_id')
    if market_id:
        query = query.filter(MarketReview.market_id == market_id)
    
    top_reviews = query.all()
        
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
    query = (
        db.session.query(VendorReview)
        .join(vote_up_counts, VendorReview.id == vote_up_counts.c.review_id)
        .filter(vote_up_counts.c.vote_up_count >= max(percentile_value, 3))
        .order_by(desc(vote_up_counts.c.vote_up_count))
    )
    vendor_id = request.args.get('vendor_id')
    if vendor_id:
        query = query.filter(VendorReview.vendor_id == vendor_id)

    top_reviews = query.all()

    # print("Percentile value for top reviews:", percentile_value)
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
                is_grabbed=data.get('is_grabbed', False),
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
            if 'is_refunded' in data:
                basket.is_refunded = data['is_refunded']
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
                    "fee_vendor": basket.fee_vendor,
                    "is_refunded": basket.is_refunded
                }

            sales_history[(sale_date, market_day_id)]["total_baskets"] += 1
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
        qr_code_data = qr_code.to_dict()
        return jsonify(qr_code_data), 200

    elif request.method == 'DELETE':
        qr_code = QRCode.query.filter_by(id=id).first()
        if not qr_code:
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
        compiled_html = body

    if body_type == 'mjml':
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
    if body_type == 'mjml':
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

@app.route("/api/sms", methods=['GET', 'POST'])
def incoming_sms():
    # Get the message the user sent our Twilio number
    body = request.values.get('Body', None)
    sender_phone = request.values.get('From', None)

    if sender_phone.startswith("+1"):
        sender_phone = sender_phone[2:]
    elif sender_phone.startswith("+"):
        sender_phone = sender_phone[1:]

    # Start our TwiML response
    resp = MessagingResponse()

    # Determine the right reply for this message
    if body == 'stop':
        try:
            user = User.query.filter_by(phone=sender_phone).first()
            if user:
                settings = SettingsUser.query.filter_by(user_id=user.id).first()
                if settings:
                    settings.text_fav_market_schedule_change = False
                    settings.text_fav_market_new_basket = False
                    settings.text_fav_vendor_schedule_change = False
                    settings.text_basket_pickup_time = False
                    db.session.commit()
                    resp.message("You have been unsubscribed from all text notifications ;)")
                else:
                    resp.message(r"Error unsubscribing from text all notifications. Please turn them off on the website. ¯\_(ツ)_/¯")
            else:
                print("No user found with this phone number.")
                resp.message(r"Error unsubscribing from all text notifications. Please turn them off on the website. ¯\_(ツ)_/¯")
        except Exception as e:
            db.session.rollback()
            print(f"An error occurred: {str(e)}")
    else:
        resp.message("I didn't understand that prompt :/")

    return str(resp)

# Stripe
stripe.api_key = os.getenv('STRIPE_PY_KEY')

def get_vendor_stripe_accounts(vendor_ids):
    vendors = Vendor.query.filter(Vendor.id.in_(vendor_ids)).all()
    vendor_accounts = {vendor.id: vendor.stripe_account_id for vendor in vendors if vendor.stripe_account_id}
    return vendor_accounts

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
        if not data or 'baskets' not in data:
            return jsonify({'error': {'message': 'Missing baskets data.'}}), 400

        total_price = sum(basket['price'] for basket in data['baskets'])
        total_fee_vendor = sum(basket['fee_vendor'] for basket in data['baskets'])
        total_fee_user = sum(basket['fee_user'] for basket in data['baskets']) 

        transfer_group = f"group_pi_{int(datetime.now().timestamp())}"

        payment_intent = stripe.PaymentIntent.create(
            amount=int((total_price + total_fee_user) * 100),
            currency="usd",
            automatic_payment_methods={'enabled': True},
            transfer_group=transfer_group
        )

        return jsonify({
            'clientSecret': payment_intent['client_secret'],
            'transfer_group': transfer_group,
            'total_fee_vendor': total_fee_vendor
        }), 200

    except stripe.error.StripeError as e:
        return jsonify({'error': {'message': str(e.user_message)}}), 400

    except Exception as e:
        return jsonify({'error': {'message': 'An unexpected error occurred.', 'details': str(e)}}), 500

@app.route('/api/process-transfers', methods=['POST'])
def process_transfers():
    try:
        data = request.get_json()
        print("THIS IS WHAT YOU ARE LOOKING FOR !!!!!!!!!:", data) 

        if not data or 'payment_intent_id' not in data or 'baskets' not in data:
            return jsonify({'error': {'message': 'Missing required data.'}}), 400

        payment_intent_id = data['payment_intent_id']
        print(f"Processing transfers for PaymentIntent: {payment_intent_id}")

        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        print(f"PaymentIntent Status: {payment_intent['status']}")
        if payment_intent['status'] != 'succeeded':
            return jsonify({
                'error': {
                    'message': f"Payment not completed yet. Current status: {payment_intent['status']}",
                    'payment_intent_status': payment_intent['status']
                }
            }), 400
        
        vendor_ids = [basket['vendor_id'] for basket in data['baskets']]
        vendor_accounts = get_vendor_stripe_accounts(vendor_ids)
        print(f"Vendor accounts retrieved: {vendor_accounts}")

        transfer_data = []
        for basket in data['baskets']:
            vendor_id = basket.get('vendor_id')
            price = basket.get('price', 0)
            fee_vendor = basket.get('fee_vendor', 0)
            
            if vendor_id is None or price == 0:
                print(f"Skipping invalid basket: {basket}")
                continue
            
            stripe_account_id = vendor_accounts.get(vendor_id)

            if not stripe_account_id:
                print(f"Vendor {vendor_id} has no Stripe account! Skipping...")
                continue

            # Calculate transfer amount (excluding the vendor fee)
            transfer_amount = int((price - fee_vendor) * 100)

            # Set fee for this specific basket transfer
            application_fee = int(fee_vendor * 100)

            print(f"Creating transfer for vendor {vendor_id} (Stripe ID: {stripe_account_id}):")
            print(f"  - Transfer Amount: {transfer_amount} cents")
            print(f"  - Application Fee: {application_fee} cents")

            try:
                transfer = stripe.Transfer.create(
                    amount=transfer_amount + application_fee,  # Total amount to transfer
                    currency="usd",
                    destination=stripe_account_id,
                    transfer_group=f"group_pi_{payment_intent_id}",
                    application_fee_amount=application_fee  # Assign fee per transfer
                )

                print(f"Stripe Transfer Response: {transfer}") 

                transfer_data.append({
                    "basket_id": basket["id"], 
                    "vendor_id": vendor_id,
                    "stripe_account_id": stripe_account_id,
                    "stripe_transfer_id": transfer.id,
                    "amount": transfer.amount,
                    "destination": stripe_account_id,
                    "payment_intent_id": payment_intent_id,
                    "transfer_group": f"group_pi_{payment_intent_id}",
                    "application_fee_amount": application_fee,
                })
                
                print("LOOK AT THIS ONE TOO", transfer_data)

                # Update the basket record in the database
                basket_record = Basket.query.filter_by(id=basket['id']).first()
                if basket_record:
                    basket_record.stripe_transfer_id = transfer.id 
                    db.session.commit() 
                    print(f"Basket {basket['id']} updated with stripe_transfer_id {transfer.id}")

            except stripe.error.StripeError as e:
                print(f"Transfer failed for vendor {vendor_id} (Stripe ID: {stripe_account_id}): {e}")
                print(f"Stripe API Response: {e.json_body}") 
                return jsonify({'error': {'message': f"Transfer failed for vendor {vendor_id}", 'details': e.json_body}}), 400

        print("Final Transfer Data:", transfer_data)

        return jsonify({
            'message': 'Transfers processed successfully',
            'transfer_data': transfer_data
        }), 200

    except stripe.error.StripeError as e:
        print(f"Stripe API Error: {str(e)}")
        return jsonify({'error': {'message': 'Stripe API Error', 'details': str(e)}}), 400

    except Exception as e:
        print(f"Unexpected error in /api/process-transfers: {str(e)}")
        return jsonify({'error': {'message': 'An unexpected error occurred.', 'details': str(e)}}), 500

@app.route('/api/transfer-reversal', methods=['POST'])
def reverse_basket_transfer():
    try:
        data = request.get_json()
        required_fields = ["basket_id", "stripe_account_id", "amount"]
        if not all(field in data for field in required_fields):
            return jsonify({'error': {'message': 'Missing required data.'}}), 400

        basket_id = data['basket_id']
        stripe_account_id = data['stripe_account_id']
        reversal_amount = int(data['amount'] * 100)

        print(f"Reversing transfer for Basket {basket_id} (Stripe ID: {stripe_account_id}) (Amount: {reversal_amount} cents)")

        basket_record = Basket.query.filter_by(id=basket_id).first()
        if not basket_record or not basket_record.stripe_transfer_id:
            return jsonify({'error': {'message': f"No stripe_transfer_id found for basket {basket_id}."}}), 400

        stripe_transfer_id = basket_record.stripe_transfer_id
        print(f"Found stripe_transfer_id: {stripe_transfer_id} for basket {basket_id}")

        reversal = stripe.Transfer.create_reversal(
            stripe_transfer_id,
            amount=reversal_amount,
            metadata={"reason": "Refunded to customer"}
        )

        basket_record.is_refunded = True
        db.session.commit()

        return jsonify({
            "id": reversal["id"],
            "object": reversal["object"],
            "amount": reversal["amount"],
            "balance_transaction": reversal["balance_transaction"],
            "created": reversal["created"],
            "currency": reversal["currency"],
            "destination_payment_refund": reversal.get("destination_payment_refund"),
            "metadata": reversal["metadata"],
            "source_refund": reversal["source_refund"],
            "transfer": stripe_transfer_id,
            "is_refunded": True
        }), 200

    except stripe.error.StripeError as e:
        db.session.rollback()
        print(f"❌ Stripe API Error: {e.user_message}")
        return jsonify({'error': {'message': e.user_message}}), 400

    except Exception as e:
        db.session.rollback()
        print(f"❌ Unexpected Error: {str(e)}")
        return jsonify({'error': {'message': 'An unexpected error occurred.', 'details': str(e)}}), 500


@app.route('/api/create-stripe-account', methods=['POST'])
def create_stripe_account():
    vendor_id = request.json.get("vendor_id")
    vendor_email = request.json.get("vendor_email")
    vendor_name = request.json.get("vendor_name")

    account = stripe.Account.create(
        type="standard",
        country="US",
        email=vendor_email,
        capabilities={
            "card_payments": {"requested": True},
            "transfers": {"requested": True},
        },
        business_profile= {
            "name": vendor_name,
            "support_email": vendor_email,
        },
    )

    vendor = Vendor.query.get(vendor_id)
    if vendor:
        vendor.stripe_account_id = account.id
        db.session.commit()

    return jsonify({"stripe_account_id": account.id})

@app.route('/api/account_link', methods=['POST'])
def create_account_link():
    try:
        stripe_account_id = request.get_json().get('stripe_account_id')
        website = os.environ['SITE_URL']

        account_link = stripe.AccountLink.create(
          account=stripe_account_id,
          return_url=f"{website}/vendor/sales?tab=payout{stripe_account_id}",
          refresh_url=f"{website}/refresh/{stripe_account_id}",
          type="account_onboarding",
          collect= 'eventually_due'
        )

        return jsonify({
          'url': account_link.url,
        })
    except Exception as e:
        print('An error occurred when calling the Stripe API to create an account link: ', e)
        return jsonify(error=str(e)), 500

# @app.route('/api/refund', methods=['POST'])
# def process_refund():
#     """
#     Processes a refund for a specific vendor in a multi-vendor transaction.
#     Ensures transfer reversal before issuing a refund.
#     """
#     try:
#         data = request.get_json()
#         required_fields = ["payment_intent_id", "vendor_id", "stripe_account_id", "amount"]
#         if not all(field in data for field in required_fields):
#             return jsonify({'error': {'message': 'Missing required data.'}}), 400

#         payment_intent_id = data['payment_intent_id']
#         vendor_id = data['vendor_id']
#         stripe_account_id = data['stripe_account_id']  # Direct vendor stripe ID
#         refund_amount = int(data['amount'] * 100)  # Convert to cents

#         print(f"Initiating refund process for Vendor {vendor_id} (Stripe ID: {stripe_account_id}) in PaymentIntent {payment_intent_id}")

#         # Reverse the transfer for this vendor
#         reversal_id = reverse_vendor_transfer(payment_intent_id, stripe_account_id)
#         if isinstance(reversal_id, dict) and "error" in reversal_id:
#             return jsonify({'error': reversal_id["error"]}), 400  # Stop if reversal failed

#         # Wait until the reversal is complete before refunding
#         timeout = time.time() + 30
#         while time.time() < timeout:
#             if check_reversal_status(reversal_id):
#                 print(f"Transfer reversal completed for vendor {vendor_id}. Proceeding with refund.")
#                 break
#             print("Waiting for reversal to complete...")
#             time.sleep(5)

#         # Issue refund for **only** this vendor's portion
#         refund = stripe.Refund.create(
#             payment_intent=payment_intent_id,  # Refund must be linked to PaymentIntent
#             amount=refund_amount,  # Only refund this vendor's amount
#             metadata={
#                 "vendor_id": vendor_id,
#                 "reason": "requested_by_customer"
#             }
#         )

#         print(f"Refund issued: {refund['id']} for {refund_amount} cents")
#         return jsonify({
#             "message": "Refund processed successfully",
#             "refund_id": refund['id']
#         }), 200

#     except stripe.error.StripeError as e:
#         print(f"Stripe API Error: {e.user_message}")
#         return jsonify({'error': {'message': e.user_message}}), 400

#     except Exception as e:
#         print(f"Unexpected Error: {str(e)}")
#         return jsonify({'error': {'message': 'An unexpected error occurred.', 'details': str(e)}}), 500

def get_request_ip():
    if request.headers.get("X-Forwarded-For"):
        return request.headers.get("X-Forwarded-For").split(",")[0].strip()
    return request.remote_addr 

@app.route('/api/stripe-webhook', methods=['POST'])
def stripe_webhook():
    # CHECKS IP ADDRESS BEFORE REQUEST
    # request_ip = get_request_ip()

    # if request_ip not in STRIPE_ALLOWED_IPS:
    #     print(f"Unauthorized Webhook Attempt from {request_ip}")
    #     return jsonify({"error": "Unauthorized IP"}), 40

    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')

    try:
        # Verify Stripe event signature
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except ValueError as e:
        print("[Error] Invalid payload:", str(e))
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        print("[Error] Invalid signature:", str(e))
        return jsonify({'error': 'Invalid signature'}), 400

    event_type = event['type']
    print(f"\n[Event Received]: {event_type}")

    try:
        # Handle `payment_intent.created`
        if event_type == 'payment_intent.created':
            payment_intent = event['data']['object']
            print(f"Payment Intent created: {payment_intent['id']}")
            return jsonify({'message': 'Payment Intent created'}), 200

        # Handle `payment_intent.succeeded`
        elif event_type == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            print(f"Payment Intent succeeded: {payment_intent['id']}")
            handle_payment_success(payment_intent)
            return jsonify({'message': 'Payment processed'}), 200

        # Handle `charge.succeeded`
        elif event_type == 'charge.succeeded':
            charge = event['data']['object']
            print(f"Charge succeeded: {charge['id']}")
            # Additional charge processing if needed
            return jsonify({'message': 'Charge processed'}), 200

        # Handle `charge.updated`
        elif event_type == 'charge.updated':
            charge = event['data']['object']
            print(f"Charge updated: {charge['id']}")
            # Handle charge updates if needed
            return jsonify({'message': 'Charge updated'}), 200

        # Handle `payment.created`
        elif event_type == 'payment.created':
            payment = event['data']['object']
            print(f"Payment created: {payment['id']}")
            # Handle payment creation if needed
            return jsonify({'message': 'Payment created'}), 200

        # Handle `transfer.created`
        elif event_type == 'transfer.created':
            transfer = event['data']['object']
            print(f"Transfer created: {transfer['id']}")
            # Update basket with transfer ID if needed
            if transfer.get('metadata', {}).get('basket_id'):
                basket = Basket.query.filter_by(id=transfer['metadata']['basket_id']).first()
                if basket:
                    basket.stripe_transfer_id = transfer['id']
                    db.session.commit()
            return jsonify({'message': 'Transfer created'}), 200

        # Handle `application_fee.created`
        elif event_type == 'application_fee.created':
            application_fee = event['data']['object']
            print(f"Application fee created: {application_fee['id']}")
            # Handle application fee if needed
            return jsonify({'message': 'Application fee created'}), 200
        
        # Handle `balance.available`
        elif event_type == "balance.available":
            balance_data = event["data"]["object"]
            available_funds = balance_data["available"]
            print(f"Available Balance Updated: {available_funds}")
            # Handle balance updates if needed
            return jsonify({'message': 'Balance Available'}), 200
        
        # Handle `account.updated`
        elif event_type == "account.updated":
            account_data = event["data"]["object"]
            stripe_account_id = account_data["id"]
            charges_enabled = account_data.get("charges_enabled", False)
            payouts_enabled = account_data.get("payouts_enabled", False)
            
            # Update vendor's Stripe account status
            vendor = Vendor.query.filter_by(stripe_account_id=stripe_account_id).first()
            if vendor:
                vendor.charges_enabled = charges_enabled
                vendor.payouts_enabled = payouts_enabled
                db.session.commit()
                print(f"Updated vendor {vendor.id} Stripe account status")
            
            return jsonify({"message": "Account updated"}), 200
        
        else: 
            print("Unhandled event type:", event_type)
            return jsonify({'message': f'Unhandled event {event_type}'}), 200

    except Exception as e:
        print(f"Error processing webhook event {event_type}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stripe-transaction', methods=['GET'])
def get_stripe_transaction():
    payment_intent_id = request.args.get("payment_intent_id")

    if not payment_intent_id:
        return jsonify({"error": "Missing required parameter: payment_intent_id"}), 400

    try:
        # Fetch PaymentIntent from Stripe
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)

        if not payment_intent or "latest_charge" not in payment_intent:
            return jsonify({"error": "Invalid PaymentIntent or charge not found"}), 404

        # Fetch Charge details
        charge = stripe.Charge.retrieve(payment_intent["latest_charge"])

        # Try getting balance_transaction from charge
        balance_transaction_id = charge.get("balance_transaction")

        # If missing, try fetching from Application Fee
        if not balance_transaction_id and charge.get("application_fee"):
            app_fee = stripe.ApplicationFee.retrieve(charge["application_fee"])
            balance_transaction_id = app_fee.get("balance_transaction")
            print(f"Using Application Fee Transaction: {balance_transaction_id}")

        # If still missing, try fetching from Transfer
        if not balance_transaction_id and charge.get("source_transfer"):
            transfer = stripe.Transfer.retrieve(charge["source_transfer"])
            balance_transaction_id = transfer.get("balance_transaction")
            print(f"Using Transfer Transaction: {balance_transaction_id}")

        # If still missing, return an error
        if not balance_transaction_id:
            return jsonify({"error": "Charge does not have a balance transaction yet. Try again later."}), 400

        # Fetch Balance Transaction details from Stripe
        balance_transaction = stripe.BalanceTransaction.retrieve(balance_transaction_id)

        # Extract Fees & Taxes
        fee_processor = sum(fee['amount'] / 100 for fee in balance_transaction.fee_details if fee['type'] == 'stripe_fee')
        fee_gingham = sum(fee['amount'] / 100 for fee in balance_transaction.fee_details if fee['type'] == 'application_fee')
        tax_total = sum(fee['amount'] / 100 for fee in balance_transaction.fee_details if fee['type'] == 'tax')

        # Extract Last 4 Digits of Card
        card_id = charge.payment_method_details.get('card', {}).get('last4', "N/A")

        # Return transaction details
        return jsonify({
            "payment_intent_id": payment_intent_id,
            "fee_gingham": fee_gingham,
            "fee_processor": fee_processor,
            "card_id": card_id,
            "tax": tax_total
        }), 200

    except stripe.error.InvalidRequestError as e:
        print(f"Stripe API Error: {str(e)}")  # Debugging log
        return jsonify({"error": f"Stripe API error: {str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected Error: {str(e)}")  # Debugging log
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

# Distribute Payments route is not working correctly - this may need to be made into a webhook.     
# @app.route('/api/distribute-payments', methods=['POST'])
# def distribute_payments():
#     try:
#         data = request.get_json()
#         if not data or 'baskets' not in data or 'payment_intent_id' not in data:
#             return jsonify({'error': {'message': 'Missing required data.'}}), 400

#         payment_intent_id = data['payment_intent_id']
#         baskets = data['baskets']

#         print(f"Fetching PaymentIntent {payment_intent_id}...")

#         # Retrieve the PaymentIntent to get the charge ID
#         payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
#         charge_id = payment_intent.charges.data[0].id if payment_intent.charges.data else None

#         if not charge_id:
#             print("No charge found for PaymentIntent.")
#             return jsonify({'error': {'message': 'No charge associated with this PaymentIntent.'}}), 400

#         print(f"Retrieved Charge ID: {charge_id}")

#         transfers = []

#         for basket in baskets:
#             vendor_id = basket['vendor_id']
#             vendor_account_id = get_vendor_stripe_account(vendor_id)
#             price = basket['price']
#             fee_vendor = basket.get('fee_vendor', 0)

#             if not vendor_account_id:
#                 print(f"Skipping vendor {vendor_id}: No Stripe account.")
#                 continue

#             vendor_payout = price - fee_vendor
#             if vendor_payout <= 0:
#                 print(f"Skipping vendor {vendor_id}: Payout amount is zero or negative.")
#                 continue

#             print(f"Transferring {vendor_payout} to Vendor {vendor_id} (Stripe Account: {vendor_account_id})")

#             transfer = stripe.Transfer.create(
#                 amount=int(vendor_payout * 100),
#                 currency="usd",
#                 destination=vendor_account_id,
#                 description=f"Payout for Basket {basket['id']}",
#                 source_transaction=charge_id 
#             )

#             transfers.append(transfer)
#             print(f"Transfer successful: {transfer['id']} to Vendor {vendor_id}")

#         return jsonify({'message': 'Vendor payouts completed successfully', 'transfers': transfers}), 200

#     except stripe.error.StripeError as e:
#         print("Stripe error during payouts:", e)
#         return jsonify({'error': {'message': str(e.user_message)}}), 400

#     except Exception as e:
#         print("Unexpected error:", str(e))
#         return jsonify({'error': {'message': 'An unexpected error occurred.'}}), 500

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
        website = os.environ['SITE_URL']
        
        return redirect(f'{website}/user/password-reset/{token}')

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
        website = os.environ['SITE_URL']
        return redirect(f'{website}/vendor/password-reset/{token}')

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
        website = os.environ['SITE_URL']
        return redirect(f'{website}/admin/password-reset/{token}')

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
    print("Request Headers:", request.headers)
    print("Authorization Header:", request.headers.get('Authorization'))
    
    try:
        current_user = get_jwt_identity()
        print("JWT Identity (User):", current_user)
    except Exception as e:
        print("JWT Error:", str(e))
        return jsonify({"error": "JWT validation failed"}), 401

    user_id = request.args.get('user_id')
    print("Requested user_id:", user_id)
    
    if request.method == 'GET':
        query = UserNotification.query
        if user_id:
            query = query.filter_by(user_id=user_id)

        notifications = query.order_by(UserNotification.created_at.desc()).all()
        print("Found notifications count:", len(notifications))
        
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

    # Validate input
    if not data or 'user_id' not in data or 'vendor_id' not in data:
        return jsonify({'message': 'Invalid request data.'}), 400

    session = Session(db.engine)  # Ensure explicit session for SQLAlchemy 2.0
    try:
        # Fetch User and Vendor
        user = session.get(User, data['user_id'])
        vendor = session.get(Vendor, data['vendor_id'])

        # Retrieve all VendorUsers
        all_vendor_users = session.query(VendorUser).all()

        vendor_users = []
        for vendor_user in all_vendor_users:
            vendor_data = vendor_user.vendor_id  # Get vendor_id field (JSON)

            # Ensure vendor_id is properly handled (convert JSON if needed)
            if isinstance(vendor_data, dict):  
                vendor_dict = vendor_data  # Already a dict
            elif isinstance(vendor_data, str):
                try:
                    vendor_dict = json.loads(vendor_data)  # Convert JSON string to dict
                except json.JSONDecodeError:
                    print(f"Invalid JSON format in vendor_id for VendorUser ID {vendor_user.id}")
                    continue  # Skip this record
            else:
                print(f"Unexpected type for vendor_id in VendorUser ID {vendor_user.id}: {type(vendor_data)}")
                continue  # Skip

            # Check if the `vendor_id` exists as a key (convert to string)
            if str(data['vendor_id']) in vendor_dict:
                vendor_users.append(vendor_user)

        # Error Handling: Ensure required entities exist
        if not vendor:
            return jsonify({'message': f"Vendor with ID {data['vendor_id']} not found."}), 404

        if not user:
            return jsonify({'message': f"User with ID {data['user_id']} not found."}), 404

        if not vendor_users:
            print(f"No vendor users found for vendor ID {data['vendor_id']}.")
            return jsonify({'message': f"No vendor users found for vendor ID {data['vendor_id']}."}), 404

        # Create notifications for each vendor user found
        notifications = [
            VendorNotification(
                subject=data.get('subject', 'New Basket Interest'),
                message=data.get('message', f"A user is interested in buying a basket at {vendor.name}."),
                link=data.get('link', "/vendor/dashboard?tab=baskets"),
                user_id=user.id,
                vendor_id=vendor.id,
                vendor_user_id=vendor_user.id,
                market_id=data.get('market_id'),
                is_read=False
            )
            for vendor_user in vendor_users
        ]

        session.add_all(notifications)
        session.commit()

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
        session.rollback()
        print(f"Error creating notification: {str(e)}")
        return jsonify({'message': f'Error creating notification: {str(e)}'}), 500

    finally:
        session.close()

@app.route('/api/vendor-notifications', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def fetch_vendor_notifications():
    vendor_id = request.args.get('vendor_id')
    vendor_user_id = request.args.get('vendor_user_id')
    is_read = request.args.get('is_read', None)
    subject = request.args.get('subject')
    data = request.args.get('data')
    vendor_id = request.args.get('vendor_id')
    
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
        if data:
            query = query.filter_by(data=data)
        if vendor_id:
            query = query.filter_by(data=vendor_id)

        notifications = query.order_by(VendorNotification.created_at.desc()).all()

        notifications_data = [ {
            'id': n.id,
            'subject': n.subject,
            'message': n.message,
            'link': n.link,
            'data': n.data,
            'is_read': n.is_read,
            'user_id': n.user_id,
            'market_id': n.market_id,
            'vendor_id': n.vendor_id,
            'vendor_user_id': n.vendor_user_id, 
            'created_at': n.created_at,
            'vendor_name': Vendor.query.get(n.vendor_id).name if Vendor.query.get(n.vendor_id) else 'Unknown Vendor',
            } for n in notifications ]
        
        return jsonify({'notifications': notifications_data}), 200
    
    if request.method == 'POST':
        data = request.get_json()

        vendor_role_arg = request.args.get('vendor_role', type=int)

        if not data or 'message' not in data or 'vendor_id' not in data:
            return jsonify({'message': 'Invalid request data.'}), 400

        try:
            vendor_id_str = str(data['vendor_id'])
            vendor_user_id = int(data['data'])
    
            vendor_user = VendorUser.query.get(vendor_user_id)

            if not vendor_user:
                return jsonify({'message': 'Vendor user not found.'}), 404

            if isinstance(vendor_user.vendor_id, dict) and vendor_id_str in vendor_user.vendor_id:
                return jsonify({'message': 'Vendor team request already sent.'}), 400
            
            vendor_users = VendorUser.query.filter(
                VendorUser.vendor_id.contains({vendor_id_str: int(data['vendor_id'])}),
                VendorUser.vendor_role[vendor_id_str].as_integer() <= vendor_role_arg
            ).all()
            
            print(f"Found vendor_users: {vendor_users}")

            if not vendor_users:
                return jsonify({'message': 'No matching vendor users found.'}), 404

            notifications = []

            for vendor_user in vendor_users:
                new_notification = VendorNotification(
                    subject=data['subject'],
                    message=data['message'],
                    link=data['link'],
                    data=data['data'],
                    user_id=data.get('user_id'),
                    market_id=data.get('market_id'),
                    vendor_id=data['vendor_id'],
                    vendor_user_id=vendor_user.id,
                    created_at=datetime.utcnow(),
                    is_read=False
                )
                db.session.add(new_notification)
                notifications.append(new_notification)

            db.session.commit()

            return jsonify([{
                'id': n.id,
                'subject': n.subject,
                'message': n.message,
                'link': n.link,
                'data': n.data,
                'user_id': n.user_id,
                'market_id': n.market_id,
                'vendor_id': n.vendor_id,
                'vendor_user_id': n.vendor_user_id,
                'is_read': n.is_read
            } for n in notifications]), 201

        except Exception as e:
            db.session.rollback()
            print(f"Error creating notification: {str(e)}")
            return jsonify({'message': f'Error creating notification: {str(e)}'}), 500

    if request.method == 'DELETE':
        if subject == 'team-request':
            query = VendorNotification.query
            query = query.filter(
                VendorNotification.data == int(data),
                VendorNotification.subject == subject,
                VendorNotification.vendor_id ==int(vendor_id)
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

    if not notification.data:
        return jsonify({'message': 'No vendor user associated with this notification'}), 400

    user = VendorUser.query.get(int(notification.data))
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

    VendorNotification.query.filter_by(
        subject=notification.subject,
        vendor_id=notification.vendor_id,
        data=notification.data
    ).delete()

    db.session.commit()

    return jsonify({'message': 'Notification approved and user updated successfully'}), 200


@app.route('/api/vendor-notifications/<int:notification_id>/reject', methods=['DELETE'])
@jwt_required()
def reject_notification(notification_id):
    notification = VendorNotification.query.get(notification_id)
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404

    VendorNotification.query.filter_by(
        subject=notification.subject,
        vendor_id=notification.vendor_id,
        data=notification.data
    ).delete()
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
            admin_role=data['admin_role'],
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
    admin_id = request.args.get('admin_id')

    if request.method == 'GET':
        notifications = AdminNotification.query.all()
        if admin_id:
            query = query.filter_by(admin_id=admin_id)

        return jsonify([notif.to_dict() for notif in notifications]), 200
    
    if request.method == 'DELETE':
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

@app.route('/api/receipts', methods=['GET', 'POST'])
def get_user_receipts():
    if request.method == 'GET':
        try:
            user_id = request.args.get("user_id", type=int)
            
            if user_id:
                user = User.query.get(user_id)
                if not user:
                    return jsonify({"error": "User not found"}), 404

                receipts = Receipt.query.filter_by(user_id=user_id).order_by(Receipt.created_at.desc()).all()
            else:
                receipts = Receipt.query.order_by(Receipt.created_at.desc()).all()

            receipts = Receipt.query.filter_by(user_id=user_id).order_by(Receipt.created_at.desc()).all()

            return jsonify([receipt.to_dict() for receipt in receipts]), 200
        except Exception as e:
            return jsonify({"error": f"Error fetching receipts: {str(e)}"}), 500

    if request.method == 'POST':
        try:
            if not request.data:
                return jsonify({"error": "Empty request body"}), 400

            data = request.get_json()

            if not data or 'user_id' not in data or 'baskets' not in data or 'payment_intent_id' not in data:
                return jsonify({"error": "Missing required fields: 'user_id', 'baskets', or 'payment_intent_id'"}), 400

            user = User.query.get(data['user_id'])
            if not user:
                return jsonify({"error": "User not found"}), 404

            created_at = datetime.utcnow().date()

            new_receipt = Receipt(
                user_id=data['user_id'],
                baskets=data['baskets'],
                payment_intent_id=data['payment_intent_id'],
                created_at=created_at
            )

            db.session.add(new_receipt)
            db.session.commit()

            return jsonify(new_receipt.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Error creating receipt: {str(e)}"}), 500

@app.route('/api/receipts/<int:receipt_id>', methods=['GET'])
def get_receipt(receipt_id):
    try:
        receipt = Receipt.query.get(receipt_id)
        if not receipt:
            return jsonify({"error": "Receipt not found"}), 404

        return jsonify(receipt.to_dict()), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching receipt: {str(e)}"}), 500

@app.route('/api/user-issues', methods=['GET', 'POST'])
@jwt_required()
def user_issues():
    if request.method == 'GET':
        user_id = request.args.get('user_id')
        
        if user_id:
            issues = UserIssue.query.filter_by(user_id=user_id).all()
        else:
            issues = UserIssue.query.all()
            
        return jsonify([
            {
                "id": issue.id,
                "user_id": issue.user_id,
                "basket_id": issue.basket_id,
                "issue_type": issue.issue_type,
                "issue_subtype": issue.issue_subtype,
                "body": issue.body,
                "status": issue.status,
                "created_at": issue.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            for issue in issues
        ]), 200

    elif request.method == 'POST':
        data = request.get_json()

        required_fields = ['user_id', 'issue_type', 'issue_subtype', 'body']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"{field} is required"}), 400

        new_issue = UserIssue(
            user_id=data['user_id'],
            basket_id=data.get('basket_id'),
            issue_type=data['issue_type'],
            issue_subtype=data['issue_subtype'],
            body=data['body'],
            status="Pending"
        )

        db.session.add(new_issue)
        db.session.commit()

        return jsonify({"message": "Issue created successfully", "issue_id": new_issue.id}), 201


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

@app.route('/api/vendor-users/count', methods=['GET'])
@jwt_required()
def vendor_user_count():
    try:
        count = db.session.query(VendorUser).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin-users/count', methods=['GET'])
@jwt_required()
def admin_user_count():
    try:
        count = db.session.query(AdminUser).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/markets/count', methods=['GET'])
@jwt_required()
def market_count():
    try:
        count = db.session.query(Market).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/market-days/count', methods=['GET'])
@jwt_required()
def market_days_count():
    try:
        count = db.session.query(MarketDay).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vendors/count', methods=['GET'])
@jwt_required()
def vendor_count():
    try:
        count = db.session.query(Vendor).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

@app.route('/api/baskets/top-10-vendors', methods=['GET'])
@jwt_required()
def basket_top_10_vendors():
    try:
        vendor_counts = (
            db.session.query(Vendor.name, func.count(Basket.id).label("count"))
            .join(Vendor, Vendor.id == Basket.vendor_id)
            .group_by(Vendor.name)
            .order_by(func.count(Basket.id).desc())
            .limit(10)
            .all()
        )

        vendor_data = {vendor: count for vendor, count in vendor_counts}

        return jsonify(vendor_data), 200
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

from flask import jsonify
from sqlalchemy import func
from models import db, User  # Assuming User model and db are defined
from flask_jwt_extended import jwt_required

@app.route('/api/users/join-date-user-count', methods=['GET'])
@jwt_required()
def get_user_join_date_counts():
    try:
        join_date_user_counts = (
            db.session.query(
                func.date(User.join_date).label("join_date"),
                func.count(User.id).label("user_count")
            )
            .filter(User.join_date.isnot(None))
            .group_by(func.date(User.join_date))
            .order_by(func.date(User.join_date).asc())
            .all()
        )

        result = [
            {"join_date": str(join_date), "user_count": user_count}
            for join_date, user_count in join_date_user_counts
        ]

        return jsonify(result), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/users/top-10-cities', methods=['GET'])
@jwt_required()
def top_10_cities():
    try:
        city_state_counts = (
            db.session.query(
                func.lower(User.city).label("city"),
                func.upper(User.state).label("state"),
                func.count().label("count")
            )
            .group_by(func.lower(User.city), func.upper(User.state))
            .order_by(func.count().desc())
            .limit(10)
            .all()
        )

        city_data = [
            {"city": city.title(), "state": state, "count": count}
            for city, state, count in city_state_counts
        ]

        return jsonify(city_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/market-favorites/top-10-markets', methods=['GET'])
def get_top_favorited_markets():
    try:
        top_markets = (
            db.session.query(
                MarketFavorite.market_id,
                Market.name,
                func.count(MarketFavorite.id).label("favorite_count")
            )
            .join(Market, Market.id == MarketFavorite.market_id)
            .group_by(MarketFavorite.market_id, Market.name)
            .order_by(func.count(MarketFavorite.id).desc())
            .limit(10)
            .all()
        )

        result = [
            {"market_id": market_id, "market_name": name, "favorite_count": favorite_count}
            for market_id, name, favorite_count in top_markets
        ]

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vendor-favorites/top-10-vendors', methods=['GET'])
def get_top_favorited_vendors():
    try:
        top_vendors = (
            db.session.query(
                VendorFavorite.vendor_id,
                Vendor.name,
                func.count(VendorFavorite.id).label("favorite_count")
            )
            .join(Vendor, Vendor.id == VendorFavorite.vendor_id)
            .group_by(VendorFavorite.vendor_id, Vendor.name)
            .order_by(func.count(VendorFavorite.id).desc())
            .limit(10)
            .all()
        )

        result = [
            {"vendor_id": vendor_id, "vendor_name": name, "favorite_count": favorite_count}
            for vendor_id, name, favorite_count in top_vendors
        ]

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/export-csv/users', methods=['GET'])
def export_csv_users():
    try:
        users = User.query.all()
        csv_data = []

        headers = ["id", "email", "first_name", "last_name", "phone", "address_1", "address_2", 
                   "city", "state", "zipcode", "coordinates", "avatar_default", "status", 
                   "login_count", "last_login", "join_date"]

        for user in users:
            csv_data.append([
                user.id, user.email, user.first_name, user.last_name, user.phone,
                user.address_1, user.address_2, user.city, user.state, user.zipcode,
                user.coordinates, user.avatar_default, user.status,
                user.login_count, user.last_login, user.join_date
            ])

        output = StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        writer.writerow(headers)
        writer.writerows(csv_data)

        csv_content = output.getvalue()
        output.close()

        today_date = datetime.now().strftime("%Y-%m-%d")
        filename = f"database_export_users_{today_date}.csv"

        response = Response(csv_content, mimetype="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"

        return jsonify({"csv": csv_content, "filename": filename})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/export-csv/vendor-users', methods=['GET'])
def export_csv_vendor_users():
    try:
        vendor_users = VendorUser.query.all()
        csv_data = []

        headers = ["id", "email", "first_name", "last_name", "phone", 
                   "vendor_id", "vendor_role", "login_count", "last_login", "join_date"]

        for user in vendor_users:
            csv_data.append([
                user.id, user.email, user.first_name, user.last_name, user.phone,
                json.dumps(user.vendor_id),
                json.dumps(user.vendor_role),
                user.login_count, user.last_login, user.join_date
            ])

        output = StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        writer.writerow(headers)
        writer.writerows(csv_data)

        csv_content = output.getvalue()
        output.close()

        today_date = datetime.now().strftime("%Y-%m-%d")
        filename = f"database_export_vendor_users_{today_date}.csv"

        return jsonify({"csv": csv_content, "filename": filename})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/export-csv/markets', methods=['GET'])
def export_csv_markets():
    try:
        markets = Market.query.all()
        csv_data = []

        headers = ["id", "name", "image_default", "location", "city",
                   "state", "zipcode", "coordinates", "schedule", 
                   "year_round", "season_start", "season_end", 
                   "is_visible"]

        for market in markets:
            csv_data.append([
                market.id, market.name, market.image_default, market.location,
                market.city, market.state, market.zipcode, json.dumps(market.coordinates),
                market.schedule, market.year_round, market.season_start,
                market.season_end, market.is_visible
            ])

        output = StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        writer.writerow(headers)
        writer.writerows(csv_data)

        csv_content = output.getvalue()
        output.close()

        today_date = datetime.now().strftime("%Y-%m-%d")
        filename = f"database_export_markets_{today_date}.csv"

        return jsonify({"csv": csv_content, "filename": filename})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/export-csv/vendors', methods=['GET'])
def export_csv_vendors():
    try:
        vendors = Vendor.query.all()
        csv_data = []

        headers = ["id", "name", "city", "state", "products", "bio", "website", "image_default"]

        for vendor in vendors:
            csv_data.append([
                vendor.id, vendor.name, vendor.city, vendor.state,
                json.dumps(vendor.products), vendor.bio, vendor.website, vendor.image_default
            ])

        output = StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        writer.writerow(headers)
        writer.writerows(csv_data)

        csv_content = output.getvalue()
        output.close()

        today_date = datetime.now().strftime("%Y-%m-%d")
        filename = f"database_export_vendors_{today_date}.csv"

        return jsonify({"csv": csv_content, "filename": filename})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/export-csv/baskets', methods=['GET'])
def export_csv_baskets():
    try:
        baskets = Basket.query.all()
        csv_data = []

        headers = ["id", "vendor_id", "market_day_id", "sale_date", "pickup_start", "pickup_end", 
                   "user_id", "is_sold", "is_grabbed", "is_refunded", "price", "value", "fee_vendor"]

        for basket in baskets:
            csv_data.append([
                basket.id, basket.vendor_id, basket.market_day_id, basket.sale_date, 
                basket.pickup_start, basket.pickup_end, basket.user_id, 
                basket.is_sold, basket.is_grabbed, basket.is_refunded, basket.price, 
                basket.value, basket.fee_vendor
            ])

        output = StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        writer.writerow(headers)
        writer.writerows(csv_data)

        csv_content = output.getvalue()
        output.close()

        today_date = datetime.now().strftime("%Y-%m-%d")
        filename = f"database_export_baskets_{today_date}.csv"

        return jsonify({"csv": csv_content, "filename": filename})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/export-csv/products', methods=['GET'])
def export_csv_products():
    try:
        products = Product.query.all()
        csv_data = []

        headers = ["id", "product"]

        for product in products:
            csv_data.append([
                product.id, product.product
            ])

        output = StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        writer.writerow(headers)
        writer.writerows(csv_data)

        csv_content = output.getvalue()
        output.close()

        today_date = datetime.now().strftime("%Y-%m-%d")
        filename = f"database_export_products_{today_date}.csv"

        return jsonify({"csv": csv_content, "filename": filename})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/export-csv/for-vendor/baskets', methods=['GET'])
def export_csv_vendor_baskets():
    vendor_id = request.args.get('vendor_id', type=int)
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    
    if not all([vendor_id, month, year]):
        return jsonify({'error': 'Missing required parameters'}), 400
    
    # Query baskets for given vendor and month/year
    baskets = Basket.query.filter(
        Basket.vendor_id == vendor_id,
        extract('month', Basket.sale_date) == month,
        extract('year', Basket.sale_date) == year
    ).all()
    
    # Create CSV in memory
    output = StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)
    
    # Write headers
    headers = ['ID', 'Sale Date', 'Pickup Start', 'Pickup End', 'Price', 
              'Value', 'Fee', 'Is Sold', 'Is Grabbed', "Is Refunded"]
    writer.writerow(headers)
    
    # Write data
    for basket in baskets:
        writer.writerow([
            basket.id,
            basket.sale_date.strftime('%Y-%m-%d') if basket.sale_date else '',
            basket.pickup_start.strftime('%H:%M') if basket.pickup_start else '',
            basket.pickup_end.strftime('%H:%M') if basket.pickup_end else '',
            basket.price,
            basket.value,
            basket.fee_vendor,
            'Yes' if basket.is_sold else 'No',
            'Yes' if basket.is_grabbed else 'No',
            'Yes' if basket.is_refunded else 'No'
        ])
    
    # Convert to BytesIO for send_file
    mem = BytesIO()
    mem.write(output.getvalue().encode('utf-8'))
    mem.seek(0)
    output.close()
    
    return send_file(
        mem,
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'gingham_vendor-statement_{year}-{month:02d}.csv'
    )

@app.route('/api/export-pdf/for-vendor/baskets', methods=['GET'])
def export_pdf_vendor_baskets():
    vendor_id = request.args.get('vendor_id', type=int)
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    
    if not all([vendor_id, month, year]):
        return jsonify({'error': 'Missing required parameters'}), 400
    
    try:
        # Query baskets for given vendor and month/year
        baskets = Basket.query.filter(
            Basket.vendor_id == vendor_id,
            extract('month', Basket.sale_date) == month,
            extract('year', Basket.sale_date) == year
        ).all()
        
        return jsonify([basket.to_dict() for basket in baskets]), 200
    
    except Exception as e:
        return jsonify({"error": f"Error fetching baskets: {str(e)}"}), 500

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1', 't']
    app.run(port=5555, debug=debug_mode)