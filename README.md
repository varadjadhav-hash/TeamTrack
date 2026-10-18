# 🚀 TeamMaker — Team Building & Project Collaboration Platform

**TeamMaker** is a modern full-stack web application designed for students and industry professionals to form teams, collaborate on projects, track milestones, and manage task lifecycles with real-time dynamic progress calculation.

---

## 🌟 Key Features

1. **Two Account Types**:
   - 🎓 **Student**: Tailored for college/university teams, capstone projects, and study groups.
   - 💼 **Company Employee**: Built for enterprise squads, engineering teams, and corporate initiatives.
2. **Authentication & Security**:
   - Secure registration, login, and JWT-authenticated protected routes.
   - Passwords hashed using `bcrypt` (10 salt rounds).
   - Automatic session validation and expiration handling.
3. **Team Building & Invitation System**:
   - Create squads with custom mission statements.
   - Automatic generation of unique 6-character uppercase invite codes (e.g., `0B8004`).
   - 1-click invite code copying with visual feedback.
   - Instant onboarding via invite codes.
4. **Project Collaboration & Kanban Boards**:
   - Team leaders create projects with targeted deadlines and descriptions.
   - Tasks support **To Do**, **In Progress**, and **Completed** statuses.
   - Assign tasks to any verified squad member.
   - Real-time project completion progress dynamically computed from task completion ratios:
     $$\text{Progress} = \text{round}\left(\frac{\text{Completed Tasks}}{\text{Total Tasks}} \times 100\right)\%$$
5. **Strict Role-Based Access Control (RBAC)**:
   - Unauthorized users cannot view or edit teams or projects they don't belong to.
   - Only team leaders can create/delete projects and manage squad memberships.
   - Team members collaborate on tasks and advance milestone states.
6. **Polished SaaS UI/UX**:
   - Responsive layout built with React, Vite, Tailwind CSS, and Lucide icons.
   - Live KPI metric cards, progress indicators, modal dialogs, and non-blocking toast alerts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v7 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas / Local MongoDB, Mongoose ODM |
| **Auth & Security** | JSON Web Tokens (JWT), Bcrypt.js, CORS, Dotenv |

---

## 📁 Project Structure

```
teammaker/
├── backend/
│   ├── config/
│   │   └── db.js                 # Mongoose connection logic
│   ├── controllers/
│   │   ├── authController.js      # Register, login, getMe, updateProfile
│   │   ├── teamController.js      # Create, list, join by code, delete
│   │   ├── projectController.js   # Project creation & computed progress
│   │   ├── taskController.js      # Task creation, assignment & status updates
│   │   └── dashboardController.js # Aggregated metrics & user tasks
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT token verification
│   ├── models/
│   │   ├── User.js               # User schema (Student vs Company Employee)
│   │   ├── Team.js               # Team schema with members & inviteCode
│   │   ├── Project.js            # Project schema
│   │   └── Task.js               # Task schema (To Do, In Progress, Completed)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── teamRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── dashboardRoutes.js
│   ├── .env                      # Environment configuration (active)
│   ├── .env.example              # Credentials template
│   ├── package.json
│   └── server.js                 # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosClient.js    # Axios with JWT bearer interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state & token storage
│   │   ├── components/
│   │   │   ├── Alert.jsx         # Non-blocking alert/toast banners
│   │   │   ├── Modal.jsx         # Accessible modal dialog
│   │   │   ├── Navbar.jsx        # Navigation bar with role badges
│   │   │   ├── Sidebar.jsx       # Responsive sidebar navigation
│   │   │   ├── ProgressBar.jsx   # Dynamic progress bar
│   │   │   ├── LoadingSpinner.jsx# Sleek spinner animation
│   │   │   └── ProtectedRoute.jsx# Auth route guard
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Sign-in with demo quick-fills
│   │   │   ├── Register.jsx      # Role selector (Student / Employee)
│   │   │   ├── Dashboard.jsx     # Overview with KPIs & quick status changer
│   │   │   ├── Teams.jsx         # Squad cards & invite code copier
│   │   │   ├── TeamDetails.jsx   # Projects list & member management
│   │   │   ├── ProjectDetails.jsx# 3-column Kanban board (To Do, In Prog, Done)
│   │   │   └── Profile.jsx       # User profile editor
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind base & custom scrollbars
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚡ Windows PowerShell Setup Instructions

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB**: Either local MongoDB server (`mongodb://localhost:27017/teammaker`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

