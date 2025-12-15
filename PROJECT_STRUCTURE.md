# Water Report Card (WRC) - Detailed Project Structure

## 📋 Project Overview

**Water Report Card** is a full-stack water quality management platform with three main components:
1. **Frontend** - Public-facing water quality map viewer
2. **Backend** - Express.js API server with PostgreSQL database
3. **Admin Panel** - Administrative dashboard for CRM/CMMS operations

---

## 🏗️ High-Level Architecture

```
WRC-Alex-Dev/
├── frontend/          # Next.js 15 public app (port 3000)
├── backend/           # Express.js 5 API server (port 2018)
├── admin-panel/       # Next.js 15 admin dashboard (port 4000/4001)
├── package.json       # Root workspace configuration
└── ecosystem.config.cjs  # PM2 production configuration
```

---

## 📁 Detailed Directory Structure

### **Root Level**
```
WRC-Alex-Dev/
├── package.json              # Root workspace scripts
├── package-lock.json
├── ecosystem.config.cjs      # PM2 process manager config
└── node_modules/             # Root dependencies (concurrently)
```

---

## 🔧 Backend Structure (`/backend`)

### **Technology Stack**
- **Framework**: Express.js 5.1.0
- **Database**: PostgreSQL (pg 8.16.3)
- **Authentication**: Passport.js (JWT + Local strategies)
- **Email**: Nodemailer + Google APIs (Gmail OAuth2)
- **Map Tiles**: @mapbox/mbtiles (for serving MBTiles)

### **Directory Structure**
```
backend/
├── src/
│   ├── server.js                    # Main Express server entry point
│   │
│   ├── config/
│   │   ├── db.js                    # PostgreSQL connection pool
│   │   └── envConfig.js             # Environment variables loader
│   │
│   ├── middleware/
│   │   └── auth-middleware.js       # JWT authentication, role-based access
│   │
│   ├── routes/                      # API route definitions
│   │   ├── tile-routes.js           # Map tile serving (/tiles/:z/:x/:y.pbf)
│   │   ├── auth-routes.js           # Authentication endpoints
│   │   ├── content-routes.js        # Content management
│   │   ├── layer-styles-routes.js   # Map layer styling
│   │   ├── contaminants-routes.js   # Water contaminant data
│   │   ├── crm-routes.js            # CRM operations
│   │   ├── admin-crud-routes.js     # Admin CRUD operations
│   │   ├── admin-business-routes.js # Business logic routes
│   │   ├── customer-routes.js       # Customer management
│   │   └── invitation-routes.js      # User invitation system
│   │
│   ├── controller/                  # Request handlers
│   │   ├── tile-controller.js       # MBTiles tile serving
│   │   ├── auth-controller.js       # Authentication logic
│   │   ├── contaminants-controller.js # Contaminant CRUD
│   │   ├── content-controller.js    # Content management
│   │   ├── crm-controller.js        # CRM operations
│   │   ├── crm-cmms-crud-controller.js # Generic CRUD
│   │   ├── customerController.js    # Customer operations
│   │   ├── invitation-controller.js # Invitation handling
│   │   └── layer-styles-controller.js # Layer style management
│   │
│   ├── services/                    # Business logic layer
│   │   ├── auth-service.js          # User authentication, registration
│   │   ├── email-service.js         # Email sending (Gmail OAuth2)
│   │   ├── contaminants-service.js  # Contaminant data operations
│   │   ├── crm-service.js           # CRM business logic
│   │   ├── crm-cmms-crud-service.js # Generic CRUD operations
│   │   └── crm-cmms-schema-service.js # Dynamic schema management
│   │
│   └── validation/                  # Input validation (if exists)
│
├── public/
│   └── assets/
│       ├── water_districts.mbtiles   # Water district map tiles (957 MB)
│       └── water_boundaries.mbtiles  # Water boundary map tiles (759 MB)
│
├── routes/                           # Legacy routes (if exists)
├── package.json
└── .env                              # Environment variables
```

### **Backend API Endpoints**

| Route | Purpose | Controller |
|-------|---------|------------|
| `/tiles/:z/:x/:y.pbf` | Map tile serving | `tile-controller.js` |
| `/auth/*` | Authentication | `auth-controller.js` |
| `/content/*` | Content management | `content-controller.js` |
| `/layer-styles/*` | Map layer styling | `layer-styles-controller.js` |
| `/contaminants/*` | Water contaminants | `contaminants-controller.js` |
| `/crm/*` | CRM operations | `crm-controller.js` |
| `/admin/*` | Admin CRUD | `crm-cmms-crud-controller.js` |
| `/admin/business/*` | Business logic | Admin business routes |
| `/customers/*` | Customer management | `customerController.js` |
| `/invitations/*` | User invitations | `invitation-controller.js` |

