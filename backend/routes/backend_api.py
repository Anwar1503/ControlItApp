from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
from functools import wraps
import os
import sys
import uuid
import secrets
import jwt
import datetime
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
BootStrap.bootstrap_admin(users_collection, logger)


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
        users = list(users_collection.find({}, {'_id': 1, 'email': 1}))
        users_with_agents = []

        for user in users:
            user_id = str(user['_id'])
            agent_count = agents_collection.count_documents({"linked_user_id": user_id})

            users_with_agents.append({
                "id": user_id,
                "email": user['email'],
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


@app.route('/api/agent/register', methods=['POST'])
def register_agent():
    """Register a new agent (pre-link)
    Agent calls this first with just agent_id to initialize itself in the database
    """
    try:
        data = request.json
        agent_id = data.get('agent_id')
        
        if not agent_id:
            return jsonify({"status": "error", "message": "Agent ID is required"}), 400
        
        # Check if agent already exists
        existing = agents_collection.find_one({"agent_id": agent_id})
        if existing:
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
            "agent_token": None,  # Will be set when user links it
            "linked_user_id": None,
            "linked_at": None,
            "last_heartbeat": None,
            "system_info": {},
            "pending_commands": []
        })
        
        logger.info("Agent registered: agent_id=%s", agent_id)
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


if __name__ == '__main__':
    app.run(debug=True, port=5000)