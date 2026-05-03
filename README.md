# Ethara AI Task Manager

A JIRA-like full-stack task management application with role-based access control, Kanban board, and employee management.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access: Admin and Member
- First user registered becomes Admin

### 👑 Admin Features
- Create and manage projects
- Add/remove employees
- Assign tasks to employees
- View full system dashboard
- Manage all tasks

### 👨‍💻 Employee Features
- View assigned tasks
- Update task status (To Do → In Progress → Done)
- Kanban board with drag & drop
- View project details

### 📁 Core Functionality
- **Projects**: Admin creates projects, assigns employees
- **Tasks**: Title, description, priority (Low/Medium/High), status, due date, assignee
- **Kanban Board**: Drag & drop tasks between columns
- **Dashboard**: Role-specific views

## Tech Stack

- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Frontend**: Next.js, React, TypeScript, Framer Motion
- **Deployment**: Railway (Backend + DB + Frontend)

## Setup (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend Setup
1. Navigate to `backend/` directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your database URL and JWT secret
5. Generate Prisma client and push schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
6. Start the backend:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to `frontend/` directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
4. Update `NEXT_PUBLIC_API_URL` if needed (defaults to `http://localhost:4001`)
5. Start the frontend:
   ```bash
   npm run dev
   ```

## Deployment on Railway

### 1. Backend Deployment
1. Create a new Railway project
2. Connect your GitHub repository
3. Add PostgreSQL database service
4. Set environment variables in Railway:
   - `DATABASE_URL`: Your Railway PostgreSQL URL
   - `JWT_SECRET`: A secure random string
   - `PORT`: 4001 (or Railway's default)
5. Deploy the backend service

### 2. Frontend Deployment
1. In the same Railway project, add a new service
2. Connect the frontend code
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend Railway URL
4. Deploy the frontend service

### 3. Database Migration
After backend deployment, run:
```bash
railway run npx prisma db push
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/users` - Get all users (Admin only)
- `POST /api/auth/users` - Add new employee (Admin only)
- `DELETE /api/auth/users/:id` - Remove employee (Admin only)

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create project (Admin only)
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project (Admin only)
- `DELETE /api/projects/:id` - Delete project (Admin only)
- `POST /api/projects/:id/members` - Add member to project (Admin only)
- `DELETE /api/projects/:id/members/:memberId` - Remove member (Admin only)

### Tasks
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create task (Admin only)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (Admin only)

## Usage

1. **Register**: First user becomes Admin
2. **Login**: Use email and password
3. **Admin**: Create projects, add employees, assign tasks
4. **Employee**: View and update assigned tasks via Kanban board

## Screenshots

(Add screenshots of the app here)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

## License

MIT License
