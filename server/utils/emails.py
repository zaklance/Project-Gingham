import os
import smtplib
from io import BytesIO, StringIO
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import csv
from flask import url_for
from itsdangerous import URLSafeTimedSerializer
from sqlalchemy import extract
from datetime import datetime, date, time
from models import (Product, Basket)

serializer = URLSafeTimedSerializer(os.getenv('SECRET_KEY'))

def format_event_date(date_input):
    try:
        if isinstance(date_input, (datetime, date)):
            date_obj = date_input
        elif isinstance(date_input, str):
            date_obj = datetime.strptime(date_input, "%Y-%m-%d")
        else:
            raise ValueError("Unsupported date format")

        return date_obj.strftime("%b %d, %Y")
    
    except Exception as e:
        print(f"Date formatting error: {e}")
        return "Invalid Date"

def time_converter(time_input):
    if isinstance(time_input, time):
        time_obj = time_input
    elif isinstance(time_input, str):
        time_format = "%H:%M:%S" if len(time_input.split(':')) == 3 else "%H:%M"
        time_obj = datetime.strptime(time_input, time_format).time()
    else:
        raise ValueError("time_converter expects a string or datetime.time object")

    time12 = time_obj.strftime("%-I:%M %p")

    if time12.endswith(":00 AM") or time12.endswith(":00 PM"):
        time12 = time_obj.strftime("%-I %p")

    return time12

def get_current_year():
    return datetime.now().year

EMAIL_STYLES = """
    <style>
        .email-container {
            font-family: helvetica, sans-serif;
            line-height: 1.6;
            color: #3b4752;
            background-color: #fbf7eb;
            padding: 20px;
            border-radius: 24px;
        }
        .header {
            color: white;
            text-align: center;
            border-radius: 16px;
        }
        .content {
            padding: 20px;
            color: #3b4752;
        }
        .footer {
            font-size: 12px;
            text-align: center;
            margin-top: 20px;
            margin-bottom: -10px;
            color: #777;
        }
        .footer-flex {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .button {
            display: inline-block;
            background-color: #ff806b;
            color: #ffffff !important;
            text-decoration: none !important;
            padding: 8px 12px;
            border-radius: 5px;
            margin-top: 10px;
        }
        .img-logo {
            height: 120px;
            width: 120px;
        }
        .img-logo-small {
            height: 32px;
            width: 32px;
        }
        .divider {
            border: 0;
            border-top: 4px solid #ff806b;
        }
        p, h1, h2, h3, h4, h5, h6, li {
            color: #ff806b;
        }
        .img-hero, .img-blog {
            width: 100%;
            height: auto;
        }
        article {
            margin-bottom: 1em;
            widows: 2;
        }
        .first-letter::first-letter {
            -webkit-initial-letter: 2;
            initial-letter: 2;
            font-family: inherit;
            padding-right: 4px;
        }
        .center {
            text-align: center;
        }
        .flex-center {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
        }
        .flex-gap-8 {
            gap: 8px;
        }
        .flex-gap-16 {
            gap: 16px;
        }
        .margin-4-0 {
            margin: 4px;
        }
        .margin-12-0 {
            margin: 12px;
        }
        .margin-r-16 {
            margin-right: 16px;
        }
        .link-underline {
            color: #ff806b;
            text-decoration: none;
        }
        .link-underline:hover {
            text-decoration: underline;
            text-underline-offset: .15em;
            background-color: transparent;
            transition: all 0.3s;
        }
        .box-callout {
            border: 4px solid #ff806b;
            border-radius: 20px;
            padding: 12px 24px;
        }
    </style>
"""


# Email Contact Form
def send_contact_email(name, email, subject, message): 
    try: 
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = "admin@gingham.nyc"
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = f"GINGHAM Contact Form Submission: {subject}"

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>gingham Contact Form Submission</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h2>New Contact Form Submission</h2>
                    </div>
                    <hr class="divider"/>
                    <div class="content">
                        <p><strong>Name:</strong> {name}</p>
                        <p><strong>Email:</strong> {email}</p>
                        <p><strong>Subject:</strong> {subject}</p>
                        <p><strong>Message:</strong></p>
                        <p>{message}</p>
                        <a href="mailto:{email}" class="button">Reply to {name}</a>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        # print("SMTP Server is unreachable")

        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()
        
        return {"message": "Email sent successfully!"}

    except Exception as e: 
        print("Error occured:", str(e))
        return {"error": str(e)}

