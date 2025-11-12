# Lumive Access MVP

> **Property Management SaaS Platform for the Saudi Arabia Market**

Lumive Access is an all-in-one property management platform targeting short-term rental hosts in the MENA region, specifically KSA. The platform integrates booking management (Beds24), smart device control (Tuya & TTLock), and comprehensive automation to streamline property operations.

## 🌟 Key Features

- **📅 Booking Management** - Full integration with Beds24 for multi-channel booking sync (Airbnb, Booking.com, etc.)
- **🔐 Smart Lock Control** - TTLock and Tuya smart locks with automated passcode generation
- **🏠 Smart Home Devices** - Tuya Cloud integration for lights, thermostats, plugs, sensors, and more
- **⚡ Automation Engine** - Rule-based automations for check-in/check-out workflows and guest communications
- **💬 Multi-Channel Messaging** - Email, SMS, and WhatsApp guest communications with template system
- **🌍 Bilingual Support** - Full Arabic and English support with RTL layout
- **📊 Real-Time Monitoring** - Device status tracking, booking dashboard, and analytics
- **🔒 Enterprise Security** - AES-256-GCM encryption, JWT authentication, rate limiting

## 🚀 Technology Stack

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4.19+
- **Database:** PostgreSQL 16+
- **ORM:** Sequelize 6.35+
- **Cache:** Redis 7.2+
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Joi
- **i18n:** i18next

### Frontend
- **Framework:** React 18.2+
- **Build Tool:** Vite 5.0+
- **Routing:** React Router 6.20+
- **State Management:** Zustand 4.4+
- **Styling:** Tailwind CSS 3.4+
- **Forms:** React Hook Form + Zod
- **i18n:** react-i18next

