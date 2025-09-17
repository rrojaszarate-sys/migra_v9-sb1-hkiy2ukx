/**
 * Mexican Data Generator
 * Generates realistic Mexican business data for comprehensive testing
 */

// Mexican company names and business types
const MEXICAN_COMPANY_NAMES = [
  'Innovación', 'Desarrollo', 'Soluciones', 'Sistemas', 'Grupo',
  'Corporativo', 'Industrial', 'Comercial', 'Integral', 'Profesional',
  'Tecnología', 'Servicios', 'Construcción', 'Manufactura', 'Logística',
  'Consultoría', 'Alimentaria', 'Textil', 'Automotriz', 'Farmacéutica'
];

const MEXICAN_BUSINESS_SECTORS = [
  'Construcción', 'Tecnología', 'Servicios', 'Manufactura', 'Comercio',
  'Consultoría', 'Logística', 'Alimentaria', 'Textil', 'Automotriz',
  'Farmacéutica', 'Energía', 'Telecomunicaciones', 'Financiera', 'Turismo',
  'Educación', 'Salud', 'Inmobiliaria', 'Agrícola', 'Minería'
];

const MEXICAN_COMPANY_TYPES = ['SA de CV', 'SAPI de CV', 'SC', 'SRL', 'AC', 'SPR de RL'];

// Mexican names and surnames
const MEXICAN_FIRST_NAMES = [
  'José', 'María', 'Juan', 'Ana', 'Luis', 'Carmen', 'Carlos', 'Rosa',
  'Miguel', 'Elena', 'Francisco', 'Patricia', 'Antonio', 'Laura', 'Manuel',
  'Isabel', 'Alejandro', 'Mónica', 'Rafael', 'Silvia', 'Fernando', 'Adriana',
  'Ricardo', 'Gabriela', 'Roberto', 'Claudia', 'Eduardo', 'Beatriz', 'Sergio',
  'Mariana', 'Arturo', 'Verónica', 'Raúl', 'Leticia', 'Javier'
];

const MEXICAN_SURNAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández',
  'Pérez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Díaz',
  'Morales', 'Jiménez', 'Álvarez', 'Romero', 'Gutiérrez', 'Vargas',
  'Castillo', 'Ortega', 'Ruiz', 'Torres', 'Mendoza', 'Aguilar',
  'Moreno', 'Guerrero', 'Medina', 'Ramos', 'Vázquez'
];

