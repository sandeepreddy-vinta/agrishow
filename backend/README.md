# FranchiseOS Backend API v2.0

A robust Node.js/Express backend API for the FranchiseOS digital signage management system.

## Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Admin, Manager, Viewer roles
- **RESTful API** - Clean, standardized REST endpoints
- **Input Validation** - Schema validation with Zod
- **Rate Limiting** - Protect against abuse
- **CORS Configuration** - Secure cross-origin requests
- **Automatic Backups** - Hourly database backups with rotation
- **Audit Logging** - Track all important actions
- **Migration System** - Database schema versioning

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# Make sure to set a strong API_KEY and JWT_SECRET

# Start development server
npm run dev

# Or start production server
npm start
```

### Default Admin Credentials

- **Email:** admin@franchiseos.com
- **Password:** Admin@123

> ⚠️ Change these credentials in production!

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/change-password` | Change password |

### Franchises

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/franchises` | List all franchises |
| POST | `/api/franchises` | Create new franchise |
| GET | `/api/franchises/:id` | Get franchise by ID |
| PUT | `/api/franchises/:id` | Update franchise |
| DELETE | `/api/franchises/:id` | Delete franchise |
| POST | `/api/franchises/:id/regenerate-token` | Regenerate device token |

### Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content` | List all content |
| POST | `/api/content/upload` | Upload new content |
| GET | `/api/content/:id` | Get content by ID |
| PUT | `/api/content/:id` | Update content metadata |
| DELETE | `/api/content/:id` | Delete content |

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List all assignments |
| POST | `/api/assignments` | Create/update assignments |
| GET | `/api/assignments/:deviceId` | Get assignments for device |
| DELETE | `/api/assignments/:deviceId` | Clear device assignments |
| POST | `/api/assignments/:deviceId/add` | Add content to assignments |
| POST | `/api/assignments/:deviceId/remove` | Remove content from assignments |

### Device Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/heartbeat` | Device heartbeat |
| GET | `/api/playlist` | Get device playlist |
| GET | `/api/device/info` | Get device info |
| POST | `/api/device/report` | Report playback stats |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (public) |
| GET | `/api/stats` | System statistics |
| GET | `/api/stats/analytics` | Playback analytics |

## Authentication

### Using JWT Token

```bash
# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@franchiseos.com","password":"Admin@123"}'

# Use token in subsequent requests
curl http://localhost:3000/api/franchises \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using API Key

```bash
curl http://localhost:3000/api/franchises \
  -H "X-API-Key: your-api-key"
```

### Device Authentication

```bash
curl http://localhost:3000/api/playlist \
  -H "X-Device-Token: your-device-token"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `API_KEY` | Yes | Admin API key |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 24h) |
| `MAX_FILE_SIZE` | No | Max upload size in bytes |
| `ALLOWED_VIDEO_TYPES` | No | Allowed video MIME types |
| `ALLOWED_IMAGE_TYPES` | No | Allowed image MIME types |
| `ALLOWED_ORIGINS` | No | CORS allowed origins |
| `ADMIN_EMAIL` | No | Default admin email |
| `ADMIN_PASSWORD` | No | Default admin password |

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── env.js          # Environment validation
│   ├── middleware/
│   │   ├── auth.js         # Authentication middleware
│   │   ├── errorHandler.js # Global error handling
│   │   └── validation.js   # Request validation
│   ├── routes/
│   │   ├── auth.js         # Auth endpoints
│   │   ├── franchises.js   # Franchise CRUD
│   │   ├── content.js      # Content management
│   │   ├── assignments.js  # Content assignments
│   │   ├── device.js       # Device endpoints
│   │   └── stats.js        # Statistics & health
│   ├── services/
│   │   └── database.js     # Database manager
│   ├── utils/
│   │   └── response.js     # Response helpers
│   └── app.js              # Express app setup
├── tests/
│   ├── setup.js            # Test configuration
│   ├── auth.test.js        # Auth tests
│   └── franchises.test.js  # Franchise tests
├── backups/                # Database backups
├── content/                # Uploaded content
├── migrations/             # Database migrations
├── backup.js               # Backup utilities
├── database.js             # Legacy (use src/services/)
├── server.js               # Entry point
├── package.json
└── .env
```

## License

Proprietary - FranchiseOS
