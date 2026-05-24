# Job Application Tracker API

A workflow-driven REST API that allows users to manage job applications while maintaining data integrity through transactions, audit logging, and database-enforced business rules.

---

## Features

### Authentication

- JWT Authentication
- HTTP-Only Cookies
- Role-Based Access Control

### User Permissions

#### User

- Create Job Application
- Read Own Applications
- Update Own Applications
- Delete Own Applications

#### Admin

- Read All Applications
- Update Application Status
- Delete Any Application

---

## Application Workflow

Supported statuses:

- Applied
- Interview
- Offered
- Accepted
- Rejected

The system enforces valid workflow transitions at the database level.

Example:

```text
Applied
   ↓
Interview
   ↓
Offered
   ↓
Accepted
```

Invalid transitions are rejected by PostgreSQL constraints.

---

## Data Integrity

### Transactions

Status updates execute inside PostgreSQL transactions.

This guarantees atomicity:

- Update application status
- Record audit log

Both succeed or both fail.

---

### Row Locking

The application uses:

```sql
FOR UPDATE
```

to lock rows during status updates and prevent race conditions.

---

### Audit Logging

Every status transition is permanently recorded.

Example:

Applied → Interview

Interview → Offered

Offered → Accepted

Audit logs are immutable and cannot be modified.

---

### Database Constraints

Business rules are enforced at the database layer.

Examples:

- Allowed status values only
- Valid status transitions only
- Immutable history records

This ensures data integrity even if application-level validation is bypassed.

---

## Architecture

```text
Routes
 ↓
Controllers
 ↓
Services
 ↓
Repositories
 ↓
PostgreSQL
```

---

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- JWT
- bcrypt
- UUID

---

## Future Improvements

- Deployment
- Swagger Documentation
- Automated Testing
- Email Notifications