# PROMPT DE RECONSTRUCCIÓN COMPLETA - MADE Event Manager Pro

## Instrucciones para el Asistente de IA

Eres un desarrollador senior experto en React, TypeScript y Supabase. Tu tarea es reconstruir completamente la aplicación "MADE Event Manager Pro" siguiendo estas especificaciones exactas.

## ESPECIFICACIONES TÉCNICAS EXACTAS

### Stack Tecnológico Obligatorio
```json
{
  "frontend": {
    "framework": "React 18.3.1",
    "language": "TypeScript 5.5.3",
    "buildTool": "Vite 5.4.2",
    "styling": "Tailwind CSS 3.4.1",
    "icons": "Lucide React 0.344.0"
  },
  "backend": {
    "platform": "Supabase",
    "database": "PostgreSQL 15+",
    "auth": "Supabase Auth",
    "functions": "Edge Functions (Deno)"
  },
  "development": {
    "linting": "ESLint 9.9.1",
    "typeChecking": "TypeScript strict mode",
    "formatting": "Prettier (integrado)"
  }
}
```

### Estructura de Archivos EXACTA
```
made-event-manager-pro/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── .env.example
├── README.md
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── lib/
│   │   └── supabase.ts
│   ├── types/
│   │   ├── auth.ts
│   │   └── database.ts
│   ├── hooks/
│   │   └── useAuth.tsx
│   ├── utils/
│   │   ├── authConfig.ts
│   │   ├── authGuards.ts
│   │   ├── chartColors.ts
│   │   ├── databaseSeeder.ts
│   │   ├── databaseVerification.ts
│   │   ├── financial.ts
│   │   ├── passwordValidation.ts
│   │   └── workflow.ts
│   ├── styles/
│   │   └── design-system.css
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Dashboard.tsx
│   │   ├── BillingMaster.tsx
│   │   ├── EventDetail.tsx
│   │   ├── CreateEvent.tsx
│   │   ├── Clients.tsx
│   │   ├── ActivityLog.tsx
│   │   ├── RoleSelector.tsx
│   │   ├── auth/
│   │   │   ├── AuthContainer.tsx
│   │   │   ├── AuthGuard.tsx
│   │   │   ├── AuthStatus.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── SessionManager.tsx
│   │   │   └── UserProfile.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ClientsManager.tsx
│   │   │   ├── DatabaseRecreation.tsx
│   │   │   ├── DatabaseSeeder.tsx
│   │   │   ├── DatabaseVerification.tsx
│   │   │   ├── EventsManager.tsx
│   │   │   ├── ExpensesManager.tsx
│   │   │   ├── IncomesManager.tsx
│   │   │   ├── PasswordUpdateModal.tsx
│   │   │   └── UserManager.tsx
│   │   ├── catalogs/
│   │   │   ├── CatalogManager.tsx
│   │   │   ├── ClientsCatalog.tsx
│   │   │   ├── EventsCatalog.tsx
│   │   │   ├── ExpensesCatalog.tsx
│   │   │   └── IncomesCatalog.tsx
│   │   ├── charts/
│   │   │   ├── ExpenseChart3D.tsx
│   │   │   ├── IncomeChart3D.tsx
│   │   │   ├── MonthlyEventsChart.tsx
│   │   │   └── ProfitChart3D.tsx
│   │   ├── enhanced/
│   │   │   └── EnhancedEventDetail.tsx
│   │   └── ui/
│   │       ├── FileUpload.tsx
│   │       ├── FinancialInput.tsx
│   │       ├── ProfitabilityChart.tsx
│   │       ├── StatusBadge.tsx
│   │       └── StatusWorkflow.tsx
├── supabase/
│   ├── functions/
│   │   ├── manage-user/
│   │   │   └── index.ts
│   │   └── update-user-password/
│   │       └── index.ts
│   └── migrations/
│       └── [archivos SQL de migración]
└── database-recreation/
    ├── 01-environment-assessment.md
    ├── 03-test-users-credentials.txt
    └── 06-execution-checklist.md
```

## CONFIGURACIONES CRÍTICAS

### 1. package.json EXACTO
```json
{
  "name": "vite-react-typescript-starter",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
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
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2"
  }
}
```

### 2. Variables de Entorno (.env.example)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Authentication Mode Configuration
VITE_AUTH_MODE=development
VITE_ENABLE_ROLE_SELECTOR=true
VITE_SESSION_TIMEOUT=480
VITE_MAX_LOGIN_ATTEMPTS=5
```

### 3. Configuración Vite
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

### 4. Configuración Tailwind
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## ESQUEMA DE BASE DE DATOS COMPLETO

### Tipos Personalizados OBLIGATORIOS
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

### Tablas Principales OBLIGATORIAS
```sql
-- Tabla de usuarios
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

