# ControlItApp

## 📌 Overview
This project is built for learning and development purposes.
It showcases practical implementation of concepts and is intended
to be used as a reference or for personal experimentation.

## 🚀 Features
- Clean and modular code
- Focus on real-world development practices
- Easy to understand and extend
- **Remote Agent Management**: Server-side API for remote client management

## 🛠 Tech Stack
- TypeScript / Python / React
- Git & GitHub
- MongoDB for data storage
- Flask for backend API

## 🔒 License & Usage
This project is **source-available**.

You are allowed to:
- View the source code
- Use and modify it for **personal, educational, and development purposes**

You are **NOT allowed** to:
- Use this project for commercial purposes
- Sell, sublicense, or redistribute it without permission

See the `LICENSE` file for full details.

## 🤝 Contributions
Contributions are currently not accepted.
If you’d like to discuss ideas or improvements, feel free to open an issue.

## � Agent System

### Overview
The ControlIt agent system provides server-side APIs for remote management of client machines. The client agents run separately and connect to this server for monitoring and control.

### Server Features
- **Secure Linking**: Browser-based authentication to link agents to user accounts
- **Real-time Monitoring**: Receives system information from connected agents
- **Remote Commands**: Send commands (lock, shutdown, get info) to connected agents
- **Admin Management**: Web interface for viewing and controlling linked agents

### API Endpoints
- `POST /api/agent/link` - Links agent to user account
- `GET /api/agent/status/{agent_id}` - Polls linking status
- `POST /api/agent/heartbeat` - Receives heartbeats and sends commands
- `GET /api/admin/agents` - Admin view of all linked agents
- `POST /api/admin/agent/command` - Send commands to agents

### Agent Linking Process
1. Agent opens browser to `/login/agent/link?agent_id={agent_id}`
2. User logs in through the web interface
3. Agent polls `/api/agent/status/{agent_id}` for linking completion
4. Once linked, agent receives authentication token
5. Agent begins sending heartbeats with system information

### Admin Panel
Administrators can view linked agents and send commands through the admin panel at `/admin`.

## �👤 Author
**Anwar Basha**  
Software Engineer | Bengaluru 🇮🇳
