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
                          send_admin_confirmation_email )
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from sqlalchemy.sql.expression import extract
from datetime import datetime

serializer = URLSafeTimedSerializer(os.environ['SECRET_KEY'])

@celery.task
def contact_task(name, email, subject, message):
    try:
        print(f"Processing contact request - Name: {name}, Email: {email}, Subject: {subject}, Message: {message}")

        result = send_contact_email(name, email, subject, message)

        if "error" in result:
            return {"error": result["error"]}

        return {"message": result["message"]}

    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}

@celery.task
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

@celery.task
def confirm_user_email_task(token, request_method):
    from app import app
    with app.app_context():
        try:
            # Decode the token to get user data
            data = serializer.loads(token, salt='user-confirmation-salt', max_age=86400)
            website = os.environ['SITE_URL']

            user_id = data.get('user_id')  # Extract user ID
            email = data.get('email')  # Extract new email

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

@celery.task
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

@celery.task
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

@celery.task
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

@celery.task
def confirm_vendor_email_task(token, request_method):
    from app import app
    with app.app_context():
        try:
            # Decode the token to get user data
            data = serializer.loads(token, salt='vendor-confirmation-salt', max_age=86400)
            website = os.environ['SITE_URL']

            vendor_id = data.get('vendor_id')  # Extract user ID
            email = data.get('email')  # Extract new email

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

@celery.task
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

@celery.task
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

@celery.task
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

@celery.task
def confirm_admin_email_task(token, request_method):
    from app import app
    with app.app_context():
        try:
            # Decode the token to get user data
            data = serializer.loads(token, salt='admin-confirmation-salt', max_age=86400)
            website = os.environ['SITE_URL']

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

@celery.task
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

@celery.task
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

@celery.task
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

@celery.task
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

@celery.task
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



@celery.task
def export_csv_users_task():
    """Exports user data to a CSV file asynchronously."""
    from app import app
    with app.app_context():
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

            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            return {"error": str(e)}

@celery.task
def export_csv_vendor_users_task():
    """Exports vendor user data to a CSV file asynchronously."""
    from app import app
    with app.app_context():
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

            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            return {"error": str(e)}

@celery.task
def export_csv_markets_task():
    """Exports market data to a CSV file asynchronously."""
    from app import app
    with app.app_context():
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

            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            return {"error": str(e)}

@celery.task
def export_csv_vendors_task():
    """Exports vendor data to a CSV file asynchronously."""
    from app import app
    with app.app_context():
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

            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            return {"error": str(e)}

@celery.task
def export_csv_baskets_task():
    """Exports basket data to a CSV file asynchronously."""
    from app import app
    with app.app_context():
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

            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            return {"error": str(e)}

@celery.task
def export_csv_products_task():
    """Exports product data to a CSV file asynchronously."""
    from app import app
    with app.app_context():
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

            return {"csv": csv_content, "filename": filename}

        except Exception as e:
            return {"error": str(e)}

@celery.task
def generate_vendor_baskets_csv(vendor_id, month, year):
    from app import app
    with app.app_context():
        try:
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
            
            filename = f'gingham_vendor-statement_{vendor_id}_{year}-{int(month):02d}.csv'
            file_path = os.path.join('/tmp', filename)
            
            with open(file_path, 'w', newline='') as csvfile:
                csvfile.write(output.getvalue())
            
            return {
                'status': 'success',
                'file_path': file_path,
                'filename': filename
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }