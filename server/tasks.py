import os
import csv
import smtplib
import subprocess
from io import StringIO, BytesIO
from celery_config import celery
from celery import shared_task
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
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from sqlalchemy.sql.expression import extract
from datetime import datetime

@celery.task(name="tasks.add")  # Explicit name to avoid import issues
def add(x, y):
    return x + y

@celery.task
def send_mjml_email_task(mjml, subject, recipient_email):
    """Process MJML email rendering and send via SMTP."""
    try:
        result = subprocess.run(['mjml', '--stdin'], input=mjml.encode(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            return {'error': result.stderr.decode()}

        compiled_html = result.stdout.decode()
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = subject
        msg.attach(MIMEText(compiled_html, 'html'))

        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
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

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = subject

        body = html
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
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
        return {"error": str(e)}

@celery.task
def export_csv_markets_task():
    """Exports market data to a CSV file asynchronously."""
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
        return {"error": str(e)}

@celery.task
def export_csv_vendors_task():
    """Exports vendor data to a CSV file asynchronously."""
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
        return {"error": str(e)}

@celery.task
def export_csv_baskets_task():
    """Exports basket data to a CSV file asynchronously."""
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
        return {"error": str(e)}

@celery.task
def export_csv_products_task():
    """Exports product data to a CSV file asynchronously."""
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
        return {"error": str(e)}

@shared_task
def generate_vendor_baskets_csv(vendor_id, month, year):
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
        
        filename = f'gingham_vendor-statement_{vendor_id}_{year}-{month:02d}_{datetime.now().strftime("%Y%m%d%H%M%S")}.csv'
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