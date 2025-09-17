# MADE Event Manager Pro

A comprehensive event management system built with React, TypeScript, and Supabase for managing events, clients, billing, and financial analytics.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Authentication System](#authentication-system)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Project Overview

MADE Event Manager Pro is a full-stack web application designed for event management companies to handle their complete business workflow. The system provides comprehensive tools for managing clients, events, billing, expenses, and financial analytics with role-based access control and real-time data visualization.

### Key Capabilities
- **Event Management**: Complete lifecycle management from creation to payment
- **Client Management**: Comprehensive client database with Mexican RFC validation
- **Financial Analytics**: Real-time dashboard with 3D charts and profit analysis
- **Billing System**: Invoice generation and payment tracking
- **User Management**: Role-based access control with three user levels
- **Activity Logging**: Complete audit trail of all system activities

## ✨ Features

### 🔐 Authentication & User Management
- **Dual Authentication Modes**: Development (role selector) and Production (full auth)
- **Role-Based Access Control**: Three user levels with specific permissions
  - **Administrador**: Full system access, user management, configuration
  - **Ejecutivo**: Event management, billing operations, client management
  - **Visualizador**: Read-only access to dashboard and reports
- **Security Features**: Session management, account lockout, rate limiting
- **User Profile Management**: Password changes, profile updates, activity tracking

### 📊 Dashboard & Analytics
- **Interactive 3D Charts**: Income distribution, expense breakdown, profit analysis
- **Real-Time KPIs**: Total income, expenses, profit margins, efficiency metrics
- **Monthly Trends**: Event distribution over time with trend analysis
- **Dynamic Filtering**: Filter by year, status, and custom date ranges
- **Export Capabilities**: Chart export to PNG/PDF formats

### 🏢 Client Management
- **Mexican Business Support**: RFC validation, razón social, nombre comercial
- **CRUD Operations**: Create, read, update, delete client records
- **Search & Filter**: Advanced search across all client fields
- **Activity Logging**: Track all client-related changes

### 📅 Event Management
- **Complete Event Lifecycle**: From creation to payment completion
- **Financial Calculations**: Automatic IVA (16%) calculations for Mexican tax compliance
- **Status Workflow**: Sequential status progression with validation
- **Document Management**: Invoice and payment receipt uploads
- **Expense Tracking**: Categorized expense management per event

### 💰 Financial Management
- **Automated Calculations**: Mexican tax-compliant financial calculations
- **Expense Categories**: 
  - SPs (Professional Services)
  - Combustible/Peaje (Fuel/Tolls)
  - RH (Human Resources)
  - Materiales (Materials)
  - Provisiones (Provisions)
- **Profit Analysis**: Real-time profitability calculations
- **Payment Status Tracking**: Four-stage payment workflow

### 📈 Billing Master
- **Invoice Management**: Complete billing workflow
- **Payment Tracking**: Status progression from pending to paid
- **Document Storage**: PDF storage for invoices and payment receipts
- **Financial Reporting**: Comprehensive financial analytics

### 🛠 Administrative Tools
- **Database Seeder**: Generate realistic test data for development
- **User Management**: Create, edit, and manage user accounts
- **Activity Logs**: Complete audit trail of all system activities
- **Database Verification**: Health checks and system validation
- **Catalog Management**: Manage all system catalogs and reference data

## 🚀 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Modern web browser with JavaScript enabled

### Step 1: Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd made-event-manager-pro

# Install dependencies
npm install
```

### Step 2: Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Step 3: Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API in your Supabase dashboard
3. Copy your Project URL and anon public key
4. Update your `.env` file with these credentials

### Step 4: Database Setup
```bash
# Start the development server
npm run dev

# Navigate to the admin panel and run database seeder
# Or manually run the SQL migrations in your Supabase dashboard
```

## ⚙️ Configuration

### Environment Variables

```bash
# === SUPABASE CONFIGURATION ===
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# === AUTHENTICATION MODE ===
# Controls the authentication behavior
# Values: "development" | "production"
VITE_AUTH_MODE=development

# === DEVELOPMENT SETTINGS ===
# Enable role selector in development mode
VITE_ENABLE_ROLE_SELECTOR=true

# === SESSION CONFIGURATION ===
# Session timeout in minutes (default: 480 = 8 hours)
VITE_SESSION_TIMEOUT=480

# === SECURITY SETTINGS ===
# Maximum login attempts before account lockout
VITE_MAX_LOGIN_ATTEMPTS=5
```

### Authentication Modes

#### Development Mode (`VITE_AUTH_MODE=development`)
- **Role Selector**: Quick access without credentials
- **Test Users**: Predefined credentials for testing
- **Debug Logging**: Detailed console logs
- **Relaxed Validation**: Simplified for development

#### Production Mode (`VITE_AUTH_MODE=production`)
- **Full Authentication**: Complete login/registration with Supabase
- **Enhanced Security**: Strict validations and security measures
- **Session Management**: Automatic timeouts and renewal
- **Anti-Loop Protection**: Robust navigation guards

## 📖 Usage

### Getting Started

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Access the System**
   - Development Mode: Use the role selector or test credentials
   - Production Mode: Register a new account or use existing credentials

3. **Test Credentials (Development Mode)**
   ```
   Administrator: admin@made.com / admin123
   Ejecutivo: ejecutivo@made.com / ejecutivo123
   Visualizador: visualizador@made.com / visualizador123
   ```

### Core Workflows

#### 1. Client Management
```typescript
// Navigate to Clients section
// Add new client with Mexican business data
{
  razon_social: "Empresa Ejemplo SA de CV",
  nombre_comercial: "Empresa Ejemplo",
  rfc: "EEJ123456ABC"
}
```

#### 2. Event Creation
```typescript
// Create new event
{
  clave_evento: "EVT-2025-001",
  nombre_proyecto: "Conferencia Anual 2025",
  client_id: 1,
  subtotal: 100000,
  iva: 16000,      // Calculated automatically
  total: 116000,   // Calculated automatically
  status_pago: "Pendiente Facturar"
}
```

#### 3. Financial Management
- **Automatic IVA Calculation**: 16% Mexican tax rate
- **Expense Categorization**: Five predefined categories
- **Profit Analysis**: Real-time profitability calculations
- **Payment Tracking**: Four-stage workflow

#### 4. Dashboard Analytics
- **Income Distribution**: Pending vs. paid analysis
- **Expense Breakdown**: By category with percentages
- **Profit Analysis**: Margin calculations and trends
- **Monthly Events**: Temporal distribution analysis

## 🔐 Authentication System

### User Roles and Permissions

| Role | Dashboard | Events | Clients | Users | Billing | Logs |
|------|-----------|--------|---------|-------|---------|------|
| **Administrador** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Ejecutivo** | ✅ View | ✅ Full | ✅ View | ❌ None | ✅ Full | ❌ None |
| **Visualizador** | ✅ View | ✅ View | ✅ View | ❌ None | ✅ View | ❌ None |

### Security Features
- **Session Management**: Configurable timeouts with warnings
- **Rate Limiting**: Protection against brute force attacks
- **Account Lockout**: Temporary lockout after failed attempts
- **Activity Logging**: Complete audit trail
- **Password Policy**: Strong password requirements

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  username text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'Visualizador',
  status user_status DEFAULT 'Activo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Clients Table
```sql
CREATE TABLE clients (
  id integer PRIMARY KEY,
  razon_social text NOT NULL,
  nombre_comercial text NOT NULL,
  rfc text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

#### Events Table
```sql
CREATE TABLE events (
  id integer PRIMARY KEY,
  clave_evento text UNIQUE NOT NULL,
  nombre_proyecto text NOT NULL,
  subtotal numeric DEFAULT 0,
  iva numeric DEFAULT 0,
  total numeric DEFAULT 0,
  client_id integer REFERENCES clients(id),
  status_pago payment_status DEFAULT 'Pendiente Facturar',
  utilidad numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

#### Expenses Table
```sql
CREATE TABLE expenses (
  id integer PRIMARY KEY,
  concepto text NOT NULL,
  monto_a_pagar numeric NOT NULL DEFAULT 0,
  event_id integer REFERENCES events(id),
  category expense_category NOT NULL DEFAULT 'SPs',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id)
);
```

### Custom Types
```sql
-- User roles
CREATE TYPE user_role AS ENUM ('Administrador', 'Ejecutivo', 'Visualizador');

-- User status
CREATE TYPE user_status AS ENUM ('Activo', 'Bloqueado', 'Inactivo', 'Pendiente');

-- Payment status
CREATE TYPE payment_status AS ENUM ('Pagado', 'Pago Pendiente', 'Pendiente Facturar', 'Vencido');

-- Expense categories
CREATE TYPE expense_category AS ENUM ('Combustible/Peaje', 'Materiales', 'Provisiones', 'RH', 'SPs');

-- Action types for logging
CREATE TYPE action_type AS ENUM ('CREATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'UPDATE');
```

## 🔌 API Documentation

### Supabase Edge Functions

#### Update User Password
```typescript
POST /functions/v1/update-user-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userId": "uuid",
  "newPassword": "string",
  "forceChange": boolean,
  "changedBy": "uuid"
}
```

### Database Operations

#### Authentication Queries
```typescript
// Get user profile
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// Update user status
const { error } = await supabase
  .from('users')
  .update({ status: 'Activo' })
  .eq('id', userId);
```

#### Event Management
```typescript
// Fetch events with client data
const { data, error } = await supabase
  .from('events')
  .select(`
    *,
    client:clients(*),
    expenses:expenses(*)
  `)
  .order('created_at', { ascending: false });
```

#### Financial Calculations
```typescript
// Auto-calculate IVA and totals
const financials = autoCalculateFinancials('subtotal', 100000);
// Returns: { subtotal: 100000, vat: 16000, total: 116000 }
```

## 🏗️ Architecture

### Frontend Architecture
```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── admin/           # Administrative interfaces
│   ├── charts/          # Data visualization components
│   ├── catalogs/        # Catalog management
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
│   └── useAuth.tsx      # Authentication hook
├── types/               # TypeScript type definitions
│   ├── auth.ts          # Authentication types
│   └── database.ts      # Database types
├── utils/               # Utility functions
│   ├── authConfig.ts    # Authentication configuration
│   ├── authGuards.ts    # Security guards
│   ├── chartColors.ts   # Chart styling
│   ├── financial.ts     # Financial calculations
│   └── workflow.ts      # Business logic
└── styles/              # CSS and styling
    └── design-system.css # Design system
```

### Backend Architecture
```
supabase/
├── functions/           # Edge functions
│   └── update-user-password/ # Password management
└── migrations/          # Database migrations
    └── *.sql           # Schema definitions
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Charts**: Custom SVG-based 3D visualizations
- **State Management**: React Context + Custom hooks
- **Styling**: Tailwind CSS + Custom design system

## 🔧 Development

### Available Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

### Development Workflow

1. **Set Development Mode**
   ```bash
   echo "VITE_AUTH_MODE=development" > .env
   npm run dev
   ```

2. **Generate Test Data**
   - Login as Administrator
   - Navigate to "Generador de Datos"
   - Run "Siembra Rápida" for basic test data

3. **Test Different Roles**
   - Use role selector in development mode
   - Or use test credentials provided

### Code Quality Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with React hooks rules
- **File Organization**: Modular architecture with clear separation
- **Error Handling**: Comprehensive error boundaries and validation
- **Performance**: Optimized queries and memoized calculations

## 📊 Financial System

### Mexican Tax Compliance
The system is specifically designed for Mexican businesses with:
- **16% IVA (VAT) Calculations**: Automatic tax calculations
- **RFC Validation**: Mexican tax ID validation
- **Currency Formatting**: Mexican peso (MXN) formatting
- **Business Entity Support**: SA de CV, SAPI de CV, etc.

### Financial Calculations
```typescript
// Automatic IVA calculation from subtotal
const subtotal = 100000;
const iva = calculateIVAFromSubtotal(subtotal); // 16000
const total = subtotal + iva; // 116000

// Reverse calculation from total
const total = 116000;
const iva = calculateIVAFromTotal(total); // 16000
const subtotal = total - iva; // 100000
```

### Expense Categories
1. **SPs**: Professional services and specialized providers
2. **Combustible/Peaje**: Fuel and toll expenses
3. **RH**: Human resources and personnel costs
4. **Materiales**: Materials and equipment
5. **Provisiones**: Catering and provisions

## 🎨 Design System

### Color Palette
```css
/* Primary Colors */
--color-mint: #74F1C8;      /* Success, profits, positive metrics */
--color-white: #FFFFFF;     /* Backgrounds, contrast text */
--color-black: #000000;     /* Primary text, emphasis */

/* Grayscale */
--gray-dark: #6E7C89;       /* Secondary data, expenses */
--gray-mid: #9B9B9B;        /* Neutral data, inactive states */
--gray-soft: #B4B4B4;       /* Borders, subtle elements */

/* Extended Palette */
--ocean-blue: #4A90E2;      /* Primary actions, invoiced status */
--coral-orange: #F5A623;    /* Warnings, pending payments */
--deep-purple: #7B68EE;     /* Premium services */
--forest-green: #50C878;    /* Growth, completed projects */
--warm-red: #E74C3C;        /* Overdue, critical items */
--golden-yellow: #F1C40F;   /* Attention, featured items */
```

### Component System
- **Buttons**: Primary, secondary, destructive, ghost variants
- **Forms**: Comprehensive form system with validation
- **Cards**: Flexible card layouts for content organization
- **Status Badges**: Color-coded status indicators
- **Charts**: 3D SVG-based visualization components

## 🔍 Troubleshooting

### Common Issues

#### Authentication Problems
```bash
# Issue: "Invalid login credentials"
# Solution: Generate test users in admin panel
1. Set VITE_AUTH_MODE=development
2. Use role selector to access as Administrator
3. Go to "Generador de Datos" → "Generar Usuarios Base"
4. Try login again with test credentials
```

#### Database Connection Issues
```bash
# Issue: "Failed to fetch"
# Solution: Check Supabase configuration
1. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
2. Check Supabase project status
3. Verify RLS policies are configured correctly
```

#### Missing Data
```bash
# Issue: Empty dashboard or missing data
# Solution: Generate test data
1. Login as Administrator
2. Navigate to "Generador de Datos"
3. Run "Siembra Rápida" for basic data
4. Or "Siembra Completa" for comprehensive dataset
```

### Debug Mode
Enable detailed logging in development:
```bash
VITE_AUTH_MODE=development
# Check browser console for detailed logs
```

### Performance Optimization
- **Database Queries**: Optimized with proper indexing
- **Chart Rendering**: Memoized calculations and debounced interactions
- **Memory Management**: Proper cleanup of timers and event listeners
- **Bundle Size**: Optimized imports and code splitting

## 🧪 Testing

### Test Data Generation
The system includes comprehensive test data generation:

#### Quick Seed (30 seconds)
- 15 test users (5 per role)
- 20 Mexican clients with valid RFCs
- 200 events (10 per client)
- 1,000 expenses (5 per event)

#### Full Seed (3-5 minutes)
- 15 test users
- 20 Mexican clients
- 2,480 events (124 per client)
- 24,800 expenses (10 per event)

### Test User Credentials
| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Administrador | admin@made.com | admin123 | Full system access |
| Ejecutivo | ejecutivo@made.com | ejecutivo123 | Event management |
| Visualizador | visualizador@made.com | visualizador123 | Read-only access |

## 📱 Responsive Design

The application is fully responsive with:
- **Mobile-First Design**: Optimized for mobile devices
- **Tablet Support**: Enhanced layouts for tablet screens
- **Desktop Experience**: Full-featured desktop interface
- **Touch-Friendly**: Optimized for touch interactions

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Security Features

### Data Protection
- **Row Level Security (RLS)**: Database-level access control
- **Input Validation**: Comprehensive client and server-side validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization and output encoding

### Authentication Security
- **Password Hashing**: Supabase-managed secure hashing
- **Session Management**: Secure token handling
- **Rate Limiting**: Protection against brute force attacks
- **Account Lockout**: Temporary lockout after failed attempts

### Audit Trail
- **Activity Logging**: All user actions logged
- **Change Tracking**: Before/after values for updates
- **User Attribution**: All changes attributed to users
- **Timestamp Tracking**: Precise timing of all activities

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   VITE_AUTH_MODE=production
   VITE_ENABLE_ROLE_SELECTOR=false
   VITE_SUPABASE_URL=https://your-production-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-production-anon-key
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Deploy to Hosting Platform**
   - Vercel, Netlify, or any static hosting
   - Ensure environment variables are configured
   - Enable HTTPS for production

### Database Migration
1. **Export Schema**: Use Supabase dashboard to export schema
2. **Create Production Database**: Set up production Supabase project
3. **Run Migrations**: Execute all SQL migrations
4. **Configure RLS**: Set up Row Level Security policies
5. **Create Admin User**: Create initial administrator account

## 📋 API Reference

### Authentication Endpoints
```typescript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: { username: 'User Name', role: 'Visualizador' }
  }
});
```

### Data Operations
```typescript
// Fetch events with relationships
const { data, error } = await supabase
  .from('events')
  .select(`
    *,
    client:clients(*),
    expenses:expenses(*)
  `)
  .order('created_at', { ascending: false });

// Create new client
const { data, error } = await supabase
  .from('clients')
  .insert([{
    razon_social: 'Company Name SA de CV',
    nombre_comercial: 'Company Name',
    rfc: 'ABC123456XYZ'
  }])
  .select()
  .single();
```

## 🛠️ Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Set up development environment with test data
4. Make your changes following the coding standards
5. Test thoroughly with different user roles
6. Submit a pull request

### Coding Standards
- **TypeScript**: Use strict typing throughout
- **Components**: Keep components under 200 lines
- **Functions**: Single responsibility principle
- **Naming**: Descriptive names in Spanish for business logic
- **Comments**: Document complex business logic

### Testing Guidelines
- Test all user roles and permissions
- Verify financial calculations accuracy
- Test responsive design on multiple devices
- Validate form inputs and error handling
- Check accessibility compliance

## 📄 License

This project is proprietary software developed for MADE Event Management. All rights reserved.

## 🆘 Support

### Getting Help
1. **Check Documentation**: Review this README and inline comments
2. **Console Logs**: Check browser console for detailed error information
3. **Database Verification**: Use admin tools to verify database state
4. **Test Data**: Generate fresh test data if needed

### Common Solutions
- **Reset Authentication**: Clear localStorage and restart
- **Regenerate Data**: Use database seeder for fresh test data
- **Check Permissions**: Verify user role and status
- **Validate Configuration**: Ensure environment variables are correct

### Contact Information
For technical support or questions about the system, please contact the development team.

---

**Built with ❤️ for efficient event management**

*Last updated: January 2025*