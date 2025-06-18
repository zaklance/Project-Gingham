import os
from flask import Flask, request, redirect
from twilio.rest import Client

account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
from_phone_number = os.environ["TWILIO_PHONE_NUMBER"]
client = Client(account_sid, auth_token)

def send_sms(body: str, to: str):
    try:
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to={to}
        )
        return message.sid
    except Exception as e:
        return f"Failed to send SMS: {str(e)}"

def send_sms_user_fav_vendor_schedule_change(phone, user, vendor, event):
    """Send SMS notification to user when their favorite vendor has a schedule change"""
    try:
        # Format phone number for US numbers
        if not phone.startswith('+'):
            phone = f"+1{phone}"
        
        body = f"Hi {user.first_name}! Your favorite vendor, {vendor.name}, has updated their schedule temporarily. Event: {event.title}. Reply STOP to unsubscribe."
        
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to=phone
        )
        return {'message': 'SMS sent successfully!', 'sid': message.sid}
    except Exception as e:
        print(f"Error sending SMS to {phone}: {str(e)}")
        return {'error': f'Failed to send SMS: {str(e)}'}

def send_sms_admin_reported_review(phone, admin, vendor, review):
    """Send SMS notification to admin when a vendor review is reported"""
    try:
        # Format phone number for US numbers
        if not phone.startswith('+'):
            phone = f"+1{phone}"
        
        body = f"Hi {admin.first_name}! A review for vendor '{vendor.name}' has been reported and needs your attention. Check the admin panel. Reply STOP to unsubscribe."
        
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to=phone
        )
        return {'message': 'SMS sent successfully!', 'sid': message.sid}
    except Exception as e:
        print(f"Error sending SMS to {phone}: {str(e)}")
        return {'error': f'Failed to send SMS: {str(e)}'}

def send_sms_admin_reported_market_review(phone, admin, market, review):
    """Send SMS notification to admin when a market review is reported"""
    try:
        # Format phone number for US numbers
        if not phone.startswith('+'):
            phone = f"+1{phone}"
        
        body = f"Hi {admin.first_name}! A review for market '{market.name}' has been reported and needs your attention. Check the admin panel. Reply STOP to unsubscribe."
        
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to=phone
        )
        return {'message': 'SMS sent successfully!', 'sid': message.sid}
    except Exception as e:
        print(f"Error sending SMS to {phone}: {str(e)}")
        return {'error': f'Failed to send SMS: {str(e)}'}

def send_sms_vendor_basket_sold(phone, vendor_user, vendor, basket_count, sale_date):
    """Send SMS notification to vendor user when their basket is sold"""
    try:
        # Format phone number for US numbers
        if not phone.startswith('+'):
            phone = f"+1{phone}"
        
        basket_text = "baskets" if basket_count > 1 else "basket"
        body = f"Hi {vendor_user.first_name}! {vendor.name} sold {basket_count} {basket_text} on {sale_date.strftime('%B %d')}. Check your vendor dashboard for pickup details. Reply STOP to unsubscribe."
        
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to=phone
        )
        return {'message': 'SMS sent successfully!', 'sid': message.sid}
    except Exception as e:
        print(f"Error sending SMS to {phone}: {str(e)}")
        return {'error': f'Failed to send SMS: {str(e)}'}

def send_sms_user_fav_market_new_basket(phone, user, market, vendor):
    """Send SMS notification to user when new baskets are available in their favorite market"""
    try:
        # Format phone number for US numbers
        if not phone.startswith('+'):
            phone = f"+1{phone}"
        
        body = f"Hi {user.first_name}! New baskets available at {market.name} from {vendor.name}. Check them out before they're gone! Reply STOP to unsubscribe."
        
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to=phone
        )
        return {'message': 'SMS sent successfully!', 'sid': message.sid}
    except Exception as e:
        print(f"Error sending SMS to {phone}: {str(e)}")
        return {'error': f'Failed to send SMS: {str(e)}'}

