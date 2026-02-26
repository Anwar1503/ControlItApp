"""
Admin authorization middleware
Checks if user has admin role before allowing access to protected endpoints
"""
from functools import wraps
from flask import request, jsonify

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
        
        if not user_role and request.json:
            user_role = request.json.get('user_role')
        
        if user_role and user_role.lower() == 'admin':
            return f(*args, **kwargs)
        
        return jsonify({
            "status": "error",
            "message": "Admin access required",
            "code": "ADMIN_ONLY"
        }), 403
    
    return decorated_function