-- Tabla de clientes
CREATE TABLE clients (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  razon_social text NOT NULL,
  nombre_comercial text NOT NULL,
  rfc text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla de eventos
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

-- Tabla de ingresos
CREATE TABLE incomes (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  concepto text NOT NULL,
  monto_a_pagar numeric NOT NULL DEFAULT 0,
  event_id integer REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Tabla de gastos
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

-- Tabla de log de actividades
CREATE TABLE activity_log (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_email text NOT NULL,
  action_type action_type NOT NULL,
  affected_table text NOT NULL,
  record_id integer NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

### Políticas RLS OBLIGATORIAS
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "administrators_full_access" ON users FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM auth.users WHERE id = uid() AND raw_user_meta_data->>'role' = 'Administrador'));

CREATE POLICY "users_read_own_profile" ON users FOR SELECT TO authenticated
USING (uid() = id);

-- Políticas para clientes
CREATE POLICY "Administrators and Ejecutivos can manage clients" ON clients FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role IN ('Administrador', 'Ejecutivo')));

CREATE POLICY "Authenticated users can read clients" ON clients FOR SELECT TO authenticated
USING (true);

-- Políticas para eventos
CREATE POLICY "Administrators and Ejecutivos can manage events" ON events FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role IN ('Administrador', 'Ejecutivo')));

CREATE POLICY "Authenticated users can read events" ON events FOR SELECT TO authenticated
USING (true);

-- Políticas para ingresos
CREATE POLICY "Administrators and Ejecutivos can manage incomes" ON incomes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role IN ('Administrador', 'Ejecutivo')));

CREATE POLICY "Authenticated users can read incomes" ON incomes FOR SELECT TO authenticated
USING (true);

-- Políticas para gastos
CREATE POLICY "Administrators and Ejecutivos can manage expenses" ON expenses FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role IN ('Administrador', 'Ejecutivo')));

CREATE POLICY "Authenticated users can read expenses" ON expenses FOR SELECT TO authenticated
USING (true);

-- Políticas para logs
CREATE POLICY "Administrators can read activity logs" ON activity_log FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = uid() AND role = 'Administrador'));

CREATE POLICY "System can insert activity logs" ON activity_log FOR INSERT TO authenticated
WITH CHECK (true);
```

## COMPONENTES CRÍTICOS A IMPLEMENTAR

### 1. Sistema de Autenticación Dual (CRÍTICO)
**Archivo**: `src/hooks/useAuth.tsx`

**Características obligatorias**:
- Modo desarrollo con selector de roles
- Modo producción con autenticación completa
- Circuit breaker para prevenir loops infinitos
- Rate limiting para seguridad
- Session timeout management
- Cleanup automático de recursos

**Usuarios de prueba obligatorios**:
```typescript
const DEV_TEST_USERS = [
  { email: 'admin@made.com', password: 'admin123', role: 'Administrador' },
  { email: 'ejecutivo@made.com', password: 'ejecutivo123', role: 'Ejecutivo' },
  { email: 'visualizador@made.com', password: 'visualizador123', role: 'Visualizador' }
];
```

### 2. Dashboard con Gráficos 3D (CRÍTICO)
**Archivo**: `src/components/Dashboard.tsx`

**Gráficos obligatorios**:
1. **IncomeChart3D**: Distribución ingresos pendientes vs pagados
2. **ExpenseChart3D**: Gastos por categoría con interactividad
3. **ProfitChart3D**: Análisis de rentabilidad con métricas
4. **MonthlyEventsChart**: Eventos por mes con tendencias

**Paleta de colores obligatoria**:
```typescript
const CHART_COLORS = {
  MINT_GREEN: '#74F1C8',    // Éxito, ganancias
  WHITE: '#FFFFFF',         // Fondos
  BLACK: '#000000',         // Texto principal
  DARK_GRAY: '#6E7C89',     // Datos secundarios
  MEDIUM_GRAY: '#9B9B9B',   // Estados neutros
  SOFT_GRAY: '#B4B4B4'      // Elementos sutiles
};
```

### 3. Cálculos Financieros Mexicanos (CRÍTICO)
**Archivo**: `src/utils/financial.ts`

**Funciones obligatorias**:
```typescript
// Cálculo IVA desde subtotal (método tradicional)
export function calculateIVAFromSubtotal(subtotal: number): number {
  return roundHalfUp(subtotal * 0.16);
}

// Cálculo IVA desde total (método mexicano)
export function calculateIVAFromTotal(total: number): number {
  return roundHalfUp(total * (0.16 / 1.16));
}

