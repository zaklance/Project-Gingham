import os
import json
import smtplib
import csv
import traceback
from flask import Flask, Response, request, jsonify, session, send_from_directory, send_file, redirect, url_for
from markupsafe import escape
from models import ( db, User, Market, MarketDay, Vendor, MarketReview, 
                    VendorReview, ReportedReview, MarketReviewRating, 
                    VendorReviewRating, MarketFavorite, VendorFavorite, 
                    VendorMarket, VendorUser, AdminUser, Basket, Event, 
                    Product, UserNotification, VendorNotification, 
                    AdminNotification, QRCode, FAQ, Blog, BlogFavorite,
                    Receipt, SettingsUser, SettingsVendor, SettingsAdmin, 
                    UserIssue, Recipe, Ingredient, RecipeIngredient,
                    InstructionGroup, Instruction, RecipeFavorite,
                    Smallware, bcrypt )
from dotenv import load_dotenv
from sqlalchemy import cast, desc, extract, func, Integer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, Session
from sqlalchemy.dialects.postgresql import JSONB
from flask_migrate import Migrate
from flask_cors import CORS
from flask_caching import Cache
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.utils import secure_filename
from datetime import datetime, date, time, timedelta, timezone
from PIL import Image
from io import BytesIO, StringIO
from random import choice
import stripe
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import utils.events as events
from utils.emails import ( send_contact_email, send_user_password_reset_email, 
                          send_vendor_password_reset_email, send_admin_password_reset_email, 
                          send_user_confirmation_email, send_vendor_confirmation_email, 
                          send_admin_confirmation_email, send_vendor_team_invite_email )
import subprocess
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from twilio.twiml.messaging_response import MessagingResponse
from tasks import ( send_mjml_email_task, send_html_email_task,
                         send_sendgrid_email_task, export_csv_users_task,
                         export_csv_vendor_users_task, export_csv_markets_task,
                         export_csv_vendors_task, export_csv_baskets_task,
                         export_csv_products_task, generate_vendor_baskets_csv,
                         user_signup_task, confirm_user_email_task, 
                         change_user_email_task, vendor_signup_task,
                         confirm_vendor_email_task, change_vendor_email_task,
                         admin_signup_task, confirm_admin_email_task,
                         change_admin_email_task, user_password_reset_request_task,
                         vendor_password_reset_request_task, admin_password_reset_request_task,
                         contact_task, process_image, send_sendgrid_email_client_task,
                         send_team_invite_email_task, process_transfers_task,
                         reverse_basket_transfer_task
                         )
from celery.result import AsyncResult
from celery_config import celery
import base64


load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

app = Flask(__name__, static_folder='public')

cache = Cache(app, config={"CACHE_TYPE": "simple"})

STRIPE_WEBHOOK_SECRET = "whsec_0fd1e4d74c18b3685bd164fe766c292f8ec7a73a887dd83f598697be422a2875"
STRIPE_ALLOWED_IPS = {
    "3.18.12.63", "3.130.192.231", "13.235.14.237", "13.235.122.149",
    "18.211.135.69", "35.154.171.200", "52.15.183.38", "54.88.130.119",
    "54.88.130.237", "54.187.174.169", "54.187.205.235", "54.187.216.72"
}

