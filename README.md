# 🏥 MediCare
### The Healthcare Administration Console

<p align="center">
  A Modern Digital Healthcare Platform
</p>

<p align="center">
  Connecting Patients, Doctors, and Administrators Through Technology.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk" />
  <img src="https://img.shields.io/badge/Spring_Boot-Backend-6DB33F?style=for-the-badge&logo=springboot" />
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Project-Under_Development-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Architecture-Full_Stack-success?style=flat-square" />
  <img src="https://img.shields.io/badge/Authentication-JWT-black?style=flat-square" />
</p>

---

## 📌 About MediCare

MediCare is a modern, full-stack healthcare platform designed to simplify hospital operations and create seamless interactions between administrators, doctors, and patients.

The project is being migrated from an existing PHP-based application to a modern Java Full Stack architecture powered by React.js, Spring Boot, and PostgreSQL.

MediCare brings essential healthcare operations together through dedicated portals, secure authentication, appointment workflows, patient records, doctor services, and activity notifications.

### 🎯 Our Vision

To create a connected digital healthcare environment that makes everyday hospital operations simpler, more accessible, and more efficient.

---

## ✨ Core Features

### 👨‍💼 Admin Portal

- Admin Dashboard with hospital activity summaries
- Patient Records and Patient Directory
- Doctor Directory
- Appointment Coordination
- Contact Message Management
- Activity Notifications
- Notification Preferences
- Admin Profile Settings
- Password and Security Settings

### 👨‍⚕️ Doctor Portal

- Doctor Dashboard
- Appointment Overview
- Patient Records
- Doctor Profile
- Availability Management
- Activity Notifications
- Prescription Services

### 🧑‍🤝‍🧑 Patient Portal

- Patient Registration and Login
- Doctor Directory
- Appointment Booking
- Appointment Tracking
- Patient Profile
- Medical History
- Prescription History

### 🔐 Authentication & Security

- Spring Security
- JWT-Based Authentication
- Role-Based Access Control
- BCrypt Password Encryption
- Protected Frontend Routes
- OTP-Based Password Reset
- Backend Request Validation

---

## 🛠️ Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React.js | User Interface |
| Vite | Frontend Build Tool |
| JavaScript | Application Logic |
| Tailwind CSS | Styling |
| Axios | HTTP Client |

### Backend

| Technology | Purpose |
|---|---|
| Java 21 | Programming Language |
| Spring Boot | Backend Framework |
| Spring Data JPA | Data Access |
| Hibernate | Object-Relational Mapping |
| Spring Security | Application Security |
| JWT | Authentication |
| REST APIs | Client-Server Communication |
| Maven | Dependency Management |

### Database

| Technology | Purpose |
|---|---|
| PostgreSQL 18 | Relational Database |

### Development Tools

- Visual Studio Code
- IntelliJ IDEA
- Git & GitHub
- Postman
- pgAdmin

---

## 🏗️ System Architecture

MediCare follows a layered full-stack architecture.

```text
             ┌──────────────────────────┐
             │      React Frontend      │
             │                          │
             │   Admin | Doctor | Patient│
             └────────────┬─────────────┘
                          │
                     Axios / HTTP
                       REST APIs
                          │
                          ▼
             ┌──────────────────────────┐
             │    Spring Boot Backend  │
             │                          │
             │       Controllers        │
             │         Services         │
             │       Repositories       │
             │    Spring Security + JWT │
             └────────────┬─────────────┘
                          │
                    Spring Data JPA
                       Hibernate
                          │
                          ▼
             ┌──────────────────────────┐
             │       PostgreSQL 18      │
             │                          │
             │       medicare_db        │
             └──────────────────────────┘
```

---

## 📂 Project Structure

```text
MediCare/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── sections/
│       ├── services/
│       └── App.jsx
│
├── backend/
│   └── medicare-backend/
│       └── src/
│           └── main/
│               ├── java/
│               │   └── com/medicare/backend/
│               │       ├── config/
│               │       ├── controller/
│               │       ├── dto/
│               │       ├── entity/
│               │       ├── repository/
│               │       └── service/
│               │
│               └── resources/
│
├── postman/
├── .gitignore
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Install the following before running MediCare:

- Java JDK 21
- Node.js and npm
- PostgreSQL 18
- Maven
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/patilyogeshofficial/MediCare.git
```

```bash
cd MediCare
```

### 2. Database Configuration

Create the PostgreSQL database:

```sql
CREATE DATABASE medicare_db;
```

Configure the required database credentials and application secrets through environment variables:

```text
DB_USERNAME
DB_PASSWORD
JWT_SECRET
MAIL_USERNAME
MAIL_PASSWORD
```

Never commit actual passwords, JWT secrets, or email credentials to GitHub.

### 3. Run the Backend

Navigate to the backend directory:

```bash
cd backend/medicare-backend
```

Configure the required environment variables and start Spring Boot:

```bash
mvn spring-boot:run
```

Backend URL:

```text
http://localhost:8080
```

### 4. Run the Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## 🔗 Backend API

The backend exposes RESTful endpoints under:

```text
http://localhost:8080/api
```

Available API areas include:

- Authentication
- Admin Dashboard
- Patient Records
- Doctor Directory
- Appointments
- Contact Messages
- Notifications
- Admin Settings
- Medical History
- Password Reset

API requests can be explored and tested using Postman.

---

## 📊 Development Progress

MediCare is actively under development.

| Module | Current Status |
|---|---|
| React Frontend | In Progress |
| Spring Boot Backend | In Progress |
| Database Integration | In Progress |
| Authentication & Authorization | Implemented |
| Admin Dashboard | Implemented |
| Admin Appointments | Implemented |
| Admin Patients | Implemented |
| Admin Doctors | Implemented |
| Admin Contact Messages | Implemented |
| Admin Notifications | Implemented |
| Admin Settings | In Progress |
| Doctor Portal | In Progress |
| Patient Portal | In Progress |
| End-to-End Testing | Pending |

*The progress table will be updated as development continues.*

---

## 🚀 Future Enhancements

- Complete Admin Settings and Hospital Configuration
- Complete Doctor Portal Integration
- Complete Patient Portal Integration
- Prescription Workflow
- Revenue Analytics and Reporting
- Advanced Dashboard Insights
- Comprehensive End-to-End Testing
- Cloud Deployment

---

## 🎯 Project Objectives

- Build a modern digital healthcare platform.
- Develop RESTful APIs using Spring Boot.
- Implement database operations using Hibernate and PostgreSQL.
- Create responsive interfaces using React.js.
- Implement secure authentication and role-based authorization.
- Follow layered architecture and clean coding practices.
- Maintain source code using Git and GitHub.

---

## 👨‍💻 Developer

**Yogesh Patil**

Computer Engineering Graduate | Java Full Stack Developer

- GitHub: [@patilyogeshofficial](https://github.com/patilyogeshofficial)
- Project Repository: [MediCare](https://github.com/patilyogeshofficial/MediCare)

---

<p align="center">
  <strong>Built with ❤️ using Java, React.js, Spring Boot and PostgreSQL.</strong>
</p>

<p align="center">
  MediCare – Simplifying Digital Healthcare Operations.
</p>
