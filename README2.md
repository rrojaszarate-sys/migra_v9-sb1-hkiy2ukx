# MADE Event Manager Pro - Análisis Técnico Completo

## Descripción General

MADE Event Manager Pro es una aplicación web full-stack desarrollada con React, TypeScript y Supabase, diseñada específicamente para empresas mexicanas de gestión de eventos. La aplicación proporciona un sistema integral para la administración del ciclo completo de eventos, desde la creación hasta el pago, incluyendo gestión de clientes, facturación, análisis financiero y control de usuarios con roles específicos.

### Propósito Principal
- **Gestión Integral de Eventos**: Control completo del ciclo de vida de eventos corporativos
- **Cumplimiento Fiscal Mexicano**: Cálculos automáticos de IVA (16%) y validación de RFC
- **Análisis Financiero**: Dashboard con gráficos 3D y métricas de rentabilidad en tiempo real
- **Control de Acceso**: Sistema de roles con tres niveles de permisos
- **Auditoría Completa**: Registro detallado de todas las actividades del sistema

### Contexto de Negocio
La aplicación está optimizada para el mercado mexicano con soporte nativo para:
- Razón social y nombre comercial de empresas
- Validación de RFC (Registro Federal de Contribuyentes)
- Cálculos de IVA según normativa mexicana (16%)
- Formatos de fecha y moneda en español mexicano

## Arquitectura del Sistema

### Patrón Arquitectónico: JAMstack + BaaS
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Components  │  │   Hooks     │  │   Utils     │         │
│  │   Layer     │  │   Layer     │  │   Layer     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    STATE MANAGEMENT                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Auth Context│  │ Local State │  │ Session Mgmt│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    BACKEND (Supabase)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │ Auth System │  │ Edge Funcs  │         │
│  │ Database    │  │ + RLS       │  │ (Serverless)│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Capas de la Aplicación

#### 1. Capa de Presentación (Frontend)
- **Framework**: React 18 con TypeScript
- **Styling**: Tailwind CSS + Sistema de diseño personalizado
- **Iconografía**: Lucide React
- **Routing**: Navegación basada en estado (SPA)

#### 2. Capa de Lógica de Negocio
- **Hooks Personalizados**: Gestión de estado y efectos
- **Utilidades**: Cálculos financieros, validaciones, workflows
- **Guards**: Protección de rutas y autenticación

#### 3. Capa de Datos (Backend)
- **Base de Datos**: PostgreSQL 15+ (Supabase)
- **Autenticación**: Supabase Auth + Perfiles personalizados
- **Seguridad**: Row Level Security (RLS)
- **Funciones**: Edge Functions para operaciones administrativas

## Estructura de Archivos Completa

