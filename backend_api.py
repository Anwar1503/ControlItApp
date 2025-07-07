from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import os

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully!"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password, password):
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
    users = User.query.all()
    return jsonify([
        {"id": u.id, "email": u.email, "password": u.password}
        for u in users
    ])    

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
