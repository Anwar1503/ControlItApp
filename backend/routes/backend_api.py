from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
import sys
import uuid
import secrets
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from services.otp_service import request_otp, verify_otp, is_otp_verified, clear_otp
from services.credentials_service import store_email_credentials, get_email_credentials
from services.auth_service import require_admin_role
from services.logger_service import setup_logger
from services.bootstrap_admin import bootstrap_admin

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

logger = setup_logger("controlit-backend")

# MongoDB setup - Use environment variable or default to localhost
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGODB_URI)
db = client["user_database"]
users_collection = db["users"]
agents_collection = db["agents"]

logger.debug(
    "Mongo context DB=%s Collection=%s",
    db.name,
    users_collection.name
)

#BOOTSTRAP(runs once at startup)
bootstrap_admin(users_collection, logger)


@app.route('/api/register/request-otp', methods=['POST'])
def request_otp_endpoint():
    """Request OTP for registration"""
    logger.debug("Otp request received")
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
    logger.info("Otp request success")
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
    logger.debug("register request received")
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
    clear_otp(email)
    logger.debug("register request received")
    
    return jsonify({
        "message": "User registered successfully!",
        "user_id": str(result.inserted_id),
        "role": user_role,
        "is_admin": is_first_user
    })


@app.route('/api/login', methods=['POST'])
def login():
    logger.debug("Login request received")
    logger.debug(
        "Mongo context DB=%s Collection=%s",
        db.name,
        users_collection.name
    )

    data = request.json
    email = data.get("email")
    password = data.get("password")

    logger.debug("login payload received for email=%s", email)

    user = users_collection.find_one({"email": email})

    if not user:
        logger.warning("Login failed: user not found email=%s", email)
        return jsonify({"message": "Invalid credentials!"}), 401

    if bcrypt.check_password_hash(user["password"], password):
        logger.info("Login successful email=%s role=%s", user["email"], user["role"])
        return jsonify({
            "message": "Login successful!",
            "user_id": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", "user"),
            "is_admin": user.get("role", "user") == "admin"
        })

    logger.warning("Invalid password for email=%s", email)
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
        logger.debug("setting up credentials")
        data = request.json
        email = data.get('email')
        password = data.get('password')
        logger.debug(
            "data EMAIL=%s Password=%s",
            email,
            password
        )
        
        if not email or not password:
            logger.error("Email and password are required")
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


def generate_agent_token():
    """Generate a secure token for agent authentication"""
    return secrets.token_urlsafe(32)


def require_agent_auth(f):
    """Decorator to require valid agent token"""
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid authorization header"}), 401
        
        token = auth_header.split(' ')[1]
        agent = agents_collection.find_one({"agent_token": token})
        if not agent:
            return jsonify({"error": "Invalid agent token"}), 401
        
        # Add agent to request context
        request.agent = agent
        return f(*args, **kwargs)
    return wrapper


@app.route('/api/agent/link', methods=['POST'])
def link_agent():
    """Link an agent to the current user session"""
    data = request.json
    agent_id = data.get('agent_id')
    user_id = data.get('user_id')
    
    if not agent_id or not user_id:
        return jsonify({"status": "error", "message": "Agent ID and User ID are required"}), 400
    
    # Check if user exists
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    
    # Generate token
    agent_token = generate_agent_token()
    
    # Update or insert agent
    agents_collection.update_one(
        {"agent_id": agent_id},
        {
            "$set": {
                "agent_id": agent_id,
                "agent_token": agent_token,
                "linked_user_id": user_id,
                "linked_at": None,
                "last_heartbeat": None
            }
        },
        upsert=True
    )
    
    logger.info("Agent linked: agent_id=%s user_id=%s", agent_id, user_id)
    return jsonify({"status": "success", "agent_token": agent_token})


@app.route('/api/agent/status/<agent_id>', methods=['GET'])
def get_agent_status(agent_id):
    """Get linking status for an agent"""
    agent = agents_collection.find_one({"agent_id": agent_id})
    
    if agent and agent.get('agent_token'):
        return jsonify({
            "linked": True,
            "agent_token": agent['agent_token']
        })
    else:
        return jsonify({
            "linked": False
        })


@app.route('/api/agent/heartbeat', methods=['POST'])
@require_agent_auth
def agent_heartbeat():
    """Receive heartbeat from agent with system info"""
    data = request.json
    agent_id = data.get('agent_id')
    system_info = data.get('system_info', {})
    
    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400
    
    # Get pending commands
    agent = agents_collection.find_one({"agent_id": agent_id})
    commands = agent.get('pending_commands', []) if agent else []
    
    # Update last heartbeat and clear pending commands
    agents_collection.update_one(
        {"agent_id": agent_id},
        {
            "$set": {
                "last_heartbeat": None,
                "system_info": system_info
            },
            "$unset": {"pending_commands": ""}
        }
    )
    
    logger.debug("Heartbeat received from agent_id=%s, sending %d commands", agent_id, len(commands))
    return jsonify({"commands": commands})


@app.route('/api/admin/agents', methods=['GET'])
@require_admin_role
def get_agents():
    """Get all linked agents (admin only)"""
    try:
        agents = list(agents_collection.find({}, {
            '_id': 0,
            'agent_id': 1,
            'linked_user_id': 1,
            'last_heartbeat': 1,
            'system_info': 1
        }))
        
        # Get user emails for display
        for agent in agents:
            user = users_collection.find_one({"_id": ObjectId(agent['linked_user_id'])}, {'email': 1})
            if user:
                agent['user_email'] = user['email']
        
        return jsonify({"status": "success", "agents": agents})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error fetching agents: {str(e)}"}), 500


@app.route('/api/admin/agent/command', methods=['POST'])
@require_admin_role
def send_agent_command():
    """Send command to agent (admin only)"""
    data = request.json
    agent_id = data.get('agent_id')
    command = data.get('command')
    
    if not agent_id or not command:
        return jsonify({"status": "error", "message": "Agent ID and command are required"}), 400
    
    # For now, we'll store the command in the agent's document
    # In a real implementation, you might use WebSockets or polling
    agents_collection.update_one(
        {"agent_id": agent_id},
        {"$push": {"pending_commands": command}}
    )
    
    logger.info("Command sent to agent %s: %s", agent_id, command)
    return jsonify({"status": "success", "message": "Command sent to agent"})


if __name__ == '__main__':
    app.run(debug=True, port=5000)