```
made-event-manager-pro/
├── 📁 public/                          # Assets estáticos
│   └── vite.svg                        # Logo de Vite
├── 📁 src/                             # Código fuente principal
│   ├── 📁 components/                  # Componentes React
│   │   ├── 📁 admin/                   # Componentes administrativos
│   │   │   ├── AdminDashboard.tsx      # Dashboard de administración
│   │   │   ├── ClientsManager.tsx      # Gestión de clientes (admin)
│   │   │   ├── DatabaseRecreation.tsx  # Recreación de BD
│   │   │   ├── DatabaseSeeder.tsx      # Generador de datos
│   │   │   ├── DatabaseVerification.tsx # Verificación de BD
│   │   │   ├── EventsManager.tsx       # Gestión de eventos (admin)
│   │   │   ├── ExpensesManager.tsx     # Gestión de gastos (admin)
│   │   │   ├── IncomesManager.tsx      # Gestión de ingresos (admin)
│   │   │   ├── PasswordUpdateModal.tsx # Modal cambio contraseñas
│   │   │   └── UserManager.tsx         # Gestión de usuarios
│   │   ├── 📁 auth/                    # Sistema de autenticación
│   │   │   ├── AuthContainer.tsx       # Contenedor principal auth
│   │   │   ├── AuthGuard.tsx           # Protección de rutas
│   │   │   ├── AuthStatus.tsx          # Estado de autenticación
│   │   │   ├── LoginForm.tsx           # Formulario de login
│   │   │   ├── RegisterForm.tsx        # Formulario de registro
│   │   │   ├── SessionManager.tsx      # Gestión de sesiones
│   │   │   └── UserProfile.tsx         # Perfil de usuario
│   │   ├── 📁 catalogs/                # Gestión de catálogos
│   │   │   ├── CatalogManager.tsx      # Gestor principal
│   │   │   ├── ClientsCatalog.tsx      # Catálogo de clientes
│   │   │   ├── EventsCatalog.tsx       # Catálogo de eventos
│   │   │   ├── ExpensesCatalog.tsx     # Catálogo de gastos
│   │   │   └── IncomesCatalog.tsx      # Catálogo de ingresos
│   │   ├── 📁 charts/                  # Visualización de datos
│   │   │   ├── ExpenseChart3D.tsx      # Gráfico 3D de gastos
│   │   │   ├── IncomeChart3D.tsx       # Gráfico 3D de ingresos
│   │   │   ├── MonthlyEventsChart.tsx  # Gráfico eventos mensuales
│   │   │   └── ProfitChart3D.tsx       # Gráfico 3D de rentabilidad
│   │   ├── 📁 enhanced/                # Componentes mejorados
│   │   │   └── EnhancedEventDetail.tsx # Detalle evento mejorado
│   │   ├── 📁 ui/                      # Componentes UI reutilizables
│   │   │   ├── FileUpload.tsx          # Subida de archivos
│   │   │   ├── FinancialInput.tsx      # Input financiero
│   │   │   ├── ProfitabilityChart.tsx  # Gráfico de rentabilidad
│   │   │   ├── StatusBadge.tsx         # Badge de estado
│   │   │   └── StatusWorkflow.tsx      # Flujo de estados
│   │   ├── ActivityLog.tsx             # Log de actividades
│   │   ├── BillingMaster.tsx           # Master de facturación
│   │   ├── Clients.tsx                 # Gestión de clientes
│   │   ├── CreateEvent.tsx             # Creación de eventos
│   │   ├── Dashboard.tsx               # Dashboard principal
│   │   ├── EventDetail.tsx             # Detalle de evento
│   │   ├── Layout.tsx                  # Layout principal
│   │   └── RoleSelector.tsx            # Selector de roles (dev)
│   ├── 📁 hooks/                       # Hooks personalizados
│   │   └── useAuth.tsx                 # Hook de autenticación
│   ├── 📁 lib/                         # Librerías y configuración
│   │   └── supabase.ts                 # Cliente de Supabase
│   ├── 📁 styles/                      # Estilos y diseño
│   │   └── design-system.css           # Sistema de diseño
│   ├── 📁 types/                       # Definiciones TypeScript
│   │   ├── auth.ts                     # Tipos de autenticación
│   │   └── database.ts                 # Tipos de base de datos
│   ├── 📁 utils/                       # Utilidades y helpers
│   │   ├── authConfig.ts               # Configuración de auth
│   │   ├── authGuards.ts               # Guards de autenticación
│   │   ├── chartColors.ts              # Colores de gráficos
│   │   ├── databaseSeeder.ts           # Generador de datos
│   │   ├── databaseVerification.ts     # Verificación de BD
│   │   ├── financial.ts                # Cálculos financieros
│   │   ├── passwordValidation.ts       # Validación de contraseñas
│   │   └── workflow.ts                 # Flujos de trabajo
│   ├── App.tsx                         # Componente raíz
│   ├── index.css                       # Estilos globales
│   ├── main.tsx                        # Punto de entrada
│   └── vite-env.d.ts                   # Tipos de Vite
├── 📁 supabase/                        # Configuración Supabase
│   ├── 📁 functions/                   # Edge Functions
│   │   ├── 📁 manage-user/             # Gestión de usuarios
│   │   │   └── index.ts                # Función de gestión
│   │   └── 📁 update-user-password/    # Actualización contraseñas
│   │       └── index.ts                # Función de actualización
│   └── 📁 migrations/                  # Migraciones de BD
│       └── [múltiples archivos .sql]   # Esquemas y datos
├── 📁 database-recreation/             # Scripts de recreación
│   ├── 01-environment-assessment.md    # Evaluación de entorno
│   ├── 03-test-users-credentials.txt   # Credenciales de prueba
│   └── 06-execution-checklist.md       # Lista de verificación
├── 📁 documentation/                   # Documentación técnica
│   ├── AUTHENTICATION_DEBUG_REPORT.md  # Reporte de debug auth
│   ├── AUTHENTICATION_TESTING_GUIDE.md # Guía de testing auth
│   ├── DEBUG_REPORT.md                 # Reporte general debug
│   └── QA_AUTHENTICATION_REVIEW.md     # Revisión QA auth
├── 📄 .env.example                     # Plantilla variables entorno
├── 📄 eslint.config.js                 # Configuración ESLint
├── 📄 index.html                       # HTML principal
├── 📄 package.json                     # Dependencias y scripts
├── 📄 postcss.config.js                # Configuración PostCSS
├── 📄 README.md                        # Documentación principal
├── 📄 tailwind.config.js               # Configuración Tailwind
├── 📄 tsconfig.app.json                # Config TypeScript app
├── 📄 tsconfig.json                    # Config TypeScript raíz
├── 📄 tsconfig.node.json               # Config TypeScript Node
└── 📄 vite.config.ts                   # Configuración Vite
```