### **Backend Environment Variables**
```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Authentication
ACCESS_TOKEN_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-secret

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Email (Gmail OAuth2)
EMAIL_USER=your-email@gmail.com
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
GMAIL_OAUTH_REDIRECT_URI=https://developers.google.com/oauthplayground

# URLs
FRONTEND_URL=http://localhost:3000
ADMIN_PANEL_URL=http://localhost:4000

# Server
PORT=2018
NODE_ENV=development
```

---

## 🌐 Frontend Structure (`/frontend`)

### **Technology Stack**
- **Framework**: Next.js 15.3.5 (App Router)
- **React**: 19.0.0
- **Styling**: Tailwind CSS 4
- **Maps**: Mapbox GL JS 3.13.0
- **HTTP Client**: Axios 1.10.0
- **Forms**: React Hook Form 7.60.0

### **Directory Structure**
```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.js                 # Root layout
│   │   ├── page.js                   # Home page
│   │   ├── (auth)/                   # Auth route group
│   │   ├── mapview/                  # Map viewer page
│   │   │   └── page.js
│   │   └── api/                      # API routes (if any)
│   │
│   ├── components/
│   │   ├── admin/                    # Admin components
│   │   ├── common/                   # Shared components
│   │   └── mapview/                  # Map-related components
│   │       ├── MapContainer.js       # Main map container
│   │       ├── controls/             # Map controls
│   │       └── layers/               # Map layers
│   │
│   ├── config/
│   │   └── envConfig.js              # Environment config
│   │
│   ├── services/
│   │   └── api.js                    # API client
│   │
│   ├── lib/                          # Utility libraries
│   ├── utils/                        # Helper functions
│   ├── style/                        # Global styles
│   └── GooleAnalytics/               # Analytics (typo in name)
│
├── public/
│   ├── logo/                         # Logo assets
│   ├── mapview/                      # Map-related assets
│   ├── road_shields/                 # Road shield images
│   └── assets/                       # Other assets
│
├── package.json
└── .env                              # Environment variables
```

### **Frontend Environment Variables**
```env
NEXT_PUBLIC_API_URL=http://localhost:2018
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

### **Key Frontend Features**
- Interactive water quality map viewer
- Location search with Mapbox Geocoding API
- Water district boundaries visualization
- Contaminant data display
- Responsive design with Tailwind CSS

---

## 🎛️ Admin Panel Structure (`/admin-panel`)

### **Technology Stack**
- **Framework**: Next.js 15.4.5 (App Router)
- **React**: 19.1.0
- **Styling**: Tailwind CSS 4 + Framer Motion
- **Maps**: Mapbox GL JS 3.15.0
- **State Management**: SWR 2.3.6, React Query 5.83.0
- **Authorization**: CASL 6.7.3 (role-based access)
- **HTTP Client**: Axios 1.12.2

### **Directory Structure**
```
admin-panel/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.js                 # Root layout
│   │   ├── page.js                   # Landing page
│   │   ├── globals.css               # Global styles
│   │   │
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── signin/page.js
│   │   │   ├── forgot-password/page.js
│   │   │   └── reset-password/page.js
│   │   │
│   │   ├── dashboard/                # Dashboard pages
│   │   │   ├── page.js               # Main dashboard
│   │   │   ├── customers/page.js     # Customer management
│   │   │   ├── customer-management/page.js # New customer management
│   │   │   ├── user-management/page.js # User management
│   │   │   ├── crm-cmms/page.js       # CRM/CMMS operations
│   │   │   ├── contaminants/         # Contaminant management
│   │   │   │   ├── types/page.js
│   │   │   │   ├── classifications/page.js
│   │   │   │   ├── subclassifications/page.js
│   │   │   │   └── analytes/page.js
│   │   │   ├── layer-styles/page.js   # Map layer styling
│   │   │   ├── content/page.js        # Content management
│   │   │   └── profile/page.js        # User profile
│   │   │
│   │   ├── api/                      # API route handlers
│   │   │   ├── auth/                  # Auth API routes
│   │   │   ├── invitations/          # Invitation API routes
│   │   │   ├── layer-styles/          # Layer styles API
│   │   │   └── users/                 # User API routes
│   │   │
│   │   ├── accept-invitation/        # Invitation acceptance
│   │   ├── accept-invite/            # Alternative invite route
│   │   └── verify-email/              # Email verification
│   │
│   ├── components/
│   │   ├── common/                   # Shared components
│   │   │   ├── Header.js
│   │   │   ├── Sidebar.js            # Navigation sidebar
│   │   │   └── Navbar.js
│   │   │
│   │   ├── layout/
│   │   │   └── DashboardLayout.js    # Main dashboard layout
│   │   │
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   ├── Modal.js
│   │   │   ├── DataTable.js
│   │   │   ├── Badge.js
│   │   │   └── LoadingSpinner.js
│   │   │
│   │   ├── customer-management/      # Customer management
│   │   │   ├── CreateAccountModal.js # New account creation
│   │   │   ├── CustomerManagementPage.js # Main page
│   │   │   └── MultiCustomerInvitationModal.js
│   │   │
│   │   ├── crm-cmms/                 # CRM/CMMS components
│   │   │   └── CustomerHierarchy.jsx
│   │   │
│   │   ├── user-management/          # User management
│   │   │   ├── CustomerAssignmentModal.js
│   │   │   └── MembershipManagementModal.js
│   │   │
│   │   ├── mapview/                  # Map components
│   │   │   └── CustomerMapView.js
│   │   │
│   │   ├── layerStyles/              # Layer styling
│   │   ├── dashboard/                # Dashboard widgets
│   │   ├── AddressAutocomplete.js    # Mapbox geocoding
│   │   ├── PhoneInput.js             # Phone input component
│   │   └── CustomerDetailsSidebar.js
│   │
│   ├── services/
│   │   ├── api.js                    # Main API client
│   │   ├── api-client.js             # Alternative API client
│   │   ├── customerService.js       # Customer operations
│   │   ├── contaminants.api.js       # Contaminant API
│   │   └── complete-schema-mapping.js # Database schema mapping
│   │
│   ├── context/
│   │   └── UserContext.js            # User context provider
│   │
│   ├── hooks/
│   │   └── useRouteProtection.js    # Route protection hook
│   │
│   ├── lib/
│   │   └── rbac.js                   # Role-based access control
│   │
│   ├── utils/
│   │   └── constants.js              # Constants
│   │
│   └── config/
│
├── public/                            # Static assets
├── package.json
├── .env.development                   # Development env vars
└── .env.production                    # Production env vars
```

### **Admin Panel Environment Variables**
```env
# Development
PORT=4001
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:2018
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Production
PORT=4000
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://waterreportcard.com
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

