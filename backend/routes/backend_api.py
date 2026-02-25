from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from services.otp_service import request_otp, verify_otp, is_otp_verified, clear_otp

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
    
    new_user = {
        "email": email,
        "phone": phone,
        "password": hashed_password
    }

    result = users_collection.insert_one(new_user)
    clear_otp(email)  # Clear OTP after successful registration
    return jsonify({"message": "User registered successfully!", "user_id": str(result.inserted_id)})


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({"email": email})
    if user and bcrypt.check_password_hash(user["password"], password):
        return jsonify({"message": "Login successful!"})
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


if __name__ == '__main__':
    app.run(debug=True, port=5000)