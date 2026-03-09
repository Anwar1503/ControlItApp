"""
Admin authorization middleware
Checks if user has admin role before allowing access to protected endpoints
"""
from functools import wraps
from flask import request, jsonify
from .logger_service import setup_logger

logger = setup_logger("Decoraters")

def require_admin_token(f):
    """
    Decorator to require admin role for endpoint access
    Expects a token in Authorization header that contains user role
    
    Usage:
        @app.route('/api/admin/...')
        @require_admin_token
        def admin_endpoint():
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({"status": "error", "message": "Authorization header required"}), 401
        
        try:
            # Expected format: "Bearer <role>:<user_id>"
            # Or could use JWT in production
            parts = auth_header.split(' ')
            if len(parts) != 2 or parts[0].lower() != 'bearer':
                return jsonify({"status": "error", "message": "Invalid authorization header"}), 401
            
            token_data = parts[1].split(':')
            if len(token_data) < 2:
                return jsonify({"status": "error", "message": "Invalid token format"}), 401
            
            role = token_data[0]
            
            if role.lower() != 'admin':
                return jsonify({
                    "status": "error",
                    "message": "Admin access required",
                    "code": "ADMIN_ONLY"
                }), 403
            
            return f(*args, **kwargs)
        
        except Exception as e:
            return jsonify({"status": "error", "message": f"Authorization error: {str(e)}"}), 401
    
    return decorated_function


def require_admin_role(f):
    """
    Simpler decorator that checks request body or query params for role
    Used when role is passed as data instead of token
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get user_role from request (can be from body, query, or header)
        user_role = request.args.get('user_role')
        logger.info("user_role from query: %s", user_role)
        
        if not user_role and request.json:
            user_role = request.json.get('user_role')
            logger.info("user_role from body: %s", user_role)
        
        if user_role and user_role.lower() == 'admin':
            logger.info("Admin access granted")
            return f(*args, **kwargs)
        
        logger.warning("Admin access denied for role: %s", user_role)
        return jsonify({
            "status": "error",
            "message": "Admin access required",
            "code": "ADMIN_ONLY"
        }), 403
    
    return decorated_function


def require_agent_auth(f):
    """
    Decorator to require agent authentication via token
    Expects: Authorization: Bearer <agent_token>
    
    Usage:
        @app.route('/api/agent/...')
        @require_agent_auth
        def agent_endpoint():
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        logger.debug("Agent auth check - Authorization header: %s", "present" if auth_header else "missing")
        
        if not auth_header:
            logger.warning("Agent auth failed: No authorization header")
            return jsonify({"status": "error", "message": "Authorization header required"}), 401
        
        try:
            # Expected format: "Bearer <agent_token>"
            parts = auth_header.split(' ')
            if len(parts) != 2 or parts[0].lower() != 'bearer':
                logger.warning("Agent auth failed: Invalid header format")
                return jsonify({"status": "error", "message": "Invalid authorization header"}), 401
            
            agent_token = parts[1]
            
            # Verify token exists (simplified check)
            # In production, use JWT or more secure token validation
            if not agent_token:
                logger.warning("Agent auth failed: Empty token")
                return jsonify({"status": "error", "message": "Invalid token"}), 401
            
            logger.debug("Agent auth successful")
            return f(*args, **kwargs)
        
        except Exception as e:
            logger.error("Agent auth error: %s", str(e))
            return jsonify({"status": "error", "message": f"Authorization error: {str(e)}"}), 401
    
    return decorated_function