UPLOAD_FOLDER = os.environ['IMAGE_UPLOAD_FOLDER']
USER_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, "user-images")
MARKET_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, "market-images")
VENDOR_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, "vendor-images")
RECIPE_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, "recipe-images")
INSTRUCTION_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, "instruction-images")
BLOG_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, 'blog-images')
os.makedirs(USER_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(MARKET_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(VENDOR_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RECIPE_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INSTRUCTION_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(BLOG_UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'svg', 'heic'}
MAX_SIZE = 1.10 * 1024 * 1024
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

    # Get last 4 digits of the card - safely handle missing charges data
    last4 = "N/A"
    customer_email = "N/A"
    user_id = None
    
    try:
        # Check if charges data exists and has data
        if "charges" in payment_intent and payment_intent["charges"] and payment_intent["charges"].get("data"):
            charge_data = payment_intent["charges"]["data"][0]
            
            # Safely get last 4 digits
            if "payment_method_details" in charge_data and "card" in charge_data["payment_method_details"]:
                last4 = charge_data["payment_method_details"]["card"].get("last4", "N/A")
            
            # Safely get customer email
            if "billing_details" in charge_data and "email" in charge_data["billing_details"]:
                customer_email = charge_data["billing_details"]["email"]
    except (KeyError, IndexError, TypeError) as e:
        print(f"Warning: Could not extract charge details from payment_intent: {e}")
        # Continue with default values

    # Retrieve metadata for baskets (if stored in frontend during checkout)
    baskets = payment_intent.get("metadata", {}).get("baskets", "[]")
    user_id = payment_intent.get("metadata", {}).get("user_id")

    print(f"Payment Successful: {payment_intent_id}")
    print(f"Customer: {customer_email}")
    print(f"Total Paid: ${total_amount} {currency}")
    print(f"Card Last 4: {last4}")

    # If baskets metadata exists, convert it from JSON format
    import json
    try:
        basket_data = json.loads(baskets)
    except json.JSONDecodeError:
        basket_data = []

    if user_id and basket_data:
        # Create receipt in database
        new_receipt = Receipt(
            user_id=user_id,
            baskets=basket_data,
            payment_intent_id=payment_intent_id,
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(new_receipt)
        db.session.commit()
        print(f"Created receipt with ID: {new_receipt.id}")
        return new_receipt.id

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
@cache.cached(timeout=600)
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
@cache.cached(timeout=600)
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
@cache.cached(timeout=600)
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
@cache.cached(timeout=600)
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
    
@app.route('/api/users/top-10-cities', methods=['GET'])
@jwt_required()
@cache.cached(timeout=600)
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
@cache.cached(timeout=600)
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
@cache.cached(timeout=600)
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

@app.route('/api/users/join-date-user-count', methods=['GET'])
@jwt_required()
@cache.cached(timeout=600)
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

@app.route('/api/vendor-users/join-date-user-count', methods=['GET'])
@jwt_required()
@cache.cached(timeout=600)
def get_vendor_user_join_date_counts():
    try:
        join_date_user_counts = (
            db.session.query(
                func.date(VendorUser.join_date).label("join_date"),
                func.count(VendorUser.id).label("user_count")
            )
            .filter(VendorUser.join_date.isnot(None))
            .group_by(func.date(VendorUser.join_date))
            .order_by(func.date(VendorUser.join_date).asc())
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

@app.route('/api/admin-users/join-date-user-count', methods=['GET'])
@jwt_required()
@cache.cached(timeout=600)
def get_admin_user_join_date_counts():
    try:
        join_date_user_counts = (
            db.session.query(
                func.date(AdminUser.join_date).label("join_date"),
                func.count(AdminUser.id).label("user_count")
            )
            .filter(AdminUser.join_date.isnot(None))
            .group_by(func.date(AdminUser.join_date))
            .order_by(func.date(AdminUser.join_date).asc())
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

@app.route('/api/vendors/join-date-vendor-count', methods=['GET'])
@jwt_required()
@cache.cached(timeout=600)
def get_vendor_join_date_counts():
    try:
        join_date_vendor_counts = (
            db.session.query(
                func.date(Vendor.join_date).label("join_date"),
                func.count(Vendor.id).label("user_count")
            )
            .filter(Vendor.join_date.isnot(None))
            .group_by(func.date(Vendor.join_date))
            .order_by(func.date(Vendor.join_date).asc())
            .all()
        )

        result = [
            {"join_date": str(join_date), "user_count": user_count}
            for join_date, user_count in join_date_vendor_counts
        ]

        return jsonify(result), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/export-csv/users', methods=['GET'])
def export_csv_users():
    task = export_csv_users_task.delay()
    return jsonify({"message": "CSV generation started!", "task_id": task.id}), 202

@app.route('/api/export-csv/vendor-users', methods=['GET'])
def export_csv_vendor_users():
    task = export_csv_vendor_users_task.delay()
    return jsonify({"message": "CSV generation started!", "task_id": task.id}), 202

@app.route('/api/export-csv/markets', methods=['GET'])
def export_csv_markets():
    task = export_csv_markets_task.delay()
    return jsonify({"message": "CSV generation started!", "task_id": task.id}), 202

@app.route('/api/export-csv/vendors', methods=['GET'])
def export_csv_vendors():
    task = export_csv_vendors_task.delay()
    return jsonify({"message": "CSV generation started!", "task_id": task.id}), 202

@app.route('/api/export-csv/baskets', methods=['GET'])
def export_csv_baskets():
    task = export_csv_baskets_task.delay()
    return jsonify({"message": "CSV generation started!", "task_id": task.id}), 202

@app.route('/api/export-csv/products', methods=['GET'])
def export_csv_products():
    task = export_csv_products_task.delay()
    return jsonify({"message": "CSV generation started!", "task_id": task.id}), 202

@app.route('/api/export-csv/<route>/status/<task_id>', methods=['GET'])
def check_export_status(task_id, route):
    if route == 'users':
        task_result = export_csv_users_task.AsyncResult(task_id)
    if route == 'vendor-users':
        task_result = export_csv_vendor_users_task.AsyncResult(task_id)
    if route == 'markets':
        task_result = export_csv_markets_task.AsyncResult(task_id)
    if route == 'vendors':
        task_result = export_csv_vendors_task.AsyncResult(task_id)
    if route == 'baskets':
        task_result = export_csv_baskets_task.AsyncResult(task_id)
    if route == 'products':
        task_result = export_csv_products_task.AsyncResult(task_id)
    
    if task_result.ready():
        result = task_result.get()
        if 'error' in result:
            return jsonify({'status': 'failed', 'error': result['error']}), 500
        return jsonify({
            'status': 'completed',
            'csv': result['csv'],
            'filename': result['filename']
        })
    else:
        return jsonify({'status': 'processing'}), 202

@app.route('/api/export-csv/vendor-baskets/baskets', methods=['POST'])
def queue_export_csv_vendor_baskets():
    vendor_id = request.json.get('vendor_id')
    month = request.json.get('month')
    year = request.json.get('year')
    
    if not all([vendor_id, month, year]):
        return jsonify({'error': 'Missing required parameters'}), 400
    
    # Queue the Celery task
    task = generate_vendor_baskets_csv.delay(vendor_id, month, year)
    
    return jsonify({
        'task_id': task.id,
        'status': 'queued'
    }), 202

@app.route('/api/export-csv/vendor-baskets/status/<task_id>', methods=['GET'])
def check_csv_export_status(task_id):
    task_result = generate_vendor_baskets_csv.AsyncResult(task_id)
    
    if task_result.ready():
        result = task_result.get()
        if result.get('status') == 'success':
            return jsonify({
                'status': 'completed',
                'file_path': result.get('file_path'),
                'download_url': f'/api/export-csv/vendor-baskets/download/{task_id}'
            })
        elif result.get('error'):
            return jsonify({
                'status': 'failed',
                'error': result.get('error')
            }), 500
        else:
            return jsonify({'status': 'failed', 'error': 'Unknown error'}), 500
    else:
        return jsonify({'status': 'processing'})

@app.route('/api/export-csv/vendor-baskets/download/<task_id>', methods=['GET'])
def download_csv_export(task_id):
    task_result = generate_vendor_baskets_csv.AsyncResult(task_id)
    if not task_result.ready():
        return jsonify({'error': 'Task not completed yet'}), 400
    
    result = task_result.get()
    if result.get('status') != 'success':
        return jsonify({'error': result.get('error', 'Task failed')}), 500
    
    file_path = result.get('file_path')
    filename = result.get('filename')

    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return jsonify({'error': 'File not found'}), 404
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(
        file_path,
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
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

@app.route('/api/vendor/team-invite', methods=['POST'])
@jwt_required()
def send_team_invite():
    try:
        data = request.get_json()
        email = data.get('email')
        vendor_id = data.get('vendor_id')
        role = data.get('role', 2)

        if not email or not vendor_id:
            return jsonify({'error': 'Email and vendor_id are required'}), 400

        # Kick off background task
        task = send_team_invite_email_task.delay(email, vendor_id, role)

        return jsonify({'message': 'Invitation is being sent', 'task_id': task.id}), 202

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/vendor/join-team/<token>', methods=['GET', 'POST'])
def join_team(token):
    try:
        # Decode the token
        try:
            data = serializer.loads(token, salt='team-invite-salt', max_age=604800)  # 7 days
            # Convert the ISO format string back to datetime
            data['exp'] = datetime.fromisoformat(data['exp'])
        except Exception as e:
            return jsonify({'error': 'Invalid or expired invitation link'}), 400

        if request.method == 'GET':
            # Return vendor information for the invitation page
            vendor = Vendor.query.get(data['vendor_id'])
            if not vendor:
                return jsonify({'error': 'Vendor not found'}), 404
                
            return jsonify({
                'vendor_name': vendor.name,
                'email': data['email'],
                'role': data['role']
            }), 200

        elif request.method == 'POST':
            # Process the invitation acceptance
            form_data = request.get_json()
            
            # Check if user already exists
            existing_user = VendorUser.query.filter_by(email=data['email']).first()
            
            if existing_user:
                # Update existing user
                if not isinstance(existing_user.vendor_id, dict):
                    existing_user.vendor_id = {}
                if not isinstance(existing_user.vendor_role, dict):
                    existing_user.vendor_role = {}
                    
                existing_user.vendor_id[str(data['vendor_id'])] = data['vendor_id']
                existing_user.vendor_role[str(data['vendor_id'])] = data['role']
                existing_user.active_vendor = data['vendor_id']
                
            else:
                # Create new user
                new_user = VendorUser(
                    email=data['email'],
                    password=form_data['password'],
                    first_name=form_data['first_name'],
                    last_name=form_data['last_name'],
                    phone=form_data['phone'],
                    vendor_id={str(data['vendor_id']): data['vendor_id']},
                    vendor_role={str(data['vendor_id']): data['role']},
                    active_vendor=data['vendor_id']
                )
                db.session.add(new_user)
            
            db.session.commit()
            return jsonify({'message': 'Successfully joined the team'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stripe/publishable-key', methods=['GET'])
def get_publishable_key():
    return jsonify({
        'publishableKey': os.environ.get('STRIPE_PUBLISHABLE_KEY')
    })

@app.route('/api/cart/clear', methods=['POST'])
def clear_cart():
    try:
        data = request.get_json()
        basket_ids = data.get('basket_ids', [])
        user_id = data.get('user_id')
        
        if not basket_ids:
            return jsonify({"error": "No basket IDs provided"}), 400

        # Update baskets to mark them as sold and set the user_id
        baskets = Basket.query.filter(Basket.id.in_(basket_ids)).all()
        for basket in baskets:
            basket.is_sold = True
            basket.user_id = user_id  # Associate the basket with the user
        
        db.session.commit()
        return jsonify({"message": "Cart cleared successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1', 't']
    app.run(port=5555, debug=debug_mode)