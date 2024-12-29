import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import url_for
from itsdangerous import URLSafeTimedSerializer

serializer = URLSafeTimedSerializer(os.getenv('SECRET_KEY'))

# Email Form
def send_contact_email(name, email, subject, message): 
    try: 
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = "admin@gingham.nyc"

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = f"Gingham.nyc Contact Form Submission: {subject}"

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Contact Form Submission</title>
                <style>
                    .email-container {{
                        font-family: helvetica, sans-serif;
                        line-height: 1.6;
                        color: #3b4752;
                        background-color: #fbf7eb;
                        padding: 20px;
                        border-radius: 24px;
                    }}
                    .header {{
                        color: white;
                        text-align: center;
                        border-radius: 16px;
                    }}
                    .content {{
                        padding: 20px;
                        color: #3b4752;
                    }}
                    .footer {{
                        font-size: 12px;
                        text-align: center;
                        margin-top: 20px;
                        margin-bottom: -10px;
                        color: #777;
                    }}
                    .button {{
                        display: inline-block;
                        background-color: #ff806b;
                        color: #ffffff !important;
                        text-decoration: none;
                        padding: 8px 12px;
                        border-radius: 5px;
                        margin-top: 10px;
                    }}
                    .img-logo {{
                        height: 120px;
                        width: 120px;
                    }}
                    .img-logo-small {{
                        height: 32px;
                        width: 32px;
                    }}
                    .divider {{
                        border: 0;
                        border-top: 4px solid #ff806b;
                    }}
                    p, h1, h2, h3, h4, h5, h6 {{
                        color: #ff806b;
                    }}
                    .img-hero {{
                        width: 100%;
                        height: auto;
                    }}
                    .center {{
                        text-align: center;
                    }}
                </style>
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
                        <p>&copy; 2024 GINGHAM.NYC. All Rights Reserved.</p>
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


