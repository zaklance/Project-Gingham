import os
import csv
import smtplib
import json
import subprocess
from io import StringIO, BytesIO
from celery_config import celery
from celery import Celery
from flask import jsonify, send_file
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from models import ( db, User, Market, MarketDay, Vendor, MarketReview, 
                    VendorReview, ReportedReview, MarketReviewRating, 
                    VendorReviewRating, MarketFavorite, VendorFavorite, 
                    VendorMarket, VendorUser, AdminUser, Basket, Event, 
                    Product, UserNotification, VendorNotification, 
                    AdminNotification, QRCode, FAQ, Blog, BlogFavorite,
                    Receipt, SettingsUser, SettingsVendor, SettingsAdmin, 
                    UserIssue, bcrypt )
from utils.emails import ( send_contact_email, send_user_password_reset_email, 
                          send_vendor_password_reset_email, send_admin_password_reset_email, 
                          send_user_confirmation_email, send_vendor_confirmation_email, 
                          send_admin_confirmation_email, send_vendor_team_invite_email, 
                          )
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from sqlalchemy.sql.expression import extract
from datetime import datetime, time, timedelta
import time as time2
from celery.schedules import crontab
from sqlalchemy.orm import Session
from sqlalchemy import event
from PIL import Image
import base64
from uuid import uuid4
import numpy as np
import psutil
import stripe

serializer = URLSafeTimedSerializer(os.environ['SECRET_KEY'])

MAX_SIZE = 1.5 * 1024 * 1024
MAX_RES = (1800, 1800)

def log_mem(label=""):
    rss = psutil.Process(os.getpid()).memory_info().rss / 1024**2
    print(f"{label} RAM: {rss:.2f} MB")

@celery.task(queue='default')
def heavy_task(size=10000, duration=3):
    """Simulates memory and CPU load"""
    print(f"Starting heavy_task with size={size}, duration={duration}s")
    process = psutil.Process(os.getpid())
    mem_before = process.memory_info().rss
    
    print(f"Memory before: {mem_before / 1024 / 1024:.2f} MB")
    print(f"Estimated array size: {(size * size * 8) / 1024 / 1024:.2f} MB")

    data = np.random.rand(size, size)
    time2.sleep(duration)
    data.sum()
    
    mem_after = process.memory_info().rss
    print(f"Memory after: {mem_after / 1024 / 1024:.2f} MB")
    print(f"RAM usage: {psutil.virtual_memory().percent}%")
    print(f"CPU usage: {psutil.cpu_percent()}%")
    return

@celery.task(queue='default')
def contact_task(name, email, subject, message):
    try:
        print(f"Processing contact request - Name: {name}, Email: {email}, Subject: {subject}, Message: {message}")

        result = send_contact_email(name, email, subject, message)

        if "error" in result:
            return {"error": result["error"]}

        return {"message": result["message"]}

    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}

@celery.task(queue='default')
def user_signup_task(data):
    from app import app
    with app.app_context():
        try:
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return {'error': 'Email and password are required'}

            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                return {'error': 'This email is already registered. Please log in or use a different email.'}

            # Send user confirmation email
            result = send_user_confirmation_email(email, data)
            if 'error' in result:
                return {"error": result["error"]}

            return {"message": result["message"]}

        except Exception as e:
            return {"error": str(e)}