## Tecnologías y Dependencias

### Stack Principal
- **Frontend Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React 0.344.0
- **Backend**: Supabase 2.57.4 (PostgreSQL + Auth + Storage)

### Dependencias de Desarrollo
```json
{
  "@eslint/js": "^9.9.1",
  "@types/react": "^18.3.5",
  "@types/react-dom": "^18.3.0",
  "@vitejs/plugin-react": "^4.3.1",
  "autoprefixer": "^10.4.18",
  "eslint": "^9.9.1",
  "eslint-plugin-react-hooks": "^5.1.0-rc.0",
  "eslint-plugin-react-refresh": "^0.4.11",
  "globals": "^15.9.0",
  "postcss": "^8.4.35",
  "tailwindcss": "^3.4.1",
  "typescript": "^5.5.3",
  "typescript-eslint": "^8.3.0"
}
```

### Herramientas de Desarrollo
- **Linting**: ESLint con reglas para React y TypeScript
- **Formatting**: Prettier integrado
- **Type Checking**: TypeScript en modo estricto
- **Hot Reload**: Vite HMR
- **CSS Processing**: PostCSS + Autoprefixer

## Funcionalidades Detalladas

### 🔐 Sistema de Autenticación Dual
**Archivos principales**: `src/hooks/useAuth.tsx`, `src/components/auth/`

#### Modo Desarrollo
- Selector de roles sin credenciales
- Usuarios de prueba predefinidos
- Bypass de validaciones para testing
- Logging detallado para debugging

#### Modo Producción
- Autenticación completa con Supabase
- Validación de contraseñas robusta
- Gestión de sesiones con timeout
- Protección contra ataques de fuerza bruta

#### Roles y Permisos
```typescript
// Matriz de permisos por rol
const ROLE_PERMISSIONS = {
  'Administrador': {
    read: ['*'], write: ['*'], delete: ['*'], admin: ['users', 'system', 'logs']
  },
  'Ejecutivo': {
    read: ['dashboard', 'events', 'clients', 'billing'], 
    write: ['events', 'clients', 'billing'], delete: ['events', 'expenses']
  },
  'Visualizador': {
    read: ['dashboard', 'events', 'clients', 'reports'], write: [], delete: []
  }
};
```

