from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
import os

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["user_database"]
users_collection = db["users"]


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    # Check if user already exists
    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists!"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    new_user = {
        "email": email,
        "password": hashed_password
    }

    result = users_collection.insert_one(new_user)
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