// Mexican states and cities
const MEXICAN_STATES = [
  { state: 'Ciudad de México', cities: ['Ciudad de México', 'Coyoacán', 'Polanco', 'Roma Norte'], postalCodes: ['01000', '04100', '11560', '06700'] },
  { state: 'Jalisco', cities: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá'], postalCodes: ['44100', '45010', '45500', '45400'] },
  { state: 'Nuevo León', cities: ['Monterrey', 'San Pedro Garza García', 'Guadalupe', 'Apodaca'], postalCodes: ['64000', '66230', '67100', '66600'] },
  { state: 'Puebla', cities: ['Puebla', 'San Andrés Cholula', 'Tehuacán', 'Atlixco'], postalCodes: ['72000', '72810', '75700', '74200'] },
  { state: 'Guanajuato', cities: ['León', 'Irapuato', 'Celaya', 'Salamanca'], postalCodes: ['37000', '36500', '38000', '36700'] }
];

// Event types relevant to Mexican business context
const MEXICAN_EVENT_TYPES = [
  'Convención Nacional', 'Seminario Empresarial', 'Conferencia de Negocios',
  'Lanzamiento de Producto', 'Capacitación Corporativa', 'Reunión Anual',
  'Feria Comercial', 'Workshop Técnico', 'Evento de Networking',
  'Celebración Corporativa', 'Presentación de Resultados', 'Summit Ejecutivo',
  'Congreso Industrial', 'Simposio Tecnológico', 'Expo Comercial'
];

// Mexican expense categories with realistic concepts
const MEXICAN_EXPENSE_CATEGORIES = {
  'SPs': [
    'Servicios de Audio Profesional', 'Iluminación Escénica', 'Sonido Ambiente',
    'Equipos de Grabación', 'Streaming en Vivo', 'Fotografía Profesional',
    'Video Corporativo', 'Traducción Simultánea', 'Servicios de Seguridad',
    'Personal Técnico Especializado'
  ],
  'Combustible/Peaje': [
    'Combustible Vehículos Empresa', 'Peajes Autopista México-Guadalajara',
    'Estacionamiento Centro de Convenciones', 'Transporte de Equipo',
    'Viáticos de Transporte', 'Casetas de Cobro', 'Combustible Generadores',
    'Transporte Personal', 'Peajes Urbanos', 'Combustible Vehículos Alquilados'
  ],
  'RH': [
    'Personal Técnico Temporal', 'Coordinadores de Evento', 'Personal de Apoyo',
    'Supervisores de Área', 'Especialistas en Protocolo', 'Asistentes Ejecutivos',
    'Personal de Limpieza', 'Seguridad Privada', 'Intérpretes', 'Hostess'
  ],
  'Materiales': [
    'Material Eléctrico Especializado', 'Cables y Conectores', 'Estructuras Metálicas',
    'Decoración Temática', 'Señalización Corporativa', 'Material de Oficina',
    'Mobiliario Temporal', 'Equipos de Cómputo', 'Material Promocional',
    'Suministros Técnicos'
  ],
  'Provisiones': [
    'Catering Ejecutivo', 'Bebidas Premium', 'Coffee Break Matutino',
    'Lunch Empresarial', 'Snacks Gourmet', 'Agua Embotellada',
    'Servicio de Bar', 'Cena de Gala', 'Desayuno Continental',
    'Refrigerios Vespertinos'
  ]
};

/**
 * Generate realistic Mexican full name
 */
export function generateMexicanName(): { firstName: string; lastName: string; fullName: string } {
  const firstName = MEXICAN_FIRST_NAMES[Math.floor(Math.random() * MEXICAN_FIRST_NAMES.length)];
  const lastName1 = MEXICAN_SURNAMES[Math.floor(Math.random() * MEXICAN_SURNAMES.length)];
  const lastName2 = MEXICAN_SURNAMES[Math.floor(Math.random() * MEXICAN_SURNAMES.length)];
  
  return {
    firstName,
    lastName: `${lastName1} ${lastName2}`,
    fullName: `${firstName} ${lastName1} ${lastName2}`
  };
}

/**
 * Generate valid Mexican RFC (tax ID)
 */
export function generateMexicanRFC(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  // RFC format: 3-4 letters + 6 numbers + 3 alphanumeric
  const firstPart = Array.from({ length: 3 }, () => 
    letters[Math.floor(Math.random() * letters.length)]
  ).join('');
  
  const datePart = Array.from({ length: 6 }, () => 
    numbers[Math.floor(Math.random() * numbers.length)]
  ).join('');
  
  const lastPart = Array.from({ length: 3 }, () => {
    const chars = letters + numbers;
    return chars[Math.floor(Math.random() * chars.length)];
  }).join('');
  
  return `${firstPart}${datePart}${lastPart}`;
}

/**
 * Generate Mexican phone number
 */
export function generateMexicanPhone(): string {
  // Format: +52 (area code) number
  const areaCodes = ['55', '33', '81', '222', '477', '618', '656', '662'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const number = Array.from({ length: 8 }, () => 
    Math.floor(Math.random() * 10)
  ).join('');
  
  return `+52 ${areaCode} ${number.substring(0, 4)} ${number.substring(4)}`;
}

/**
 * Generate Mexican address
 */
export function generateMexicanAddress(): {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  fullAddress: string;
} {
  const stateData = MEXICAN_STATES[Math.floor(Math.random() * MEXICAN_STATES.length)];
  const cityIndex = Math.floor(Math.random() * stateData.cities.length);
  const city = stateData.cities[cityIndex];
  const postalCode = stateData.postalCodes[cityIndex];
  
  const streetNames = [
    'Av. Insurgentes', 'Calle Reforma', 'Blvd. Adolfo López Mateos',
    'Av. Universidad', 'Calle Madero', 'Av. Juárez', 'Calle Hidalgo',
    'Av. Revolución', 'Calle Morelos', 'Av. Constitución'
  ];
  
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const street = `${streetName} ${streetNumber}`;
  
  return {
    street,
    city,
    state: stateData.state,
    postalCode,
    fullAddress: `${street}, ${city}, ${stateData.state}, CP ${postalCode}`
  };
}

/**
 * Generate Mexican company data
 */
export function generateMexicanCompany(index: number): {
  razon_social: string;
  nombre_comercial: string;
  rfc: string;
  address: string;
  phone: string;
  contact_person: string;
  email: string;
} {
  const sector = MEXICAN_BUSINESS_SECTORS[index % MEXICAN_BUSINESS_SECTORS.length];
  const companyName = MEXICAN_COMPANY_NAMES[Math.floor(Math.random() * MEXICAN_COMPANY_NAMES.length)];
  const companyType = MEXICAN_COMPANY_TYPES[Math.floor(Math.random() * MEXICAN_COMPANY_TYPES.length)];
  
  const razon_social = `${companyName} ${sector} ${companyType}`;
  const nombre_comercial = `${sector} ${companyName}`;
  const rfc = generateMexicanRFC();
  const address = generateMexicanAddress();
  const phone = generateMexicanPhone();
  const contact = generateMexicanName();
  
  // Generate company email
  const emailDomain = `${companyName.toLowerCase().replace(/\s+/g, '')}${sector.toLowerCase().replace(/\s+/g, '')}.com.mx`;
  const email = `contacto@${emailDomain}`;
  
  return {
    razon_social,
    nombre_comercial,
    rfc,
    address: address.fullAddress,
    phone,
    contact_person: contact.fullName,
    email
  };
}

/**
 * Generate Mexican test user
 */
export function generateMexicanTestUser(index: number): {
  username: string;
  email: string;
  password: string;
  role: 'Administrador' | 'Ejecutivo' | 'Visualizador';
  status: 'Activo' | 'Inactivo' | 'Bloqueado';
  fullName: string;
} {
  const name = generateMexicanName();
  const roles: ('Administrador' | 'Ejecutivo' | 'Visualizador')[] = ['Administrador', 'Ejecutivo', 'Visualizador'];
  const statuses: ('Activo' | 'Inactivo' | 'Bloqueado')[] = ['Activo', 'Inactivo', 'Bloqueado'];
  
  // Distribute roles: 3 admin, 6 ejecutivo, 6 visualizador
  let role: 'Administrador' | 'Ejecutivo' | 'Visualizador';
  if (index < 3) {
    role = 'Administrador';
  } else if (index < 9) {
    role = 'Ejecutivo';
  } else {
    role = 'Visualizador';
  }
  
  // Most users active, some inactive/blocked for testing
  const status = index < 13 ? 'Activo' : statuses[Math.floor(Math.random() * statuses.length)];
  
  const username = `${name.firstName.toLowerCase()}.${name.lastName.split(' ')[0].toLowerCase()}`;
  const email = `${username}@made.com.mx`;
  const password = `${role.toLowerCase()}123`;
  
  return {
    username: name.fullName,
    email,
    password,
    role,
    status,
    fullName: name.fullName
  };
}

/**
 * Generate realistic event name
 */
export function generateMexicanEvent(clientName: string, index: number): {
  clave_evento: string;
  nombre_proyecto: string;
  description: string;
  location: string;
} {
  const eventType = MEXICAN_EVENT_TYPES[index % MEXICAN_EVENT_TYPES.length];
  const year = new Date().getFullYear();
  const month = Math.floor(Math.random() * 12) + 1;
  
  const clave_evento = `EVT-${year}-${String(index + 1).padStart(4, '0')}`;
  const nombre_proyecto = `${eventType} ${clientName} ${year}`;
  
  const locations = [
    'Centro de Convenciones WTC México', 'Hotel Presidente InterContinental',
    'Centro Banamex', 'Palacio de los Deportes', 'Auditorio Nacional',
    'Centro de Convenciones Tlatelolco', 'Hotel Camino Real Polanco',
    'Centro Empresarial Santa Fe', 'World Trade Center Guadalajara',
    'Centro de Convenciones Cintermex Monterrey'
  ];
  
  const location = locations[Math.floor(Math.random() * locations.length)];
  
  const description = `${eventType} organizado para ${clientName} con enfoque en desarrollo empresarial y networking profesional. Incluye conferencias magistrales, talleres especializados y sesiones de networking.`;
  
  return {
    clave_evento,
    nombre_proyecto,
    description,
    location
  };
}

/**
 * Generate realistic Mexican expense
 */
export function generateMexicanExpense(
  eventId: number, 
  category: keyof typeof MEXICAN_EXPENSE_CATEGORIES,
  index: number
): {
  concepto: string;
  monto_a_pagar: number;
  category: string;
  description: string;
  receipt_number: string;
  payment_method: string;
} {
  const concepts = MEXICAN_EXPENSE_CATEGORIES[category];
  const concepto = concepts[index % concepts.length];
  
  // Realistic Mexican peso amounts by category
  const amountRanges = {
    'SPs': { min: 15000, max: 80000 },
    'Combustible/Peaje': { min: 500, max: 5000 },
    'RH': { min: 2000, max: 25000 },
    'Materiales': { min: 1000, max: 30000 },
    'Provisiones': { min: 800, max: 15000 }
  };
  
  const range = amountRanges[category];
  const monto_a_pagar = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  
  const paymentMethods = ['Transferencia Bancaria', 'Cheque', 'Efectivo', 'Tarjeta Corporativa'];
  const payment_method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  
  const receipt_number = `REC-${String(eventId).padStart(4, '0')}-${String(index + 1).padStart(3, '0')}`;
  
  const description = `${concepto} para evento corporativo. Incluye todos los servicios necesarios según especificaciones técnicas y requerimientos del cliente.`;
  
  return {
    concepto,
    monto_a_pagar,
    category,
    description,
    receipt_number,
    payment_method
  };
}

/**
 * Generate random date within last 12 months
 */
export function generateRandomDateLast12Months(): Date {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  const randomTime = twelveMonthsAgo.getTime() + Math.random() * (now.getTime() - twelveMonthsAgo.getTime());
  return new Date(randomTime);
}

/**
 * Generate financial amounts with Mexican IVA (16%)
 */
export function generateMexicanFinancials(): {
  subtotal: number;
  iva: number;
  total: number;
} {
  // Generate subtotal between 50,000 and 800,000 MXN
  const subtotal = Math.floor(Math.random() * 750000) + 50000;
  const iva = Math.round(subtotal * 0.16); // 16% Mexican IVA
  const total = subtotal + iva;
  
  return { subtotal, iva, total };
}

/**
 * Generate payment status with realistic distribution
 */
export function generatePaymentStatus(): 'Pendiente Facturar' | 'Pago Pendiente' | 'Pagado' | 'Vencido' {
  const statuses: ('Pendiente Facturar' | 'Pago Pendiente' | 'Pagado' | 'Vencido')[] = [
    'Pendiente Facturar', 'Pago Pendiente', 'Pagado', 'Vencido'
  ];
  
  // Weighted distribution: 20% pending, 15% payment pending, 60% paid, 5% overdue
  const random = Math.random();
  if (random < 0.20) return 'Pendiente Facturar';
  if (random < 0.35) return 'Pago Pendiente';
  if (random < 0.95) return 'Pagado';
  return 'Vencido';
}