# GrievEase backend

GrievEase is a station-based campus grievance system. Students, staff, and parents submit complaints; each station has a dedicated admin who can see and resolve only that station's queue.

## Services and ports

| Service | Default port |
| --- | ---: |
| React frontend | 5173 |
| Express API and Socket.IO | 8000 |
| Flask ML service | 5000 |
| MongoDB | 27017 |

Copy `.env.example` to `.env`, set a strong `JWT_SECRET`, then run `npm install` and `npm run dev`. The ML service URL is configured with `ML_SERVICE_URL`; it must not use the API port.

### MongoDB Atlas

For Atlas, set `MONGO_URI` to the Atlas connection string and add the computer's current public IP address under **Atlas → Network Access**. If the campus or company network blocks outbound port `27017`, use another network or ask the network administrator to allow Atlas shard hosts on port `27017`. The API now waits for MongoDB before it starts, so its terminal will show a clear connection error instead of letting login requests hang.

## Priority policy

Only three priority levels exist: `Low`, `Medium`, and `Critical`. The Flask service returns both a level and numeric score, and the backend stores both. Admin queues are sorted by score first, then oldest complaint first.

For records created before this policy, run:

```
npm run migrate:priorities
```

This converts legacy `High` records to `Critical`, so an old urgent complaint is never demoted.

## Station admins

Admins cannot be registered publicly. There are two administrator types:

- `admin`: a station admin, restricted to one assigned station.
- `main_admin`: the single main admin, able to view, filter, and resolve complaints across every station.

To create either admin, put a unique name, email and password in `.env`, then run:

```
npm run seed:admin
```

For a station admin, set `ADMIN_ROLE=admin` and a valid `ADMIN_STATION`; repeat with a different email for every campus station. For the main admin, set `ADMIN_ROLE=main_admin` and leave `ADMIN_STATION` blank. The script refuses to overwrite an existing user. Station admins are restricted at the API and Socket.IO layers; the main admin receives all live updates.

## API routes

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | Public student, staff, or parent signup |
| POST | `/api/auth/login` | Public |
| POST | `/api/grievances` | Authenticated reporter |
| GET | `/api/grievances/mine` | Authenticated reporter |
| GET | `/api/complaints` | Assigned station admin or main admin |
| PATCH | `/api/complaints/:id/status` | Assigned station admin or main admin |

All protected HTTP routes need `Authorization: Bearer <token>`. Socket.IO also requires the same token; it is no longer publicly readable.