---

### 2. Configure Backend Environment

Navigate to the backend directory and set up `.env`:

```powershell
cd C:\Users\VARAD\.gemini\antigravity\scratch\teammaker\backend
Copy-Item .env.example .env
```

Your `.env` file should have:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/teammaker
# If using MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/teammaker?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_teammaker_2026_dev_secure
CLIENT_URL=http://localhost:5173
```

---

### 3. Install Dependencies & Start the Backend

Open a **Windows PowerShell** window:

```powershell
# Navigate to backend
cd C:\Users\VARAD\.gemini\antigravity\scratch\teammaker\backend

# Install backend dependencies
npm install

# Start the Express server
npm start
```
You will see:
```
🚀 TeamMaker Backend Server running on port 5000
✅ MongoDB Connected: localhost / DB: teammaker
```

---

### 4. Install Dependencies & Start the Frontend

Open a **second Windows PowerShell** window:

```powershell
# Navigate to frontend
cd C:\Users\VARAD\.gemini\antigravity\scratch\teammaker\frontend

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```
You will see:
```
  VITE v8.3.4  ready in 646 ms

  ➜  Local:   http://localhost:5173/
```

Open your browser to: **`http://localhost:5173`**

---

## 🧪 Pre-configured Test Accounts

You can either register new accounts or use the built-in quick test buttons on the login screen:

| Account Type | Email | Password | Role | Organization |
|---|---|---|---|---|
| **Student (Leader)** | `alice@university.edu` | `password123` | Student | Stanford University |
| **Employee (Member)**| `bob@techcorp.com` | `password123` | Company Employee | TechCorp Inc. |

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a Student or Company Employee account.
- `POST /api/auth/login` — Login and receive JWT token.
- `GET /api/auth/me` *(Protected)* — Retrieve currently authenticated user.
- `PUT /api/auth/profile` *(Protected)* — Update profile, organization, bio, and skills.

### Teams (`/api/teams`)
- `POST /api/teams` *(Protected)* — Create a team; creator becomes Leader and receives unique 6-character `inviteCode`.
- `GET /api/teams` *(Protected)* — List all teams the current user is part of.
- `GET /api/teams/:id` *(Protected)* — Team details with members and projects.
- `POST /api/teams/join` *(Protected)* — Join a team using 6-character `inviteCode`.
- `DELETE /api/teams/:id/members/:userId` *(Protected)* — Remove member (Leader only) or leave team.
- `DELETE /api/teams/:id` *(Protected)* — Delete team and associated projects/tasks (Leader only).

### Projects (`/api/projects`)
- `POST /api/projects` *(Protected, Leader only)* — Create a project for a team.
- `GET /api/projects/team/:teamId` *(Protected)* — List projects for a team with computed completion %.
- `GET /api/projects/:id` *(Protected)* — Get project details, task board, and real-time completion %.
- `PUT /api/projects/:id` *(Protected, Leader only)* — Update project details.
- `DELETE /api/projects/:id` *(Protected, Leader only)* — Delete project and its tasks.

### Tasks (`/api/tasks`)
- `POST /api/tasks` *(Protected)* — Create and assign a task to a team member.
- `GET /api/tasks/project/:projectId` *(Protected)* — List tasks for a project.
- `PATCH /api/tasks/:id/status` *(Protected)* — Move task between `To Do`, `In Progress`, and `Completed`.
- `PUT /api/tasks/:id` *(Protected)* — Edit task title, description, priority, or due date.
- `DELETE /api/tasks/:id` *(Protected)* — Delete task (Creator or Leader).

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` *(Protected)* — Returns metrics: total teams, active projects, tasks breakdown, and completion rate.
# TeamTrack