#  PASSWORD EMAILS PASSWORD EMAILS PASSWORD EMAILS PASSWORD EMAILS
#  PASSWORD EMAILS PASSWORD EMAILS PASSWORD EMAILS PASSWORD EMAILS

def send_user_password_reset_email(*args, **kwargs):
    """Stub for send_user_password_reset_email to satisfy imports."""
    return {'message': 'User password reset email sent (stub)'}

def send_vendor_password_reset_email(email):
    """
    Sends a password reset email to the given user email.
    """

    # Generate token for password reset
    token = serializer.dumps(email, salt='vendor-password-reset-salt')
    reset_link = url_for('vendor_password_reset', token=token, _external=True)

    try:
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = email
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = 'GINGHAM Password Reset'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>gingham Password Reset</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please click the link to reset your password <br/></strong> <a class="button" href={reset_link}>Password Reset</a></p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # Send email
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()

        return {'message': 'Password reset link sent'}

    except Exception as e:
        return {'error': f'Failed to send email: {str(e)}'}


def send_admin_password_reset_email(email):
    """
    Sends a password reset email to the given user email.
    """

    # Generate token for password reset
    token = serializer.dumps(email, salt='admin-password-reset-salt')
    reset_link = url_for('admin_password_reset', token=token, _external=True)

    try:
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = email
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = 'GINGHAM Password Reset'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>gingham Password Reset</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please click the link to reset your password <br/></strong> <a class="button" href={reset_link}>Password Reset</a></p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # Send email
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()

        return {'message': 'Password reset link sent'}

    except Exception as e:
        return {'error': f'Failed to send email: {str(e)}'}

#  CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS
#  CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS
    
def send_user_confirmation_email(email, user_data):
    try:
        token = serializer.dumps(user_data, salt='user-confirmation-salt')  # Generate the token
        VITE_SITE_URL = os.getenv('VITE_SITE_URL')
        confirmation_link = f"{VITE_SITE_URL}/user/confirm-email/{token}"
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = 'GINGHAM Email Confirmation'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>gingham Email Confirmation</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please confirm your email by clicking this link: <br/></strong> <a class="button" href={confirmation_link}>Verify Email</a></p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Email sent successfully")
        return {'message': 'Confirmation email sent successfully.', 'token': token}

    except Exception as e:
        print(f"Error during email sending: {str(e)}")
        return {'error': f'Failed to send email: {str(e)}'}
    