### 📊 Dashboard Analítico con Gráficos 3D
**Archivos principales**: `src/components/Dashboard.tsx`, `src/components/charts/`

#### Visualizaciones Disponibles
1. **Gráfico de Ingresos 3D** (`IncomeChart3D.tsx`)
   - Distribución pendiente vs pagado
   - Efectos 3D con gradientes y sombras
   - Tooltips interactivos
   - Análisis de efectividad de cobro

2. **Gráfico de Gastos 3D** (`ExpenseChart3D.tsx`)
   - Desglose por 5 categorías
   - Comparación interactiva
   - Ranking dinámico
   - Análisis de distribución

3. **Gráfico de Rentabilidad 3D** (`ProfitChart3D.tsx`)
   - Análisis ingresos vs gastos
   - Cálculo de márgenes
   - Indicadores de eficiencia
   - Métricas de ROI

4. **Gráfico Eventos Mensuales** (`MonthlyEventsChart.tsx`)
   - Distribución temporal
   - Análisis de tendencias
   - Comparación entre períodos
   - Identificación de picos

#### KPIs Dinámicos
```typescript
interface KPIInsights {
  totalIncome: number;        // Ingresos totales
  totalExpenses: number;      // Gastos totales
  efficiency: number;         // Ratio ingresos/gastos
  collectionRate: number;     // % de cobro efectivo
  profitability: number;      // % de rentabilidad
}
```

### 🏢 Gestión de Clientes Mexicanos
**Archivos principales**: `src/components/Clients.tsx`, `src/components/catalogs/ClientsCatalog.tsx`

#### Campos Específicos
- **Razón Social**: Nombre legal de la empresa
- **Nombre Comercial**: Nombre de operación
- **RFC**: Registro Federal de Contribuyentes (validado)

#### Funcionalidades
- CRUD completo con validación
- Búsqueda avanzada multi-campo
- Integración con eventos
- Auditoría de cambios

### 📅 Gestión Integral de Eventos
**Archivos principales**: `src/components/EventDetail.tsx`, `src/components/CreateEvent.tsx`

#### Ciclo de Vida del Evento
1. **Creación**: Datos básicos + cliente + financieros
2. **Gestión de Gastos**: Categorización por tipo
3. **Flujo de Estados**: Workflow secuencial
4. **Facturación**: Generación y seguimiento
5. **Pago**: Confirmación y cierre

#### Cálculos Financieros Automáticos
```typescript
// Cálculo automático de IVA mexicano (16%)
const autoCalculateFinancials = (inputField: 'subtotal' | 'total', value: number) => {
  if (inputField === 'subtotal') {
    const subtotal = value;
    const vat = subtotal * 0.16;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  } else {
    const total = value;
    const vat = total * (0.16 / 1.16);
    const subtotal = total - vat;
    return { subtotal, vat, total };
  }
};
```

### 💰 Sistema de Facturación y Pagos
**Archivos principales**: `src/components/BillingMaster.tsx`, `src/utils/workflow.ts`

#### Estados de Pago Secuenciales
```typescript
const INVOICE_STATUS_SEQUENCE = [
  'Pendiente Facturar',  // Estado inicial
  'Facturado',          // Factura generada
  'Pago Pendiente',     // Esperando pago
  'Pagado'              // Proceso completado
] as const;
```

#### Validaciones de Transición
- Verificación de archivos requeridos
- Permisos por rol
- Razones obligatorias para rollback
- Auditoría completa de cambios

### 📈 Análisis Financiero Avanzado
**Archivos principales**: `src/utils/financial.ts`, `src/utils/chartColors.ts`