@celery.task(queue='default')
def confirm_user_email_task(token, request_method):
    from app import app
    with app.app_context():
        try:
            # Decode the token to get user data
            data = serializer.loads(token, salt='user-confirmation-salt', max_age=86400)
            website = os.environ['VITE_SITE_URL']

            user_id = data.get('user_id')
            email = data.get('email')

            if request_method == 'GET':
                # Return a redirect response (or perform another action as needed)
                return {'redirect': f'{website}/user/confirm-email/{token}'}

            if request_method == 'POST':
                existing_user = User.query.get(user_id)

                if existing_user:
                    # Check if the email is already taken by another user
                    if User.query.filter(User.email == email, User.id != user_id).first():
                        return {"error": "This email is already in use by another account."}

                    existing_user.email = email
                    db.session.commit()

                    return {
                        "message": "Email updated successfully. Verification required for the new email.",
                        "isNewUser": False,
                        "user_id": existing_user.id,
                        "email": existing_user.email
                    }

                if "password" not in data:
                    return {"error": "Password is required to create a new account."}

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

                return {
                    'message': 'Email confirmed and account created successfully.',
                    'isNewUser': True,
                    'user_id': new_user.id
                }

        except SignatureExpired:
            return {'error': 'The token has expired'}
        except Exception as e:
            return {'error': f'Failed to confirm or update email: {str(e)}'}

@celery.task(queue='default')
def change_user_email_task(data):
    from app import app
    with app.app_context():
        try:
            email = data.get('email')
            if not email:
                return {"error": "Email is required"}

            result = send_user_confirmation_email(email, data)

            if 'error' in result:
                return {"error": result["error"]}

            return {"message": result["message"]}

        except Exception as e:
            return {"error": f"An unexpected error occurred: {str(e)}"}

@celery.task(queue='default')
def user_password_reset_request_task(email):
    from app import app
    with app.app_context():
        try:
            if not email:
                return {"error": "Email is required"}

            user = User.query.filter_by(email=email).first()
            if not user:
                return {"error": "User not found"}

            result = send_user_password_reset_email(email)

            if "error" in result:
                return {"error": result["error"]}

            return {"message": result["message"]}

        except Exception as e:
            return {"error": f"An unexpected error occurred: {str(e)}"}

@celery.task(queue='default')
def vendor_signup_task(data):
    from app import app
    with app.app_context():
        try:
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return {'error': 'Email and password are required'}

            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                return {'error': 'This email is already registered. Please log in or use a different email.'}

            # Send user confirmation email
            result = send_vendor_confirmation_email(email, data)
            if 'error' in result:
                return {"error": result["error"]}

            return {"message": result["message"]}

        except Exception as e:
            return {"error": str(e)}

@celery.task(queue='default')
def confirm_vendor_email_task(token, request_method):
    from app import app
    with app.app_context():
        try:
            # Decode the token to get user data
            data = serializer.loads(token, salt='vendor-confirmation-salt', max_age=86400)
            website = os.environ['VITE_SITE_URL']

            vendor_id = data.get('vendor_id')
            email = data.get('email')

            if request_method == 'GET':
                # Return a redirect response (or perform another action as needed)
                return {'redirect': f'{website}/vendor/confirm-email/{token}'}
            
            if request_method == 'POST':
                existing_vendor = VendorUser.query.get(vendor_id)

                if existing_vendor:
                    print(f"POST request: User {vendor_id} exists, updating email to {email}")

                    if VendorUser.query.filter(VendorUser.email == email, VendorUser.id != vendor_id).first():
                        return {"error": "This email is already in use by another account."}

                    existing_vendor.email = email
                    db.session.commit()

                    return {
                        "message": "Email updated successfully. Verification required for the new email.",
                        "isNewUser": False,
                        "user_id": existing_vendor.id,
                        "email": existing_vendor.email
                    }

                if "password" not in data:
                    return {"error": "Password is required to create a new account."}

                new_vendor_user = VendorUser(
                    email=email,
                    password=data['password'], 
                    first_name=data['first_name'],
                    last_name=data['last_name'],
                    phone=data['phone'],
                )
                db.session.add(new_vendor_user)
                db.session.commit()

                
                return {
                    'message': 'Email confirmed and account created successfully.',
                    'isNewVendor': True,
                    'vendor_id': new_vendor_user.id
                }

        except SignatureExpired:
            return {'error': 'The token has expired'}
        except Exception as e:
            return {'error': f'Failed to confirm or update email: {str(e)}'}

