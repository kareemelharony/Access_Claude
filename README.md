# Lumive Access MVP

> **Universal Property Automation Hub for Multi-Brand Smart Home Ecosystems**

Lumive Access is a **hardware-agnostic property management platform** designed for Airbnb hosts managing multiple properties across the MENA region. Instead of forcing hosts to replace their existing smart devices, Lumive Access unifies **TTLock, Tuya, and future device ecosystems** into a single automation dashboard.

**The Problem:** Hosts with mixed-brand devices (TTLock locks, Tuya thermostats, various sensors) must juggle multiple apps, creating confusion and wasted time.

**The Solution:** One unified interface that automatically detects which devices belong to which ecosystem and handles cross-brand automation transparently. Hosts can automate guest access, temperature, lighting, and energy management regardless of device brand.

**Key Differentiator:** Account-level integration allows hosts to connect all their devices once, then assign them to properties. Cross-platform automations work seamlessly (e.g., TTLock passcode generation + Tuya AC pre-cooling in a single rule).

## 🌟 Key Features

### Core Platform
- **🔄 Multi-Brand Device Aggregation** - Connect TTLock, Tuya, and future ecosystems in one account
- **📅 Unified Booking Management** - Full integration with Beds24 for multi-channel sync (Airbnb, Booking.com, etc.)
- **🎯 Hardware-Agnostic Approach** - Works with existing devices - no need to replace hardware
- **🏠 Single Dashboard View** - All properties and devices visible regardless of brand
- **⚡ Cross-Platform Automation** - Rules work across multiple device ecosystems automatically

### Device Integration
- **🔐 Universal Smart Lock Support** - TTLock and Tuya smart locks with automated passcode generation
- **🌡️ Smart Climate Control** - Thermostats and AC units from any supported brand
- **💡 Lighting & Energy** - Lights, plugs, sensors unified in one interface
- **📡 Device Discovery** - Automatic detection and assignment workflow
- **🔋 Battery Monitoring** - Cross-brand battery status tracking

### Automation & Communication
- **🤖 Intelligent Automation Engine** - Brand-agnostic rules (e.g., TTLock + Tuya in one automation)
- **💬 Multi-Channel Messaging** - Email, SMS, WhatsApp guest communications with template system
- **🔔 Smart Triggers** - Booking events, time-based, device status changes
- **📊 Real-Time Monitoring** - Unified device status tracking across all ecosystems

### User Experience
- **🌍 Bilingual Support** - Full Arabic and English with RTL layout
- **📱 Account-Level Integration** - Connect devices once, assign to multiple properties
- **🎨 Brand-Agnostic UI** - Consistent interface regardless of device manufacturer
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

## 🏗️ System Architecture

### Multi-Brand Device Abstraction

Lumive Access implements a **Device Abstraction Layer** that enables seamless cross-platform automation:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Dashboard                       │
│          (Brand-Agnostic UI for All Devices)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Device Service Layer                        │
│                 (UnifiedDeviceAPI)                          │
│                                                              │
│  • Normalizes device data across all ecosystems             │
│  • Routes commands to appropriate connector                  │
│  • Handles token management & caching                        │
│  • Provides consistent interface for automation              │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   TTLock     │  │     Tuya     │  │   Future     │
    │  Connector   │  │  Connector   │  │  Connectors  │
    │              │  │              │  │              │
    │ • OAuth 2.0  │  │ • OAuth 2.0  │  │ • Zigbee     │
    │ • Passcodes  │  │ • Devices    │  │ • Z-Wave     │
    │ • Locks      │  │ • Scenes     │  │ • Matter     │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ TTLock Cloud │  │  Tuya Cloud  │  │   Other      │
    │     API      │  │     API      │  │   APIs       │
    └──────────────┘  └──────────────┘  └──────────────┘
