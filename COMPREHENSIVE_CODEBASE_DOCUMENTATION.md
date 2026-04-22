# ControlItApp - Complete Codebase Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Backend API Documentation](#backend-api-documentation)
5. [Frontend Components](#frontend-components)
6. [Database Schema](#database-schema)
7. [Authentication & Security](#authentication--security)
8. [Agent System](#agent-system)
9. [Deployment & DevOps](#deployment--devops)
10. [Setup & Installation](#setup--installation)
11. [Development Guidelines](#development-guidelines)
12. [API Reference](#api-reference)

---

## 🎯 Project Overview

**ControlItApp** is a sophisticated full-stack web application designed for remote PC management and control. It implements an agent-based architecture where external client applications ("agents") connect to a central server to receive commands and report system information.

### Key Features

- **🔐 Secure Authentication**: JWT-based user authentication with role-based access control
- **🤖 Agent Management**: Remote control of linked devices through agent clients
- **📊 Real-time Monitoring**: Live system information from connected agents
- **⚡ Remote Commands**: Send control commands (lock, shutdown, etc.) to agents
- **👑 Admin Panel**: Comprehensive web interface for managing users and agents
- **📁 File Management**: Upload and download capabilities for software distribution
- **🔒 OTP System**: Two-factor authentication for enhanced security
- **📱 Responsive UI**: Modern Material-UI based interface

### Core Use Cases

1. **Remote Device Management**: IT administrators can monitor and control company devices
2. **Personal Device Control**: Users can remotely manage their own computers
3. **Software Distribution**: Centralized platform for distributing software updates
4. **System Monitoring**: Real-time health monitoring of connected devices

*[Suggested Image: High-level system overview diagram showing user → web app → agents → devices]*

---

## 🏗️ System Architecture

### Overall Architecture

```
┌─────────────────┐    HTTPS/API    ┌─────────────────┐
│   Agent Client  │◄──────────────►│ ControlIt Server│
│                 │                │                 │
│ • Runs on device│                │ • Flask Backend │
│ • Receives cmds │                │ • MongoDB       │
│ • Reports status│                │ • JWT Auth      │
│ • Auto-starts   │                │ • Command Queue │
└─────────────────┘                └─────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────┐                   ┌─────────────────┐
│   End User      │◄─────────────────►│   Web Dashboard │
│   Device        │                   │   Admin Panel   │
└─────────────────┘                   └─────────────────┘
```

### Component Breakdown

#### Backend Services
- **Flask API Server**: RESTful API handling all business logic
- **MongoDB Database**: Document storage for users, agents, and downloads
- **JWT Authentication**: Stateless token-based authentication
- **OTP Service**: SMS-based two-factor authentication
- **File Upload Service**: Secure file storage and distribution

#### Frontend Application
- **React SPA**: Single-page application with routing
- **Material-UI**: Modern component library
- **Axios**: HTTP client for API communication
- **Session Management**: Automatic timeout and renewal

#### Agent System
- **Agent Clients**: External applications running on target devices
- **Heartbeat Protocol**: Regular status reporting
- **Command Queue**: Asynchronous command execution
- **Secure Linking**: Browser-based agent registration

*[Suggested Image: Detailed component diagram showing all services and their interactions]*

---

## 🛠️ Technology Stack

### Backend Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Web Framework** | Flask | 3.0.0 | REST API development |
| **Database** | MongoDB | Latest | Document storage |
| **Authentication** | PyJWT | 2.8.0 | JWT token handling |
| **Password Hashing** | Flask-Bcrypt | 1.0.1 | Secure password storage |
| **CORS** | Flask-CORS | 4.0.0 | Cross-origin requests |
| **HTTP Client** | Requests | 2.31.0 | External API calls |
| **Environment** | python-dotenv | 1.0.0 | Configuration management |

### Frontend Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | React | 18.3.1 | UI development |
| **Language** | TypeScript | Latest | Type-safe JavaScript |
| **UI Library** | Material-UI | 5.14.0 | Component library |
| **Routing** | React Router | 6.30.3 | Client-side routing |
| **HTTP Client** | Axios | 1.8.2 | API communication |
| **Icons** | Lucide React | 0.460.0 | Icon library |
| **Build Tool** | Create React App | 5.0.1 | Development tooling |

### Infrastructure & DevOps

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Containerization** | Docker | Application packaging |
| **Orchestration** | Docker Compose | Multi-service management |
| **Web Server** | Nginx | Reverse proxy and static serving |
| **Database** | MongoDB | Data persistence |
| **Version Control** | Git | Source code management |

*[Suggested Image: Technology stack visualization showing layers from infrastructure to UI]*

---

## 🔧 Backend API Documentation

### API Endpoints Overview

The backend provides RESTful APIs organized by functionality:

#### Authentication Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/register/request-otp` - Request OTP for registration
- `POST /api/register/verify-otp` - Verify registration OTP
- `POST /api/user/request-password-otp` - Request password reset OTP
- `POST /api/user/change-password` - Change password with OTP

#### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/admin/users-with-agents` - Admin: Get all users with agent counts
- `POST /api/admin/change-user-role` - Admin: Change user role

#### Agent Management
- `POST /api/agent/register` - Register new agent
- `POST /api/agent/link` - Link agent to user
- `GET /api/agent/status/{agent_id}` - Get agent linking status
- `POST /api/agent/heartbeat` - Agent heartbeat with system info
- `GET /api/admin/agents` - Get all agents (admin view)
- `POST /api/admin/agent/command` - Send command to agent

#### File Management
- `GET /api/downloads` - Get available downloads
- `POST /api/admin/uploads/add` - Upload new download (admin)
- `GET /api/downloads/{id}/file` - Download file
- `DELETE /api/admin/uploads/{id}` - Delete download (admin)

#### Utility
- `GET /api/health` - Health check
- `POST /api/lock` - Lock workstation (legacy)

### Authentication Flow

#### JWT Token Structure
```json
{
  "user_id": "64f...",
  "email": "user@example.com",
  "role": "admin",
  "is_admin": true,
  "exp": 1640995200
}
```

#### Request Authentication
```http
Authorization: Bearer <jwt_token>
```

#### Agent Authentication
```http
Authorization: Bearer <agent_token>
```

*[Suggested Image: Authentication flow diagram showing login → JWT → API access]*

---

## 🎨 Frontend Components

### Component Hierarchy

```
App (Root Component)
├── Navbar (Navigation)
├── Login/Register/ForgotPassword (Auth Pages)
├── Dashboard (Main User Interface)
│   ├── Agent Cards
│   ├── System Stats
│   └── Command Interface
├── AdminPanel (Admin Interface)
│   ├── User Management
│   ├── Agent Management
│   └── Downloads Management
├── Profile (User Profile)
├── Downloads (File Downloads)
├── About (Information Page)
└── SessionTimeoutDialog (Session Management)
```

### Key Components

#### App.tsx
- **Purpose**: Main application component with routing
- **Features**: Route protection, session timeout handling
- **Routes**:
  - `/login` - Authentication
  - `/dashboard` - User dashboard
  - `/admin` - Admin panel
  - `/profile` - User profile
  - `/downloads` - File downloads

#### Dashboard.tsx
- **Purpose**: Main user interface for agent management
- **Features**:
  - Real-time agent status display
  - Command sending interface
  - System information visualization
  - Agent health monitoring

#### AdminPanel.tsx
- **Purpose**: Administrative interface
- **Features**:
  - User role management
  - Agent monitoring across all users
  - Email credential setup
  - File upload management

#### Authentication Components
- **Login.tsx**: User authentication
- **Register.tsx**: New user registration with OTP
- **ForgotPassword.tsx**: Password reset flow

*[Suggested Image: Component hierarchy diagram showing parent-child relationships]*

---

## 🗄️ Database Schema

### MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  password: "$2b$12$...", // Bcrypt hash
  phone: "+1234567890",
  parentName: "John Doe",
  role: "user", // "user" | "admin"
  created_at: ISODate("2024-01-01T00:00:00Z")
}
```

#### Agents Collection
```javascript
{
  _id: ObjectId,
  agent_id: "ABC123", // Unique identifier
  name: "DESKTOP-ABC123", // Display name
  agent_token: "secure-random-token", // For authentication
  linked_user_id: "user_id", // Owner user ID
  linked_at: ISODate,
  last_heartbeat: ISODate,
  system_info: {
    os: "Windows 11 Pro",
    os_version: "21H2",
    cpu: "Intel(R) Core(TM) i7-9750H",
    cpu_cores: 6,
    memory_total: "16GB",
    memory_used: "8GB",
    disk_total: "512GB",
    disk_used: "256GB",
    hostname: "DESKTOP-ABC123",
    ip_address: "192.168.1.100",
    cpuUsage: 45.2
  },
  pending_commands: ["lock_screen", "shutdown -t 60"]
}
```

#### Downloads Collection
```javascript
{
  _id: ObjectId,
  name: "ControlIt Agent v1.0",
  version: "1.0.0",
  size: "15.2 MB",
  description: "Latest agent client for remote management",
  filename: "uuid_filename.exe",
  originalFilename: "ControlItAgent.exe",
  uploadedDate: ISODate,
  uploadedBy: "user_id",
  active: true
}
```

*[Suggested Image: Database ER diagram showing collections and relationships]*

---

## 🔐 Authentication & Security

### JWT Implementation

#### Token Generation
```python
token_payload = {
    'user_id': str(user["_id"]),
    'email': user["email"],
    'role': user.get("role", "user"),
    'is_admin': user.get("role", "user") == "admin",
    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
}
token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm='HS256')
```

#### Token Validation
```python
def require_jwt(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({"error": "Missing token"}), 401

        try:
            payload = jwt.decode(token.split(' ')[1], JWT_SECRET_KEY, algorithms=['HS256'])
            request.user_id = payload['user_id']
            request.user_role = payload.get('role', 'user')
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
    return wrapper
```

### Password Security

#### Password Policy
- Minimum 8 characters
- At least one uppercase letter
- At least one special character
- Bcrypt hashing with salt

#### Password Validation
```python
password_policy = r"^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':\\\"\\|,.<>\/?]).{8,}$"
if not re.match(password_policy, password):
    return jsonify({"message": "Password does not meet requirements"}), 400
```

### OTP System

#### SMS-based Authentication
- Uses external SMS service for OTP delivery
- 6-digit OTP with expiration
- Rate limiting and attempt validation

#### OTP Flow
1. User requests OTP with email/phone
2. System generates and sends OTP
3. User verifies OTP within time limit
4. OTP cleared after successful verification

*[Suggested Image: Security architecture diagram showing authentication layers]*

---

## 🤖 Agent System

### Agent Lifecycle

#### Phase 1: Registration
```
Agent Client                    Server
     │                            │
     │  POST /api/agent/register  │
     │  {agent_id: "ABC123"}      │
     │───────────────────────────►│
     │                            │
     │  200 OK                    │
     │  {registered: true}        │
     │◄───────────────────────────┘
```

#### Phase 2: Linking
```
User (Browser)                 Server                     Agent
     │                           │                        │
     │  1. Login to dashboard    │                        │
     │──────────────────────────►│                        │
     │                           │                        │
     │  2. Click "Link Agent"    │                        │
     │  GET /login/agent/link?   │                        │
     │     agent_id=ABC123       │                        │
     │──────────────────────────►│                        │
     │                           │                        │
     │  3. Login form shown      │                        │
     │◄──────────────────────────│                        │
     │                           │                        │
     │  4. User logs in          │                        │
     │  POST /api/login          │                        │
     │──────────────────────────►│                        │
     │                           │                        │
     │  5. JWT returned          │                        │
     │◄──────────────────────────│                        │
     │                           │                        │
     │  6. Link agent            │                        │
     │  POST /api/agent/link     │                        │
     │  {agent_id, user_id}      │                        │
     │──────────────────────────►│                        │
     │                           │                        │
     │  7. Agent token generated │                        │
     │  200 {agent_token: "..."} │                        │
     │◄──────────────────────────│                        │
     │                           │                        │
     │  8. Success message       │                        │
     │◄──────────────────────────│                        │
     │                           │                        │
     │  9. Agent polls status    │                        │
     │  GET /api/agent/status/   │                        │
     │     ABC123                 │                        │
     │──────────────────────────►│                        │
     │                           │                        │
     │  10. Token returned       │                        │
     │  {linked: true,           │                        │
     │   agent_token: "..."}      │                        │
     │◄──────────────────────────│                        │
     │                           │                        │
     │  11. Agent starts         │                        │
     │     heartbeats            │                        │
     │──────────────────────────►│                        │
```

#### Phase 3: Operation
```
Agent Client                    Server
     │                            │
     │  POST /api/agent/heartbeat │
     │  Authorization: Bearer     │
     │  {agent_id, system_info}   │
     │───────────────────────────►│
     │                            │
     │  200 OK                    │
     │  {commands: [...]}         │
     │◄───────────────────────────┘
     │                            │
     │  [Execute commands]        │
     │                            │
     │  [Send next heartbeat]     │
     │────────────────────────────┘
```

### Command System

#### Supported Commands
- `lock_screen` - Lock the workstation
- `shutdown` - Shutdown the system
- `shutdown -t {seconds}` - Delayed shutdown
- `custom_command:param1:param2` - Custom commands

#### Command Execution Flow
1. User sends command via dashboard
2. Command stored in agent's `pending_commands` array
3. Agent receives commands in next heartbeat response
4. Agent executes commands and clears from server
5. Agent continues normal heartbeat cycle

*[Suggested Image: Agent lifecycle flowchart showing all phases]*

---

## 🚀 Deployment & DevOps

### Docker Architecture

#### Services
- **mongodb**: MongoDB database with authentication
- **backend**: Flask API server with health checks
- **frontend**: React SPA served by Nginx

#### Docker Compose Configuration
```yaml
services:
  mongodb:
    image: mongo:latest
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      MONGODB_URI: mongodb://admin:password@mongodb:27017/user_database
    depends_on:
      mongodb:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    depends_on:
      - backend
```

### Nginx Configuration

#### Reverse Proxy Setup
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # API proxy to backend
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # React Router fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Environment Variables

#### Backend Environment
```env
MONGODB_URI=mongodb://admin:password@mongodb:27017/user_database
JWT_SECRET_KEY=your-super-secret-jwt-key
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
UPLOAD_FOLDER=/app/uploads
```

#### Frontend Environment
```env
REACT_APP_API_URL=/
```

*[Suggested Image: Docker architecture diagram showing container relationships]*

---

## ⚙️ Setup & Installation

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- MongoDB (for local development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ControlItApp
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost/api/health
   - MongoDB: localhost:27017

### Local Development Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r ../requirements.txt
python routes/backend_api.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Initialization

The application automatically:
- Creates MongoDB database and collections
- Sets up initial admin user (admin@controlit.local / Admin@123)
- Configures indexes and constraints

*[Suggested Image: Setup flowchart showing installation steps]*

---

## 📚 Development Guidelines

### Code Organization

#### Backend Structure
```
backend/
├── routes/
│   └── backend_api.py      # Main API endpoints
├── services/
│   ├── auth_service.py     # Authentication helpers
│   ├── otp_service.py      # OTP functionality
│   ├── credentials_service.py # Email credentials
│   ├── logger_service.py   # Logging configuration
│   └── bootstrap_admin.py  # Admin user setup
└── schema/
    └── user.js            # Database schemas
```

#### Frontend Structure
```
frontend/src/
├── components/            # React components
├── config/
│   └── api.ts            # API configuration
├── hooks/
│   └── useSessionTimeout.ts # Custom hooks
├── services/
│   └── api.ts            # API service layer
└── styles/               # Component styles
```

### Coding Standards

#### Python (Backend)
- Use Flask best practices
- Implement proper error handling
- Use type hints where possible
- Follow PEP 8 style guide

#### TypeScript/React (Frontend)
- Use functional components with hooks
- Implement proper TypeScript types
- Follow React best practices
- Use Material-UI component patterns

### Security Best Practices

#### Input Validation
- Validate all user inputs
- Sanitize file uploads
- Use parameterized queries (MongoDB safe)

#### Authentication
- JWT tokens with expiration
- Secure password hashing
- Role-based access control

#### API Security
- CORS configuration
- Rate limiting (recommended)
- Input sanitization

*[Suggested Image: Code organization diagram showing folder structure]*

---

## 📖 API Reference

### Authentication Endpoints

#### POST /api/login
User authentication endpoint.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful!",
  "token": "jwt_token_here",
  "user_id": "user_id",
  "email": "user@example.com",
  "role": "user",
  "is_admin": false
}
```

#### POST /api/register
User registration with OTP verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password@123",
  "phone": "+1234567890",
  "name": "John Doe"
}
```

### Agent Endpoints

#### POST /api/agent/register
Register a new agent.

**Request Body:**
```json
{
  "agent_id": "ABC123",
  "name": "DESKTOP-ABC123"
}
```

#### POST /api/agent/heartbeat
Agent heartbeat with system information.

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Request Body:**
```json
{
  "agent_id": "ABC123",
  "system_info": {
    "os": "Windows 11",
    "cpu": "Intel i7",
    "memory_total": "16GB"
  }
}
```

**Response:**
```json
{
  "commands": ["lock_screen", "shutdown"]
}
```

### Admin Endpoints

#### GET /api/admin/agents
Get all agents (admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "status": "success",
  "agents": [
    {
      "agent_id": "ABC123",
      "name": "DESKTOP-ABC123",
      "last_heartbeat": "2024-01-01T12:00:00Z",
      "system_info": {...},
      "user_email": "user@example.com"
    }
  ]
}
```

#### POST /api/admin/agent/command
Send command to agent.

**Request Body:**
```json
{
  "agent_id": "ABC123",
  "command": "lock_screen",
  "user_id": "user_id",
  "user_role": "admin"
}
```

---

## 📸 Suggested Images for Documentation

### Architecture & System Design
1. **System Overview Diagram** - High-level architecture showing all components
2. **Component Interaction Diagram** - Detailed service relationships
3. **Database Schema Diagram** - MongoDB collections and relationships
4. **Authentication Flow** - JWT and OTP authentication sequence
5. **Agent Lifecycle Flowchart** - Complete agent registration to operation

### UI/UX Screenshots
6. **Login/Register Pages** - Authentication interface
7. **Dashboard View** - Main user interface with agent cards
8. **Admin Panel** - Administrative management interface
9. **Agent Management** - Agent linking and control interface
10. **Mobile Responsive** - App on different screen sizes

### Development & Deployment
11. **Docker Architecture** - Container relationships
12. **CI/CD Pipeline** - Build and deployment process
13. **Code Structure** - Folder organization diagram
14. **API Documentation** - Swagger/OpenAPI interface

### User Experience
15. **Agent Linking Process** - Step-by-step user flow
16. **Command Execution** - Remote command sending workflow
17. **File Management** - Upload/download interface
18. **Session Management** - Timeout and renewal dialogs

---

## 📞 Support & Contributing

### Issue Reporting
- Use GitHub Issues for bug reports
- Include detailed steps to reproduce
- Provide environment information
- Attach relevant logs and screenshots

### Development Contributions
- Fork the repository
- Create feature branches
- Follow coding standards
- Add tests for new features
- Submit pull requests with descriptions

### Documentation Updates
- Keep this document current
- Add screenshots for new features
- Update API documentation
- Maintain setup instructions

---

**Author**: Anwar Basha  
**Version**: 1.0.0  
**Last Updated**: March 31, 2026  
**License**: Source-available (personal, educational, and development use only)</content>
<parameter name="filePath">c:\ControlIt\ControlItApp\COMPREHENSIVE_CODEBASE_DOCUMENTATION.md