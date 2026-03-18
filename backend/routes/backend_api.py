from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
from functools import wraps
import os
import sys
import re
import uuid
import secrets
import jwt
import datetime
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from services.otp_service import request_otp, verify_otp, is_otp_verified, clear_otp
from services.credentials_service import store_email_credentials, get_email_credentials
from services.auth_service import require_admin_role, require_jwt, require_admin_jwt
from services.logger_service import setup_logger
from services.bootstrap_admin import BootStrap

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# JWT Secret Key (use environment variable in production)
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY

# File upload configuration
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', '/app/uploads')
ALLOWED_EXTENSIONS = {'exe', 'zip'}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB

# Create upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

logger = setup_logger("controlit-backend")

# MongoDB setup - Use environment variable or default to localhost
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGODB_URI)
db = client["user_database"]
users_collection = db["users"]
agents_collection = db["agents"]
downloads_collection = db["downloads"]

logger.debug(
    "Mongo context DB=%s Collection=%s",
    db.name,
    users_collection.name
)

#BOOTSTRAP(runs once at startup)
BootStrap.bootstrap_admin(users_collection, logger)

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({"status": "healthy", "service": "controlit-backend"})

# Health check endpoint
@app.route('/api/user/profile', methods=['GET'])
@require_jwt
def get_user_profile():
    """Get current user's profile information"""
    try:
        user_id = request.user_id  # From JWT
        user = users_collection.find_one({"_id": ObjectId(user_id)}, {
            '_id': 0,
            'email': 1,
            'phone': 1,
            'parentName': 1,
            'role': 1,
            'created_at': 1
        })

        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        # Get agent statistics
        agent_count = agents_collection.count_documents({"linked_user_id": user_id})
        online_agents = agents_collection.count_documents({
            "linked_user_id": user_id,
            "last_heartbeat": {"$gte": datetime.datetime.utcnow() - datetime.timedelta(minutes=5)}
        })

        # Get average CPU usage from recent heartbeats
        recent_agents = list(agents_collection.find({
            "linked_user_id": user_id,
            "last_heartbeat": {"$gte": datetime.datetime.utcnow() - datetime.timedelta(minutes=5)}
        }, {"system_info.cpuUsage": 1}))

        avg_cpu = 0
        if recent_agents:
            cpu_values = [agent.get("system_info", {}).get("cpuUsage", 0) for agent in recent_agents if agent.get("system_info", {}).get("cpuUsage")]
            if cpu_values:
                avg_cpu = round(sum(cpu_values) / len(cpu_values), 1)

        user_data = {
            **user,
            "agent_count": agent_count,
            "online_agents": online_agents,
            "avg_cpu": avg_cpu
        }

        return jsonify({"status": "success", "user": user_data})
    except Exception as e:
        logger.error("Error fetching user profile: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


@app.route('/api/user/profile', methods=['PUT'])
@require_jwt
def update_user_profile():
    """Update current user's profile information"""
    try:
        user_id = request.user_id
        data = request.json
        parent_name = data.get('parentName')
        phone = data.get('phone')

        if not parent_name:
            return jsonify({"status": "error", "message": "Name is required"}), 400

        # Update user
        update_data = {"parentName": parent_name}
        if phone is not None:
            update_data["phone"] = phone

        result = users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )

        if result.modified_count > 0:
            return jsonify({"status": "success", "message": "Profile updated successfully"})
        else:
            return jsonify({"status": "success", "message": "No changes made"})
    except Exception as e:
        logger.error("Error updating user profile: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


@app.route('/api/user/request-password-otp', methods=['POST'])
def request_password_otp():
    """Request OTP for password change"""
    try:
        data = request.json
        email = data.get('email')

        if not email:
            return jsonify({"status": "error", "message": "Email is required"}), 400

        # Check if user exists
        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        # Request OTP
        result = request_otp(email, user.get('phone', ''))
        status_code = 200 if result['status'] == 'success' else 400
        return jsonify(result), status_code
    except Exception as e:
        logger.error("Error requesting password OTP: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


@app.route('/api/user/change-password', methods=['POST'])
def change_password():
    """Verify OTP and change password"""
    try:
        data = request.json
        email = data.get('email')
        otp = data.get('otp')
        new_password = data.get('new_password')

        if not email or not otp or not new_password:
            return jsonify({"status": "error", "message": "Email, OTP, and new password are required"}), 400

        # Verify OTP
        otp_result = verify_otp(email, otp)
        if otp_result['status'] != 'success':
            return jsonify({"status": "error", "message": "Invalid or expired OTP"}), 400

        # Validate password strength
        password_policy = r"^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':\\\"\\|,.<>\/?]).{8,}$"
        if not re.match(password_policy, new_password):
            return jsonify({"status": "error", "message": "Password must be at least 8 characters long, include an uppercase letter and a special character."}), 400

        # Update password
        hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        result = users_collection.update_one(
            {"email": email},
            {"$set": {"password": hashed_password}}
        )

        if result.modified_count > 0:
            clear_otp(email)
            return jsonify({"status": "success", "message": "Password changed successfully"})
        else:
            return jsonify({"status": "error", "message": "Failed to update password"}), 500
    except Exception as e:
        logger.error("Error changing password: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


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
    parent_name = data.get('name')  # Extract name field

    # Check if OTP is verified
    if not is_otp_verified(email):
        return jsonify({"message": "Please verify your OTP first!"}), 400

    # Strong password rules: minimum 8 chars, at least one uppercase, and at least one special character
    password_policy = r"^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':\\\"\\|,.<>\/?]).{8,}$"
    if not password or not re.match(password_policy, password):
        return jsonify({"message": "Password must be at least 8 characters long, include an uppercase letter and a special character."}), 400

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
        "parentName": parent_name,
        "password": hashed_password,
        "role": user_role,
        "created_at": datetime.datetime.utcnow()
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
        
        # Create JWT token
        token_payload = {
            'user_id': str(user["_id"]),
            'email': user["email"],
            'role': user.get("role", "user"),
            'is_admin': user.get("role", "user") == "admin",
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)  # Token expires in 24 hours
        }
        token = jwt.encode(token_payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            "message": "Login successful!",
            "token": token,
            "user_id": str(user["_id"]),
            "email": user["email"],
            "parentName": user.get("parentName", ""),
            "role": user.get("role", "user"),
            "is_admin": user.get("role", "user") == "admin"
        })

    logger.warning("Invalid password for email=%s", email)
    return jsonify({"message": "Invalid credentials!"}), 401


@app.route('/api/lock', methods=['POST'])
@require_jwt
def lock_laptop():
    data = request.json  
    user_choice = data.get('choice')  
    
    if user_choice == "yes":
        os.system("rundll32.exe user32.dll,LockWorkStation")
        return jsonify({"status": "Laptop locked!"})
    else:
        return jsonify({"status": "Laptop not locked."})

@app.route('/api/all_users')
@require_admin_jwt
def all_users():
    users = users_collection.find()
    return jsonify([
        {"id": str(user["_id"]), "email": user["email"], "password": user["password"]}
        for user in users
    ])


@app.route('/api/admin/users-with-agents')
@require_admin_jwt
def get_users_with_agents():
    """Get all users with their agent counts for admin dashboard"""
    try:
        users = list(users_collection.find({}, {'_id': 1, 'email': 1, 'role': 1}))
        users_with_agents = []

        for user in users:
            user_id = str(user['_id'])
            agent_count = agents_collection.count_documents({"linked_user_id": user_id})

            users_with_agents.append({
                "id": user_id,
                "email": user['email'],
                "role": user.get('role', 'user'),
                "agent_count": agent_count
            })

        return jsonify({"status": "success", "users": users_with_agents})
    except Exception as e:
        logger.error("Error fetching users with agents: %s", str(e))
        return jsonify({"status": "error", "message": f"Error fetching users: {str(e)}"}), 500


@app.route('/api/admin/user-agents/<user_id>')
@require_admin_jwt
def get_user_agents(user_id):
    """Get all agents for a specific user (admin view only)"""
    try:
        agents = list(agents_collection.find({"linked_user_id": user_id}, {
            '_id': 0,
            'agent_id': 1,
            'name': 1,
            'linked_user_id': 1,
            'last_heartbeat': 1,
            'system_info': 1
        }))

        # Get user email for display
        user = users_collection.find_one({"_id": ObjectId(user_id)}, {'email': 1})
        user_email = user['email'] if user else 'Unknown'

        # Add user email to each agent
        for agent in agents:
            agent['user_email'] = user_email

        return jsonify({"status": "success", "agents": agents})
    except Exception as e:
        logger.error("Error fetching user agents: %s", str(e))
        return jsonify({"status": "error", "message": f"Error fetching user agents: {str(e)}"}), 500


@app.route('/api/admin/setup-email-credentials', methods=['POST'])
@require_admin_jwt
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
@require_admin_jwt
def check_email_credentials():
    """
    Check if email credentials are configured (without revealing password)
    Only accessible to admin role users
    Checks both database and environment variables
    """
    try:
        email, password = get_email_credentials()
        if email:
            return jsonify({
                "status": "success",
                "configured": True,
                "email": email,
                "message": "Email credentials are configured (can be updated from Admin Panel)"
            }), 200
        else:
            return jsonify({
                "status": "success",
                "configured": False,
                "message": "Email credentials are not configured. Please set them up in the Admin Panel to send OTPs."
            }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "configured": False,
            "message": f"Error checking credentials: {str(e)}"
        }), 500
        return jsonify({"status": "error", "message": f"Error checking credentials: {str(e)}"}), 500