#### Métricas Calculadas
- **Margen de Utilidad**: (Ingresos - Gastos) / Ingresos * 100
- **Eficiencia Operativa**: Ingresos / Gastos
- **Tasa de Cobro**: Pagado / Total Facturado * 100
- **ROI por Proyecto**: Utilidad / Inversión * 100

#### Categorías de Gastos
1. **SPs**: Servicios Profesionales
2. **Combustible/Peaje**: Transporte y logística
3. **RH**: Recursos Humanos
4. **Materiales**: Equipos y suministros
5. **Provisiones**: Catering y consumibles

### 🛡️ Sistema de Seguridad Multicapa
**Archivos principales**: `src/utils/authGuards.ts`, `src/utils/passwordValidation.ts`

#### Características de Seguridad
- **Row Level Security (RLS)**: Políticas a nivel de base de datos
- **Validación de Contraseñas**: Complejidad configurable
- **Rate Limiting**: Protección contra ataques
- **Session Management**: Timeouts y renovación automática
- **Audit Trail**: Registro completo de actividades

#### Protecciones Implementadas
```typescript
// Circuit breaker para prevenir loops infinitos
class AuthGuardCircuitBreaker {
  private failures = 0;
  private readonly threshold = 5;
  private readonly timeout = 30000;
  
  canProceed(): boolean {
    return this.failures < this.threshold;
  }
}
```

## Configuración y Variables de Entorno

### Variables Requeridas (.env)
```bash
# === CONFIGURACIÓN SUPABASE ===
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima

# === MODO DE AUTENTICACIÓN ===
VITE_AUTH_MODE=development|production

# === CONFIGURACIÓN DE DESARROLLO ===
VITE_ENABLE_ROLE_SELECTOR=true|false

# === CONFIGURACIÓN DE SESIÓN ===
VITE_SESSION_TIMEOUT=480  # minutos (8 horas por defecto)

# === CONFIGURACIÓN DE SEGURIDAD ===
VITE_MAX_LOGIN_ATTEMPTS=5
```

### Configuraciones por Entorno

#### Desarrollo
- Selector de roles habilitado
- Usuarios de prueba predefinidos
- Logging detallado
- Validaciones relajadas

#### Producción
- Autenticación completa requerida
- Validaciones estrictas
- Timeouts de sesión
- Auditoría completa

## Flujo de Datos

### 1. Autenticación
```
Usuario → LoginForm → useAuth Hook → Supabase Auth → 
Validación RLS → Perfil Usuario → Estado Global
```

### 2. Gestión de Eventos
```
Crear Evento → Validación Financiera → Base de Datos → 
Actualización Estado → Notificación → Refresh UI
```

### 3. Dashboard Analytics
```
Consulta BD → Procesamiento Datos → Cálculos Financieros → 
Generación Gráficos → Renderizado 3D → Interacciones Usuario
```

### 4. Flujo de Estados
```
Estado Actual → Validación Transición → Verificación Archivos → 
Actualización BD → Log Auditoría → Notificación Usuario
```

## APIs y Endpoints

### Supabase Edge Functions

#### 1. `/functions/v1/manage-user`
**Propósito**: Gestión administrativa de usuarios
```typescript
POST /functions/v1/manage-user
Authorization: Bearer <access_token>
Content-Type: application/json

// Crear usuario
{
  "action": "create",
  "username": "string",
  "email": "string", 
  "password": "string",
  "role": "Administrador|Ejecutivo|Visualizador",
  "status": "Activo|Inactivo|Bloqueado|Pendiente"
}

// Actualizar contraseña
{
  "action": "updatePassword",
  "userId": "uuid",
  "newPassword": "string",
  "forcePasswordChange": boolean
}
```

#### 2. `/functions/v1/update-user-password`
**Propósito**: Actualización específica de contraseñas
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

### Operaciones de Base de Datos

