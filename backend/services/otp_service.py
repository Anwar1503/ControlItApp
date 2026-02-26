import smtplib
import random
import time
import os
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from .credentials_service import get_email_credentials

# OTP storage with expiration (in-memory, or use MongoDB for production)
otp_storage = {}  # Format: {email: {"otp": "123456", "expiry": datetime, "phone": "1234567890", "verified": False}}


def generate_otp():
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))


def send_email_otp(email, otp):
    """Send OTP via email using SMTP"""
    try:
        # Get credentials from database
        EMAIL_ADDRESS, EMAIL_PASSWORD = get_email_credentials()
        
        if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
            print("Error: Email credentials not configured. Set credentials in database.")
            return False
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = email
        msg['Subject'] = "Your OTP for Registration"
        
        body = f"""
        <html>
            <body>
                <h2>Email Verification</h2>
                <p>Your One-Time Password (OTP) is:</p>
                <h1 style="color: #2196F3;">{otp}</h1>
                <p>This OTP will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        server.sendmail(EMAIL_ADDRESS, email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email OTP: {e}")
        return False


def send_sms_otp(phone, otp):
    """Send OTP via SMS using Twilio (requires Twilio account)"""
    # You'll need to set up Twilio
    # For now, returning a placeholder
    try:
        # Uncomment when Twilio is set up
        # from twilio.rest import Client
        # account_sid = 'your_account_sid'
        # auth_token = 'your_auth_token'
        # client = Client(account_sid, auth_token)
        # message = client.messages.create(
        #     body=f'Your OTP is: {otp}. Valid for 10 minutes.',
        #     from_='your_twilio_number',
        #     to=phone
        # )
        # return True
        print(f"SMS OTP would be sent to {phone}: {otp}")
        return True
    except Exception as e:
        print(f"Error sending SMS OTP: {e}")
        return False


def request_otp(email, phone):
    """Request OTP for a new user"""
    if email in otp_storage and otp_storage[email]['expiry'] > datetime.now():
        return {"status": "error", "message": "OTP already sent. Wait before requesting again."}
    
    otp = generate_otp()
    expiry = datetime.now() + timedelta(minutes=10)
    
    otp_storage[email] = {
        "otp": otp,
        "expiry": expiry,
        "phone": phone,
        "verified": False
    }
    
    # Send OTP via email
    email_sent = send_email_otp(email, otp)
    
    # Send OTP via SMS
    sms_sent = send_sms_otp(phone, otp)
    
    if email_sent or sms_sent:
        return {"status": "success", "message": "OTP sent successfully"}
    else:
        return {"status": "error", "message": "Failed to send OTP"}


def verify_otp(email, otp):
    """Verify OTP for a user"""
    if email not in otp_storage:
        return {"status": "error", "message": "OTP not requested for this email"}
    
    stored_data = otp_storage[email]
    
    # Check if OTP is expired
    if stored_data['expiry'] < datetime.now():
        del otp_storage[email]
        return {"status": "error", "message": "OTP has expired"}
    
    # Check if OTP is correct
    if stored_data['otp'] != otp:
        return {"status": "error", "message": "Invalid OTP"}
    
    # Mark as verified
    otp_storage[email]['verified'] = True
    return {"status": "success", "message": "OTP verified successfully"}


def is_otp_verified(email):
    """Check if OTP is verified for this email"""
    return email in otp_storage and otp_storage[email]['verified']


def clear_otp(email):
    """Clear OTP after successful registration"""
    if email in otp_storage:
        del otp_storage[email]