def send_vendor_confirmation_email(email, vendor_data):
    try:
        token = serializer.dumps(vendor_data, salt='vendor-confirmation-salt')
        VITE_SITE_URL = os.getenv('VITE_SITE_URL')
        confirmation_link = f"{VITE_SITE_URL}/vendor/confirm-email/{token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = 'GINGHAM Vendor Email Confirmation'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>gingham Vendor Email Confirmation</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please confirm your email by clicking this link: <br/></strong> <a class="button" href={confirmation_link}>Verify Email</a></p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor confirmation email sent successfully.', 'token': token}

    except Exception as e:
        print(f"Error during vendor email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_admin_confirmation_email(email, admin_data):
    try:
        token = serializer.dumps(admin_data, salt='admin-confirmation-salt')
        VITE_SITE_URL = os.getenv('VITE_SITE_URL')
        confirmation_link = f"{VITE_SITE_URL}/admin/confirm-email/{token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = 'GINGHAM Admin Email Confirmation'

        body = body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>gingham Admin Email Confirmation</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please confirm your email by clicking this link: <br/></strong> <a class="button" href={confirmation_link}>Verify Email</a></p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send admin email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Admin email sent successfully")
        return {'message': 'Admin confirmation email sent successfully.', 'token': token}

    except Exception as e:
        print(f"Error during admin email sending: {str(e)}")
        return {'error': f'Failed to send admin email: {str(e)}'}

#  USER EMAILS USER EMAILS USER EMAILS USER EMAILS
#  USER EMAILS USER EMAILS USER EMAILS USER EMAILS
#  USER EMAILS USER EMAILS USER EMAILS USER EMAILS
#  USER EMAILS USER EMAILS USER EMAILS USER EMAILS
#  USER EMAILS USER EMAILS USER EMAILS USER EMAILS

def send_email_user_fav_market_new_event(email, user, market, event, link):
    try:
        payload = {
            'type': 'SettingsUser',
            'field': 'email_fav_market_new_event',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link = f'https://www.gingham.nyc/{link}'

        start_date_formatted = format_event_date(event.start_date)
        end_date_formatted = format_event_date(event.end_date)
        if event.start_date != event.end_date:
            date_display = f"{start_date_formatted} — {end_date_formatted}"
        else:
            date_display = start_date_formatted

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Event at {market.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>One of your favorite markets, <strong><a class="link-underline" href={full_link}>{market.name}</a></strong>, has a new event, check it out: </p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3 class="margin-4-0">{event.title}</h3>
                                <h5 class="margin-4-0">{date_display}</h5>
                                <p class="margin-12-0">{event.message}</p>
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'User notification email sent successfully.'}

    except Exception as e:
        print(f"Error during user fav market new event email sending: {str(e)}")
        return {'error': f'Failed to send user email: {str(e)}'}

def send_email_user_fav_market_schedule_change(email, user, market, event, link):
    try:
        payload = {
            'type': 'SettingsUser',
            'field': 'email_fav_market_schedule_change',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link = f'https://www.gingham.nyc/{link}'

        start_date_formatted = format_event_date(event.start_date)
        end_date_formatted = format_event_date(event.end_date)
        if event.start_date != event.end_date:
            date_display = f"{start_date_formatted} — {end_date_formatted}"
        else:
            date_display = start_date_formatted

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'Schedule Change at {market.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>One of your favorite markets, <strong><a class="link-underline" href={full_link}>{market.name}</a></strong>, has temporarily changed their schedule, check it out: </p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3 class="margin-4-0">{event.title}</h3>
                                <h5 class="margin-4-0">{date_display}</h5>
                                <p class="margin-12-0">{event.message}</p>
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'User notification email sent successfully.'}

    except Exception as e:
        print(f"Error during user fav market schedule change email sending: {str(e)}")
        return {'error': f'Failed to send user email: {str(e)}'}

def send_email_user_fav_market_new_vendor(email, user, market, vendor, link_market, link_vendor):
    try:
        payload = {
            'type': 'SettingsUser',
            'field': 'email_fav_market_new_vendor',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_market = f'https://www.gingham.nyc/{link_market}'
        full_link_vendor = f'https://www.gingham.nyc/{link_vendor}'

        # Move this to events.py so there isn't a circular import, or will that create a longer circular import?
        if vendor.products:
            product_names = [product.product for product in Product.query.filter(Product.id.in_(vendor.products)).all()]
            products_display = ', '.join(product_names) if product_names else 'N/A'
        else:
            products_display = 'N/A'

        if vendor.products_subcategories:
            subcategories_display = ', '.join(vendor.products_subcategories)
            subcategories_html = f"<h5 class='margin-4-0'>Product Subcategories: {subcategories_display}</h5>"
        else:
            subcategories_html = ""

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Vendor at {market.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>One of your favorite markets, <strong><a class="link-underline" href={full_link_market}>{market.name}</a></strong>, has a new vendor: <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong>. Check it out!</p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3 class="margin-4-0">{vendor.name}</h3>
                                <h5 class="margin-4-0">{vendor.city}, {vendor.state}</h5>
                                <h5 class="margin-4-0">Products: {products_display}</h5>
                                {subcategories_html}
                                <p class="margin-12-0">{vendor.bio}</p>
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'User notification email sent successfully.'}

    except Exception as e:
        print(f"Error during user fav market new vendor email sending: {str(e)}")
        return {'error': f'Failed to send user email: {str(e)}'}

def send_email_user_fav_market_new_basket(email, user, market, vendor, link_market, link_vendor):
    try:
        payload = {
            'type': 'SettingsUser',
            'field': 'email_fav_market_new_basket',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_market = f'https://www.gingham.nyc/{link_market}'
        full_link_vendor = f'https://www.gingham.nyc/{link_vendor}'

        # Move this to events.py so there isn't a circular import, or will that create a longer circular import?
        if vendor.products:
            product_names = [product.product for product in Product.query.filter(Product.id.in_(vendor.products)).all()]
            products_display = ', '.join(product_names) if product_names else 'N/A'
        else:
            products_display = 'N/A'

        if vendor.products_subcategories:
            subcategories_display = ', '.join(vendor.products_subcategories)
            subcategories_html = f"<h5 class='margin-4-0'>Product Subcategories: {subcategories_display}</h5>"
        else:
            subcategories_html = ""
        
        if market.bio:
            market_bio_html = f"<p class='margin-12-0'>{market.bio}</p>"
        else:
            market_bio_html = ""

        if vendor.bio:
            vendor_bio_html = f"<p class='margin-4-0'>{vendor.bio}</p>"
        else:
            vendor_bio_html = ""

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Basket Available at {market.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>One of your favorite markets, <strong><a class="link-underline" href={full_link_market}>{market.name}</a></strong>, has a new basket available at <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong>. Check it out before it's gone!</p>
                        <div class="content flex-center">
                            <div class="box-callout margin-r-16">
                                <h3 class="margin-4-0">{vendor.name}</h3>
                                <h5 class="margin-4-0">{vendor.city}, {vendor.state}</h5>
                                <h5 class="margin-4-0">Products: {products_display}</h5>
                                {subcategories_html}
                                {vendor_bio_html}
                            </div>
                            <div class="box-callout">
                                <h3 class="margin-4-0">{market.name}</h3>
                                <h5 class="margin-4-0">{market.location}</h5>
                                <h5 class="margin-4-0">{market.city}, {market.state}</h5>
                                <h5 class="margin-4-0">{market.schedule}</h5>
                                {market_bio_html}
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'User notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during user fav market new basket email sending: {str(e)}")
        return {'error': f'Failed to send user email: {str(e)}'}

def send_email_user_fav_vendor_new_event(email, user, vendor, event, link_vendor):
    try:
        payload = {
            'type': 'SettingsUser',
            'field': 'email_fav_vendor_new_event',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_vendor = f'https://www.gingham.nyc/{link_vendor}'

        start_date_formatted = format_event_date(event.start_date)
        end_date_formatted = format_event_date(event.end_date)
        if event.start_date != event.end_date:
            date_display = f"{start_date_formatted} — {end_date_formatted}"
        else:
            date_display = start_date_formatted

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Event by {vendor.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>One of your favorite vendors, <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong>, has a new event, check it out!</p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3 class="margin-4-0">{event.title}</h3>
                                <h5 class="margin-4-0">{date_display}</h5>
                                <p class="margin-12-0">{event.message}</p>
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'User notification email sent successfully.'}

    except Exception as e:
        print(f"Error during user fav vendor new event email sending: {str(e)}")
        return {'error': f'Failed to send user email: {str(e)}'}

def send_email_user_fav_vendor_schedule_change(email, user, vendor, event, link_vendor):
    try:
        payload = {
            'type': 'SettingsUser',
            'field': 'email_fav_vendor_schedule_change',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_vendor = f'https://www.gingham.nyc/{link_vendor}'

        start_date_formatted = format_event_date(event.start_date)
        end_date_formatted = format_event_date(event.end_date)
        if event.start_date != event.end_date:
            date_display = f"{start_date_formatted} — {end_date_formatted}"
        else:
            date_display = start_date_formatted

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'Schedule Change for {vendor.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>One of your favorite vendors, <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong>, has temporarily changed their schedule, check it out: </p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3 class="margin-4-0">{event.title}</h3>
                                <h5 class="margin-4-0">{date_display}</h5>
                                <p class="margin-12-0">{event.message}</p>
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'User notification email sent successfully.'}

    except Exception as e:
        print(f"Error during user fav vendor schedule change email sending: {str(e)}")
        return {'error': f'Failed to send user email: {str(e)}'}

def send_email_user_fav_vendor_new_basket(email, user, market, vendor, link_market, link_vendor):
    try:
        payload = {
            'type': 'SettingsUser',
            'field': 'email_fav_vendor_new_basket',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_market = f'https://www.gingham.nyc/{link_market}'
        full_link_vendor = f'https://www.gingham.nyc/{link_vendor}'

        # Move this to events.py so there isn't a circular import, or will that create a longer circular import?
        if vendor.products:
            product_names = [product.product for product in Product.query.filter(Product.id.in_(vendor.products)).all()]
            products_display = ', '.join(product_names) if product_names else 'N/A'
        else:
            products_display = 'N/A'

        if vendor.products_subcategories:
            subcategories_display = ', '.join(vendor.products_subcategories)
            subcategories_html = f"<h5 class='margin-4-0'>Product Subcategories: {subcategories_display}</h5>"
        else:
            subcategories_html = ""

        if vendor.bio:
            vendor_bio_html = f"<p class='margin-12-0'>{vendor.bio}</p>"
        else:
            vendor_bio_html = ""
        
        if market.bio:
            market_bio_html = f"<p class='margin-12-0'>{market.bio}</p>"
        else:
            market_bio_html = ""

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Basket Available from {vendor.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>One of your favorite vendors, <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong>, has a new basket available at <strong><a class="link-underline" href={full_link_market}>{market.name}</a></strong>. Check it out before it's gone!</p>
                        <div class="content flex-center">
                            <div class="box-callout margin-r-16">
                                <h3 class="margin-4-0">{vendor.name}</h3>
                                <h5 class="margin-4-0">{vendor.city}, {vendor.state}</h5>
                                <h5 class="margin-4-0">Products: {products_display}</h5>
                                {subcategories_html}
                                {vendor_bio_html}
                            </div>
                            <div class="box-callout">
                                <h3 class="margin-4-0">{market.name}</h3>
                                <h5 class="margin-4-0">{market.location}</h5>
                                <h5 class="margin-4-0">{market.city}, {market.state}</h5>
                                <h5 class="margin-4-0">{market.schedule}</h5>
                                {market_bio_html}
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'User notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during user fav vendor new basket email sending: {str(e)}")
        return {'error': f'Failed to send user email: {str(e)}'}

def send_email_user_basket_pickup_time(email, user, market, vendor, basket, link_market, link_vendor):
    try:
        payload = {
            'type': 'SettingsUser',
            'field': 'email_basket_pickup_time',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_market = f'https://www.gingham.nyc/{link_market}'
        full_link_vendor = f'https://www.gingham.nyc/{link_vendor}'

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'Almost Time to Pickup Your Basket'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>It's almost time to pickup your basket! <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong> set the pickup time from {time_converter(basket.pickup_start)} to {time_converter(basket.pickup_end)} at <strong><a class="link-underline" href={full_link_market}>{market.name}</a></strong>. If it is a large farmers' market, be sure to allot time to find the vendor.</p>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'User notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during user basket pickup time email sending: {str(e)}")
        return {'error': f'Failed to send user email: {str(e)}'}

def send_email_user_vendor_review_response(email, user, vendor, review, link_review):
    try:
        payload = {
            'type': 'SettingsUser',
            'field': 'email_vendor_review_response',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_review = f'https://www.gingham.nyc/{link_review}'

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'Response to on of your Reviews'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>A vendor responded to your review! Check out what <strong><a class="link-underline" href={full_link_review}>{vendor.name}</a></strong> said.</p>
                        <div class="content flex-center">
                            <div class='box-callout'>
                                <p>{review.review_text}</p>
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'User notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during user vendor review response email sending: {str(e)}")
        return {'error': f'Failed to send user email: {str(e)}'}

def send_email_user_new_blog(email, user, blog):
    try:
        payload = {
            'type': 'SettingsUser',
            'field': 'email_new_blog',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New GINGHAM Blog Post!'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>A new blog post is out, check out <strong><a class="link-underline" href='https://www.gingham.nyc/'>{blog.title}</a></strong>!</p>
                        <div class="content flex-center">
                            <div class='box-callout'>
                                {blog.body}
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'User notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during user new blog email sending: {str(e)}")
        return {'error': f'Failed to send user email: {str(e)}'}

def send_email_user_new_market_in_city(email, user, market, link_market):
    try:
        payload = {
            'type': 'SettingsUser',
            'field': 'email_new_market_in_city',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_market = f'https://www.gingham.nyc/{link_market}'

        if market.bio:
            market_bio_html = f"<p class='margin-12-0'>{market.bio}</p>"
        else:
            market_bio_html = ""

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Market in {market.city}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>There is a new farmers' market in your city, {market.city}, <strong><a class="link-underline" href={full_link_market}>{market.name}</a></strong>. Check it out!</p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3 class="margin-4-0">{market.name}</h3>
                                <h5 class="margin-4-0">{market.location}</h5>
                                <h5 class="margin-4-0">{market.city}, {market.state}</h5>
                                <h5 class="margin-4-0">{market.schedule}</h5>
                                {market_bio_html}
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'User notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during user new market in city email sending: {str(e)}")
        return {'error': f'Failed to send user email: {str(e)}'}

#  VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS
#  VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS
#  VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS
#  VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS
#  VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS

def send_email_vendor_market_new_event(email, user, market, event, link):
    try:
        payload = {
            'type': 'SettingsVendor',
            'field': 'email_market_new_event',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link = f'https://www.gingham.nyc/{link}'

        start_date_formatted = format_event_date(event.start_date)
        end_date_formatted = format_event_date(event.end_date)
        if event.start_date != event.end_date:
            date_display = f"{start_date_formatted} — {end_date_formatted}"
        else:
            date_display = start_date_formatted

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Event at {market.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>One of your the markets you are in, <strong><a class="link-underline" href={full_link}>{market.name}</a></strong>, has a new event, check it out: </p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3 class="margin-4-0">{event.title}</h3>
                                <h5 class="margin-4-0">{date_display}</h5>
                                <p class="margin-12-0">{event.message}</p>
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor notification email sent successfully.'}

    except Exception as e:
        print(f"Error during vendor new market event email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_email_vendor_market_schedule_change(email, user, market, event, link):
    try:
        payload = {
            'type': 'SettingsVendor',
            'field': 'email_market_schedule_change',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link = f'https://www.gingham.nyc/{link}'

        start_date_formatted = format_event_date(event.start_date)
        end_date_formatted = format_event_date(event.end_date)
        if event.start_date != event.end_date:
            date_display = f"{start_date_formatted} — {end_date_formatted}"
        else:
            date_display = start_date_formatted

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'Schedule Change at {market.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>One of the markets you are in, <strong><a class="link-underline" href={full_link}>{market.name}</a></strong>, has temporarily changed their schedule, check it out: </p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3 class="margin-4-0">{event.title}</h3>
                                <h5 class="margin-4-0">{date_display}</h5>
                                <p class="margin-12-0">{event.message}</p>
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor notification email sent successfully.'}

    except Exception as e:
        print(f"Error during vendor schedule change email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_email_vendor_basket_sold(email, user, market, vendor, basket_count, pickup_start, pickup_end, sale_date):
    try:
        payload = {
            'type': 'SettingsVendor',
            'field': 'email_basket_sold',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        if basket_count > 1:
            basket_text = "baskets"
        else:
            basket_text = "basket"

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'Basket sold'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>{vendor.name} has sold {basket_count} {basket_text} at {market.name} on {format_event_date(sale_date)}. You set the pickup time from {time_converter(pickup_start)} to {time_converter(pickup_end)}.</p>
                        <div class="flex-center">
                            <p><strong><a class="button" href='https://www.gingham.nyc/vendor/scan'>Scan basket QR codes here!</a></strong></p>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during vendor basket sold email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_email_vendor_new_review(email, user, vendor, review, link_review):
    try:
        payload = {
            'type': 'SettingsVendor',
            'field': 'email_new_review',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_review = f'https://www.gingham.nyc/{link_review}'

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Review on GINGHAM!'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>A user posted a new <strong><a class="link-underline" href={full_link_review}>review</a></strong> about {vendor.name}!</p>
                        <div class="content flex-center">
                            <div class='box-callout'>
                                <p>{review.review_text}</p>
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during vendor new review email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_email_vendor_new_blog(email, user, blog):
    try:
        payload = {
            'type': 'SettingsVendor',
            'field': 'email_new_blog',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New GINGHAM Vendor Blog Post!'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>A new blog post is out, check out <strong><a class="link-underline" href='https://www.gingham.nyc/vendor#blog'>{blog.title}</a></strong>!</p>
                        <div class="content flex-center">
                            <div class='box-callout'>
                                {blog.body}
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during vendor new blog email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_email_vendor_new_statement(vendor_user, receipt):
    """Send email to vendor user about new monthly statement."""
    try:
        subject = "New Monthly Statement Available"
        body = f"""
        Hello {vendor_user.first_name},

        Your monthly statement for {receipt.sale_date.strftime('%B %Y')} is now available.
        You can view it by clicking the link below:

        /vendor/sales#statements

        Best regards,
        The Gingham Team
        """
        send_email(vendor_user.email, subject, body)
        return True
    except Exception as e:
        print(f"Error sending vendor new statement email: {e}")
        return False

#  ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS
#  ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS
#  ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS
#  ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS
#  ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS

def send_email_admin_reported_review(email, user, market, vendor, review, link_review):
    try:
        payload = {
            'type': 'SettingsAdmin',
            'field': 'email_reported_review',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_review = f'https://www.gingham.nyc/{link_review}'

        if market:
            review_about = f"{market.name}"
        if vendor:
            review_about = f"{vendor.name}"

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Reported Review on GINGHAM :('

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>A user reported a <strong><a class="link-underline" href={full_link_review}>review</a></strong> about {review_about}!</p>
                        <div class="content flex-center">
                            <div class='box-callout'>
                                <p>{review.review_text}</p>
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Admin notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during admin reported review email sending: {str(e)}")
        return {'error': f'Failed to send admin email: {str(e)}'}

def send_email_admin_product_request(email, user, vendor, new_product, link_product):
    try:
        payload = {
            'type': 'SettingsAdmin',
            'field': 'email_product_request',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_product = f'https://www.gingham.nyc/{link_product}'

        if vendor.products:
            product_names = [product.product for product in Product.query.filter(Product.id.in_(vendor.products)).all()]
            products_display = ', '.join(product_names) if product_names else 'N/A'
        else:
            products_display = 'N/A'

        if vendor.products_subcategories:
            subcategories_display = ', '.join(vendor.products_subcategories)
            subcategories_html = f"<h5 class='margin-4-0'>Product Subcategories: {subcategories_display}</h5>"
        else:
            subcategories_html = ""

        if vendor.bio:
            vendor_bio_html = f"<p class='margin-12-0'>{vendor.bio}</p>"
        else:
            vendor_bio_html = ""

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Product Request on GINGHAM'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>A vendor, {vendor.name}, requested a new product <strong><a class="link-underline" href={full_link_product}>{new_product}</a></strong>!</p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3 class="margin-4-0">{vendor.name}</h3>
                                <h5 class="margin-4-0">{vendor.city}, {vendor.state}</h5>
                                <h5 class="margin-4-0">Products: {products_display}</h5>
                                {subcategories_html}
                                {vendor_bio_html}
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Admin notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during admin product request email sending: {str(e)}")
        return {'error': f'Failed to send admin email: {str(e)}'}

def send_email_admin_new_blog(email, user, blog):
    try:
        payload = {
            'type': 'SettingsAdmin',
            'field': 'email_new_blog',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New GINGHAM Admin Blog Post!'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>A new blog post is out, check out <strong><a class="link-underline" href='https://www.gingham.nyc/admin/profile/{user.id}'>{blog.title}</a></strong>!</p>
                        <div class="content flex-center">
                            <div class='box-callout'>
                                {blog.body}
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Admin notification email sent successfully.'}

    except Exception as e:
        print(f"Error during admin new blog email sending: {str(e)}")
        return {'error': f'Failed to send admin email: {str(e)}'}

def send_email_admin_new_vendor(email, user, vendor, link_vendor):
    try:
        payload = {
            'type': 'SettingsAdmin',
            'field': 'email_new_vendor',
            'id': user.id
        }

        token = serializer.dumps(payload, salt='unsubscribe')
        unsubscribe_url = f"https://www.gingham.nyc/unsubscribe?token={token}"

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_vendor = f'https://www.gingham.nyc/{link_vendor}'

        if vendor.products:
            product_names = [product.product for product in Product.query.filter(Product.id.in_(vendor.products)).all()]
            products_display = ', '.join(product_names) if product_names else 'N/A'
        else:
            products_display = 'N/A'

        if vendor.products_subcategories:
            subcategories_display = ', '.join(vendor.products_subcategories)
            subcategories_html = f"<h5 class='margin-4-0'>Product Subcategories: {subcategories_display}</h5>"
        else:
            subcategories_html = ""

        if vendor.bio:
            vendor_bio_html = f"<p class='margin-12-0'>{vendor.bio}</p>"
        else:
            vendor_bio_html = ""

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Product Request on GINGHAM'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.first_name},</p>
                        <p>A new vendor joined gingham, check <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong> out!</p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3 class="margin-4-0">{vendor.name}</h3>
                                <h5 class="margin-4-0">{vendor.city}, {vendor.state}</h5>
                                <h5 class="margin-4-0">Products: {products_display}</h5>
                                {subcategories_html}
                                {vendor_bio_html}
                            </div>
                        </div>
                        <p>—The gingham team</p>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                        <a class="link-underline" href={unsubscribe_url}>
                            Unsubscribe
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Admin notification email sent successfully.'}
    
    except Exception as e:
        print(f"Error during admin product request email sending: {str(e)}")
        return {'error': f'Failed to send admin email: {str(e)}'}

def send_vendor_team_invite_email(email, vendor_name, token):
    """
    Sends a team invitation email to the given email address.
    """
    try:
        VITE_SITE_URL = os.getenv('VITE_SITE_URL')
        invitation_link = f"{VITE_SITE_URL}/vendor/join-team/{token}"
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'Invitation to join {vendor_name} on GINGHAM'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Team Invitation</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo_04-2A.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>{vendor_name}</strong> has invited you to join their team on gingham!</p>
                        <p>Click the button below to accept the invitation and set up your account:</p>
                        <a class="button" href={invitation_link}>Join Team</a>
                    </div>
                    <div class="footer">
                        <div class-"footer-flex">
                            <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo_04-2B.png" alt="logo"/>
                            <p>&copy; {get_current_year()} GINGHAM.NYC. All Rights Reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        return {'message': 'Team invitation email sent successfully.'}

    except Exception as e:
        print(f"Error during team invitation email sending: {str(e)}")
        return {'error': f'Failed to send team invitation email: {str(e)}'}

def send_email_weekly_admin_update(email, body_tag):
    try:
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        smtp = os.getenv('EMAIL_SMTP')
        port = os.getenv('EMAIL_PORT')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        msg = MIMEMultipart()
        msg['From'] = f'gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = "Weekly Platform Summary"

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {EMAIL_STYLES}
            </head>
                {body_tag}
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(smtp, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Weekly email update sent successfully.'}

    except Exception as e:
        print(f"Error during weekly update email sending: {str(e)}")
        return {'error': f'Failed to send weekly update email: {str(e)}'}

def send_email(to_email, subject, body):
    """
    Send an email to the specified recipient.

    Args:
        to_email (str): The recipient's email address.
        subject (str): The email subject.
        body (str): The email body.

    Returns:
        bool: True if the email was sent successfully, False otherwise.
    """
    try:
        # Mock implementation for testing
        print(f"Email would be sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False