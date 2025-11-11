# Lumive Access MVP

> **Property Management SaaS Platform for the Saudi Arabia Market**

Lumive Access is an all-in-one property management platform targeting short-term rental hosts in the MENA region, specifically KSA. The platform integrates booking management (Beds24), smart device control (Tuya & TTLock), and comprehensive automation to streamline property operations.

## 🌟 Key Features

- **📅 Booking Management** - Full integration with Beds24 for multi-channel booking sync
- **🔐 Smart Access Control** - TTLock integration for automated door code generation
- **🏠 Smart Home Devices** - Tuya Cloud integration for thermostats, lights, and sensors
- **⚡ Automation Engine** - Automated check-in/check-out workflows and guest communications
- **💬 Unified Inbox** - Centralized guest messaging across all platforms
- **🌍 Bilingual Support** - Full Arabic and English support (RTL-ready)
- **📊 Analytics & Reporting** - Revenue tracking, occupancy rates, and energy monitoring

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
- **Beds24 API** - Booking management
- **Tuya Cloud API** - Smart home devices
- **TTLock Cloud API** - Smart lock management
- **Stripe** - Payment processing
- **SendGrid** - Email notifications

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
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### Bookings (Coming Soon)
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Properties (Coming Soon)
- `GET /api/properties` - List properties
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property
- `PATCH /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Devices (Coming Soon)
- `GET /api/devices` - List devices
- `GET /api/devices/:id` - Get device details
- `POST /api/devices/:id/control` - Control device

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

## 📊 Business Model

- **Pricing:** 50 SAR per property/month
- **Target Margin:** 36-42 SAR after infrastructure costs
- **Target Market:** Short-term rental hosts in KSA/UAE

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Project setup
- [x] Authentication system
- [x] Database models
- [x] i18n support

### Phase 2: Beds24 Integration (In Progress)
- [ ] Beds24 OAuth setup
- [ ] Booking sync
- [ ] Webhook handlers
- [ ] Calendar view

### Phase 3: Device Integration
- [ ] TTLock integration
- [ ] Tuya integration
- [ ] Device management dashboard
- [ ] Automated access codes

### Phase 4: Automation Engine
- [ ] Rule engine
- [ ] Time-based automations
- [ ] Event-based automations
- [ ] Automation builder UI

### Phase 5: Launch
- [ ] Testing & QA
- [ ] Documentation
- [ ] Production deployment
- [ ] User onboarding

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
