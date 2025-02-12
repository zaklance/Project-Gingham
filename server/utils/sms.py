import os
from flask import Flask, request, redirect
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse

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

def incoming_sms():
    # Get the message the user sent our Twilio number
    body = request.values.get('Body', None)

    # Start our TwiML response
    resp = MessagingResponse()

    # Determine the right reply for this message
    if body.lower() == 'stop':
        resp.message("You have been unsubscribed from this notification type ;)")
    else:
        resp.message("I didn't understand that prompt :/")

    return str(resp)