def send_user_password_reset_email(email):
    """
    Sends a password reset email to the given user email.
    """
    from app import User  # Import User model here to avoid circular import
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return {'error': 'User not found'}, 404

    # Generate token for password reset
    token = serializer.dumps(email, salt='password-reset-salt')
    reset_link = url_for('password_reset', token=token, _external=True)

    try:
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = email

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = 'Gingham Password Reset'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Contact Form Submission</title>
                <style>
                    .email-container {{
                        font-family: helvetica, sans-serif;
                        line-height: 1.6;
                        color: #3b4752;
                        background-color: #fbf7eb;
                        padding: 20px;
                        border-radius: 24px;
                    }}
                    .header {{
                        color: white;
                        text-align: center;
                        border-radius: 16px;
                    }}
                    .content {{
                        padding: 20px;
                        color: #3b4752;
                    }}
                    .footer {{
                        font-size: 12px;
                        text-align: center;
                        margin-top: 20px;
                        margin-bottom: -10px;
                        color: #777;
                    }}
                    .button {{
                        display: inline-block;
                        background-color: #ff806b;
                        color: #ffffff !important;
                        text-decoration: none;
                        padding: 8px 12px;
                        border-radius: 5px;
                        margin-top: 10px;
                    }}
                    .img-logo {{
                        height: 120px;
                        width: 120px;
                    }}
                    .img-logo-small {{
                        height: 32px;
                        width: 32px;
                    }}
                    .divider {{
                        border: 0;
                        border-top: 4px solid #ff806b;
                    }}
                    p, h1, h2, h3, h4, h5, h6 {{
                        color: #ff806b;
                    }}
                    .img-hero {{
                        width: 100%;
                        height: auto;
                    }}
                    .center {{
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please click the link to reset your password <br/></strong> <a class="button" href={reset_link}>Password Reset<a/></p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2024 GINGHAM.NYC. All Rights Reserved.</p>
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
    from app import VendorUser  # Import User model here to avoid circular import
    
    vendor_user = VendorUser.query.filter_by(email=email).first()
    if not vendor_user:
        return {'error': 'Vendor not found'}, 404

    # Generate token for password reset
    token = serializer.dumps(email, salt='vendor-password-reset-salt')
    reset_link = url_for('vendor_password_reset', token=token, _external=True)

    try:
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = email

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = 'Gingham Password Reset'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Contact Form Submission</title>
                <style>
                    .email-container {{
                        font-family: helvetica, sans-serif;
                        line-height: 1.6;
                        color: #3b4752;
                        background-color: #fbf7eb;
                        padding: 20px;
                        border-radius: 24px;
                    }}
                    .header {{
                        color: white;
                        text-align: center;
                        border-radius: 16px;
                    }}
                    .content {{
                        padding: 20px;
                        color: #3b4752;
                    }}
                    .footer {{
                        font-size: 12px;
                        text-align: center;
                        margin-top: 20px;
                        margin-bottom: -10px;
                        color: #777;
                    }}
                    .button {{
                        display: inline-block;
                        background-color: #ff806b;
                        color: #ffffff !important;
                        text-decoration: none;
                        padding: 8px 12px;
                        border-radius: 5px;
                        margin-top: 10px;
                    }}
                    .img-logo {{
                        height: 120px;
                        width: 120px;
                    }}
                    .img-logo-small {{
                        height: 32px;
                        width: 32px;
                    }}
                    .divider {{
                        border: 0;
                        border-top: 4px solid #ff806b;
                    }}
                    p, h1, h2, h3, h4, h5, h6 {{
                        color: #ff806b;
                    }}
                    .img-hero {{
                        width: 100%;
                        height: auto;
                    }}
                    .center {{
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please click the link to reset your password <br/></strong> <a class="button" href={reset_link}>Password Reset<a/></p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2024 GINGHAM.NYC. All Rights Reserved.</p>
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
    from app import AdminUser  # Import User model here to avoid circular import
    
    admin_user = AdminUser.query.filter_by(email=email).first()
    if not admin_user:
        return {'error': 'User not found'}, 404

    # Generate token for password reset
    token = serializer.dumps(email, salt='admin-password-reset-salt')
    reset_link = url_for('admin_password_reset', token=token, _external=True)

    try:
        sender_email = os.getenv('EMAIL_USER')
        password = os.getenv('EMAIL_PASS')
        recipient_email = email

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = 'Gingham Password Reset'

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Contact Form Submission</title>
                <style>
                    .email-container {{
                        font-family: helvetica, sans-serif;
                        line-height: 1.6;
                        color: #3b4752;
                        background-color: #fbf7eb;
                        padding: 20px;
                        border-radius: 24px;
                    }}
                    .header {{
                        color: white;
                        text-align: center;
                        border-radius: 16px;
                    }}
                    .content {{
                        padding: 20px;
                        color: #3b4752;
                    }}
                    .footer {{
                        font-size: 12px;
                        text-align: center;
                        margin-top: 20px;
                        margin-bottom: -10px;
                        color: #777;
                    }}
                    .button {{
                        display: inline-block;
                        background-color: #ff806b;
                        color: #ffffff !important;
                        text-decoration: none;
                        padding: 8px 12px;
                        border-radius: 5px;
                        margin-top: 10px;
                    }}
                    .img-logo {{
                        height: 120px;
                        width: 120px;
                    }}
                    .img-logo-small {{
                        height: 32px;
                        width: 32px;
                    }}
                    .divider {{
                        border: 0;
                        border-top: 4px solid #ff806b;
                    }}
                    p, h1, h2, h3, h4, h5, h6 {{
                        color: #ff806b;
                    }}
                    .img-hero {{
                        width: 100%;
                        height: auto;
                    }}
                    .center {{
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content center">
                        <p><strong>Please click the link to reset your password <br/></strong> <a class="button" href={reset_link}>Password Reset<a/></p>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_2.png" alt="logo"/>
                        <p>&copy; 2024 GINGHAM.NYC. All Rights Reserved.</p>
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