### Integrations
- **Beds24 API v2** - Multi-channel booking management with OAuth 2.0 and webhooks
- **Tuya Cloud API** - Smart home devices including smart locks, lights, thermostats, plugs, sensors
- **TTLock Cloud API** - Specialized smart lock management with passcode generation
- **SendGrid** - Email delivery (placeholder ready for integration)
- **Twilio** - SMS and WhatsApp messaging (placeholder ready for integration)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20.0.0 or higher)
- **npm** (v10.0.0 or higher)
- **PostgreSQL** (v16 or higher)
- **Redis** (v7.2 or higher)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Access_Claude
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/lumive_access

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Encryption Key (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your-32-byte-hex-encryption-key-change-this

# Beds24 API
BEDS24_CLIENT_ID=your-beds24-client-id
BEDS24_CLIENT_SECRET=your-beds24-client-secret

# Tuya Cloud API
TUYA_CLIENT_ID=your-tuya-client-id
TUYA_CLIENT_SECRET=your-tuya-client-secret

# TTLock API
TTLOCK_CLIENT_ID=your-ttlock-client-id
TTLOCK_CLIENT_SECRET=your-ttlock-client-secret
```

**Create Database:**

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE lumive_access;
\q

# Run database migrations (when implemented)
npm run migrate
```

**Start Backend Server:**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Frontend Environment Variables:**

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_APP_NAME=Lumive Access
VITE_DEFAULT_LANGUAGE=en
```

**Start Frontend Development Server:**

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
lumive-access/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files (database, redis, i18n)
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── jobs/            # Background jobs
│   ├── locales/             # i18n translation files
│   │   ├── en/              # English translations
│   │   └── ar/              # Arabic translations
│   ├── tests/               # Test files
│   ├── .env.example
│   ├── package.json
│   └── server.js            # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # Global styles
│   ├── public/
│   │   └── locales/         # Frontend translations
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
└── docs/                    # Documentation
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Properties
- `GET /api/properties` - List user properties
- `POST /api/properties` - Create property
- `GET /api/properties/:id` - Get property details
- `PATCH /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `POST /api/properties/:id/beds24/connect` - Connect property to Beds24
- `POST /api/properties/:id/beds24/sync` - Sync property from Beds24

### Bookings
- `GET /api/bookings` - List bookings (with pagination & filters)
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/beds24/sync` - Sync all bookings from Beds24
- `GET /api/bookings/stats` - Get booking statistics

### Devices
- `GET /api/devices` - List all devices
- `POST /api/devices` - Create device
- `GET /api/devices/:id` - Get device details
- `PATCH /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `GET /api/devices/:id/status` - Get real-time device status
- `POST /api/devices/:id/control` - Send control command to device
- `GET /api/devices/stats` - Get device statistics
- **TTLock Specific:**
  - `GET /api/devices/ttlock/auth-url` - Get TTLock OAuth URL
  - `POST /api/devices/ttlock/callback` - Handle TTLock OAuth callback
  - `POST /api/devices/ttlock/sync` - Sync TTLock devices
  - `POST /api/devices/:id/passcode` - Generate access passcode
  - `GET /api/devices/:id/passcodes` - List all passcodes
  - `DELETE /api/devices/:id/passcode/:passcodeId` - Delete passcode
- **Tuya Specific:**
  - `POST /api/devices/tuya/connect` - Connect Tuya home to property
  - `POST /api/devices/tuya/sync` - Sync Tuya devices

### Automations
- `GET /api/automations` - List automation rules
- `POST /api/automations` - Create automation rule
- `GET /api/automations/:id` - Get automation details
- `PATCH /api/automations/:id` - Update automation
- `DELETE /api/automations/:id` - Delete automation
- `GET /api/automations/stats` - Get automation statistics
- `POST /api/automations/:id/test` - Test automation execution
- `GET /api/automations/messages/:bookingId` - Get booking messages
- `POST /api/automations/messages/:messageId/retry` - Retry failed message

### Webhooks
- `POST /api/webhooks/beds24` - Beds24 webhook handler

## 🧪 Testing

### Run Backend Tests

```bash
cd backend
npm test
```

### Run Frontend Tests

```bash
cd frontend
npm test
```

## 🚢 Deployment

### Environment-Specific Configuration

**Development:**
```env
NODE_ENV=development
```

**Production:**
```env
NODE_ENV=production
```

### Build Frontend for Production

```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist/`

## 🌐 Internationalization (i18n)

The application supports both English and Arabic:

- **English (en)** - Default language
- **Arabic (ar)** - Full RTL support

### Adding Translations

**Backend:**
```bash
backend/locales/en/common.json
backend/locales/ar/common.json
```

**Frontend:**
```bash
frontend/public/locales/en/common.json
frontend/public/locales/ar/common.json
```

## 🔐 Security

- **JWT Authentication** with refresh tokens
- **Password Hashing** using bcrypt (12 rounds)
- **Data Encryption** for sensitive data (AES-256-GCM)
- **Rate Limiting** to prevent abuse
- **CORS Protection** with allowed origins
- **Helmet** for HTTP security headers
- **Input Validation** using Joi
- **XSS Protection** using xss library

## 🔐 Smart Lock Integration

The platform supports smart locks from both TTLock and Tuya platforms:

### TTLock Smart Locks
- **OAuth 2.0 Authentication** - Secure token-based integration
- **Passcode Generation** - Time-limited, permanent, one-time, and cyclic codes
- **Remote Control** - Lock/unlock via gateway
- **Access Logs** - Track all lock/unlock events
- **Battery Monitoring** - Real-time battery level tracking
- **Guest Passcodes** - Automatically generated for booking dates

### Tuya Smart Locks
- **Cloud API Integration** - Full smart lock support via Tuya platform
- **Multi-Brand Support** - Works with various Tuya-compatible smart lock brands
- **Device Control** - Lock/unlock, status monitoring
- **Scene Integration** - Combine with other smart home devices
- **Real-Time Status** - Online/offline monitoring

Both systems integrate seamlessly with the automation engine to automatically generate and send access codes to guests based on booking dates.

## 📊 Business Model

- **Pricing:** 50 SAR per property/month
- **Target Margin:** 36-42 SAR after infrastructure costs
- **Target Market:** Short-term rental hosts in KSA/UAE

## 🗺️ Development Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] Project setup (Node.js, React, PostgreSQL, Redis)
- [x] Authentication system (JWT with refresh tokens)
- [x] Database models (User, Property, Booking, Device, Automation, GuestMessage)
- [x] Bilingual i18n support (English & Arabic with RTL)
- [x] Frontend dashboard and navigation

### Phase 2: Beds24 Integration ✅ COMPLETE
- [x] Beds24 OAuth 2.0 setup
- [x] Property and booking sync
- [x] Webhook handlers for real-time updates
- [x] Frontend property and booking management UI
- [x] Pagination and filtering

### Phase 3: Device Integration ✅ COMPLETE
- [x] TTLock OAuth integration and passcode generation
- [x] Tuya Cloud API integration for smart home devices
- [x] Device management dashboard with control interface
- [x] Automated access code generation for bookings
- [x] Real-time device status monitoring
- [x] Device sync from both TTLock and Tuya platforms

### Phase 4: Automation Engine ✅ COMPLETE
- [x] Flexible automation rule engine
- [x] Trigger types (booking_created, check_in, check_out, time-based)
- [x] Action types (messages, passcode generation, device control)
- [x] Multi-channel messaging (Email, SMS, WhatsApp)
- [x] Template rendering system with variables
- [x] Execution tracking and statistics

### Phase 5: Future Enhancements 🔄 PLANNED
- [ ] Advanced analytics and reporting dashboards
- [ ] Task management system
- [ ] Team member management with roles
- [ ] Mobile app (React Native)
- [ ] Payment integration (Stripe)
- [ ] Guest portal
- [ ] Advanced automation builder UI
- [ ] Multi-language expansion (beyond English/Arabic)

## 🤝 Contributing

This is a proprietary project. Please contact the development team for contribution guidelines.

## 📝 License

Copyright © 2025 Lumive Access. All rights reserved.

## 📧 Support

For support, please contact: support@lumiveaccess.com

## 👨‍💻 Development Team

- **Developer:** [Your Name]
- **Project Manager:** [PM Name]
- **Business Owner:** [Owner Name]

---

**Built with ❤️ for the MENA property management market**
