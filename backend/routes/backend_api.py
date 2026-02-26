from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from services.otp_service import request_otp, verify_otp, is_otp_verified, clear_otp
from services.credentials_service import store_email_credentials, get_email_credentials
from services.auth_service import require_admin_role

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# MongoDB setup - Use environment variable or default to localhost
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGODB_URI)
db = client["user_database"]
users_collection = db["users"]


@app.route('/api/register/request-otp', methods=['POST'])
def request_otp_endpoint():
    """Request OTP for registration"""
    data = request.json
    email = data.get('email')
    phone = data.get('phone')
    
    if not email or not phone:
        return jsonify({"status": "error", "message": "Email and phone are required"}), 400
    
    # Check if user already exists
    if users_collection.find_one({"email": email}):
        return jsonify({"status": "error", "message": "User already exists!"}), 409
    
    result = request_otp(email, phone)
    status_code = 200 if result['status'] == 'success' else 400
    return jsonify(result), status_code


@app.route('/api/register/verify-otp', methods=['POST'])
def verify_otp_endpoint():
    """Verify OTP for registration"""
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    
    if not email or not otp:
        return jsonify({"status": "error", "message": "Email and OTP are required"}), 400
    
    result = verify_otp(email, otp)
    status_code = 200 if result['status'] == 'success' else 400
    return jsonify(result), status_code


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone')

    # Check if OTP is verified
    if not is_otp_verified(email):
        return jsonify({"message": "Please verify your OTP first!"}), 400

    # Check if user already exists
    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists!"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # Check if this is the first user - make them admin
    user_count = users_collection.count_documents({})
    is_first_user = user_count == 0
    user_role = "admin" if is_first_user else "user"
    
    new_user = {
        "email": email,
        "phone": phone,
        "password": hashed_password,
        "role": user_role,
        "created_at": None
    }

    result = users_collection.insert_one(new_user)
    clear_otp(email)  # Clear OTP after successful registration
    
    return jsonify({
        "message": "User registered successfully!",
        "user_id": str(result.inserted_id),
        "role": user_role,
        "is_admin": is_first_user
    })


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({"email": email})
    if user and user["password"] == data.get("password"):
        return jsonify({
            "message": "Login successful!",
            "user_id": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", "user"),
            "is_admin": user.get("role", "user") == "admin"
        })
    else:
        return jsonify({"message": "Invalid credentials!"}), 401


@app.route('/api/lock', methods=['POST'])
def lock_laptop():
    data = request.json  
    user_choice = data.get('choice')  
    
    if user_choice == "yes":
        os.system("rundll32.exe user32.dll,LockWorkStation")
        return jsonify({"status": "Laptop locked!"})
    else:
        return jsonify({"status": "Laptop not locked."})

@app.route('/api/all_users')
def all_users():
    users = users_collection.find()
    return jsonify([
        {"id": str(user["_id"]), "email": user["email"], "password": user["password"]}
        for user in users
    ])


@app.route('/api/admin/setup-email-credentials', methods=['POST'])
@require_admin_role
def setup_email_credentials():
    """
    Setup/update email credentials for sending OTPs
    Only accessible to admin role users
    
    Request body:
    {
        "email": "your-email@gmail.com",
        "password": "your-app-password",
        "user_role": "admin"
    }
    """
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password are required"}), 400
        
        result = store_email_credentials(email, password)
        status_code = 200 if result['status'] == 'success' else 400
        return jsonify(result), status_code
    
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to setup credentials: {str(e)}"}), 500


@app.route('/api/admin/check-email-credentials', methods=['GET'])
@require_admin_role
def check_email_credentials():
    """
    Check if email credentials are configured (without revealing password)
    Only accessible to admin role users
    """
    try:
        email, password = get_email_credentials()
        if email:
            return jsonify({
                "status": "success",
                "configured": True,
                "email": email,
                "message": "Email credentials are configured"
            }), 200
        else:
            return jsonify({
                "status": "success",
                "configured": False,
                "message": "Email credentials are not configured"
            }), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error checking credentials: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)