```

### Integration Flow

1. **Account Connection**
   - User connects TTLock/Tuya accounts via OAuth
   - System discovers all available devices
   - Tokens encrypted and stored securely

2. **Device Assignment**
   - Dashboard displays: "We found 3 TTLock locks and 5 Tuya devices"
   - User assigns each device to a property
   - Unified device table stores normalized data

3. **Automation Execution**
   - User creates rule: "On check-in, unlock door + set AC to 22°C"
   - UnifiedDeviceAPI identifies: TTLock (door) + Tuya (AC)
   - Routes commands to appropriate connectors automatically

4. **Cross-Platform Operations**
   - Automation engine calls device.service.js
   - Service layer routes to correct ecosystem connector
   - No manual brand selection required

### Unified Device Model

All devices, regardless of brand, are normalized to:

```javascript
{
  id: "uuid",
  propertyId: "property-uuid",
  deviceType: "lock" | "thermostat" | "light" | "plug" | "sensor",
  ecosystem: "ttlock" | "tuya" | "future",
  externalId: "ecosystem-specific-id",
  name: { en: "Main Door", ar: "الباب الرئيسي" },
  capabilities: ["lock", "unlock", "passcode"],
  status: "online" | "offline",
  batteryLevel: 85,
  metadata: {} // Ecosystem-specific data
}
```

This abstraction allows:
- ✅ Single API call to control any device
- ✅ Consistent automation rules across brands
- ✅ Easy addition of new ecosystems
- ✅ Brand-agnostic frontend UI

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

## 🔄 Multi-Brand Device Integration

### Account-Level Integration Model

Unlike traditional property management systems that require per-property device setup, Lumive Access uses **account-level integration**:

#### Connection Flow
1. **User logs in** → Navigates to "Integrations" page
2. **Connects accounts** → "Connect TTLock Account" → OAuth authorization
3. **Connects accounts** → "Connect Tuya Account" → OAuth authorization
4. **System discovers devices** → "We found 3 TTLock locks and 5 Tuya devices across your accounts"
5. **User assigns devices** → Drag each device to appropriate property
6. **Automation ready** → Cross-brand rules now work automatically

#### Key Features

**Unified Device Discovery**
- Automatic refresh of device lists from all connected accounts
- Real-time sync of new devices
- Automatic token renewal for continuous connectivity
- Dashboard alerts when tokens need reauthorization

**Device Assignment Workflow**
```
┌──────────────────────────────────────────────┐
│  Unassigned Devices (8)                     │
│                                              │
│  🔐 TTLock Lock #1  [Assign to Property ▼] │
│  🔐 TTLock Lock #2  [Assign to Property ▼] │
│  🔐 TTLock Lock #3  [Assign to Property ▼] │
│  🌡️  Tuya Thermostat [Assign to Property ▼] │
│  💡 Tuya Light Bulb [Assign to Property ▼] │
│  🔌 Tuya Smart Plug [Assign to Property ▼] │
│  ...                                         │
└──────────────────────────────────────────────┘
```

**Cross-Ecosystem Automation**

Single automation rule can control multiple brands:

```javascript
// Example Automation Rule
{
  name: "Guest Check-In Automation",
  trigger: "booking_confirmed",
  actions: [
    {
      ecosystem: "ttlock",  // Automatically routed to TTLock connector
      device: "main_door_lock",
      action: "generate_passcode",
      config: { startDate: "checkInDate", endDate: "checkOutDate" }
    },
    {
      ecosystem: "tuya",    // Automatically routed to Tuya connector
      device: "bedroom_ac",
      action: "set_temperature",
      config: { temperature: 22, mode: "cool" }
    },
    {
      ecosystem: "tuya",    // Another Tuya device in same rule
      device: "living_room_lights",
      action: "turn_on",
      config: { brightness: 50 }
    }
  ]
}
```

The UnifiedDeviceAPI handles routing automatically - users never manually select brands.

### Implementation Details

**Token Management**
- Refresh tokens encrypted with AES-256-GCM
- Stored at user account level (not per property)
- Automatic renewal before expiration
- Secure token rotation

**Device Normalization**
```javascript
// TTLock Device (from API)
{
  lockId: 123456,
  lockAlias: "Main Door",
  electricQuantity: 85,
  hasGateway: 1
}

// Tuya Device (from API)
{
  id: "abc123xyz",
  name: "Bedroom AC",
  online: true,
  status: [{ code: "temp_current", value: 240 }]
}

// ↓ Normalized to Unified Device Model ↓

{
  id: "uuid-generated",
  ecosystem: "ttlock" | "tuya",
  externalId: "123456" | "abc123xyz",
  propertyId: "property-uuid",
  deviceType: "lock" | "thermostat",
  name: { en: "Main Door", ar: "..." },
  capabilities: [...],
  status: "online",
  batteryLevel: 85 | null
}
```

**API Abstraction Layer**

The device service automatically routes commands:

```javascript
// Frontend calls generic API
POST /api/devices/{deviceId}/control
{
  action: "unlock",
  // No ecosystem specified!
}

// Backend device.service.js
async controlDevice(deviceId, command) {
  const device = await Device.findByPk(deviceId);

  // Routes to appropriate connector based on device.ecosystem
  if (device.ecosystem === 'ttlock') {
    return ttlockService.unlock(device.externalId);
  } else if (device.ecosystem === 'tuya') {
    return tuyaService.toggleDevice(device.externalId, true);
  }
}
```

### User Experience Benefits

✅ **No Brand Confusion** - Single interface for all devices
✅ **Faster Setup** - Connect accounts once, not per property
✅ **Cross-Brand Automation** - Rules work across ecosystems
✅ **Future-Proof** - New brands added without user migration
✅ **Cost Effective** - Use existing hardware, no replacement needed

## 📊 Business Model

### Value Proposition
**Hardware-Agnostic Platform** - The platform works with existing smart devices, eliminating the need for hosts to replace their current hardware. This flexibility significantly lowers adoption barriers and expands the total addressable market.

**Multi-Brand Advantage:**
- Hosts with TTLock locks can continue using them
- Hosts with Tuya thermostats don't need to switch
- Mixed-ecosystem properties work seamlessly
- Future device brands can be added without disrupting existing users

### Pricing & Market
- **Pricing:** 50 SAR per property/month
- **Target Margin:** 36-42 SAR after infrastructure costs
- **Target Market:** Airbnb/short-term rental hosts in KSA/UAE managing multiple properties
- **Competitive Advantage:** Unlike competitor platforms that lock users into specific hardware ecosystems, Lumive Access unifies existing devices

### Market Opportunity
- **Lower Barrier to Entry:** Hosts don't need upfront hardware investment
- **Broader Market:** Serves hosts with TTLock, Tuya, or mixed ecosystems
- **Ecosystem Lock-In:** Once hosts centralize multiple brands in Lumive, switching costs increase
- **Future Expansion:** Easy to add Zigbee, Z-Wave, Matter protocols

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