@celery.task(queue='default')
def change_vendor_email_task(data):
    from app import app
    with app.app_context():
        try:
            email = data.get('email')
            if not email:
                return {"error": "Email is required"}

            result = send_vendor_confirmation_email(email, data)

            if 'error' in result:
                return {"error": result["error"]}

            return {"message": result["message"]}

        except Exception as e:
            return {"error": f"An unexpected error occurred: {str(e)}"}

@celery.task(queue='default')
def vendor_password_reset_request_task(email):
    from app import app
    with app.app_context():
        try:
            if not email:
                return {"error": "Email is required"}

            user = VendorUser.query.filter_by(email=email).first()
            if not user:
                return {"error": "User not found"}

            result = send_vendor_password_reset_email(email)

            if "error" in result:
                return {"error": result["error"]}

            return {"message": result["message"]}

        except Exception as e:
            return {"error": f"An unexpected error occurred: {str(e)}"}

@celery.task(queue='default')
def admin_signup_task(data):
    from app import app
    with app.app_context():
        try:
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return {'error': 'Email and password are required'}

            existing_user = AdminUser.query.filter_by(email=email).first()
            if existing_user:
                return {'error': 'This email is already registered. Please log in or use a different email.'}

            # Send user confirmation email
            result = send_admin_confirmation_email(email, data)
            if 'error' in result:
                return {"error": result["error"]}

            return {"message": result["message"]}

        except Exception as e:
            return {"error": str(e)}

@celery.task(queue='default')
def confirm_admin_email_task(token, request_method):
    from app import app
    with app.app_context():
        try:
            # Decode the token to get user data
            data = serializer.loads(token, salt='admin-confirmation-salt', max_age=86400)
            website = os.environ['VITE_SITE_URL']

            admin_id = data.get('admin_id')
            email = data.get('email')

            if request_method == 'GET':
                # Return a redirect response (or perform another action as needed)
                return {'redirect': f'{website}/admin/confirm-email/{token}'}
            
            if request_method == 'POST':
                existing_admin = AdminUser.query.get(admin_id)

                if existing_admin:
                    print(f"POST request: User {admin_id} exists, updating email to {email}")

                    if AdminUser.query.filter(AdminUser.email == email, AdminUser.id != admin_id).first():
                        return {"error": "This email is already in use by another account."}

                    existing_admin.email = email
                    db.session.commit()

                    return {
                        "message": "Email updated successfully. Verification required for the new email.",
                        "isNewUser": False,
                        "user_id": existing_admin.id,
                        "email": existing_admin.email
                    }

                if "password" not in data:
                    return {"error": "Password is required to create a new account."}

                new_admin_user = AdminUser(
                    email=email,
                    password=data['password'], 
                    first_name=data['first_name'],
                    last_name=data['last_name'],
                    phone=data['phone'],
                )
                db.session.add(new_admin_user)
                db.session.commit()

                
                return {
                    'message': 'Email confirmed and account created successfully.',
                    'isNewAdmin': True,
                    'admin_id': new_admin_user.id
                }

        except SignatureExpired:
            return {'error': 'The token has expired'}
        except Exception as e:
            return {'error': f'Failed to confirm or update email: {str(e)}'}

@celery.task(queue='default')
def change_admin_email_task(data):
    from app import app
    with app.app_context():
        try:
            email = data.get('email')
            if not email:
                return {"error": "Email is required"}

            result = send_admin_confirmation_email(email, data)

            if 'error' in result:
                return {"error": result["error"]}

            return {"message": result["message"]}

        except Exception as e:
            return {"error": f"An unexpected error occurred: {str(e)}"}

@celery.task(queue='default')
def admin_password_reset_request_task(email):
    from app import app
    with app.app_context():
        try:
            if not email:
                return {"error": "Email is required"}

            user = AdminUser.query.filter_by(email=email).first()
            if not user:
                return {"error": "User not found"}

            result = send_admin_password_reset_email(email)

            if "error" in result:
                return {"error": result["error"]}

            return {"message": result["message"]}

        except Exception as e:
            return {"error": f"An unexpected error occurred: {str(e)}"}