---

## 🗄️ Database Schema

### **PostgreSQL Database Structure**

The project uses PostgreSQL with multiple schemas:
- **`core`** - Main application data
- **`audit`** - Audit logging
- **`public`** - Public schema

### **Key Tables (from schema analysis)**

#### **Customer/Account Management**
- `accounts` - Customer accounts
- `addresses` - Physical addresses with geospatial data
- `locations` - Business locations
- `contacts` - Contact information
- `contacts_enhanced` - Enhanced contact data
- `customer_tier1`, `customer_tier2`, `customer_tier3` - Customer hierarchy

#### **CRM/CMMS**
- `manufacturers` - Equipment manufacturers
- `asset_categories` - Asset categorization
- `equipment_specifications` - Equipment specs
- `parts_listing` - Parts inventory
- `cartridge_components` - Filter components
- `buildings` - Building information
- `floors` - Floor data
- `water_filter_projects` - Filter projects
- `filter_installations` - Installation records
- `installed_cartridges` - Installed cartridges
- `water_quality_metrics` - Quality measurements
- `filter_lifespan_tracking` - Filter tracking
- `leak_monitoring` - Leak detection
- `work_orders` - Maintenance work orders

#### **User Management**
- `users` - User accounts
- `roles` - Role definitions
- `memberships` - User-customer memberships
- `capabilities` - Permission capabilities
- `invitations` - User invitations
- `user_links` - User account links

#### **Content & Configuration**
- `layer_styles` - Map layer styling
- `content` - Content management
- `contaminants` - Water contaminant data
- `analyte_types` - Analyte type definitions
- `classifications` - Contaminant classifications
- `subclassifications` - Subclassifications

---

## 🔄 Data Flow

### **Request Flow**
```
Frontend/Admin Panel
    ↓ (HTTP Request)
Backend API (Express.js)
    ↓ (SQL Query)
PostgreSQL Database
    ↓ (Response)
Backend API
    ↓ (JSON Response)
Frontend/Admin Panel
```

### **Authentication Flow**
```
1. User Login → Backend Auth Service
2. Validate Credentials → PostgreSQL
3. Generate JWT Token → Return to Client
4. Client Stores Token → localStorage
5. Subsequent Requests → Include JWT in Header
6. Backend Middleware → Validates JWT
7. Role-Based Access → CASL/Backend RBAC
```

### **Map Tile Flow**
```
1. Mapbox GL JS Requests Tile → /tiles/:z/:x/:y.pbf
2. Backend Tile Controller → Reads MBTiles File
3. MBTiles Package → Extracts Tile from SQLite
4. Returns PBF Tile → Mapbox GL JS
5. Renders on Map → User sees water districts
```

---

## 🚀 Deployment Configuration

