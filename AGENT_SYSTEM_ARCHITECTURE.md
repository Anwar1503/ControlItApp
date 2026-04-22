# Agent System Architecture Guide

## Overview

The ControlIt application implements a sophisticated agent-based architecture where external client applications ("agents") connect to a central server to receive commands and report system information. This guide explains how the client-server communication works through agents.

## Table of Contents

1. [What are Agents?](#what-are-agents)
2. [Agent Architecture](#agent-architecture)
3. [Agent Lifecycle](#agent-lifecycle)
4. [Communication Protocol](#communication-protocol)
5. [Backend Agent Management](#backend-agent-management)
6. [Frontend Agent Management](#frontend-agent-management)
7. [Security Model](#security-model)
8. [Agent Client Implementation](#agent-client-implementation)
9. [Command System](#command-system)
10. [Monitoring and Heartbeats](#monitoring-and-heartbeats)

## What are Agents?

**Agents** are external client applications that run on end-user devices (computers, servers, IoT devices) and connect to the ControlIt server. They:

- **Receive commands** from the server (lock screen, shutdown, etc.)
- **Report system information** (CPU, memory, OS details)
- **Send heartbeat signals** to indicate they're online
- **Execute actions** on behalf of authenticated users

### Agent vs User Authentication

- **Users**: Authenticate via web interface with email/password → get JWT tokens
- **Agents**: Authenticate via unique agent tokens → receive commands from server

## Agent Architecture

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

### Key Components

1. **Agent Client**: Standalone application running on target device
2. **Server API**: REST endpoints for agent communication
3. **Database**: MongoDB collections for agent metadata and commands
4. **Web Interface**: Dashboard for managing agents and sending commands

## Agent Lifecycle

### Phase 1: Agent Registration

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
     │                            │
     │  [Agent waits for linking] │
```

**Code Flow:**
```python
# Agent calls this on startup
response = requests.post(f"{SERVER_URL}/api/agent/register",
    json={"agent_id": agent_id}
)
```

### Phase 2: Agent Linking

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

### Phase 3: Agent Operation

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

## Communication Protocol

### Authentication

**Agent Authentication:**
```http
POST /api/agent/heartbeat
Authorization: Bearer <agent_token>
Content-Type: application/json

{
  "agent_id": "ABC123",
  "system_info": {
    "os": "Windows 11",
    "cpu": "Intel i7",
    "memory": "16GB"
  }
}
```

**User Authentication (for admin operations):**
```http
GET /api/admin/agents
Authorization: Bearer <jwt_token>
```

### Message Formats

#### Heartbeat Request
```json
{
  "agent_id": "unique-agent-identifier",
  "system_info": {
    "os": "Windows 11 Pro",
    "os_version": "21H2",
    "cpu": "Intel(R) Core(TM) i7-9750H",
    "cpu_cores": 6,
    "memory_total": "16GB",
    "memory_used": "8GB",
    "disk_total": "512GB",
    "disk_used": "256GB",
    "hostname": "DESKTOP-ABC123",
    "ip_address": "192.168.1.100"
  }
}
```

#### Heartbeat Response
```json
{
  "commands": [
    "lock_screen",
    "shutdown",
    "custom_command:param1:param2"
  ]
}
```

## Backend Agent Management

### Database Schema

**Agents Collection:**
```javascript
{
  _id: ObjectId,
  agent_id: "ABC123",           // Unique identifier
  agent_token: "secure-random-token", // For authentication
  linked_user_id: "user_id",    // Owner user ID
  linked_at: ISODate,           // When linked
  last_heartbeat: ISODate,      // Last activity
  system_info: {                // Hardware/software info
    os: "Windows 11",
    cpu: "Intel i7",
    memory: "16GB"
  },
  pending_commands: [           // Queue of commands to execute
    "lock_screen",
    "shutdown -t 60"
  ]
}
```

### Key API Endpoints

#### Agent Registration
```python
@app.route('/api/agent/register', methods=['POST'])
def register_agent():
    # Creates agent record, waits for linking
```

#### Agent Linking
```python
@app.route('/api/agent/link', methods=['POST'])
def link_agent():
    # Generates token, links to user
```

#### Agent Authentication Decorator
```python
def require_agent_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization').split(' ')[1]
        agent = agents_collection.find_one({"agent_token": token})
        if not agent:
            return jsonify({"error": "Invalid agent token"}), 401
        request.agent = agent
        return f(*args, **kwargs)
    return wrapper
```

#### Heartbeat Processing
```python
@app.route('/api/agent/heartbeat', methods=['POST'])
@require_agent_auth
def agent_heartbeat():
    # Update system info, return pending commands
    commands = request.agent.get('pending_commands', [])
    # Clear commands after sending
    agents_collection.update_one(
        {"agent_id": request.agent['agent_id']},
        {"$unset": {"pending_commands": ""}}
    )
    return jsonify({"commands": commands})
```

#### Admin Agent Management
```python
@app.route('/api/admin/agents', methods=['GET'])
@require_admin_jwt
def get_agents():
    # Return all agents (admin) or user's agents
```

#### Command Sending
```python
@app.route('/api/admin/agent/command', methods=['POST'])
@require_admin_jwt
def send_agent_command():
    # Add command to agent's pending_commands array
    agents_collection.update_one(
        {"agent_id": agent_id},
        {"$push": {"pending_commands": command}}
    )
```

## Frontend Agent Management

### Agent Linking Flow

1. **Agent Generates Link:**
   ```
   http://localhost/login/agent/link?agent_id=ABC123
   ```

2. **User Authentication:**
   - User visits link → sees login form
   - User logs in → server validates credentials
   - Server links agent to user account
   - Success message shown

3. **Agent Polling:**
   - Agent periodically checks `/api/agent/status/{agent_id}`
   - Once linked, receives `agent_token`
   - Starts sending heartbeats

### Admin Dashboard

```typescript
const AdminPanel: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);

  const fetchAgents = async () => {
    const response = await axios.get(`${API_BASE}/api/admin/agents`);
    setAgents(response.data.agents);
  };

  const sendCommand = async (agentId: string, command: string) => {
    await axios.post(`${API_BASE}/api/admin/agent/command`, {
      agent_id: agentId,
      command: command,
      user_id: localStorage.getItem('user_id'),
      user_role: localStorage.getItem('is_admin') ? 'admin' : 'user'
    });
  };
};
```

## Security Model

### Agent Authentication
- **Token-based**: Each agent has unique 32-character token
- **Database validation**: Tokens stored in MongoDB, validated on each request
- **No expiration**: Tokens remain valid until manually regenerated

### User Authorization
- **JWT-based**: Users authenticate via web interface
- **Role-based**: Admin vs regular users
- **Command authorization**: Users can only command their own agents (unless admin)

### Network Security
- **HTTPS required**: All communication should use TLS
- **Token in headers**: Bearer token authentication
- **CORS protection**: Restrict origins to trusted domains

### Command Security
- **Sanitized input**: Commands validated before execution
- **User ownership**: Agents only accept commands from linked user
- **Audit logging**: All commands logged with timestamps

## Agent Client Implementation

### Basic Agent Client Structure

```python
import requests
import time
import platform
import psutil
import uuid

class ControlItAgent:
    def __init__(self, server_url: str):
        self.server_url = server_url
        self.agent_id = str(uuid.uuid4())[:8].upper()  # ABC123
        self.agent_token = None
        self.is_linked = False

    def register(self):
        """Register agent with server"""
        pc_name = platform.node()
        response = requests.post(f"{self.server_url}/api/agent/register",
            json={"agent_id": self.agent_id, "name": pc_name}
        )
        return response.json()

    def check_link_status(self):
        """Check if agent has been linked"""
        response = requests.get(f"{self.server_url}/api/agent/status/{self.agent_id}")
        data = response.json()
        if data.get('linked'):
            self.agent_token = data['agent_token']
            self.is_linked = True
        return data

    def get_system_info(self):
        """Collect system information"""
        return {
            "os": platform.system(),
            "os_version": platform.version(),
            "cpu": platform.processor(),
            "cpu_cores": psutil.cpu_count(),
            "memory_total": f"{psutil.virtual_memory().total // (1024**3)}GB",
            "memory_used": f"{psutil.virtual_memory().used // (1024**3)}GB",
            "hostname": platform.node()
        }

    def send_heartbeat(self):
        """Send heartbeat with system info"""
        if not self.agent_token:
            return

        headers = {"Authorization": f"Bearer {self.agent_token}"}
        system_info = self.get_system_info()

        response = requests.post(f"{self.server_url}/api/agent/heartbeat",
            json={
                "agent_id": self.agent_id,
                "system_info": system_info
            },
            headers=headers
        )

        commands = response.json().get('commands', [])
        self.execute_commands(commands)

    def execute_commands(self, commands):
        """Execute received commands"""
        for command in commands:
            if command == "lock_screen":
                self.lock_screen()
            elif command == "shutdown":
                self.shutdown()
            # Add more commands...

    def lock_screen(self):
        """Lock the screen"""
        if platform.system() == "Windows":
            import ctypes
            ctypes.windll.user32.LockWorkStation()
        # Add Linux/Mac implementations...

    def run(self):
        """Main agent loop"""
        print(f"Agent {self.agent_id} starting...")

        # Register agent
        self.register()
        print(f"Agent registered. Link at: {self.server_url}/login/agent/link?agent_id={self.agent_id}")

        # Wait for linking
        while not self.is_linked:
            status = self.check_link_status()
            if status.get('linked'):
                print("Agent linked! Starting heartbeats...")
                break
            time.sleep(5)  # Check every 5 seconds

        # Main heartbeat loop
        while True:
            self.send_heartbeat()
            time.sleep(10)  # Heartbeat every 10 seconds

if __name__ == "__main__":
    agent = ControlItAgent("http://localhost:5000")
    agent.run()
```

### Agent Installation

1. **Generate executable:**
   ```bash
   pyinstaller --onefile agent.py
   ```

2. **Auto-start on boot:**
   - Windows: Add to Startup folder
   - Linux: Create systemd service
   - Mac: LaunchAgent plist

3. **Silent operation:**
   - No console window
   - Background process
   - Error logging to file

## Command System

### Built-in Commands

| Command | Description | Platform |
|---------|-------------|----------|
| `lock_screen` | Lock workstation | Windows/Linux/Mac |
| `shutdown` | Shutdown system | All |
| `restart` | Restart system | All |
| `logout` | Log out user | All |
| `hibernate` | Hibernate system | Windows/Linux |

### Custom Commands

```json
{
  "command": "custom_command:param1:param2",
  "timeout": 30,
  "user": "admin"
}
```

### Command Execution Flow

1. **Admin sends command** via web interface
2. **Server queues command** in agent's `pending_commands` array
3. **Agent receives command** in next heartbeat response
4. **Agent executes command** locally
5. **Agent reports result** in next heartbeat (optional)

## Monitoring and Heartbeats

### Heartbeat Data

```json
{
  "agent_id": "ABC123",
  "timestamp": "2024-01-15T10:30:00Z",
  "system_info": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "disk_usage": 234.5,
    "network_connections": 12
  },
  "status": "online",
  "last_command_executed": "lock_screen",
  "command_result": "success"
}
```

### Monitoring Dashboard

- **Real-time status**: Online/offline indicators
- **System metrics**: CPU, memory, disk usage
- **Command history**: Last executed commands
- **Alert system**: Offline agents, failed commands

### Heartbeat Intervals

- **Normal operation**: 10 seconds
- **High-frequency mode**: 5 seconds (during active commands)
- **Low-power mode**: 5 minutes (when idle)

## Troubleshooting

### Agent Won't Link

1. Check agent registration: `GET /api/agent/status/{agent_id}`
2. Verify user authentication
3. Check server logs for errors
4. Ensure agent_id format is correct

### Commands Not Executing

1. Verify agent is sending heartbeats
2. Check command queue in database
3. Validate agent token authentication
4. Review agent logs for execution errors

### Authentication Failures

1. Check token format: `Bearer <token>`
2. Verify token exists in database
3. Check token expiration (if implemented)
4. Validate JWT signature (for user auth)

## Future Enhancements

### Advanced Features
- **Bi-directional communication**: WebSocket support
- **File transfer**: Send/receive files between server and agents
- **Remote desktop**: VNC/screen sharing capabilities
- **Plugin system**: Extensible command architecture

### Scalability
- **Load balancing**: Multiple server instances
- **Message queuing**: Redis/RabbitMQ for commands
- **Database sharding**: Horizontal scaling support

### Security
- **Token rotation**: Automatic token renewal
- **End-to-end encryption**: Encrypted command payloads
- **Audit trails**: Comprehensive logging and monitoring

This agent system provides a robust foundation for remote device management with proper authentication, authorization, and monitoring capabilities.</content>
<parameter name="filePath">c:\ControlIt\ControlItApp\AGENT_SYSTEM_ARCHITECTURE.md