def send_sms_user_basket_pickup_time(phone, user, vendor, pickup_start, pickup_end):
    """Send SMS notification to user when it's time to pick up their basket"""
    try:
        # Format phone number for US numbers
        if not phone.startswith('+'):
            phone = f"+1{phone}"
        
        from utils.emails import time_converter
        pickup_start_str = time_converter(pickup_start)
        pickup_end_str = time_converter(pickup_end)
        
        body = f"Hi {user.first_name}! Time to pick up your basket from {vendor.name}. Pickup window: {pickup_start_str} - {pickup_end_str}. Don't be late! Reply STOP to unsubscribe."
        
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to=phone
        )
        return {'message': 'SMS sent successfully!', 'sid': message.sid}
    except Exception as e:
        print(f"Error sending SMS to {phone}: {str(e)}")
        return {'error': f'Failed to send SMS: {str(e)}'}

def send_sms_vendor_market_schedule_change(phone, vendor_user, market, event):
    """Send SMS notification to vendor user when their market has a schedule change"""
    try:
        # Format phone number for US numbers
        if not phone.startswith('+'):
            phone = f"+1{phone}"
        
        body = f"Hi {vendor_user.first_name}! {market.name} has a schedule change. Event: {event.title}. Check your vendor dashboard for details. Reply STOP to unsubscribe."
        
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to=phone
        )
        return {'message': 'SMS sent successfully!', 'sid': message.sid}
    except Exception as e:
        print(f"Error sending SMS to {phone}: {str(e)}")
        return {'error': f'Failed to send SMS: {str(e)}'}

def send_sms_admin_product_request(phone, admin, vendor, new_product):
    """Send SMS notification to admin when a vendor requests a new product category"""
    try:
        # Format phone number for US numbers
        if not phone.startswith('+'):
            phone = f"+1{phone}"
        
        body = f"Hi {admin.first_name}! {vendor.name} has requested a new product category: {new_product}. Check your admin panel for details. Reply STOP to unsubscribe."
        
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to=phone
        )
        return {'message': 'SMS sent successfully!', 'sid': message.sid}
    except Exception as e:
        print(f"Error sending SMS to {phone}: {str(e)}")
        return {'error': f'Failed to send SMS: {str(e)}'}

def send_sms_vendor_new_statement(phone, vendor_user, vendor, statement_date):
    """Send SMS notification to vendor user when a new statement is available"""
    try:
        # Format phone number for US numbers
        if not phone.startswith('+'):
            phone = f"+1{phone}"
        
        body = f"Hi {vendor_user.first_name}! A new statement for {vendor.name} is available for {statement_date.strftime('%B %Y')}. Check your vendor dashboard. Reply STOP to unsubscribe."
        
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to=phone
        )
        return {'message': 'SMS sent successfully!', 'sid': message.sid}
    except Exception as e:
        print(f"Error sending SMS to {phone}: {str(e)}")
        return {'error': f'Failed to send SMS: {str(e)}'}

def send_sms_user_fav_market_schedule_change(phone, user, market, event):
    """Send SMS notification to user when their favorite market has a schedule change"""
    try:
        # Format phone number for US numbers
        if not phone.startswith('+'):
            phone = f"+1{phone}"
        
        body = f"Hi {user.first_name}! Your favorite market, {market.name}, has updated their schedule temporarily. Event: {event.title}. Reply STOP to unsubscribe."
        
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to=phone
        )
        return {'message': 'SMS sent successfully!', 'sid': message.sid}
    except Exception as e:
        print(f"Error sending SMS to {phone}: {str(e)}")
        return {'error': f'Failed to send SMS: {str(e)}'}

def send_sms_vendor_notify_me(phone, vendor_user, vendor, user):
    """Send SMS notification to vendor user when a user clicks 'notify me for more baskets'"""
    try:
        # Format phone number for US numbers
        if not phone.startswith('+'):
            phone = f"+1{phone}"
        
        body = f"Hi {vendor_user.first_name}! A user ({user.first_name}) is interested in buying more baskets from {vendor.name}. Consider adding more for sale! Check your vendor dashboard. Reply STOP to unsubscribe."
        
        message = client.messages.create(
            body=body,
            from_=from_phone_number,
            to=phone
        )
        return {'message': 'SMS sent successfully!', 'sid': message.sid}
    except Exception as e:
        print(f"Error sending SMS to {phone}: {str(e)}")
        return {'error': f'Failed to send SMS: {str(e)}'}
