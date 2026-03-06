# Tuition Center Management System

A comprehensive, role-based, ERP-like web application designed to streamline the operations of tuition centers. This system allows administrators to manage students, track fees, record attendance, and communicate with students and parents efficiently.

## 🌟 Key Features

### 👥 Role-Based Access Control
* **Admin Portal**: Complete control over all aspects of the tuition center.
* **Student Portal**: Access to personal attendance, fee history, and notices.
* **Parent Portal**: Track your child's progress, attendance, and fee dues.

### 🎓 Student Management (Phase 2 Enhanced)
* Comprehensive registration process capturing detailed student and guardian information.
* Auto-generation of unique `student_code` and secure login credentials for both student and parent upon registration.
* Advanced, sortable, and filterable data tables with bulk actions.
* Quick actions for viewing profiles, editing details, updating account status (Active/Inactive), and soft deleting.

### 💰 Fee Management
* Record and track fee payments.
* Generate and export fee receipts.
* Monitor outstanding dues.

### 📅 Attendance Tracking
* Daily attendance logging.
* Visual attendance reports and statistics.

### 📢 Notice Board
* Broadcast importance announcements to students and parents.

## 🛠️ Tech Stack

### Frontend
* **React 18** + **Vite**: Fast, modern frontend framework.
* **Tailwind CSS**: Utility-first CSS framework for a beautiful, responsive, and custom design.
* **React Router v6**: For seamless navigation.
* **Lucide React**: Clean, modern icons.
* **Zustand / Context API**: State management.
* **Axios**: HTTP client for API requests.

### Backend
* **Node.js** + **Express.js**: Robust backend server.
* **PostgreSQL**: Relational database for structured data storage.
* **Sequelize / pg**: ORM/Driver for database interactions.
* **JWT (JSON Web Tokens)**: Secure authentication and authorization.
* **Bcrypt**: Password hashing for security.

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* PostgreSQL installed and running

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aaniket21/tuition_management.git
   cd tuition_management
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   * Create a `.env` file in the `backend` directory based on `.env.example` (if available) and configure your database credentials and JWT secret.
   * Start the backend server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   # Open a new terminal
   cd frontend
   npm install
   ```
   * Create a `.env` file in the `frontend` directory and add the backend API URL:
     `VITE_API_URL=http://localhost:5000/api` (Adjust port if different)
   * Start the frontend development server:
   ```bash
   npm run dev
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:5173`.

## 📸 Screenshots

*(Add screenshots of your beautiful UI here)*

## 📄 License

This project is licensed under the MIT License.