#### Consultas Principales
```typescript
// Eventos con relaciones
const { data } = await supabase
  .from('events')
  .select(`
    *,
    client:clients(*),
    expenses:expenses(*)
  `)
  .order('created_at', { ascending: false });

// Dashboard analytics
const { data } = await supabase
  .from('events')
  .select('status_pago, total, created_at')
  .gte('created_at', startDate)
  .lte('created_at', endDate);
```

## Base de Datos

### Esquema Principal

#### Tabla: users
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'Visualizador',
  status user_status DEFAULT 'Activo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  password_changed_at timestamptz,
  password_changed_by uuid REFERENCES auth.users(id),
  force_password_change boolean DEFAULT false
);
```

#### Tabla: clients
```sql
CREATE TABLE clients (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  razon_social text NOT NULL,
  nombre_comercial text NOT NULL,
  rfc text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

#### Tabla: events
```sql
CREATE TABLE events (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  clave_evento text UNIQUE NOT NULL,
  nombre_proyecto text NOT NULL,
  subtotal numeric DEFAULT 0,
  iva numeric DEFAULT 0,
  total numeric DEFAULT 0,
  client_id integer REFERENCES clients(id) ON DELETE CASCADE,
  status_pago payment_status DEFAULT 'Pendiente Facturar',
  utilidad numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  invoice_pdf_url text,
  payment_pdf_url text
);
```

#### Tabla: expenses
```sql
CREATE TABLE expenses (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  concepto text NOT NULL,
  monto_a_pagar numeric NOT NULL DEFAULT 0,
  event_id integer REFERENCES events(id) ON DELETE CASCADE,
  category expense_category NOT NULL DEFAULT 'SPs',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id)
);
```

### Tipos Personalizados
```sql
-- Roles de usuario
CREATE TYPE user_role AS ENUM ('Administrador', 'Ejecutivo', 'Visualizador');

-- Estados de usuario
CREATE TYPE user_status AS ENUM ('Activo', 'Bloqueado', 'Inactivo', 'Pendiente');

-- Estados de pago
CREATE TYPE payment_status AS ENUM ('Pagado', 'Pago Pendiente', 'Pendiente Facturar', 'Vencido');

-- Categorías de gastos
CREATE TYPE expense_category AS ENUM ('Combustible/Peaje', 'Materiales', 'Provisiones', 'RH', 'SPs');

-- Tipos de acción para auditoría
CREATE TYPE action_type AS ENUM ('CREATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'UPDATE');
```

### Políticas RLS (Row Level Security)
```sql
-- Usuarios: Administradores acceso completo, usuarios leen su perfil
CREATE POLICY "administrators_full_access" ON users FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM auth.users WHERE id = uid() AND raw_user_meta_data->>'role' = 'Administrador'));

CREATE POLICY "users_read_own_profile" ON users FOR SELECT TO authenticated
USING (uid() = id);

-- Eventos: Administradores y Ejecutivos gestionan, todos leen
CREATE POLICY "Administrators and Ejecutivos can manage events" ON events FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role IN ('Administrador', 'Ejecutivo')));

CREATE POLICY "Authenticated users can read events" ON events FOR SELECT TO authenticated
USING (true);
```

### Triggers y Funciones
```sql
-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para calcular rentabilidad
CREATE OR REPLACE FUNCTION trigger_calculate_profitability()
RETURNS TRIGGER AS $$
BEGIN
  -- Lógica de cálculo de utilidad
  RETURN NEW;
END;
$$ language 'plpgsql';
```

## Instalación y Configuración

### Prerrequisitos
- Node.js 18+ y npm
- Cuenta de Supabase
- Navegador moderno con JavaScript habilitado

### Instalación Paso a Paso

#### 1. Clonar y Configurar
```bash
# Clonar repositorio
git clone <repository-url>
cd made-event-manager-pro

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de Supabase
```

#### 2. Configuración de Supabase
```bash
# 1. Crear proyecto en supabase.com
# 2. Obtener URL y clave anónima
# 3. Ejecutar migraciones SQL en el editor de Supabase
# 4. Configurar RLS y políticas
```

#### 3. Inicialización de Datos
```bash
# Iniciar servidor de desarrollo
npm run dev

# Acceder como Administrador
# Ir a "Generador de Datos" → "Siembra Rápida"
# Generar usuarios y datos de prueba
```

### Scripts Disponibles
```json
{
  "dev": "vite",                    // Servidor de desarrollo
  "build": "vite build",            // Build para producción
  "lint": "eslint .",               // Linting del código
  "preview": "vite preview"         // Preview del build
}
```

## Uso y Ejemplos

### Credenciales de Prueba
```
Administrador: admin@made.com / admin123
Ejecutivo:     ejecutivo@made.com / ejecutivo123
Visualizador:  visualizador@made.com / visualizador123
```

### Casos de Uso Principales

#### 1. Crear Cliente Mexicano
```typescript
const clienteEjemplo = {
  razon_social: "Innovación Tecnológica SA de CV",
  nombre_comercial: "TechInnovation",
  rfc: "ITE123456ABC"
};
```

#### 2. Crear Evento con Cálculos Automáticos
```typescript
const eventoEjemplo = {
  clave_evento: "EVT-2025-001",
  nombre_proyecto: "Conferencia Anual 2025",
  subtotal: 100000,        // Base gravable
  iva: 16000,             // Calculado automáticamente (16%)
  total: 116000,          // Subtotal + IVA
  client_id: 1,
  status_pago: "Pendiente Facturar"
};
```

#### 3. Gestión de Gastos por Categoría
```typescript
const gastoEjemplo = {
  concepto: "Servicios de Audio Profesional",
  monto_a_pagar: 25000,
  category: "SPs",        // Servicios Profesionales
  event_id: 1
};
```

#### 4. Análisis de Rentabilidad
```typescript
const analisisRentabilidad = {
  ingresos: 116000,
  gastos: 85000,
  utilidad: 31000,
  margen: 26.7,          // Porcentaje de margen
  eficiencia: 1.36       // Ratio ingresos/gastos
};
```

### Flujos de Trabajo Típicos

#### Flujo Completo de Evento
1. **Administrador** crea cliente mexicano con RFC válido
2. **Ejecutivo** crea evento asociado al cliente
3. Sistema calcula automáticamente IVA (16%)
4. **Ejecutivo** agrega gastos categorizados
5. Sistema actualiza rentabilidad en tiempo real
6. **Ejecutivo** avanza estados: Facturado → Pago Pendiente → Pagado
7. Sistema registra auditoría completa

#### Flujo de Análisis Financiero
1. **Usuario** accede al Dashboard
2. Selecciona período de análisis
3. Sistema genera gráficos 3D interactivos
4. **Usuario** explora métricas por categoría
5. Exporta reportes para análisis externo

### Configuraciones Avanzadas

#### Personalización de Colores
```typescript
// Sistema de colores empresariales
const CHART_COLORS = {
  MINT_GREEN: '#74F1C8',    // Éxito, ganancias
  WHITE: '#FFFFFF',         // Fondos, contraste
  BLACK: '#000000',         // Texto principal
  DARK_GRAY: '#6E7C89',     // Datos secundarios
  MEDIUM_GRAY: '#9B9B9B',   // Estados neutros
  SOFT_GRAY: '#B4B4B4'      // Bordes, elementos sutiles
};
```

#### Configuración de Sesiones
```typescript
// Gestión avanzada de sesiones
const sessionConfig = {
  timeout: 8 * 60 * 60 * 1000,      // 8 horas
  warningTime: 5 * 60 * 1000,       // Advertencia 5 min antes
  refreshThreshold: 0.1,             // Renovar al 10% restante
  maxConcurrentSessions: 3           // Máximo 3 sesiones
};
```

## Características Técnicas Avanzadas

### Optimizaciones de Rendimiento
- **Memoización**: React.useMemo para cálculos complejos
- **Debouncing**: Búsquedas y filtros optimizados
- **Lazy Loading**: Carga diferida de componentes
- **Query Optimization**: Consultas optimizadas con índices

### Accesibilidad (A11y)
- **ARIA Labels**: Etiquetas descriptivas
- **Keyboard Navigation**: Navegación completa por teclado
- **Screen Reader Support**: Compatibilidad con lectores
- **High Contrast Mode**: Soporte para alto contraste

### Responsive Design
- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: 768px (tablet), 1024px (desktop)
- **Touch Friendly**: Elementos táctiles optimizados
- **Adaptive Layout**: Layouts que se adaptan al dispositivo

### Internacionalización
- **Locale**: es-MX (Español México)
- **Currency**: MXN (Peso Mexicano)
- **Date Format**: DD/MM/YYYY
- **Number Format**: Separadores mexicanos

## Seguridad y Cumplimiento

### Medidas de Seguridad Implementadas
1. **Autenticación Robusta**: Múltiples factores de validación
2. **Autorización Granular**: Permisos específicos por recurso
3. **Encriptación**: Datos sensibles encriptados
4. **Auditoría**: Trazabilidad completa de acciones
5. **Rate Limiting**: Protección contra ataques
6. **Session Security**: Gestión segura de sesiones

### Cumplimiento Normativo
- **LGPD**: Protección de datos personales
- **Normativa Fiscal Mexicana**: Cálculos de IVA conformes
- **RFC Validation**: Validación de identificadores fiscales
- **Audit Trail**: Registro para auditorías fiscales

## Testing y Calidad

### Estrategia de Testing
- **Unit Tests**: Funciones críticas (financial.ts, workflow.ts)
- **Integration Tests**: Flujos completos de usuario
- **E2E Tests**: Casos de uso principales
- **Security Tests**: Validación de permisos y accesos

### Herramientas de Calidad
- **TypeScript**: Tipado estricto
- **ESLint**: Análisis estático de código
- **Prettier**: Formateo consistente
- **Husky**: Git hooks para calidad

## Deployment y DevOps

### Estrategia de Deployment
- **Frontend**: Vercel, Netlify o hosting estático
- **Backend**: Supabase Cloud (automático)
- **Database**: PostgreSQL en Supabase
- **CDN**: Assets estáticos optimizados

### Monitoreo y Observabilidad
- **Error Tracking**: Console logging estructurado
- **Performance Monitoring**: Métricas de carga
- **User Analytics**: Patrones de uso
- **Database Monitoring**: Queries y performance

## Mantenimiento y Evolución

### Tareas de Mantenimiento
- **Backup Regular**: Datos y configuraciones
- **Security Updates**: Dependencias y parches
- **Performance Review**: Optimización continua
- **User Feedback**: Mejoras basadas en uso

### Roadmap de Evolución
1. **Fase 1**: Notificaciones en tiempo real
2. **Fase 2**: Integración con sistemas contables
3. **Fase 3**: API pública para integraciones
4. **Fase 4**: Aplicación móvil nativa
5. **Fase 5**: Inteligencia artificial para predicciones

## Soporte y Documentación

### Recursos de Ayuda
- **README.md**: Documentación principal
- **Inline Comments**: Comentarios en código crítico
- **Type Definitions**: Documentación de tipos
- **Error Messages**: Mensajes descriptivos

### Contacto y Soporte
- **Documentación Técnica**: Archivos en `/documentation/`
- **Guías de Testing**: Procedimientos de validación
- **Troubleshooting**: Solución de problemas comunes

---

**Desarrollado con ❤️ para la gestión eficiente de eventos corporativos**

*Última actualización: Enero 2025*
*Versión: 1.0.0*
*Licencia: Propietaria*