### **PM2 Configuration** (`ecosystem.config.cjs`)
```javascript
{
  apps: [
    {
      name: 'backend',
      script: './src/server.js',
      cwd: './backend',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'admin-panel',
      script: 'npm',
      args: 'start',
      cwd: './admin-panel',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://waterreportcard.com'
      }
    }
  ]
}
```

### **Production Domains**
- Frontend: `https://waterreportcard.com` / `https://www.waterreportcard.com`
- Admin Panel: `https://admin.waterreportcard.com`
- Backend API: `https://waterreportcard.com` (port 2018)

---

## 📦 Key Dependencies

### **Backend**
- `express` ^5.1.0 - Web framework
- `pg` ^8.16.3 - PostgreSQL client
- `passport` ^0.7.0 - Authentication
- `jsonwebtoken` ^9.0.2 - JWT tokens
- `bcrypt` ^6.0.0 - Password hashing
- `nodemailer` ^7.0.5 - Email sending
- `googleapis` ^160.0.0 - Google OAuth2
- `@mapbox/mbtiles` ^0.12.1 - MBTiles reader
- `helmet` ^8.1.0 - Security headers
- `cors` ^2.8.5 - CORS middleware

### **Frontend**
- `next` 15.3.5 - React framework
- `react` ^19.0.0 - UI library
- `mapbox-gl` ^3.13.0 - Map rendering
- `axios` ^1.10.0 - HTTP client
- `react-hook-form` ^7.60.0 - Form handling
- `tailwindcss` ^4 - CSS framework

### **Admin Panel**
- `next` 15.4.5 - React framework
- `react` 19.1.0 - UI library
- `framer-motion` ^12.23.22 - Animations
- `@casl/ability` ^6.7.3 - Authorization
- `swr` ^2.3.6 - Data fetching
- `@tanstack/react-query` ^5.83.0 - State management
- `recharts` ^3.1.0 - Charts
- `mapbox-gl` ^3.15.0 - Map rendering

---

## 🔐 Security Features

1. **Authentication**
   - JWT-based authentication
   - Passport.js strategies (JWT + Local)
   - Password hashing with bcrypt
   - Refresh token support

2. **Authorization**
   - Role-based access control (RBAC)
   - CASL ability system (admin panel)
   - Hierarchical permissions
   - Customer-scoped access

3. **Security Middleware**
   - Helmet.js for security headers
   - CORS configuration
   - Rate limiting (express-rate-limit)
   - Input validation

4. **Audit Logging**
   - Request context tracking
   - User action logging
   - Audit schema in database

---

## 🗺️ Map Integration

### **Mapbox Integration**
- **Base Maps**: Mapbox GL JS styles
- **Custom Tiles**: Self-hosted MBTiles (water districts)
- **Geocoding**: Mapbox Geocoding API
- **Vector Tiles**: PBF format served from backend

### **MBTiles Files**
- `water_districts.mbtiles` (957 MB) - Water district boundaries
- `water_boundaries.mbtiles` (759 MB) - Water boundaries
- Served via: `/tiles/:z/:x/:y.pbf` endpoint

---

## 📝 Development Workflow

### **Running the Project**

```bash
# Install all dependencies
npm run install

# Development mode (all services)
npm run dev

# Individual services
npm run dev:backend    # Backend on port 2018
npm run dev:frontend   # Frontend on port 3000
npm run dev:admin      # Admin panel on port 4001

# Production mode
npm run build          # Build all
npm start              # Start all services
```

### **Environment Setup**
1. Create `.env` files in each directory
2. Configure PostgreSQL database
3. Set up Mapbox access token
4. Configure Gmail OAuth2 (for emails)
5. Set JWT secrets

---

## 📊 Project Statistics

- **Total Components**: 3 main applications
- **Backend Routes**: 10 route modules
- **Controllers**: 9 controllers
- **Services**: 8 service modules
- **Database Tables**: 30+ tables
- **Map Tiles**: 1.7 GB of MBTiles data
- **Lines of Code**: ~50,000+ lines (estimated)

---

## 🔗 External Dependencies

### **Third-Party APIs**
1. **Mapbox API**
   - Geocoding API (address search)
   - Map styles (base maps)
   - Access token required

2. **Google APIs**
   - Gmail OAuth2 (email sending)
   - OAuth credentials required

### **Self-Hosted Services**
- PostgreSQL database
- MBTiles map tiles
- JWT authentication
- All business logic

---

## 📚 Additional Notes

- **Code Style**: ES6+ modules, async/await
- **Database**: PostgreSQL with PostGIS (geospatial)
- **File Structure**: Feature-based organization
- **State Management**: React Context + SWR/React Query
- **Styling**: Tailwind CSS utility-first approach
- **Build Tool**: Next.js built-in (Turbopack in dev)

---

*Last Updated: Based on current codebase analysis*
*Project: Water Report Card (WRC-Alex-Dev)*