// Auto-cálculo basado en campo de entrada
export function autoCalculateFinancials(
  inputField: 'subtotal' | 'total',
  inputValue: number
): { subtotal: number; vat: number; total: number }
```

### 4. Gestión de Estados de Workflow (CRÍTICO)
**Archivo**: `src/utils/workflow.ts`

**Secuencia obligatoria**:
```typescript
const INVOICE_STATUS_SEQUENCE = [
  'Pendiente Facturar',
  'Facturado', 
  'Pago Pendiente',
  'Pagado'
] as const;
```

### 5. Edge Functions para Administración (CRÍTICO)
**Archivos**: `supabase/functions/manage-user/index.ts`, `supabase/functions/update-user-password/index.ts`

**Funcionalidades obligatorias**:
- Creación de usuarios con validación de permisos
- Actualización de contraseñas con service role
- Logging de actividades administrativas
- Manejo de errores robusto

## CARACTERÍSTICAS ESPECÍFICAS OBLIGATORIAS

### Sistema de Colores Empresarial
- Paleta de 6 colores principales
- Colores semánticos para estados
- Gradientes para efectos 3D
- Validación de contraste para accesibilidad

### Validaciones Financieras
- IVA mexicano (16%) automático
- Validación de RFC mexicano
- Formato de moneda MXN
- Precisión decimal con "round half-up"

### Seguridad Multicapa
- RLS a nivel de base de datos
- Guards de autenticación en frontend
- Rate limiting para login
- Session management con timeouts
- Audit trail completo

### Responsive Design
- Mobile-first approach
- Breakpoints: 768px (tablet), 1024px (desktop)
- Touch-friendly interfaces
- Adaptive layouts

## FLUJOS DE TRABAJO OBLIGATORIOS

### 1. Flujo de Autenticación
```
1. Usuario accede → AuthContainer
2. Modo desarrollo → RoleSelector O LoginForm
3. Modo producción → LoginForm únicamente
4. Validación → useAuth hook
5. Establecer sesión → AuthGuard protection
6. Acceso a aplicación → Layout + routing
```

### 2. Flujo de Creación de Evento
```
1. Ejecutivo/Admin → "Crear Evento"
2. Seleccionar cliente → Validación existe
3. Ingresar datos financieros → Auto-cálculo IVA
4. Guardar evento → Validación completa
5. Redirección → BillingMaster
6. Log actividad → activity_log table
```

### 3. Flujo de Estados de Pago
```
1. Evento creado → "Pendiente Facturar"
2. Subir factura PDF → "Facturado"
3. Confirmar envío → "Pago Pendiente"  
4. Subir comprobante → "Pagado"
5. Cada transición → Validación + Log
```

## DATOS DE PRUEBA OBLIGATORIOS

### Usuarios Base (10 usuarios)
```
admin@made.com / admin123 (Administrador)
admin2@made.com / admin456 (Administrador)
ejecutivo@made.com / ejecutivo123 (Ejecutivo)
proyectos@made.com / proyectos123 (Ejecutivo)
regional@made.com / regional123 (Ejecutivo)
visualizador@made.com / visualizador123 (Visualizador)
consultor@made.com / consultor123 (Visualizador)
auditor@made.com / auditor123 (Visualizador)
inactivo@made.com / inactivo123 (Visualizador - Inactivo)
bloqueado@made.com / bloqueado123 (Ejecutivo - Bloqueado)
```

### Clientes Mexicanos (20 clientes)
- Razones sociales realistas con SA de CV, SAPI de CV
- RFC válidos de 12 caracteres
- Nombres comerciales coherentes
- Sectores: Construcción, Tecnología, Servicios, etc.

### Eventos y Gastos
- 200 eventos para siembra rápida (10 por cliente)
- 2,480 eventos para siembra completa (124 por cliente)
- 5-10 gastos por evento en 5 categorías
- Distribución temporal de 12 meses
- Montos realistas entre $10,000 - $500,000 MXN

## VALIDACIONES Y TESTING OBLIGATORIOS

### Tests de Autenticación
```typescript
// Validar login con cada rol
describe('Authentication', () => {
  it('should login as Administrador', async () => {
    const result = await signIn({
      email: 'admin@made.com',
      password: 'admin123'
    });
    expect(result.success).toBe(true);
  });
});
```

### Tests de Cálculos Financieros
```typescript
// Validar cálculos de IVA
describe('Financial Calculations', () => {
  it('should calculate IVA correctly', () => {
    const result = autoCalculateFinancials('subtotal', 100000);
    expect(result.vat).toBe(16000);
    expect(result.total).toBe(116000);
  });
});
```

### Tests de Permisos
```typescript
// Validar acceso por roles
describe('Role-based Access', () => {
  it('should allow admin full access', () => {
    const canAccess = hasPermission(adminUser, 'users', 'write');
    expect(canAccess).toBe(true);
  });
});
```

## INSTRUCCIONES DE IMPLEMENTACIÓN

### Paso 1: Configuración Inicial
1. Crear proyecto Vite con React + TypeScript
2. Instalar dependencias exactas del package.json
3. Configurar Tailwind CSS y PostCSS
4. Configurar ESLint con reglas específicas

### Paso 2: Estructura Base
1. Crear estructura de carpetas exacta
2. Implementar tipos TypeScript completos
3. Configurar cliente Supabase
4. Implementar sistema de diseño CSS

### Paso 3: Autenticación
1. Implementar useAuth hook con modo dual
2. Crear componentes de autenticación
3. Implementar guards y protecciones
4. Configurar session management

### Paso 4: Base de Datos
1. Crear tipos personalizados
2. Crear tablas con relaciones
3. Configurar políticas RLS
4. Crear índices para performance

### Paso 5: Componentes Principales
1. Implementar Layout y navegación
2. Crear Dashboard con gráficos 3D
3. Implementar gestión de eventos
4. Crear sistema de facturación

### Paso 6: Edge Functions
1. Crear función manage-user
2. Crear función update-user-password
3. Configurar CORS y seguridad
4. Testing de funciones

### Paso 7: Datos de Prueba
1. Implementar database seeder
2. Generar usuarios de prueba
3. Crear clientes mexicanos
4. Generar eventos y gastos

### Paso 8: Testing y Validación
1. Testing de autenticación
2. Validación de cálculos
3. Testing de permisos
4. Validación de flujos

## CRITERIOS DE ÉXITO

### Funcionalidad Mínima Viable
- [ ] Login funcional con 3 roles
- [ ] Dashboard con 4 gráficos 3D
- [ ] CRUD completo de clientes
- [ ] Creación y gestión de eventos
- [ ] Cálculos de IVA automáticos
- [ ] Flujo de estados de pago
- [ ] Gestión de gastos por categoría
- [ ] Log de actividades

### Características Avanzadas
- [ ] Generador de datos aleatorios
- [ ] Verificación de base de datos
- [ ] Gestión de usuarios (admin)
- [ ] Cambio de contraseñas
- [ ] Exportación de reportes
- [ ] Responsive design completo

### Seguridad y Performance
- [ ] RLS configurado correctamente
- [ ] Rate limiting implementado
- [ ] Session timeouts funcionando
- [ ] Circuit breakers activos
- [ ] Queries optimizadas
- [ ] Error handling robusto

## NOTAS CRÍTICAS PARA LA IMPLEMENTACIÓN

### 🚨 ERRORES COMUNES A EVITAR
1. **TSX Syntax**: Usar `<T,>` en lugar de `<T>` para generics
2. **RLS Policies**: Asegurar políticas correctas para cada rol
3. **Edge Functions**: Usar service role key para operaciones admin
4. **Financial Calculations**: Mantener precisión decimal
5. **Session Management**: Cleanup adecuado de timers
6. **Circuit Breakers**: Prevenir loops infinitos en auth

### 🎯 CARACTERÍSTICAS DISTINTIVAS
1. **Diseño Empresarial**: Estética profesional con colores corporativos
2. **Gráficos 3D**: Visualizaciones avanzadas con SVG
3. **Cumplimiento Mexicano**: RFC, IVA, formatos locales
4. **Seguridad Robusta**: Múltiples capas de protección
5. **Audit Trail**: Trazabilidad completa
6. **Responsive**: Optimizado para todos los dispositivos

### 📋 CHECKLIST FINAL
- [ ] Todos los archivos creados según estructura
- [ ] Dependencias instaladas con versiones exactas
- [ ] Base de datos configurada con RLS
- [ ] Edge functions deployadas
- [ ] Usuarios de prueba creados
- [ ] Datos de ejemplo generados
- [ ] Testing básico completado
- [ ] Documentación actualizada

## COMANDO DE INICIO
```bash
# Después de la implementación completa
npm install
npm run dev

# Acceder a http://localhost:5173
# Login: admin@made.com / admin123
# Generar datos: Admin → "Generador de Datos" → "Siembra Rápida"
```

---

**IMPORTANTE**: Esta aplicación debe ser implementada EXACTAMENTE como se especifica. Cualquier desviación debe ser justificada y documentada. El resultado final debe ser una aplicación completamente funcional, segura y lista para producción.

**Tiempo estimado de implementación**: 8-12 horas para desarrollador senior
**Complejidad**: Alta (Sistema empresarial completo)
**Nivel de experiencia requerido**: Senior Full-Stack Developer