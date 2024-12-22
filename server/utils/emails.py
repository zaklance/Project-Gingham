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
        msg['Subject'] = f"GINGHAM.NYC Contact Form Submission: {subject}"

        body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Contact Form Submission</title>
                <style>
                    .email-container {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f9f9f9;
                        padding: 20px;
                        border: 1px solid #ddd;
                    }}
                    .header {{
                        background-color: #ff7b8a;
                        color: white;
                        text-align: center;
                        padding: 10px 0;
                    }}
                    .content {{
                        padding: 20px;
                    }}
                    .footer {{
                        font-size: 12px;
                        text-align: center;
                        margin-top: 20px;
                        color: #777;
                    }}
                    .button {{
                        display: inline-block;
                        background-color: #ff7b8a;
                        color: white;
                        text-decoration: none;
                        padding: 8px 12px;
                        border-radius: 5px;
                        margin-top: 10px;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h2>New Contact Form Submission</h2>
                    </div>
                    <div class="content">
                        <p><strong>Name:</strong> {name}</p>
                        <p><strong>Email:</strong> {email}</p>
                        <p><strong>Subject:</strong> {subject}</p>
                        <p><strong>Message:</strong></p>
                        <p>{message}</p>
                        <a href="mailto:{email}" class="button">Reply to {name}</a>
                    </div>
                    <div class="footer">
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


def send_password_reset_email(email):
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
        msg['Subject'] = 'Password Reset Request'

        body = f"Please click the link to reset your password: {reset_link}"
        msg.attach(MIMEText(body, 'plain'))

        # Send email
        server = smtplib.SMTP('smtp.oxcs.bluehost.com', 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()

        return {'message': 'Password reset link sent'}

    except Exception as e:
        return {'error': f'Failed to send email: {str(e)}'}