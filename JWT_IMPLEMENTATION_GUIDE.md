# JWT Authentication Implementation Guide

## Overview

This document explains the complete JWT (JSON Web Token) authentication implementation in the ControlIt application, covering both client-side (React) and server-side (Flask) components.

## Table of Contents

1. [What is JWT?](#what-is-jwt)
2. [Why JWT over Session-based Auth?](#why-jwt-over-session-based-auth)
3. [Architecture Overview](#architecture-overview)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Security Considerations](#security-considerations)
7. [Testing the Implementation](#testing-the-implementation)
8. [Troubleshooting](#troubleshooting)

## What is JWT?

JWT (JSON Web Token) is a compact, URL-safe means of representing claims to be transferred between two parties. The claims in a JWT are encoded as a JSON object that is used as the payload of a JSON Web Signature (JWS) structure or as the plaintext of a JSON Web Encryption (JWE) structure, enabling the claims to be digitally signed or integrity protected with a Message Authentication Code (MAC) and/or encrypted.

### JWT Structure
A JWT consists of three parts separated by dots (`.`):
- **Header**: Contains the type of token and signing algorithm
- **Payload**: Contains the claims (user data, expiration, etc.)
- **Signature**: Used to verify the token hasn't been altered

Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`

## Why JWT over Session-based Auth?

### Advantages of JWT:
1. **Stateless**: No server-side session storage required
2. **Scalable**: Works well with distributed systems and microservices
3. **Cross-domain**: Can be used across different domains
4. **Self-contained**: Contains all necessary information
5. **Mobile-friendly**: Works well with mobile applications

### Our Implementation:
- **Token expiry**: 24 hours
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Storage**: localStorage (client-side)

## Architecture Overview

```
┌─────────────────┐    JWT Token    ┌─────────────────┐
│   React Client  │◄──────────────►│   Flask Server  │
│                 │                │                 │
│ • Login Form    │                │ • /api/login    │
│ • Route Guards  │                │ • JWT Decorator │
│ • Axios Interceptor│             │ • Protected Routes│
│ • Token Storage │                │ • Admin Routes   │
└─────────────────┘                └─────────────────┘
```

### Data Flow:
1. User logs in with email/password
2. Server validates credentials
3. Server generates JWT with user claims
4. Client stores JWT in localStorage
5. Client includes JWT in all API requests
6. Server validates JWT on protected routes
7. Server extracts user info from JWT payload

## Backend Implementation

### 1. Dependencies

Added to `requirements.txt`:
```txt
PyJWT==2.8.0
```

### 2. Environment Variables

Added to `.env`:
```env
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
```

### 3. JWT Configuration

In `backend/routes/backend_api.py`:
```python
import jwt
import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# JWT Secret Key
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
```

### 4. JWT Generation (Login Endpoint)

```python
@app.route('/api/login', methods=['POST'])
def login():
    # ... credential validation ...
    
    if bcrypt.check_password_hash(user["password"], password):
        # Create JWT token
        token_payload = {
            'user_id': str(user["_id"]),
            'email': user["email"],
            'role': user.get("role", "user"),
            'is_admin': user.get("role", "user") == "admin",
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
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
```

### 5. JWT Verification Decorators

In `backend/services/auth_service.py`:

#### Basic JWT Verification:
```python
def require_jwt(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({"status": "error", "message": "Authorization header required"}), 401
        
        try:
            parts = auth_header.split(' ')
            if len(parts) != 2 or parts[0].lower() != 'bearer':
                return jsonify({"status": "error", "message": "Invalid authorization header"}), 401
            
            token = parts[1]
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            
            # Attach user info to request
            request.user_id = payload.get('user_id')
            request.user_email = payload.get('email')
            request.user_role = payload.get('role')
            request.is_admin = payload.get('is_admin', False)
            
            return f(*args, **kwargs)
        
        except jwt.ExpiredSignatureError:
            return jsonify({"status": "error", "message": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"status": "error", "message": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"status": "error", "message": f"Authorization error: {str(e)}"}), 401
    
    return decorated_function
```

#### Admin JWT Verification:
```python
def require_admin_jwt(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # ... JWT verification ...
        
        # Check if admin
        if not payload.get('is_admin', False):
            return jsonify({
                "status": "error",
                "message": "Admin access required",
                "code": "ADMIN_ONLY"
            }), 403
        
        # ... attach user info ...
        return f(*args, **kwargs)
    
    return decorated_function
```

### 6. Protected Routes

#### User Routes (require valid JWT):
```python
@app.route('/api/lock', methods=['POST'])
@require_jwt
def lock_laptop():
    # Only authenticated users can access
    pass
```

#### Admin Routes (require admin JWT):
```python
@app.route('/api/admin/setup-email-credentials', methods=['POST'])
@require_admin_jwt
def setup_email_credentials():
    # Only admin users can access
    pass
```

## Frontend Implementation

### 1. Login Component

In `frontend/src/components/Login.tsx`:
```typescript
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  try {
    const response = await axios.post(`${API_BASE}/api/login`, {
      email,
      password,
    });
    
    if (response.data.message === "Login successful!") {
      // Store JWT token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user_id', response.data.user_id);
      localStorage.setItem('email', response.data.email);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('is_admin', response.data.is_admin.toString());
      
      navigate("/dashboard");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed!");
  }
};
```

### 2. Axios Interceptor

In `frontend/src/services/api.ts`:
```typescript
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Set up axios interceptor to include JWT token in headers
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### 3. Route Protection

In `frontend/src/components/App.tsx`:
```typescript
// Auth helpers
const isAuthenticated = () => Boolean(localStorage.getItem("token"));
const isAdminUser = () => localStorage.getItem("is_admin") === "true";

const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  return isAuthenticated() ? <>{element}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return isAdminUser() ? <>{element}</> : <Navigate to="/dashboard" replace />;
};

const PublicOnlyRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <>{element}</>;
};

// Route definitions
<Routes>
  <Route path="/login" element={<PublicOnlyRoute element={<Login />} />} />
  <Route path="/register" element={<PublicOnlyRoute element={<Register />} />} />
  <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
  <Route path="/admin" element={<AdminRoute element={<AdminPanel />} />} />
  {/* ... other routes */}
</Routes>
```

### 4. Logout Implementation

In `frontend/src/components/SideNav.tsx`:
```typescript
const handleLogout = () => {
  localStorage.clear(); // Clear all stored data including JWT
  setOpen(false);
  navigate("/login");
};
```

## Security Considerations

### 1. Token Storage
- **Current**: localStorage (vulnerable to XSS)
- **Better**: HttpOnly cookies (recommended for production)
- **Best**: Secure HttpOnly cookies with SameSite protection

### 2. Token Expiry
- Current: 24 hours
- Consider: Shorter expiry (1-2 hours) with refresh tokens

### 3. Secret Key
- **Never** commit real secret to version control
- Use strong, random secret (at least 256 bits)
- Rotate secrets periodically

### 4. HTTPS Only
- Always use HTTPS in production
- JWTs can be intercepted over HTTP

### 5. Token Revocation
- Current implementation: No server-side token blacklist
- Consider: Redis-based token blacklist for logout invalidation

### 6. CORS Configuration
- Restrict CORS to your domain only
- Never allow credentials from untrusted origins

## Testing the Implementation

### 1. Manual Testing

#### Test Login Flow:
1. Open browser dev tools → Network tab
2. Login with valid credentials
3. Check `/api/login` response contains `token` field
4. Check localStorage has `token` stored

#### Test Protected Routes:
1. Try accessing `/dashboard` without login → should redirect to `/login`
2. Login → should access dashboard
3. Check Network tab → all API calls include `Authorization: Bearer <token>`

#### Test Admin Routes:
1. Login as regular user
2. Try accessing `/admin` → should redirect to `/dashboard`
3. Login as admin user → should access admin panel

#### Test Token Expiry:
1. Login and get token
2. Manually modify token expiry in localStorage to past date
3. Try accessing protected route → should get 401 error

### 2. API Testing with cURL

```bash
# Login and get token
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token in subsequent requests
curl -X GET http://localhost:5000/api/admin/agents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 3. Automated Testing

Consider adding tests for:
- JWT generation and validation
- Route protection
- Token expiry handling
- Admin role checking

## Troubleshooting

### Common Issues

#### 1. "Authorization header required" (401)
- Check if axios interceptor is working
- Verify token exists in localStorage
- Check if request headers include Authorization

#### 2. "Token has expired" (401)
- Token expiry reached (24 hours)
- User needs to login again

#### 3. "Invalid token" (401)
- Token was tampered with
- Wrong secret key used for signing/verification

#### 4. "Admin access required" (403)
- User is authenticated but not admin
- Check `is_admin` claim in JWT payload

#### 5. CORS errors
- Check Flask-CORS configuration
- Ensure frontend and backend are on same domain/port

### Debug Steps

1. **Check token in browser**:
   ```javascript
   console.log(localStorage.getItem('token'));
   ```

2. **Decode JWT payload** (use jwt.io or):
   ```javascript
   const token = localStorage.getItem('token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log(payload);
   ```

3. **Check API request headers**:
   - Open Network tab in dev tools
   - Look for Authorization header in requests

4. **Backend logs**:
   - Check Flask logs for JWT validation errors
   - Look for "Agent auth check" or "Authorization error" messages

### Environment Issues

#### Docker Environment:
- Ensure `.env` file is in the correct location
- Check if `JWT_SECRET_KEY` is loaded properly
- Verify MongoDB connection for user validation

#### Development Environment:
- Install all dependencies: `pip install -r requirements.txt`
- Set `JWT_SECRET_KEY` in `.env`
- Ensure Python can import all modules

## Future Enhancements

### 1. Refresh Tokens
- Implement refresh token rotation
- Automatic token renewal before expiry

### 2. Token Blacklisting
- Server-side token invalidation
- Logout from all devices feature

### 3. Rate Limiting
- Prevent brute force attacks on login
- Limit API calls per user/token

### 4. Multi-factor Authentication
- Add TOTP/OTP verification
- Hardware security keys

### 5. Audit Logging
- Log all authentication events
- Track token usage and suspicious activity

## Conclusion

This JWT implementation provides a solid foundation for authentication in your ControlIt application. The current setup offers:

- ✅ Stateless authentication
- ✅ Role-based access control
- ✅ Automatic token management
- ✅ Secure server-side validation
- ✅ Protection against unauthorized access

For production deployment, consider implementing the security enhancements mentioned above, especially moving from localStorage to HttpOnly cookies and adding token refresh mechanisms.

The implementation is now ready to use - the JWT tokens will be automatically handled by the axios interceptor and validated by the Flask decorators on the backend.</content>
<parameter name="filePath">c:\ControlIt\ControlItApp\JWT_IMPLEMENTATION_GUIDE.md