def generate_agent_token():
    """Generate a secure token for agent authentication"""
    return secrets.token_urlsafe(32)


@app.route('/api/agent/register', methods=['POST'])
def register_agent():
    """Register a new agent (pre-link)
    Agent calls this first with agent_id and name to initialize itself in the database
    """
    try:
        data = request.json
        agent_id = data.get('agent_id')
        name = data.get('name', f'PC-{agent_id}')  # Default name if not provided
        
        if not agent_id:
            return jsonify({"status": "error", "message": "Agent ID is required"}), 400
        
        # Check if agent already exists
        existing = agents_collection.find_one({"agent_id": agent_id})
        if existing:
            # Update name if different
            if existing.get('name') != name:
                agents_collection.update_one(
                    {"agent_id": agent_id},
                    {"$set": {"name": name}}
                )
            # Return existing token if already linked, or wait status if not
            if existing.get('agent_token'):
                return jsonify({
                    "status": "success",
                    "registered": True,
                    "linked": True,
                    "agent_token": existing['agent_token']
                })
            else:
                return jsonify({
                    "status": "success",
                    "registered": True,
                    "linked": False
                })
        
        # Create new agent record (not yet linked)
        agents_collection.insert_one({
            "agent_id": agent_id,
            "name": name,
            "agent_token": None,  # Will be set when user links it
            "linked_user_id": None,
            "linked_at": None,
            "last_heartbeat": None,
            "system_info": {},
            "pending_commands": []
        })
        
        logger.info("Agent registered: agent_id=%s name=%s", agent_id, name)
        return jsonify({
            "status": "success",
            "registered": True,
            "linked": False,
            "message": "Agent registered. User needs to link it via dashboard."
        })
    
    except Exception as e:
        logger.error("Error registering agent: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


from functools import wraps

def require_agent_auth(f):
    """Decorator to require valid agent token from database"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        logger.debug("Agent auth - Authorization header: %s", "present" if auth_header else "missing")
        
        if not auth_header:
            logger.warning("Agent auth failed: Missing authorization header")
            return jsonify({"error": "Missing authorization header"}), 401
        
        if not auth_header.startswith('Bearer '):
            logger.warning("Agent auth failed: Invalid header format")
            return jsonify({"error": "Invalid authorization header format"}), 401
        
        try:
            token = auth_header.split(' ')[1]
            if not token:
                logger.warning("Agent auth failed: Empty token")
                return jsonify({"error": "Empty token"}), 401
            
            # Validate token exists in database
            agent = agents_collection.find_one({"agent_token": token})
            if not agent:
                logger.warning("Agent auth failed: Token not found in database")
                return jsonify({"error": "Invalid agent token"}), 401
            
            logger.debug("Agent auth successful for agent: %s", agent.get("agent_id"))
            # Add agent to request context
            request.agent = agent
            return f(*args, **kwargs)
        except Exception as e:
            logger.error("Agent auth error: %s", str(e))
            return jsonify({"error": f"Auth error: {str(e)}"}), 401
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


@app.route('/api/agent/regenerate/<agent_id>', methods=['POST'])
def regenerate_agent_token(agent_id):
    """Regenerate token for an agent (for debugging/recovery)"""
    try:
        agent = agents_collection.find_one({"agent_id": agent_id})
        
        if not agent:
            return jsonify({"status": "error", "message": "Agent not found"}), 404
        
        # Generate new token
        new_token = generate_agent_token()
        
        # Update agent with new token
        agents_collection.update_one(
            {"agent_id": agent_id},
            {"$set": {"agent_token": new_token}}
        )
        
        logger.info("Agent token regenerated: agent_id=%s", agent_id)
        return jsonify({
            "status": "success",
            "agent_id": agent_id,
            "agent_token": new_token,
            "message": "Token regenerated successfully"
        })
    except Exception as e:
        logger.error("Error regenerating token: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


@app.route('/api/agent/heartbeat', methods=['POST'])
@require_agent_auth
def agent_heartbeat():
    """Receive heartbeat from agent with system info"""
    from datetime import datetime
    data = request.json
    agent_id = data.get('agent_id')
    system_info = data.get('system_info', {})
    
    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400
    
    # Get pending commands
    agent = agents_collection.find_one({"agent_id": agent_id})
    commands = agent.get('pending_commands', []) if agent else []
    
    # Update last heartbeat and store system info
    agents_collection.update_one(
        {"agent_id": agent_id},
        {
            "$set": {
                "last_heartbeat": datetime.utcnow(),
                "system_info": system_info
            },
            "$unset": {"pending_commands": ""}
        }
    )
    
    logger.debug("Heartbeat received from agent_id=%s, sending %d commands", agent_id, len(commands))
    return jsonify({"commands": commands})


@app.route('/api/admin/agents', methods=['GET'])
@require_jwt
def get_agents():
    """Get all linked agents for the logged-in user"""
    try:
        user_role = request.args.get('user_role')
        user_id = request.args.get('user_id')
        
        logger.debug("get_agents called - user_role: %s, user_id: %s", user_role, user_id)
        
        if not user_id:
            return jsonify({"status": "error", "message": "User ID required"}), 400
        
        # Admin can see all agents, regular users see only their own
        if user_role and user_role.lower() == 'admin':
            filter_query = {}
        else:
            filter_query = {"linked_user_id": user_id}
        
        agents = list(agents_collection.find(filter_query, {
            '_id': 0,
            'agent_id': 1,
            'name': 1,
            'linked_user_id': 1,
            'last_heartbeat': 1,
            'system_info': 1
        }))
        
        # Get user emails for display
        for agent in agents:
            try:
                user = users_collection.find_one({"_id": ObjectId(agent['linked_user_id'])}, {'email': 1})
                if user:
                    agent['user_email'] = user['email']
            except:
                agent['user_email'] = 'Unknown'
        
        return jsonify({"status": "success", "agents": agents})
    except Exception as e:
        logger.error("Error fetching agents: %s", str(e))
        return jsonify({"status": "error", "message": f"Error fetching agents: {str(e)}"}), 500


@app.route('/api/admin/agent/command', methods=['POST'])
@require_jwt
def send_agent_command():
    """Send command to agent"""
    try:
        data = request.json
        agent_id = data.get('agent_id')
        command = data.get('command')
        user_id = data.get('user_id')
        user_role = data.get('user_role')
        
        if not agent_id or not command:
            logger.warning("Missing agent_id or command in request")
            return jsonify({"status": "error", "message": "Agent ID and command are required"}), 400
        
        if not user_id:
            logger.warning("Missing user_id in request")
            return jsonify({"status": "error", "message": "User ID required"}), 400
        
        # Check if agent belongs to user (or user is admin)
        agent = agents_collection.find_one({"agent_id": agent_id})
        if not agent:
            logger.warning("Agent not found: %s", agent_id)
            return jsonify({"status": "error", "message": "Agent not found"}), 404
        
        # Admin can command any agent, regular users can only command their own
        if not (user_role and user_role.lower() == 'admin'):
            if agent.get('linked_user_id') != user_id:
                logger.warning("User %s tried to command agent %s they don't own", user_id, agent_id)
                return jsonify({"status": "error", "message": "Unauthorized: Agent not linked to your account"}), 403
        
        # Store the command in the agent's document
        result = agents_collection.update_one(
            {"agent_id": agent_id},
            {"$push": {"pending_commands": command}}
        )
        
        if result.modified_count > 0:
            logger.info("Command sent to agent %s: %s by user %s", agent_id, command, user_id)
            return jsonify({"status": "success", "message": "Command sent to agent"})
        else:
            logger.warning("Failed to update agent %s with command", agent_id)
            return jsonify({"status": "error", "message": "Failed to send command"}), 500
    except Exception as e:
        logger.error("Error sending command: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


@app.route('/api/admin/change-user-role', methods=['POST'])
@require_admin_jwt
def change_user_role():
    """Admin endpoint to change a user's role (admin/user)"""
    try:
        data = request.json
        target_user_id = data.get('user_id')
        new_role = data.get('role')  # 'admin' or 'user'
        
        if not target_user_id or new_role not in ['admin', 'user']:
            return jsonify({"status": "error", "message": "Valid user_id and role (admin/user) are required"}), 400
        
        # Find the target user
        user = users_collection.find_one({"_id": ObjectId(target_user_id)})
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        # Prevent admin from demoting themselves
        current_user_id = request.user_id
        if str(user["_id"]) == current_user_id and new_role == 'user':
            return jsonify({"status": "error", "message": "You cannot demote yourself"}), 400
        
        # Update user role
        result = users_collection.update_one(
            {"_id": ObjectId(target_user_id)},
            {"$set": {"role": new_role}}
        )
        
        if result.modified_count > 0:
            logger.info("User role changed: user_id=%s, new_role=%s by admin=%s", target_user_id, new_role, current_user_id)
            return jsonify({
                "status": "success", 
                "message": f"User {user['email']} role changed to {new_role}",
                "user_id": target_user_id,
                "new_role": new_role
            })
        else:
            return jsonify({"status": "error", "message": "Failed to update user role"}), 500
            
    except Exception as e:
        logger.error("Error changing user role: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


# Downloads Management
@app.route('/api/downloads', methods=['GET'])
@require_jwt
def get_downloads():
    """Get list of available downloads"""
    try:
        # Fetch all downloads from the database
        downloads = list(downloads_collection.find(
            {"active": True},
            {
                "_id": 1,
                "name": 1,
                "version": 1,
                "size": 1,
                "uploadedDate": 1,
                "downloadUrl": 1,
                "description": 1
            }
        ).sort("uploadedDate", -1))
        
        # Convert ObjectId to string for JSON serialization
        for download in downloads:
            download['id'] = str(download.pop('_id'))
        
        return jsonify({
            "status": "success",
            "downloads": downloads
        })
    except Exception as e:
        logger.error("Error fetching downloads: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


@app.route('/api/admin/uploads/add', methods=['POST'])
@require_admin_jwt
def add_download():
    """Upload and add a new download (Admin only)"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "No file part"}), 400
        
        file = request.files['file']
        name = request.form.get('name')
        version = request.form.get('version')
        description = request.form.get('description', '')
        
        if not name or not version:
            return jsonify({"status": "error", "message": "Name and version are required"}), 400
        
        if file.filename == '':
            return jsonify({"status": "error", "message": "No file selected"}), 400
        
        # Validate file extension
        filename = secure_filename(file.filename)
        if not any(filename.lower().endswith(f".{ext}") for ext in ALLOWED_EXTENSIONS):
            return jsonify({"status": "error", "message": "Only .exe and .zip files are allowed"}), 400
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Save file
        file.save(filepath)
        
        # Get file size
        file_size = os.path.getsize(filepath)
        size_mb = round(file_size / (1024 * 1024), 2)
        
        download_doc = {
            "name": name,
            "version": version,
            "size": f"{size_mb} MB",
            "description": description,
            "filename": unique_filename,
            "originalFilename": filename,
            "uploadedDate": datetime.datetime.utcnow(),
            "uploadedBy": request.user_id,
            "active": True
        }
        
        result = downloads_collection.insert_one(download_doc)
        
        logger.info("New download uploaded: %s by admin: %s", result.inserted_id, request.user_id)
        return jsonify({
            "status": "success",
            "message": "Download uploaded successfully",
            "id": str(result.inserted_id)
        })
    except Exception as e:
        logger.error("Error uploading download: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


@app.route('/api/downloads/<download_id>/file', methods=['GET'])
@require_jwt
def download_file(download_id):
    """Download a file (Users can download)"""
    try:
        download = downloads_collection.find_one({"_id": ObjectId(download_id), "active": True})
        
        if not download:
            return jsonify({"status": "error", "message": "Download not found"}), 404
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], download['filename'])
        
        if not os.path.exists(filepath):
            return jsonify({"status": "error", "message": "File not found on server"}), 404
        
        logger.info("File downloaded: %s by user: %s", download_id, request.user_id)
        return send_file(
            filepath,
            as_attachment=True,
            download_name=download['originalFilename']
        )
    except Exception as e:
        logger.error("Error downloading file: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


@app.route('/api/admin/uploads/<download_id>', methods=['DELETE'])
@require_admin_jwt
def delete_download(download_id):
    """Delete a download (Admin only)"""
    try:
        download = downloads_collection.find_one({"_id": ObjectId(download_id)})
        
        if not download:
            return jsonify({"status": "error", "message": "Download not found"}), 404
        
        # Delete file from server
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], download['filename'])
        if os.path.exists(filepath):
            os.remove(filepath)
        
        result = downloads_collection.update_one(
            {"_id": ObjectId(download_id)},
            {"$set": {"active": False}}
        )
        
        logger.info("Download deleted: %s", download_id)
        return jsonify({
            "status": "success",
            "message": "Download deleted successfully"
        })
    except Exception as e:
        logger.error("Error deleting download: %s", str(e))
        return jsonify({"status": "error", "message": f"Error: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)