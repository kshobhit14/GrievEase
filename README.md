# GrievEase

GrievEase is an intelligent complaint management system designed for educational institutions. It provides a centralized platform where students and staff can submit complaints, track complaint progress, and receive real-time updates.

The system combines a modern React frontend, Node.js/Express backend, MongoDB database, WebSocket-based real-time communication, and a Python Machine Learning service for automated complaint classification and priority prediction.

---

# 📖 Project Overview

Traditional complaint management systems often rely on manual processing and periodic updates. This can make it difficult for students to know whether their complaints have been received, processed, or resolved.

GrievEase addresses this problem by providing:

- A centralized complaint management platform
- Secure user authentication
- Role-based access control
- Automated complaint classification
- Automated priority prediction
- Real-time complaint updates
- Administrative complaint management
- Persistent complaint records using MongoDB

The application follows a distributed architecture where the frontend, backend, database, and Machine Learning service work together.

---

# 🛠️ Tech Stack Overview

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS, JavaScript, Axios |
| **Backend** | Node.js, Express.js, REST APIs |
| **Real-Time Communication** | WebSockets |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JWT, bcrypt |
| **Machine Learning** | Python, FastAPI, NLP, Text Classification |
| **ML Tasks** | Complaint Category Prediction, Priority Prediction |
| **API Communication** | REST API, HTTP |
| **Testing** | Thunder Client, Postman |
| **Database Management** | MongoDB Compass |
| **Version Control** | Git, GitHub |
| **Development Environment** | Visual Studio Code |

------

# 🚀 Key Features

## 👤 User Management

- User registration
- User login
- JWT-based authentication
- Role-based authorization
- Student, Staff, and Admin roles

## 📝 Complaint Management

- Submit complaints
- View submitted complaints
- Track complaint status
- View individual complaint details
- Admin complaint management
- Complaint status updates
- Complaint categorization
- Complaint priority classification

## 🤖 Machine Learning

- Automatic complaint category prediction
- Automatic complaint priority prediction
- Natural Language Processing
- Python-based ML service
- Backend-to-ML-service communication through HTTP APIs

## ⚡ Real-Time Communication

- WebSocket-based communication
- Real-time complaint access
- Live complaint updates
- Real-time complaint status changes
- Live synchronization between connected clients
- Reduced dependency on repeated API polling

## 🗄️ Database

- MongoDB database
- Mongoose ODM
- Persistent complaint storage
- Persistent user information
- Complaint status and resolution tracking

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────────┐
                         │      React Frontend      │
                         │      Vite + Tailwind     │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                      REST API                WebSocket
                         │                         │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │     Node.js Backend      │
                         │   Express + WebSocket    │
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
         ┌──────────────────────┐            ┌──────────────────────┐
         │       MongoDB        │            │     ML Service       │
         │      Database        │            │   Python + FastAPI   │
         └──────────────────────┘            └──────────────────────┘

-------

# Application - Workflow
                    User
                     │
                     ▼
              Login / Register
                     │
                     ▼
              Submit Complaint
                     │
                     ▼
              React Frontend
                     │
                     │ REST API
                     ▼
              Node.js Backend
                     │
             ┌───────┴────────┐
             │                │
             ▼                ▼
        MongoDB          ML Service
             │                │
             │          ┌─────┴─────┐
             │          │           │
             │       Category    Priority
             │          │           │
             │          └─────┬─────┘
             │                │
             └────────┬───────┘
                      ▼
               Complaint Record
                      │
                      ▼
                Admin Dashboard
                      │
                      ▼
              Status Management
                      │
                      ▼
             Real-Time WebSocket
                      │
                      ▼
              Connected Clients