@celery.task(bind=True, queue='default')
def send_team_invite_email_task(self, email, vendor_id, role=2):
    try:
        from app import app
        with app.app_context():
            vendor = db.session.get(Vendor, vendor_id)
            if not vendor:
                return {'error': 'Vendor not found'}

            token_data = {
                'email': email,
                'vendor_id': vendor_id,
                'role': role,
                'exp': (datetime.utcnow() + timedelta(days=7)).isoformat()
            }
            token = serializer.dumps(token_data, salt='team-invite-salt')

            result = send_vendor_team_invite_email(email, vendor.name, token)

            if 'error' in result:
                return {'error': result['error']}

            return {'message': 'Invitation sent'}

    except Exception as e:
        return {'error': str(e)}

@celery.task(queue='default')
def send_mjml_email_task(mjml, subject, compiled_html, recipient_email):
    """Process MJML email rendering and send via SMTP."""
    try:
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = subject
        msg.attach(MIMEText(compiled_html, 'html'))

        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()

        return {"message": "Email sent successfully!"}
    
    except Exception as e:
        return {"error": str(e)}

@celery.task(queue='default')
def send_html_email_task(html, subject, recipient_email):
    """Process HTML email rendering and send via SMTP."""
    try: 
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = subject

        body = html
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()

        return {"message": "Email sent successfully!"}

    except Exception as e:
        return {"error": str(e)}

