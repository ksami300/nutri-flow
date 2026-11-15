# Nutri Flow — AI Nutrition & Wellness Platform

Full-stack personalized nutrition, hydration tracking, and AI coaching platform built with modern TypeScript and Node.js architecture.

## Architecture & Tech Stack
- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4
- **Backend:** Node.js, Express, MongoDB (Mongoose), OpenAI API, Stripe Billing, Winston Logger
- **Security & Quality:** JWT Authentication, Rate Limiting, Helmet, Joi Environment Validation, Jest Automated Test Suite (39 passing tests)

## Quick Start
1. Start MongoDB on `127.0.0.1:27017`
2. Backend (Port `5000`):
   ```bash
   cd backend && cp .env.example .env && npm install && npm run dev
   ```
3. Frontend (Port `3000`):
   ```bash
   cd frontend && npm install && npm run dev
   ```
