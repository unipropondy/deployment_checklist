# DEPLOYCHECK (New Independent Application)

A completely new, independent Software Deployment Checklist application built from scratch with **React Native + Expo** and **Node.js + Express + MSSQL** connected strictly to the `DEPLOYCHECK` database.

---

## Project Structure
`deployment-checklist-new/`
- `frontend/` - Expo React Native (Web, Android, iOS)
- `backend/` - Node.js + Express + MSSQL API Server

---

## Technical Highlights
1. **Strict Database Isolation**: `backend/config/db.js` verifies `process.env.DB_NAME === 'DEPLOYCHECK'` and checks `SELECT DB_NAME()` context.
2. **Real Database Integration**: Live 35 checklist items (`ChecklistMaster`), Shops, Builds, Users, and Test Runs from `DEPLOYCHECK`.
3. **JWT Authentication & User Display**: Authenticated user's name is dynamically displayed across UI, headers, and Admin dropdown without hardcoding.
4. **Completion Validation Guard**: Ensures all 35 checklist items are tested before completing a test run session.

---

## How to Run

### Backend API
```bash
cd backend
npm run dev
```

### Frontend Expo App
```bash
cd frontend
npx expo start --web
```