@celery.task(queue='default')
def send_sendgrid_email_task(html, subject, user_type):
    """Send bulk emails via SendGrid."""
    sender_email = os.getenv('EMAIL_USER')
    try:
        result = subprocess.run(['mjml', '--stdin'], input=html.encode(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            return {"error": result.stderr.decode()}

        compiled_html = result.stdout.decode()

        # Fetch recipients
        if user_type == 'user':
            users = User.query.with_entities(User.email).all()
        elif user_type == 'vendor':
            users = VendorUser.query.with_entities(VendorUser.email).all()
        elif user_type == 'admin':
            users = AdminUser.query.with_entities(AdminUser.email).all()
        else:
            return {"error": "Invalid user type"}

        email_list = [user.email for user in users]
        if not email_list:
            return {"error": "No recipients found"}

        # Send email
        message = Mail(
            from_email=f'Gingham NYC <{sender_email}>',
            to_emails=email_list,
            subject=subject,
            html_content=compiled_html,
            is_multiple=True
        )
        sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        response = sg.send(message)
        return {"message": "Email sent successfully", "status_code": response.status_code}
    
    except Exception as e:
        return {"error": str(e)}

@celery.task(queue='default')
def send_sendgrid_email_client_task(subject, body_type, body, from_email, to_email):
    compiled_html = body

    if body_type == 'mjml':
        try:
            result = subprocess.run(
                ['mjml', '--stdin'],
                input=body.encode(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            if result.returncode != 0:
                return {"error": result.stderr.decode(), "status": 400}

            compiled_html = result.stdout.decode()

        except Exception as e:
            return {"error": str(e), "status": 500}

    if body_type == 'plain':
        message = Mail(from_email=from_email, to_emails=to_email, subject=subject, plain_text_content=compiled_html)
    else:
        message = Mail(from_email=from_email, to_emails=to_email, subject=subject, html_content=compiled_html)

    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        return {"message": "Email sent successfully", "status_code": response.status_code}
    except Exception as e:
        return {"error": str(e), "status": 500}

@celery.task(bind=True, queue='default')
def export_csv_users_task(self):
    """Exports user data to a CSV file asynchronously."""
    import os
    import socket
    print(f"Task {self.request.id} STARTED on {socket.gethostname()} (pid {os.getpid()})")
    from app import app
    with app.app_context():
        try:
            users = User.query.order_by(User.id.asc()).all()
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

            db.session.close()
            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            db.session.close()
            return {"error": str(e)}

@celery.task(bind=True, queue='default')
def export_csv_vendor_users_task(self):
    """Exports vendor user data to a CSV file asynchronously."""
    import os
    import socket
    print(f"Task {self.request.id} STARTED on {socket.gethostname()} (pid {os.getpid()})")
    from app import app
    with app.app_context():
        try:
            vendor_users = VendorUser.query.order_by(VendorUser.id.asc()).all()
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

            db.session.close()
            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            db.session.close()
            return {"error": str(e)}

@celery.task(bind=True, queue='default')
def export_csv_markets_task(self):
    """Exports market data to a CSV file asynchronously."""
    import os
    import socket
    print(f"Task {self.request.id} STARTED on {socket.gethostname()} (pid {os.getpid()})")
    from app import app
    with app.app_context():
        try:
            markets = Market.query.order_by(Market.id.asc()).all()
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

            db.session.close()
            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            db.session.close()
            return {"error": str(e)}

@celery.task(bind=True, queue='default')
def export_csv_vendors_task(self):
    """Exports vendor data to a CSV file asynchronously."""
    import os
    import socket
    print(f"Task {self.request.id} STARTED on {socket.gethostname()} (pid {os.getpid()})")
    from app import app
    with app.app_context():
        try:
            vendors = Vendor.query.order_by(Vendor.id.asc()).all()
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

            db.session.close()
            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            db.session.close()
            return {"error": str(e)}

@celery.task(bind=True, queue='default')
def export_csv_baskets_task(self):
    """Exports basket data to a CSV file asynchronously."""
    import os
    import socket
    print(f"Task {self.request.id} STARTED on {socket.gethostname()} (pid {os.getpid()})")
    from app import app
    with app.app_context():
        try:
            baskets = Basket.query.order_by(Basket.id.asc()).all()
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

            db.session.close()
            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            db.session.close()
            return {"error": str(e)}

@celery.task(bind=True, queue='default')
def export_csv_products_task(self):
    """Exports product data to a CSV file asynchronously."""
    import os
    import socket
    print(f"Task {self.request.id} STARTED on {socket.gethostname()} (pid {os.getpid()})")
    from app import app
    with app.app_context():
        try:
            products = Product.query.order_by(Product.id.asc()).all()
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

            db.session.close()
            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            db.session.close()
            return {"error": str(e)}

@celery.task(queue='default')
def generate_vendor_baskets_csv(vendor_id, month, year):
    from app import app
    with app.app_context():
        try:
            # Query baskets for given vendor and month/year
            baskets = Basket.query.filter(
                Basket.vendor_id == vendor_id,
                extract('month', Basket.sale_date) == month,
                extract('year', Basket.sale_date) == year
            ).order_by(Basket.id.asc()).all()
            
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
            
            filename = f'gingham_vendor-statement_{vendor_id}_{year}-{int(month):02d}.csv'
            file_path = os.path.join('/tmp', filename)
            
            with open(file_path, 'w', newline='') as csvfile:
                csvfile.write(output.getvalue())
            
            db.session.close()

            return {
                'status': 'success',
                'file_path': file_path,
                'filename': filename
            }
        except Exception as e:
            db.session.close()
            return {
                'status': 'error',
                'error': str(e)
            }

@celery.task(queue='process_images')
def process_image(image_bytes, filename, max_size=MAX_SIZE, resolution=MAX_RES):
    """Resizes and optimizes an image asynchronously and returns it as bytes."""
    log_mem("Start")
    max_size = int(max_size)
    
    image = Image.open(BytesIO(image_bytes))
    image.thumbnail(resolution, Image.LANCZOS)

    temp_output = BytesIO()
    
    if image.format == 'PNG':
        image.save(temp_output, format='PNG', optimize=True)
    else:
        image.save(temp_output, format='JPEG', quality=50)

    file_size = temp_output.tell()
    if not isinstance(file_size, int):
        raise ValueError(f"Unexpected file_size type: {type(file_size)}")
    step = 0.9

    while file_size > max_size:
        temp_output = BytesIO()
        if image.format == 'PNG':
            image.save(temp_output, format='PNG', optimize=True)
        else:
            quality = max(10, int(85 * step))
            image.save(temp_output, format='JPEG', quality=quality)
        file_size = temp_output.tell()
        step -= 0.05
    
        if not isinstance(file_size, int):
            raise ValueError(f"Unexpected file_size type after compression: {type(file_size)}")

    log_mem("After resize")
    temp_output.seek(0)

    # Convert image to Base64 to send back to Flask
    encoded_image = base64.b64encode(temp_output.getvalue()).decode('utf-8')
    log_mem("After save")
    
    return {"filename": filename, "image_data": encoded_image}

@celery.task(queue='default')
def reset_market_status():
    """Reset all markets' is_current status to False at the start of each year."""
    session = Session()
    try:
        # Set all Markets.is_current to False
        session.query(Market).update({Market.is_current: False})
        session.commit()
        print("All markets have been set to is_current=False for the new year.")
    except Exception as e:
        session.rollback()
        print(f"Error resetting market status: {e}")
    finally:
        session.close()

@celery.task(queue='default')
def update_vendor_user_market_locations(vendor_user_id):
    """Update market locations for a vendor user when they are created."""
    session = Session()
    try:
        # Get the vendor user
        vendor_user = session.query(VendorUser).get(vendor_user_id)
        if not vendor_user:
            print(f"Vendor User ID={vendor_user_id} not found.")
            return

        # Retrieve all market_day_ids associated with the vendor
        market_days = session.query(VendorMarket.market_day_id).filter_by(vendor_id=vendor_user.vendor_id).all()
        market_day_ids = [md.market_day_id for md in market_days]

        if not market_day_ids:
            print(f"No market locations found for Vendor ID={vendor_user.vendor_id}. Skipping update.")
            return

        # Update SettingsVendor for this vendor user
        settings = session.query(SettingsVendor).filter_by(vendor_user_id=vendor_user_id).first()
        if settings:
            existing_market_locations = set(settings.market_locations or [])
            updated_market_locations = list(existing_market_locations.union(set(market_day_ids)))
            settings.market_locations = updated_market_locations
            session.commit()
            print(f"Updated market locations for Vendor User ID={vendor_user_id}")

    except Exception as e:
        session.rollback()
        print(f"Error updating market locations for Vendor User ID={vendor_user_id}: {e}")
    finally:
        session.close()

# Register event listeners
@event.listens_for(VendorUser, 'after_insert')
def handle_vendor_user_creation(mapper, connection, target):
    """Event listener to trigger market location update when a new vendor user is created."""
    update_vendor_user_market_locations.delay(target.id)

@celery.task(queue='default')
def send_blog_notifications(blog_id, task_id=None):
    """Send blog notifications to users when a new blog post is created."""
    from app import app
    with app.app_context():
        try:
            blog_id = int(blog_id)
        except (ValueError, TypeError):
            print(f"Invalid blog_id: {blog_id}. Must be an integer.")
            return None
        try:
            # Get the blog post
            blog = db.session.get(Blog, blog_id)
            if not blog:
                print(f"Blog ID={blog_id} not found.")
                return None

            # If task_id is passed, we can skip re-scheduling
            if task_id and blog.task_id and task_id != blog.task_id:
                print(f"Skipping task as it has already been scheduled with task_id {blog.task_id}")
                return

            print(task_id)
            # Check if post_date matches current date
            current_date = datetime.utcnow().date()
            if not blog.post_date or blog.post_date.date() != current_date:
                print(f"Blog ID={blog_id} post_date ({blog.post_date}) does not match current date ({current_date}). Skipping notifications.")
                return

            # Get users who have notifications enabled based on blog type
            if blog.for_user:
                users = db.session.query(User).join(SettingsUser).filter(SettingsUser.site_new_blog == True).all()
                
                # Prepare user notifications
                user_notifications = [
                    UserNotification(
                        subject="New Blog Post Alert!",
                        message=f"A new blog post, {blog.title}, has been published. Check it out!",
                        link=f"#blog",
                        user_id=user.id,
                        created_at=datetime.utcnow(),
                        is_read=False,
                        task_id=task_id
                    )
                    for user in users
                ]
            else:
                users = []
                user_notifications = []

            if blog.for_vendor:
                vendor_users = db.session.query(VendorUser).join(SettingsVendor).filter(SettingsVendor.site_new_blog == True).all()

                # Prepare vendor notifications
                vendor_notifications = [
                    VendorNotification(
                        subject="New Blog Post Alert!",
                        message=f"A new blog post, {blog.title}, has been published. Check it out!",
                        link=f"/vendor#blog",
                        vendor_user_id=vendor_user.id,
                        created_at=datetime.utcnow(),
                        is_read=False,
                        task_id=task_id
                    )
                    for vendor_user in vendor_users
                ]
            else:
                vendor_users = []
                vendor_notifications = [] 

            if blog.for_admin:
                admins = db.session.query(AdminUser).join(SettingsAdmin).filter(SettingsAdmin.site_new_blog == True).all()
                
                # Prepare admin notifications
                admin_notifications = [
                    AdminNotification(
                        subject="New Blog Post Alert!",
                        message=f"A new blog post, {blog.title}, has been published. Check it out!",
                        link=f"/admin#blog",
                        admin_role=5,
                        created_at=datetime.utcnow(),
                        is_read=False,
                        task_id=task_id
                    )
                ]
            else:
                admins = []
                admin_notifications = []
                
            if not users and not admins and not vendor_users:
                print("No users have blog notifications enabled. No notifications will be created.")
                return
            
            # Save notifications to the database
            db.session.bulk_save_objects(user_notifications + vendor_notifications + admin_notifications)  
            blog.notifications_sent = True
            db.session.commit()
            print(f"Blog ID={blog_id} notifications have been sent.")

        except Exception as e:
            db.session.rollback()
            print(f"Error sending blog notifications for Blog ID={blog_id}: {e}")
        finally:
            db.session.close()

@celery.task(queue='blog_notifications')
def check_scheduled_blog_notifications():
    """Check for blogs that need notifications today"""
    from app import app
    with app.app_context():
        try:
            # Get all blogs scheduled for today that haven't had notifications sent
            today = datetime.combine(datetime.utcnow().date(), time.min)
            print(f"[DEBUG] Checking for blogs scheduled for {today} that need notifications")
            
            # Check if the notifications_sent field exists
            from sqlalchemy import inspect
            columns = [c.name for c in inspect(Blog).columns]
            if 'notifications_sent' not in columns:
                print("[ERROR] notifications_sent column doesn't exist in Blog table!")
                return "ERROR: notifications_sent column missing"
            
            # Count all blogs
            total_blogs = db.session.query(Blog).count()
            print(f"[DEBUG] Total blogs in database: {total_blogs}")
            
            # Count blogs with today's date
            blogs_today = db.session.query(Blog).filter(Blog.post_date == today).count()
            print(f"[DEBUG] Blogs with post_date={today}: {blogs_today}")
            
            # Count blogs with notifications not sent
            blogs_not_sent = db.session.query(Blog).filter(Blog.notifications_sent == False).count()
            print(f"[DEBUG] Blogs with notifications_sent=False: {blogs_not_sent}")
            
            # Find blogs that should receive notifications today
            blogs_to_notify = db.session.query(Blog).filter(
                Blog.post_date == today,
                Blog.notifications_sent == False
            ).all()
            
            print(f"[DEBUG] Found {len(blogs_to_notify)} blogs that need notifications")
            
            # Show details of each blog that needs notification
            for blog in blogs_to_notify:
                print(f"[DEBUG] Blog ID={blog.id}, Title='{blog.title}', Post Date={blog.post_date}")
                # Send notification
                send_result = send_blog_notifications.apply_async(
                    args=[blog.id],
                    kwargs={"task_id": str(uuid4())}
                )
                print(f"[DEBUG] Notification task triggered: {send_result}")
                
                # Mark as sent
                # blog.notifications_sent = True
            
            # Commit the changes
            db.session.commit()
            return f"Processed {len(blogs_to_notify)} blog notifications"
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Exception in check_scheduled_blog_notifications: {e}")
            import traceback
            traceback.print_exc()
            return f"Error: {str(e)}"
        finally:
            db.session.close()

@celery.task(bind=True, queue='default')
def process_transfers_task(self, payment_intent_id, baskets):
    from app import app, get_vendor_stripe_accounts
    with app.app_context():
        try:
            print(f"Processing transfers for PaymentIntent: {payment_intent_id}")
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            print(f"PaymentIntent Status: {payment_intent['status']}")

            if payment_intent['status'] != 'succeeded':
                return {
                    'error': {
                        'message': f"Payment not completed yet. Current status: {payment_intent['status']}",
                        'payment_intent_status': payment_intent['status']
                    }
                }

            vendor_ids = [basket['vendor_id'] for basket in baskets]
            vendor_accounts = get_vendor_stripe_accounts(vendor_ids)
            print(f"Vendor accounts retrieved: {vendor_accounts}")

            transfer_data = []

            for basket in baskets:
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

                transfer_amount = int((price - fee_vendor) * 100)
                application_fee = int(fee_vendor * 100)

                try:
                    transfer = stripe.Transfer.create(
                        amount=transfer_amount + application_fee,
                        currency="usd",
                        destination=stripe_account_id,
                        transfer_group=f"group_pi_{payment_intent_id}",
                        # application_fee_amount=application_fee
                    )

                    transfer_data.append({
                        "basket_id": basket["id"],
                        "vendor_id": vendor_id,
                        "stripe_account_id": stripe_account_id,
                        "stripe_transfer_id": transfer.id,
                        "amount": transfer.amount,
                        "destination": stripe_account_id,
                        "payment_intent_id": payment_intent_id,
                        "transfer_group": f"group_pi_{payment_intent_id}",
                        # "application_fee_amount": application_fee,
                    })

                    basket_record = Basket.query.filter_by(id=basket['id']).first()
                    if basket_record:
                        basket_record.stripe_transfer_id = transfer.id
                        db.session.commit()
                        print(f"Basket {basket['id']} updated with stripe_transfer_id {transfer.id}")

                except stripe.error.StripeError as e:
                    print(f"Transfer failed for vendor {vendor_id}: {e}")
                    return {
                        'error': {
                            'message': f"Transfer failed for vendor {vendor_id}",
                            'details': e.json_body
                        }
                    }

            return {
                'message': 'Transfers processed successfully',
                'transfer_data': transfer_data
            }

        except stripe.error.StripeError as e:
            print(f"Stripe API Error: {str(e)}")
            return {'error': {'message': 'Stripe API Error', 'details': str(e)}}

        except Exception as e:
            print(f"Unexpected error in task: {str(e)}")
            return {'error': {'message': 'Unexpected error occurred', 'details': str(e)}}

@celery.task(bind=True, queue='default')
def reverse_basket_transfer_task(self, basket_id, stripe_account_id, amount):
    from app import app
    with app.app_context():
        try:
            reversal_amount = int(amount * 100)

            basket_record = Basket.query.filter_by(id=basket_id).first()
            if not basket_record or not basket_record.stripe_transfer_id:
                return {"error": f"No stripe_transfer_id found for basket {basket_id}."}

            stripe_transfer_id = basket_record.stripe_transfer_id

            reversal = stripe.Transfer.create_reversal(
                stripe_transfer_id,
                amount=reversal_amount,
                metadata={"reason": "Refunded to customer"}
            )

            basket_record.is_refunded = True
            db.session.commit()

            return {
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
            }
        except Exception as e:
            self.retry(exc=e, countdown=10, max_retries=3)
            return {"error": str(e)}