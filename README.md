<<<<<<< HEAD
# GrievEase — Backend

Smart Grievance Redressal System using NLP-based Priority Classification.
Node.js + Express + MongoDB backend with a rule-based NLP priority scoring engine.

## Folder Structure

```
grievease-backend/
├── server.js                  # Entry point
├── package.json
├── .env.example                # Copy to .env and fill in values
├── config/
│   └── db.js                   # MongoDB connection
├── models/
│   ├── User.js                 # User schema (student/staff/admin)
│   └── Complaint.js            # Complaint schema
├── controllers/
│   ├── authController.js       # register, login
│   └── complaintController.js  # create, list, status update
├── routes/
│   ├── authRoutes.js
│   └── complaintRoutes.js
├── middleware/
│   ├── authMiddleware.js       # JWT verification
│   └── roleMiddleware.js       # Role-based access control
├── services/
│   └── nlpService.js           # Keyword + sentiment priority scoring
└── utils/
    └── priorityWeights.js      # Tunable keyword lists & scoring weights
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/grievease
   JWT_SECRET=your_long_random_secret
   JWT_EXPIRES_IN=7d
   ```

3. Start MongoDB locally (or use MongoDB Atlas and paste the connection string into `MONGO_URI`).

4. Run the server:
   ```
   npm run dev     # with nodemon (auto-restart)
   npm start       # plain node
   ```

5. Server runs at `http://localhost:5000`.

## Creating an Admin User

Public registration only allows `student` or `staff` roles (see `authController.js`).
To create an admin, register a normal user first, then manually update their role in MongoDB:

```js
db.users.updateOne({ email: "admin@college.edu" }, { $set: { role: "admin" } })
```

## API Endpoints

| Method | Route                        | Access         | Purpose                              |
|--------|-------------------------------|----------------|---------------------------------------|
| POST   | /api/auth/register            | Public         | Register student/staff                |
| POST   | /api/auth/login               | Public         | Login, returns JWT                    |
| POST   | /api/complaints                | Student/Staff  | Submit complaint (auto NLP scoring)   |
| GET    | /api/complaints/mine           | Student/Staff  | View own complaint history            |
| GET    | /api/complaints?station=&status= | Admin        | View priority-sorted queue            |
| GET    | /api/complaints/:id            | Owner/Admin    | View single complaint                 |
| PATCH  | /api/complaints/:id/status     | Admin          | Update status (Open/In Progress/Resolved) |

All routes except `/api/auth/*` require:
```
Authorization: Bearer <token>
```

## Example: Submit a Complaint

```
POST /api/complaints
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Water leakage in hostel bathroom",
  "description": "The bathroom tap has been leaking continuously since morning, water is flooding the floor.",
  "station": "Hostel"
}
```

Response:
```json
{
  "message": "Complaint submitted successfully",
  "ticketId": "665f1c2e8a1b2c3d4e5f6789",
  "priorityLevel": "Critical",
  "status": "Open"
}
```

## How Priority Scoring Works

See `services/nlpService.js` and `utils/priorityWeights.js`. The engine combines:
1. **Keyword severity** — weighted domain keywords (e.g. "leaking", "fire", "not working")
2. **Sentiment analysis** — VADER compound score; more negative tone → higher urgency
3. **Station base weight** — small tunable weight per station (e.g. Hostel/Main Gate slightly higher than Classroom)

These combine into a single score, mapped to a priority label:
`Critical` (≥8) → `High` (≥6) → `Medium` (≥3) → `Low` (below 3)

Adjust keyword lists, weights, and thresholds in `utils/priorityWeights.js` without touching the scoring logic.

## Notes

- Passwords are hashed with bcrypt before storage.
- JWT is used for stateless authentication.
- The NLP engine runs entirely offline/synchronously — no external API calls, so it's fast and reliable for demos.
=======
# GrievEase
GrievEase is a web-based complaint system for campuses. Students/staff report issues by station; NLP (keyword + sentiment analysis) auto-assigns priority (Low–Critical). Built with Node.js, Express, MongoDB, React. Admins resolve by urgency, not order received, ensuring faster action on critical issues.
>>>>>>> origin/main
