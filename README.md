# Bedayia School Backend API

A Next.js 15 backend API built with Bun and PostgreSQL, replicating the functionality of the Odoo custom module for handling API calls from the Android app.

## Features

- **Authentication API**: Login/logout with API key generation
- **Event Management**: Create and manage school events
- **Invitee Management**: Handle event invitees with QR code support
- **Attendance Tracking**: Track and update attendance records
- **PostgreSQL Database**: Robust data persistence
- **Docker Support**: Easy deployment with Docker Compose

## API Endpoints

### Authentication
- `POST /api/v1/tickets/login` - User authentication and API key generation
- `POST /api/v1/tickets/logout` - API key revocation

### Data Management
- `POST /api/v1/tickets/get_data` - Fetch invitee data by QR code
- `POST /api/v1/tickets/update_data` - Update attendance records

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Bun (for local development)

### Quick Start with Docker

1. Clone the repository
2. Navigate to the project directory
3. Start the services:
   ```bash
   docker-compose up -d
   ```

### Services

- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Adminer (Database GUI)**: http://localhost:8080

### Database Connection (Adminer)
- **System**: PostgreSQL
- **Server**: postgres
- **Username**: bedayia_user
- **Password**: bedayia_password
- **Database**: bedayia_school

## Database Schema

### Tables
- `users` - User authentication
- `api_keys` - API key management
- `bydaya_events` - Event information
- `bydaya_event_items` - Student/event items
- `bydaya_event_invitees` - Event invitees with attendance tracking

## API Usage Examples

### Login
```bash
curl -X POST http://localhost:3001/api/v1/tickets/login \
  -H "Content-Type: application/json" \
  -d '{
    "db": "bedayia_school",
    "login": "admin",
    "password": "admin123"
  }'
```

### Get Invitee Data
```bash
curl -X POST http://localhost:3001/api/v1/tickets/get_data \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your_api_key_here",
    "invitees_qrcode_text": "EventID : 1,ID : 123, Name : John Doe"
  }'
```

### Update Attendance
```bash
curl -X POST http://localhost:3001/api/v1/tickets/update_data \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your_api_key_here",
    "invitees": [
      {
        "invitees_name": "John Doe",
        "invitees_attendance": true,
        "invitees_qrcode_text": "EventID : 1,ID : 123, Name : John Doe"
      }
    ]
  }'
```

## Development

### Local Development
```bash
cd backend
bun install
bun run dev
```

### Database Migration
```bash
bun run db:migrate
```

### Database Seeding
```bash
bun run db:seed
```

## Default Credentials

- **Username**: admin
- **Password**: admin123
- **Email**: admin@bedayia.school

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment (development/production)

## Tech Stack

- **Framework**: Next.js 15
- **Runtime**: Bun
- **Database**: PostgreSQL 16
- **Container**: Docker & Docker Compose
- **Authentication**: JWT + API Keys
- **Styling**: Tailwind CSS

## Migration from Odoo

This backend replicates the core functionality of your Odoo module:
- User authentication with API key generation (90-day expiry)
- Event and invitee management
- QR code-based attendance tracking
- Same API endpoint structure for seamless Android app integration