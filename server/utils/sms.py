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
            to=to
        )
        return message.sid
    except Exception as e:
        return f"Failed to send SMS: {str(e)}"