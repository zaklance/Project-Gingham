import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import url_for
from itsdangerous import URLSafeTimedSerializer
from datetime import datetime
from models import Product

serializer = URLSafeTimedSerializer(os.getenv('SECRET_KEY'))

def format_event_date(date_string):
    try:
        date = datetime.strptime(date_string, "%Y-%m-%d")
        return date.strftime("%b %d, %Y")
    except ValueError:
        return "Invalid Date"

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
        p, h1, h2, h3, h4, h5, h6 {
            color: #ff806b;
        }
        .img-hero {
            width: 100%;
            height: auto;
        }
        .center {
            text-align: center;
        }
        .flex-center {
            display: flex;
            justify-content: center;
        }
        .flex-gap-8 {
            gap: 8px;
        }
        .flex-gap-16 {
            gap: 16px;
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

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = f"Gingham Contact Form Submission: {subject}"

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Gingham Contact Form Submission</title>
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
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
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
#  PASSWORD EMAILS PASSWORD EMAILS PASSWORD EMAILS PASSWORD EMAILS
#  PASSWORD EMAILS PASSWORD EMAILS PASSWORD EMAILS PASSWORD EMAILS
#  PASSWORD EMAILS PASSWORD EMAILS PASSWORD EMAILS PASSWORD EMAILS

def send_user_password_reset_email(email):
    """
    Sends a password reset email to the given user email.
    """

    # Generate token for password reset
    token = serializer.dumps(email, salt='password-reset-salt')
    reset_link = url_for('password_reset', token=token, _external=True)

    try:
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = email

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = 'Gingham Password Reset'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Gingham Password Reset</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please click the link to reset your password <br/></strong> <a class="button" href={reset_link}>Password Reset</a></p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # Send email
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()

        return {'message': 'Password reset link sent'}

    except Exception as e:
        return {'error': f'Failed to send email: {str(e)}'}


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

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = 'Gingham Password Reset'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Gingham Password Reset</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please click the link to reset your password <br/></strong> <a class="button" href={reset_link}>Password Reset</a></p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # Send email
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
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

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = recipient_email
        msg['Subject'] = 'Gingham Password Reset'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Gingham Password Reset</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please click the link to reset your password <br/></strong> <a class="button" href={reset_link}>Password Reset</a></p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # Send email
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()

        return {'message': 'Password reset link sent'}

    except Exception as e:
        return {'error': f'Failed to send email: {str(e)}'}

#  CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS
#  CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS
#  CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS
#  CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS
#  CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS CONFIRMATION EMAILS
    
def send_user_confirmation_email(email, user_data):
    try:
        token = serializer.dumps(user_data, salt='user-confirmation-salt')  # Generate the token
        confirmation_link = url_for('confirm_email', token=token, _external=True)
        # print(f"Generated confirmation link: {confirmation_link}")

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = 'Gingham Email Confirmation'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Gingham Email Confirmation</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please confirm your email by clicking this link: <br/></strong> <a class="button" href={confirmation_link}>Verify Email</a></p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send email...")
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
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
        confirmation_link = url_for('confirm_vendor_email', token=token, _external=True)
        # print(f"Generated vendor confirmation link: {confirmation_link}")

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = 'Gingham Vendor Email Confirmation'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Gingham Vendor Email Confirmation</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please confirm your email by clicking this link: <br/></strong> <a class="button" href={confirmation_link}>Verify Email</a></p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
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
        confirmation_link = url_for('confirm_admin_email', token=token, _external=True)
        # print(f"Generated admin confirmation link: {confirmation_link}")

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = 'Gingham Admin Email Confirmation'

        body = body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Gingham Admin Email Confirmation</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please confirm your email by clicking this link: <br/></strong> <a class="button" href={confirmation_link}>Verify Email</a></p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send admin email...")
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
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

def send_email_fav_market_new_event(email, user, market, event, link):
    try:

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')

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
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Event at {market.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>New Event at Favorite Market</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.name},</p>
                        <p>One of your favorite markets, <strong><a class="link-underline" href={full_link}>{market.name}</a></strong>, has a new event, check it out: </p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3>{event.title}</h3>
                                <h5>{date_display}</h5>
                                <p>{event.message}</p>
                            </div>
                        </div>
                        <p>— The Gingham Team</p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor confirmation email sent successfully.'}

    except Exception as e:
        print(f"Error during vendor email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_email_fav_market_schedule_change(email, user, market, event, link):
    try:

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')

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
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'Schedule Change at {market.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Schedule Change at Favorite Market</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.name},</p>
                        <p>One of your favorite markets, <strong><a class="link-underline" href={full_link}>{market.name}</a></strong>, has temporarily changed their schedule, check it out: </p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3>{event.title}</h3>
                                <h5>{date_display}</h5>
                                <p>{event.message}</p>
                            </div>
                        </div>
                        <p>— The Gingham Team</p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor confirmation email sent successfully.'}

    except Exception as e:
        print(f"Error during vendor email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_email_fav_market_new_vendor(email, user, market, vendor, link_market, link_vendor):
    try:

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_market = f'https://www.gingham.nyc/{link_market}'
        full_link_vendor = f'https://www.gingham.nyc/{link_vendor}'

        # Move this to events.py so there isn't a circular import, or will that create a longer circular import?
        if vendor.products:
            product_names = [product.name for product in Product.query.filter(Product.id.in_(vendor.products)).all()]
            products_display = ', '.join(product_names) if product_names else 'N/A'
        else:
            products_display = 'N/A'

        if vendor.products_subcategories:
            subcategories_display = ', '.join(vendor.products_subcategories)
            subcategories_html = f"<h5>Product Subcategories: {subcategories_display}</h5>"
        else:
            subcategories_html = ""

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Vendor at {market.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>New Vendor at Favorite Market</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.name},</p>
                        <p>One of your favorite markets, <strong><a class="link-underline" href={full_link_market}>{market.name}</a></strong>, has a new vendor: <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong>. Check it out!</p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3>{vendor.name}</h3>
                                <h5>{vendor.city}, {vendor.state}</h5>
                                <h5>Products: {products_display}</h5>
                                {subcategories_html}
                                <p>{vendor.bio}</p>
                            </div>
                        </div>
                        <p>— The Gingham Team</p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor confirmation email sent successfully.'}

    except Exception as e:
        print(f"Error during vendor email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_email_fav_market_new_basket(email, user, market, vendor, link_market, link_vendor):
    try:

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_market = f'https://www.gingham.nyc/{link_market}'
        full_link_vendor = f'https://www.gingham.nyc/{link_vendor}'

        # Move this to events.py so there isn't a circular import, or will that create a longer circular import?
        if vendor.products:
            product_names = [product.name for product in Product.query.filter(Product.id.in_(vendor.products)).all()]
            products_display = ', '.join(product_names) if product_names else 'N/A'
        else:
            products_display = 'N/A'

        if vendor.products_subcategories:
            subcategories_display = ', '.join(vendor.products_subcategories)
            subcategories_html = f"<h5>Product Subcategories: {subcategories_display}</h5>"
        else:
            subcategories_html = ""
        
        if market.bio:
            market_bio_html = f"<p>{market.bio}</p>"
        else:
            market_bio_html = ""

        if vendor.bio:
            vendor_bio_html = f"<p>{vendor.bio}</p>"
        else:
            vendor_bio_html = ""

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Basket Available at {market.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>New Basket at Favorite Market</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.name},</p>
                        <p>One of your favorite markets, <strong><a class="link-underline" href={full_link_market}>{market.name}</a></strong>, has a new basket available at <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong>. Check it out before it's gone!</p>
                        <div class="content flex-center flex-gap-16">
                            <div class="box-callout">
                                <h3>{vendor.name}</h3>
                                <h5>{vendor.city}, {vendor.state}</h5>
                                <h5>Products: {products_display}</h5>
                                {subcategories_html}
                                {vendor_bio_html}
                            </div>
                            <div class="box-callout">
                                <h3>{market.name}</h3>
                                <h5>{market.location}</h5>
                                <h5>{market.city}, {vendor.state}</h5>
                                <h5>{market.schedule}</h5>
                                {market_bio_html}
                            </div>
                        </div>
                        <p>— The Gingham Team</p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor confirmation email sent successfully.'}
    
    except Exception as e:
        print(f"Error during vendor email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_email_fav_vendor_new_event(email, user, vendor, event, link_vendor):
    try:

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')

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
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Event by {vendor.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>New Event at Favorite Vendor</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.name},</p>
                        <p>One of your favorite vendors, <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong>, has a new event, check it out!</p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3>{event.title}</h3>
                                <h5>{date_display}</h5>
                                <p>{event.message}</p>
                            </div>
                        </div>
                        <p>— The Gingham Team</p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor confirmation email sent successfully.'}

    except Exception as e:
        print(f"Error during vendor email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_email_fav_vendor_schedule_change(email, user, vendor, event, link_vendor):
    try:

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')

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
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'Schedule Change for {vendor.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Schedule Change for Favorite Vendor</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.name},</p>
                        <p>One of your favorite markets, <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong>, has temporarily changed their schedule, check it out: </p>
                        <div class="content flex-center">
                            <div class="box-callout">
                                <h3>{event.title}</h3>
                                <h5>{date_display}</h5>
                                <p>{event.message}</p>
                            </div>
                        </div>
                        <p>— The Gingham Team</p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor confirmation email sent successfully.'}

    except Exception as e:
        print(f"Error during vendor email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

def send_email_fav_vendor_new_basket(email, user, market, vendor, link_market, link_vendor):
    try:

        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')

        if not sender_email or not password:
            print("Email credentials are missing")
            raise ValueError("Email credentials are missing in the environment variables.")
        
        full_link_market = f'https://www.gingham.nyc/{link_market}'
        full_link_vendor = f'https://www.gingham.nyc/{link_vendor}'

        # Move this to events.py so there isn't a circular import, or will that create a longer circular import?
        if vendor.products:
            product_names = [product.name for product in Product.query.filter(Product.id.in_(vendor.products)).all()]
            products_display = ', '.join(product_names) if product_names else 'N/A'
        else:
            products_display = 'N/A'

        if vendor.products_subcategories:
            subcategories_display = ', '.join(vendor.products_subcategories)
            subcategories_html = f"<h5>Product Subcategories: {subcategories_display}</h5>"
        else:
            subcategories_html = ""
        
        if market.bio:
            market_bio_html = f"<p>{market.bio}</p>"
        else:
            market_bio_html = ""

        if vendor.bio:
            vendor_bio_html = f"<p>{vendor.bio}</p>"
        else:
            vendor_bio_html = ""

        msg = MIMEMultipart()
        msg['From'] = f'Gingham NYC <{sender_email}>'
        msg['To'] = email
        msg['Subject'] = f'New Basket Available from {vendor.name}'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>New Basket from a Favorite Vendor</title>
                {EMAIL_STYLES}
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div>
                        <p>Hi {user.name},</p>
                        <p>One of your favorite vendors, <strong><a class="link-underline" href={full_link_vendor}>{vendor.name}</a></strong>, has a new basket available at <strong><a class="link-underline" href={full_link_market}>{market.name}</a></strong>. Check it out before it's gone!</p>
                        <div class="content flex-center flex-gap-16">
                            <div class="box-callout">
                                <h3>{vendor.name}</h3>
                                <h5>{vendor.city}, {vendor.state}</h5>
                                <h5>Products: {products_display}</h5>
                                {subcategories_html}
                                {vendor_bio_html}
                            </div>
                            <div class="box-callout">
                                <h3>{market.name}</h3>
                                <h5>{market.location}</h5>
                                <h5>{market.city}, {vendor.state}</h5>
                                <h5>{market.schedule}</h5>
                                {market_bio_html}
                            </div>
                        </div>
                        <p>— The Gingham Team</p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2025 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        msg.attach(MIMEText(body, 'html'))

        # print("Attempting to send vendor email...")
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()

        # print("Vendor email sent successfully")
        return {'message': 'Vendor confirmation email sent successfully.'}
    
    except Exception as e:
        print(f"Error during vendor email sending: {str(e)}")
        return {'error': f'Failed to send vendor email: {str(e)}'}

#  VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS
#  VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS
#  VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS
#  VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS
#  VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS VENDOR EMAILS



#  ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS
#  ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS
#  ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS
#  ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS
#  ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS ADMIN EMAILS

