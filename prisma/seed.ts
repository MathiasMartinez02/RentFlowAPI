import {
  PrismaClient, Role, PropertyStatus, PropertyType, TenantStatus,
  ContractStatus, PaymentStatus, PaymentMethod,
  MaintenanceStatus, MaintenancePriority, MaintenanceCategory,
  NotificationType, NotificationPriority, LeadStatus, LeadOrigin,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Date helpers ─────────────────────────────────────────────

const today = new Date();

function daysAgo(n: number): Date {
  return new Date(today.getTime() - n * 86_400_000);
}
function daysFromNow(n: number): Date {
  return new Date(today.getTime() + n * 86_400_000);
}
function monthsAgo(n: number): Date {
  const d = new Date(today);
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  return d;
}
function monthsFromNow(n: number): Date {
  const d = new Date(today);
  d.setMonth(d.getMonth() + n);
  return d;
}
function period(offset: number): string {
  const d = new Date(today);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function dueDate(offset: number): Date {
  const d = new Date(today);
  d.setMonth(d.getMonth() + offset);
  d.setDate(10);
  return d;
}
function paidDate(offset: number): Date {
  const d = new Date(today);
  d.setMonth(d.getMonth() + offset);
  d.setDate(5);
  return d;
}

type PaymentSeed = {
  ownerId: string; contractId: string; tenantId: string; propertyId: string;
  periodo: string; monto: number; totalPagado?: number; mora?: number;
  estado: PaymentStatus; metodoPago?: PaymentMethod; referenciaPago?: string;
  fechaVencimiento: Date; fechaPago?: Date; observaciones?: string;
};

/**
 * Generates a full payment history for a contract.
 * startOffset: negative month offset when the contract started (e.g. -11 = 11 months ago)
 * currentStatus: status for the current month payment
 * vencidoMonth: if set, that offset's payment becomes VENCIDO instead of PAGADO
 */
function buildPayments(
  ownerId: string, contractId: string, tenantId: string, propertyId: string,
  monto: number, startOffset: number,
  currentStatus: PaymentStatus,
  vencidoOffsets: number | number[] = [],
  method: PaymentMethod = PaymentMethod.TRANSFERENCIA,
): PaymentSeed[] {
  const payments: PaymentSeed[] = [];
  const vencidos = new Set(Array.isArray(vencidoOffsets) ? vencidoOffsets : [vencidoOffsets]);

  for (let offset = startOffset; offset < 0; offset++) {
    const isVencido = vencidos.has(offset);
    payments.push({
      ownerId, contractId, tenantId, propertyId,
      periodo: period(offset),
      monto,
      ...(isVencido
        ? { mora: Math.round(monto * 0.03), estado: PaymentStatus.VENCIDO, fechaVencimiento: dueDate(offset) }
        : { totalPagado: monto, estado: PaymentStatus.PAGADO, metodoPago: method, fechaVencimiento: dueDate(offset), fechaPago: paidDate(offset) }
      ),
    });
  }

  // Current month
  if (currentStatus === PaymentStatus.PAGADO) {
    payments.push({
      ownerId, contractId, tenantId, propertyId,
      periodo: period(0), monto, totalPagado: monto,
      estado: PaymentStatus.PAGADO, metodoPago: method,
      fechaVencimiento: dueDate(0), fechaPago: paidDate(0),
    });
  } else {
    payments.push({
      ownerId, contractId, tenantId, propertyId,
      periodo: period(0), monto,
      estado: currentStatus, fechaVencimiento: daysFromNow(10),
    });
  }

  return payments;
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  const reset = process.argv.includes('--reset');

  const DEMO_EMAILS = [
    'admin@rentflow.com', 'superadmin@rentflow.com',
    'finanzas@rentflow.com', 'vendedor@rentflow.com',
    'mantenimiento@rentflow.com', 'cliente@rentflow.com', 'inquilino@rentflow.com',
  ];

  if (reset) {
    console.log('♻️  Resetting demo data...');
    await prisma.user.deleteMany({ where: { email: { in: DEMO_EMAILS } } });
  }

  const existing = await prisma.user.findUnique({ where: { email: 'admin@rentflow.com' } });
  if (existing) {
    console.log('⚠️  Demo user already exists. Run with --reset to re-seed.');
    return;
  }

  console.log('🌱 Seeding RentFlow demo data...\n');

  // ─── User ───────────────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      email: 'admin@rentflow.com',
      password: await bcrypt.hash('Admin123*', 10),
      nombre: 'Martín',
      apellido: 'García',
      empresa: 'Inmobiliaria García & Asociados',
      phone: '+54 11 4567-8901',
      role: Role.ADMIN,
    },
  });
  const uid = user.id;
  console.log(`✅ User created: ${user.email}`);

  // ─── Staff & Role Users ───────────────────────────────────
  const staffPassword = await bcrypt.hash('Demo123*', 10);
  const [superAdmin, finanzas, vendedor, mantenimiento, cliente] = await Promise.all([
    prisma.user.create({ data: {
      email: 'superadmin@rentflow.com', password: staffPassword,
      nombre: 'Super', apellido: 'Admin',
      empresa: 'RentFlow Platform', phone: '+54 11 0000-0001',
      role: Role.SUPER_ADMIN,
    }}),
    prisma.user.create({ data: {
      email: 'finanzas@rentflow.com', password: staffPassword,
      nombre: 'Laura', apellido: 'Fernández',
      empresa: 'Inmobiliaria García & Asociados', phone: '+54 11 4567-8902',
      role: Role.FINANZAS, organizationId: uid,
    }}),
    prisma.user.create({ data: {
      email: 'vendedor@rentflow.com', password: staffPassword,
      nombre: 'Carlos', apellido: 'Rodríguez',
      empresa: 'Inmobiliaria García & Asociados', phone: '+54 11 4567-8903',
      role: Role.VENDEDOR, organizationId: uid,
    }}),
    prisma.user.create({ data: {
      email: 'mantenimiento@rentflow.com', password: staffPassword,
      nombre: 'Pablo', apellido: 'Sánchez',
      empresa: 'Inmobiliaria García & Asociados', phone: '+54 11 4567-8904',
      role: Role.MANTENIMIENTO, organizationId: uid,
    }}),
    prisma.user.create({ data: {
      email: 'cliente@rentflow.com', password: staffPassword,
      nombre: 'Valeria', apellido: 'López',
      empresa: 'Inversiones López SRL', phone: '+54 11 4567-8905',
      role: Role.CLIENTE,
    }}),
  ]);
  console.log(`✅ Staff users created: SUPER_ADMIN, FINANZAS, VENDEDOR, MANTENIMIENTO, CLIENTE`);

  // ─── Properties (12) ─────────────────────────────────────
  // 9 OCUPADA · 2 DISPONIBLE · 1 MANTENIMIENTO → 75% ocupación
  const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12] = await Promise.all([
    prisma.property.create({ data: { ownerId: uid,
      nombre: 'Depto. Palermo 3A', direccion: 'Av. Santa Fe 3245 Piso 3 A',
      ciudad: 'Buenos Aires', provincia: 'CABA', codigoPostal: 'C1425',
      descripcion: 'Luminoso 2 ambientes con balcón, cochera y amenities.',
      tipoPropiedad: PropertyType.APARTAMENTO, estado: PropertyStatus.OCUPADA,
      precioMensual: 185000, habitaciones: 2, banos: 1, metrosCuadrados: 65 } }),

    prisma.property.create({ data: { ownerId: uid,
      nombre: 'PH Recoleta', direccion: 'Arenales 2430 Piso 8 PH',
      ciudad: 'Buenos Aires', provincia: 'CABA', codigoPostal: 'C1124',
      descripcion: 'Penthouse de 3 ambientes con terraza privada en Recoleta. Edificio categoría con seguridad 24h.',
      tipoPropiedad: PropertyType.APARTAMENTO, estado: PropertyStatus.OCUPADA,
      precioMensual: 320000, habitaciones: 3, banos: 2, metrosCuadrados: 110 } }),

    prisma.property.create({ data: { ownerId: uid,
      nombre: 'Casa Olivos', direccion: 'Lavalle 1870',
      ciudad: 'Vicente López', provincia: 'Buenos Aires', codigoPostal: 'B1636',
      descripcion: 'Amplia casa familiar con jardín, pileta y barbacoa en zona residencial premium.',
      tipoPropiedad: PropertyType.CASA, estado: PropertyStatus.OCUPADA,
      precioMensual: 450000, habitaciones: 4, banos: 3, metrosCuadrados: 210 } }),

    prisma.property.create({ data: { ownerId: uid,
      nombre: 'Oficina Microcentro', direccion: 'Florida 540 Piso 8',
      ciudad: 'Buenos Aires', provincia: 'CABA', codigoPostal: 'C1005',
      descripcion: 'Planta abierta de 90m2 con vista panorámica en piso 8. Ideal para empresa.',
      tipoPropiedad: PropertyType.OFICINA, estado: PropertyStatus.OCUPADA,
      precioMensual: 280000, habitaciones: 1, banos: 1, metrosCuadrados: 90 } }),

    prisma.property.create({ data: { ownerId: uid,
      nombre: 'Local San Telmo', direccion: 'Defensa 1250 PB',
      ciudad: 'Buenos Aires', provincia: 'CABA', codigoPostal: 'C1143',
      descripcion: 'Local comercial en el corazón turístico de San Telmo. Alto tránsito peatonal.',
      tipoPropiedad: PropertyType.LOCAL, estado: PropertyStatus.OCUPADA,
      precioMensual: 240000, habitaciones: 1, banos: 1, metrosCuadrados: 120 } }),

    prisma.property.create({ data: { ownerId: uid,
      nombre: 'Duplex Caballito', direccion: 'Rivadavia 5780',
      ciudad: 'Buenos Aires', provincia: 'CABA', codigoPostal: 'C1406',
      descripcion: 'Dúplex de 3 ambientes en planta baja y primera planta con patio privado.',
      tipoPropiedad: PropertyType.DUPLEX, estado: PropertyStatus.OCUPADA,
      precioMensual: 310000, habitaciones: 3, banos: 2, metrosCuadrados: 130 } }),

    prisma.property.create({ data: { ownerId: uid,
      nombre: 'Monoambiente Villa Crespo', direccion: 'Corrientes 5460 2B',
      ciudad: 'Buenos Aires', provincia: 'CABA', codigoPostal: 'C1414',
      descripcion: 'Monoambiente moderno renovado, cocina integrada, muy luminoso.',
      tipoPropiedad: PropertyType.APARTAMENTO, estado: PropertyStatus.OCUPADA,
      precioMensual: 175000, habitaciones: 1, banos: 1, metrosCuadrados: 45 } }),

    prisma.property.create({ data: { ownerId: uid,
      nombre: 'Depto. Belgrano 2A', direccion: 'Ciudad de La Paz 3140 Piso 2 A',
      ciudad: 'Buenos Aires', provincia: 'CABA', codigoPostal: 'C1426',
      descripcion: '2 ambientes en pleno Belgrano R. Edificio con portero 24h y gimnasio.',
      tipoPropiedad: PropertyType.APARTAMENTO, estado: PropertyStatus.OCUPADA,
      precioMensual: 220000, habitaciones: 2, banos: 1, metrosCuadrados: 70 } }),

    prisma.property.create({ data: { ownerId: uid,
      nombre: 'Casa Nordelta', direccion: 'Av. de los Lagos 8500',
      ciudad: 'Tigre', provincia: 'Buenos Aires', codigoPostal: 'B1670',
      descripcion: 'Imponente casa de 5 ambientes en barrio cerrado con acceso al lago, muelle privado y garage triple.',
      tipoPropiedad: PropertyType.CASA, estado: PropertyStatus.OCUPADA,
      precioMensual: 680000, habitaciones: 5, banos: 4, metrosCuadrados: 320 } }),

    prisma.property.create({ data: { ownerId: uid,
      nombre: 'Depto. Flores 4B', direccion: 'Av. Rivadavia 6850 Piso 4 B',
      ciudad: 'Buenos Aires', provincia: 'CABA', codigoPostal: 'C1407',
      descripcion: '2 ambientes con balcón. Bien ubicado, a metros del subte A.',
      tipoPropiedad: PropertyType.APARTAMENTO, estado: PropertyStatus.DISPONIBLE,
      precioMensual: 145000, habitaciones: 2, banos: 1, metrosCuadrados: 55,
      publicado: true, publicadoEn: daysAgo(10) } }),

    prisma.property.create({ data: { ownerId: uid,
      nombre: 'Oficina Palermo Tech', direccion: 'Armenia 1647 Piso 2',
      ciudad: 'Buenos Aires', provincia: 'CABA', codigoPostal: 'C1414',
      descripcion: 'Oficina moderna en Palermo Hollywood. Planta libre con fibra óptica y AC.',
      tipoPropiedad: PropertyType.OFICINA, estado: PropertyStatus.DISPONIBLE,
      precioMensual: 350000, habitaciones: 1, banos: 1, metrosCuadrados: 80,
      publicado: true, publicadoEn: daysAgo(6) } }),

    prisma.property.create({ data: { ownerId: uid,
      nombre: 'Casa Tigre', direccion: 'Ruta 27 km 3.5',
      ciudad: 'Tigre', provincia: 'Buenos Aires', codigoPostal: 'B1648',
      descripcion: 'Casa de campo con amplio parque. En refacción completa de baños y cocina.',
      tipoPropiedad: PropertyType.CASA, estado: PropertyStatus.MANTENIMIENTO,
      precioMensual: 520000, habitaciones: 4, banos: 2, metrosCuadrados: 280 } }),
  ]);
  console.log('✅ 12 properties created');

  // ─── Tenants (15) ───────────────────────────────────────────
  const [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13, t14, t15] = await Promise.all([
    prisma.tenant.create({ data: { ownerId: uid, propertyId: p1.id, estado: TenantStatus.ACTIVO,
      nombre: 'Carlos', apellido: 'Martínez', email: 'carlos.martinez@gmail.com', telefono: '+54 11 5678-1234', dni: '30456789',
      observaciones: 'Excelente historial de pago. Trabaja en relación de dependencia.' } }),
    prisma.tenant.create({ data: { ownerId: uid, propertyId: p2.id, estado: TenantStatus.ACTIVO,
      nombre: 'Valentina', apellido: 'Herrera', email: 'valentina.herrera@outlook.com', telefono: '+54 11 4523-8901', dni: '27834561' } }),
    prisma.tenant.create({ data: { ownerId: uid, propertyId: p3.id, estado: TenantStatus.ACTIVO,
      nombre: 'Roberto', apellido: 'Sánchez', email: 'roberto.sanchez@gmail.com', telefono: '+54 11 6789-2345', dni: '33567891',
      observaciones: 'Empresario. Garantía bancaria presentada.' } }),
    prisma.tenant.create({ data: { ownerId: uid, propertyId: p4.id, estado: TenantStatus.ACTIVO,
      nombre: 'Tecno', apellido: 'Corp S.A.', email: 'alquileres@tecnocorp.com.ar', telefono: '+54 11 3456-7890', dni: '30-71234567-5' } }),
    prisma.tenant.create({ data: { ownerId: uid, propertyId: p5.id, estado: TenantStatus.ACTIVO,
      nombre: 'Gabriela', apellido: 'Romero', email: 'gabriela.romero@hotmail.com', telefono: '+54 11 7890-3456', dni: '29456123' } }),
    prisma.tenant.create({ data: { ownerId: uid, propertyId: p6.id, estado: TenantStatus.ACTIVO,
      nombre: 'Facundo', apellido: 'Álvarez', email: 'facundo.alvarez@gmail.com', telefono: '+54 11 2345-6789', dni: '35123789' } }),
    prisma.tenant.create({ data: { ownerId: uid, propertyId: p7.id, estado: TenantStatus.ACTIVO,
      nombre: 'Luciana', apellido: 'Torres', email: 'luciana.torres@gmail.com', telefono: '+54 11 8901-4567', dni: '28789012' } }),
    prisma.tenant.create({ data: { ownerId: uid, propertyId: p8.id, estado: TenantStatus.MOROSO,
      nombre: 'Andrés', apellido: 'Pérez', email: 'andres.perez@gmail.com', telefono: '+54 11 4567-8901', dni: '31012345',
      observaciones: 'Dos meses de mora. En gestión de cobro.' } }),
    prisma.tenant.create({ data: { ownerId: uid, propertyId: p9.id, estado: TenantStatus.ACTIVO,
      nombre: 'Marcelo', apellido: 'Fontán', email: 'marcelo.fontan@empresa.com', telefono: '+54 11 9012-5678', dni: '26345678',
      observaciones: 'Director de empresa. Pago anticipado habitual.' } }),
    prisma.tenant.create({ data: { ownerId: uid, estado: TenantStatus.INACTIVO,
      nombre: 'María', apellido: 'González', email: 'maria.gonzalez@gmail.com', telefono: '+54 11 3456-0123', dni: '27678901',
      observaciones: 'Ex-inquilina. Contrato finalizado correctamente.' } }),
    prisma.tenant.create({ data: { ownerId: uid, estado: TenantStatus.PENDIENTE,
      nombre: 'Juan Pablo', apellido: 'Ruiz', email: 'jp.ruiz@outlook.com', telefono: '+54 11 6789-3456', dni: '34890123' } }),
    prisma.tenant.create({ data: { ownerId: uid, estado: TenantStatus.PENDIENTE,
      nombre: 'Sofía', apellido: 'López', email: 'sofia.lopez@gmail.com', telefono: '+54 11 5678-9012', dni: '29234567' } }),
    prisma.tenant.create({ data: { ownerId: uid, estado: TenantStatus.PENDIENTE,
      nombre: 'Diego', apellido: 'Ramírez', email: 'diego.ramirez@hotmail.com', telefono: '+54 11 4567-2345', dni: '32567890' } }),
    prisma.tenant.create({ data: { ownerId: uid, estado: TenantStatus.PENDIENTE,
      nombre: 'Camila', apellido: 'Castro', email: 'camila.castro@gmail.com', telefono: '+54 11 8901-6789', dni: '28123456' } }),
    prisma.tenant.create({ data: { ownerId: uid, estado: TenantStatus.INACTIVO,
      nombre: 'Hernán', apellido: 'Vidal', email: 'hernan.vidal@gmail.com', telefono: '+54 11 2345-0123', dni: '30901234' } }),
  ]);
  console.log('✅ 15 tenants created');

  // ─── INQUILINO user (linked to t1) ───────────────────────
  await prisma.user.create({ data: {
    email: 'inquilino@rentflow.com',
    password: await bcrypt.hash('Demo123*', 10),
    nombre: t1.nombre, apellido: t1.apellido,
    phone: t1.telefono,
    role: Role.INQUILINO, linkedTenantId: t1.id,
  }});
  console.log(`✅ INQUILINO user created (linked to tenant: ${t1.nombre} ${t1.apellido})`);

  // ─── Contracts (10) ─────────────────────────────────────────
  // c1-c9 activos (c1 próximo a vencer) · c10 vencido histórico
  const [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10] = await Promise.all([
    // Palermo — 11 meses corridos, vence en 22 días
    prisma.contract.create({ data: { ownerId: uid, codigoContrato: 'CTR-2025-001',
      propertyId: p1.id, tenantId: t1.id,
      fechaInicio: monthsAgo(11), fechaFin: daysFromNow(22),
      montoMensual: 185000, deposito: 370000, renovacionAutomatica: true,
      estado: ContractStatus.PROXIMO_A_VENCER } }),
    // PH Recoleta — 10 meses
    prisma.contract.create({ data: { ownerId: uid, codigoContrato: 'CTR-2025-002',
      propertyId: p2.id, tenantId: t2.id,
      fechaInicio: monthsAgo(10), fechaFin: monthsFromNow(14),
      montoMensual: 320000, deposito: 640000, renovacionAutomatica: false,
      estado: ContractStatus.ACTIVO } }),
    // Casa Olivos — 9 meses
    prisma.contract.create({ data: { ownerId: uid, codigoContrato: 'CTR-2025-003',
      propertyId: p3.id, tenantId: t3.id,
      fechaInicio: monthsAgo(9), fechaFin: monthsFromNow(3),
      montoMensual: 450000, deposito: 900000, renovacionAutomatica: true,
      estado: ContractStatus.ACTIVO } }),
    // Oficina Microcentro — 8 meses
    prisma.contract.create({ data: { ownerId: uid, codigoContrato: 'CTR-2025-004',
      propertyId: p4.id, tenantId: t4.id,
      fechaInicio: monthsAgo(8), fechaFin: monthsFromNow(16),
      montoMensual: 280000, deposito: 560000, renovacionAutomatica: true,
      estado: ContractStatus.ACTIVO } }),
    // Local San Telmo — 7 meses
    prisma.contract.create({ data: { ownerId: uid, codigoContrato: 'CTR-2025-005',
      propertyId: p5.id, tenantId: t5.id,
      fechaInicio: monthsAgo(7), fechaFin: monthsFromNow(5),
      montoMensual: 240000, deposito: 480000, renovacionAutomatica: false,
      estado: ContractStatus.ACTIVO } }),
    // Duplex Caballito — 6 meses
    prisma.contract.create({ data: { ownerId: uid, codigoContrato: 'CTR-2025-006',
      propertyId: p6.id, tenantId: t6.id,
      fechaInicio: monthsAgo(6), fechaFin: monthsFromNow(18),
      montoMensual: 310000, deposito: 620000, renovacionAutomatica: true,
      estado: ContractStatus.ACTIVO } }),
    // Monoambiente Villa Crespo — 5 meses
    prisma.contract.create({ data: { ownerId: uid, codigoContrato: 'CTR-2025-007',
      propertyId: p7.id, tenantId: t7.id,
      fechaInicio: monthsAgo(5), fechaFin: monthsFromNow(7),
      montoMensual: 175000, deposito: 350000, renovacionAutomatica: false,
      estado: ContractStatus.ACTIVO } }),
    // Belgrano — 4 meses (moroso, tiene vencido)
    prisma.contract.create({ data: { ownerId: uid, codigoContrato: 'CTR-2025-008',
      propertyId: p8.id, tenantId: t8.id,
      fechaInicio: monthsAgo(4), fechaFin: monthsFromNow(8),
      montoMensual: 220000, deposito: 440000, renovacionAutomatica: false,
      estado: ContractStatus.ACTIVO } }),
    // Casa Nordelta — 3 meses (pago anticipado)
    prisma.contract.create({ data: { ownerId: uid, codigoContrato: 'CTR-2025-009',
      propertyId: p9.id, tenantId: t9.id,
      fechaInicio: monthsAgo(3), fechaFin: monthsFromNow(9),
      montoMensual: 680000, deposito: 1360000, renovacionAutomatica: true,
      estado: ContractStatus.ACTIVO } }),
    // Histórico vencido (Casa Olivos — inquilino anterior)
    prisma.contract.create({ data: { ownerId: uid, codigoContrato: 'CTR-2024-010',
      propertyId: p10.id, tenantId: t10.id,
      fechaInicio: monthsAgo(20), fechaFin: monthsAgo(8),
      montoMensual: 280000, deposito: 560000, renovacionAutomatica: false,
      estado: ContractStatus.VENCIDO, isActive: false } }),
  ]);
  console.log('✅ 10 contracts created');

  // ─── Payments ───────────────────────────────────────────────
  //
  // Crecimiento mensual de ingresos:
  //  Mes -11: $185k           (1 contrato)
  //  Mes -10: $505k           (+Recoleta)
  //  Mes  -9: $955k           (+Olivos)
  //  Mes  -8: $1.235M         (+Microcentro)
  //  Mes  -7: $1.475M         (+San Telmo)
  //  Mes  -6: $1.785M         (+Caballito)
  //  Mes  -5: $1.960M         (+Villa Crespo)
  //  Mes  -4: $2.180M         (+Belgrano)
  //  Mes  -3: $2.860M         (+Nordelta)
  //  Mes  -2: $2.860M         (todos al día)
  //  Mes  -1: $2.345M         (Belgrano+SanTelmo vencidos)
  //  Mes   0: $1.895M cobrado + $965k pendiente

  const allPayments: PaymentSeed[] = [
    // c1 Palermo $185k — 11 meses, mes actual PENDIENTE (próximo a vencer)
    ...buildPayments(uid, c1.id, t1.id, p1.id, 185000, -11, PaymentStatus.PENDIENTE),

    // c2 PH Recoleta $320k — 10 meses, mes -1 VENCIDO, mes actual PENDIENTE
    ...buildPayments(uid, c2.id, t2.id, p2.id, 320000, -10, PaymentStatus.PENDIENTE, -1),

    // c3 Casa Olivos $450k — 9 meses, mes actual YA PAGADO
    ...buildPayments(uid, c3.id, t3.id, p3.id, 450000, -9, PaymentStatus.PAGADO, undefined, PaymentMethod.TRANSFERENCIA),

    // c4 Oficina Microcentro $280k — 8 meses, mes actual YA PAGADO
    ...buildPayments(uid, c4.id, t4.id, p4.id, 280000, -8, PaymentStatus.PAGADO, undefined, PaymentMethod.DEBITO_AUTOMATICO),

    // c5 Local San Telmo $240k — 7 meses, mes -1 VENCIDO, mes actual PENDIENTE
    ...buildPayments(uid, c5.id, t5.id, p5.id, 240000, -7, PaymentStatus.PENDIENTE, -1),

    // c6 Duplex Caballito $310k — 6 meses, mes actual YA PAGADO
    ...buildPayments(uid, c6.id, t6.id, p6.id, 310000, -6, PaymentStatus.PAGADO, undefined, PaymentMethod.EFECTIVO),

    // c7 Villa Crespo $175k — 5 meses, mes actual PENDIENTE
    ...buildPayments(uid, c7.id, t7.id, p7.id, 175000, -5, PaymentStatus.PENDIENTE),

    // c8 Belgrano $220k — 4 meses, mes -2 y -1 VENCIDOS (moroso), mes actual PENDIENTE
    ...buildPayments(uid, c8.id, t8.id, p8.id, 220000, -4, PaymentStatus.PENDIENTE, [-2, -1]),

    // c9 Casa Nordelta $680k — 3 meses, mes actual YA PAGADO (adelantado)
    ...buildPayments(uid, c9.id, t9.id, p9.id, 680000, -3, PaymentStatus.PAGADO, undefined, PaymentMethod.TRANSFERENCIA),
  ];

  await prisma.payment.createMany({ data: allPayments as any });
  console.log(`✅ ${allPayments.length} payments created`);

  // ─── Maintenance (8 tickets) ────────────────────────────────
  const [tk1, tk2, tk3, tk4, tk5, tk6, tk7, tk8] = await Promise.all([
    // URGENTE · MANTENIMIENTO (bloquea la propiedad)
    prisma.maintenanceTicket.create({ data: { ownerId: uid, propertyId: p12.id,
      titulo: 'Refacción completa baños y cocina',
      descripcion: 'Renovación total de baños y cocina previo a nuevo contrato. Cañería de cobre + azulejos + sanitarios nuevos.',
      categoria: MaintenanceCategory.PLOMERIA, prioridad: MaintenancePriority.ALTA,
      estado: MaintenanceStatus.EN_PROGRESO, costoEstimado: 850000,
      assignedTo: 'Constructora Del Valle SRL',
      observaciones: 'Avance 60%. Estimado de finalización: 15 días.',
      createdAt: daysAgo(20) } }),

    // URGENTE · en progreso
    prisma.maintenanceTicket.create({ data: { ownerId: uid, propertyId: p6.id, tenantId: t6.id,
      titulo: 'Falla eléctrica en tablero principal',
      descripcion: 'Cortes de luz intermitentes. El tablero principal tiene disyuntores que no soportan la carga actual. Riesgo de cortocircuito.',
      categoria: MaintenanceCategory.ELECTRICIDAD, prioridad: MaintenancePriority.URGENTE,
      estado: MaintenanceStatus.EN_PROGRESO, costoEstimado: 85000,
      assignedTo: 'Electricista Ramón Suárez - mat. 4821',
      createdAt: daysAgo(3) } }),

    // ALTA · pendiente
    prisma.maintenanceTicket.create({ data: { ownerId: uid, propertyId: p4.id, tenantId: t4.id,
      titulo: 'Aire acondicionado central no enfría',
      descripcion: 'El sistema de AC central de la oficina no baja de 26°C. Posible falta de gas refrigerante o falla en compresor.',
      categoria: MaintenanceCategory.GENERAL, prioridad: MaintenancePriority.ALTA,
      estado: MaintenanceStatus.PENDIENTE, costoEstimado: 45000,
      createdAt: daysAgo(7) } }),

    // MEDIA · esperando repuestos
    prisma.maintenanceTicket.create({ data: { ownerId: uid, propertyId: p2.id, tenantId: t2.id,
      titulo: 'Humedad en pared dormitorio principal',
      descripcion: 'Mancha de humedad de aprox. 1.5m2 en la pared exterior. Pintura descascarada. Requiere impermeabilización y repintura.',
      categoria: MaintenanceCategory.PINTURA, prioridad: MaintenancePriority.MEDIA,
      estado: MaintenanceStatus.ESPERANDO_REPUESTOS, costoEstimado: 32000,
      observaciones: 'Esperando pintura antihumedad Látex Exterior 20L encargada.',
      createdAt: daysAgo(12) } }),

    // ALTA · pendiente
    prisma.maintenanceTicket.create({ data: { ownerId: uid, propertyId: p7.id, tenantId: t7.id,
      titulo: 'Cerradura puerta de entrada trabada',
      descripcion: 'La llave de la puerta de entrada trabaja con mucha dificultad. Cilindro desgastado. Riesgo de quedarse sin acceso.',
      categoria: MaintenanceCategory.SEGURIDAD, prioridad: MaintenancePriority.ALTA,
      estado: MaintenanceStatus.PENDIENTE, costoEstimado: 15000,
      createdAt: daysAgo(4) } }),

    // BAJA · resuelto
    prisma.maintenanceTicket.create({ data: { ownerId: uid, propertyId: p1.id, tenantId: t1.id,
      titulo: 'Pérdida de agua bajo mesada cocina',
      descripcion: 'Goteo constante en la conexión del sifón de la cocina. Inquilino reportó manchas en el mueble inferior.',
      categoria: MaintenanceCategory.PLOMERIA, prioridad: MaintenancePriority.MEDIA,
      estado: MaintenanceStatus.RESUELTO, costoEstimado: 8000, costoFinal: 5500,
      fechaResolucion: daysAgo(18),
      assignedTo: 'Plomero Daniel Quiroga',
      observaciones: 'Se reemplazó el sifón y se selló la conexión con teflón.',
      createdAt: daysAgo(35) } }),

    // BAJA · cerrado
    prisma.maintenanceTicket.create({ data: { ownerId: uid, propertyId: p3.id, tenantId: t3.id,
      titulo: 'Reparación portón automático garage',
      descripcion: 'El portón automático dejó de responder al control remoto. Motor con problema en placa electrónica.',
      categoria: MaintenanceCategory.SEGURIDAD, prioridad: MaintenancePriority.BAJA,
      estado: MaintenanceStatus.CERRADO, costoEstimado: 22000, costoFinal: 19500,
      fechaResolucion: daysAgo(45),
      assignedTo: 'Automatismos Rivera',
      createdAt: daysAgo(55) } }),

    // MEDIA · en progreso
    prisma.maintenanceTicket.create({ data: { ownerId: uid, propertyId: p9.id, tenantId: t9.id,
      titulo: 'Limpieza y mantenimiento pileta',
      descripcion: 'La pileta requiere limpieza profunda de filtros, tratamiento de algas y calibración de pH. Bomba con ruido inusual.',
      categoria: MaintenanceCategory.LIMPIEZA, prioridad: MaintenancePriority.MEDIA,
      estado: MaintenanceStatus.EN_PROGRESO, costoEstimado: 55000,
      assignedTo: 'Pool Service Nordelta',
      createdAt: daysAgo(6) } }),
  ]);
  console.log('✅ 8 maintenance tickets created');

  // ─── Leads (6) — pipeline de captación, propiedades publicadas p10/p11 ──
  await prisma.lead.createMany({
    data: [
      { ownerId: uid, vendedorId: vendedor.id, propertyId: p10.id,
        nombre: 'Martina Suárez', email: 'martina.suarez@gmail.com', telefono: '+54 11 6123-4567',
        mensaje: 'Hola, ¿el Depto. Flores 4B sigue disponible? Me interesa para mudarme el mes que viene.',
        origen: LeadOrigin.WEB, estado: LeadStatus.NUEVO, createdAt: daysAgo(1) },

      { ownerId: uid, vendedorId: vendedor.id, propertyId: p11.id,
        nombre: 'Ignacio Ferreyra', email: 'ignacio.ferreyra@empresa.com', telefono: '+54 11 5234-6789',
        mensaje: 'Buscamos oficina para relocalizar el equipo, ¿se puede coordinar una visita esta semana?',
        origen: LeadOrigin.WHATSAPP, estado: LeadStatus.CONTACTADO, createdAt: daysAgo(4) },

      { ownerId: uid, vendedorId: vendedor.id, propertyId: p10.id,
        nombre: 'Rocío Benítez', email: 'rocio.benitez@outlook.com', telefono: '+54 11 4321-9876',
        mensaje: 'Me gustaría visitar la propiedad el sábado por la mañana.',
        origen: LeadOrigin.WEB, estado: LeadStatus.VISITA_AGENDADA,
        fechaVisita: daysFromNow(3), visitaConfirmada: true, createdAt: daysAgo(6) },

      { ownerId: uid, vendedorId: vendedor.id, propertyId: p11.id,
        nombre: 'Tomás Acosta', email: 'tomas.acosta@gmail.com', telefono: '+54 11 3987-6543',
        mensaje: 'Ya visitamos la oficina, estamos evaluando el contrato con el resto del equipo.',
        origen: LeadOrigin.PORTAL, estado: LeadStatus.NEGOCIACION,
        notas: 'Piden ajustar el plazo de contrato a 24 meses. Consultar con el propietario.',
        createdAt: daysAgo(10) },

      { ownerId: uid, vendedorId: vendedor.id,
        nombre: 'Julieta Molina', email: 'julieta.molina@gmail.com', telefono: '+54 11 2456-7890',
        mensaje: 'Consulta general por alquileres en zona Palermo/Belgrano.',
        origen: LeadOrigin.REFERIDO, estado: LeadStatus.PERDIDO,
        notas: 'Encontró una propiedad con otra inmobiliaria.', createdAt: daysAgo(20) },

      { ownerId: uid, propertyId: p10.id,
        nombre: 'Nicolás Paz', email: 'nicolas.paz@gmail.com', telefono: '+54 11 6789-0123',
        mensaje: 'Cerramos la operación, ¿cómo seguimos con el contrato?',
        origen: LeadOrigin.WEB, estado: LeadStatus.GANADO, createdAt: daysAgo(2) },
    ],
  });
  console.log('✅ 6 leads created');

  // ─── Notifications (15) ─────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: uid, titulo: 'Contrato próximo a vencer — Palermo',
        mensaje: `El contrato CTR-2025-001 del Depto. Palermo 3A vence en 22 días. Contactar a Carlos Martínez para renovación.`,
        tipo: NotificationType.CONTRACT, prioridad: NotificationPriority.HIGH },

      { userId: uid, titulo: 'Pago vencido — PH Recoleta',
        mensaje: `El pago del período ${period(-1)} de Valentina Herrera (PH Recoleta) está vencido. Monto: $320.000 + mora.`,
        tipo: NotificationType.PAYMENT, prioridad: NotificationPriority.HIGH },

      { userId: uid, titulo: 'Pago vencido — Local San Telmo',
        mensaje: `El pago del período ${period(-1)} de Gabriela Romero (Local San Telmo) está vencido. Monto: $240.000 + mora.`,
        tipo: NotificationType.PAYMENT, prioridad: NotificationPriority.HIGH },

      { userId: uid, titulo: 'Moroso — Andrés Pérez (Belgrano)',
        mensaje: 'Andrés Pérez acumula 2 pagos vencidos en Depto. Belgrano 2A. Total adeudado: $449.900. Se recomienda iniciar gestión de cobro.',
        tipo: NotificationType.PAYMENT, prioridad: NotificationPriority.URGENT },

      { userId: uid, titulo: '⚡ Urgente — Falla eléctrica Caballito',
        mensaje: 'Falla en tablero eléctrico del Duplex Caballito. Electricista asignado. Riesgo de cortocircuito.',
        tipo: NotificationType.MAINTENANCE, prioridad: NotificationPriority.URGENT },

      { userId: uid, titulo: 'Pago recibido — Casa Olivos',
        mensaje: `Roberto Sánchez pagó $450.000 por el período ${period(0)}. Transferencia bancaria confirmada.`,
        tipo: NotificationType.PAYMENT, prioridad: NotificationPriority.LOW, leida: true },

      { userId: uid, titulo: 'Pago recibido — Oficina Microcentro',
        mensaje: `Tecno Corp S.A. pagó $280.000 por el período ${period(0)}. Débito automático procesado.`,
        tipo: NotificationType.PAYMENT, prioridad: NotificationPriority.LOW, leida: true },

      { userId: uid, titulo: 'Pago recibido — Casa Nordelta',
        mensaje: `Marcelo Fontán pagó $680.000 por el período ${period(0)}. Pago adelantado recibido.`,
        tipo: NotificationType.PAYMENT, prioridad: NotificationPriority.LOW, leida: true },

      { userId: uid, titulo: 'Nuevo inquilino pendiente — Juan Pablo Ruiz',
        mensaje: 'Juan Pablo Ruiz completó el formulario de solicitud para Depto. Flores 4B. Pendiente de aprobación.',
        tipo: NotificationType.SYSTEM, prioridad: NotificationPriority.MEDIUM },

      { userId: uid, titulo: 'Ticket resuelto — Pérdida de agua Palermo',
        mensaje: 'El plomero resolvió la pérdida de agua en Depto. Palermo 3A. Costo final: $5.500.',
        tipo: NotificationType.MAINTENANCE, prioridad: NotificationPriority.LOW, leida: true },

      { userId: uid, titulo: 'Nuevo contrato — Casa Nordelta',
        mensaje: 'Contrato CTR-2025-009 firmado. Marcelo Fontán ocupará la Casa Nordelta por 12 meses.',
        tipo: NotificationType.CONTRACT, prioridad: NotificationPriority.LOW, leida: true },

      { userId: uid, titulo: 'Pago recibido — Duplex Caballito',
        mensaje: `Facundo Álvarez pagó $310.000 en efectivo por el período ${period(0)}.`,
        tipo: NotificationType.PAYMENT, prioridad: NotificationPriority.LOW, leida: true },

      { userId: uid, titulo: 'Mantenimiento en progreso — Casa Tigre',
        mensaje: 'La refacción de baños y cocina de Casa Tigre va al 60%. Estimado de finalización en 15 días.',
        tipo: NotificationType.MAINTENANCE, prioridad: NotificationPriority.MEDIUM, leida: true },

      { userId: uid, titulo: 'Recordatorio — 4 pagos pendientes este mes',
        mensaje: `Hay 4 pagos pendientes para el período ${period(0)}. Vencimiento el día 10.`,
        tipo: NotificationType.PAYMENT, prioridad: NotificationPriority.MEDIUM },

      { userId: uid, titulo: 'Inquilino pendiente — Sofía López',
        mensaje: 'Sofía López solicita información sobre Oficina Palermo Tech. Contactar para visita.',
        tipo: NotificationType.SYSTEM, prioridad: NotificationPriority.LOW },
    ],
  });
  console.log('✅ 15 notifications created');

  // ─── Activity Log (25 entradas) ─────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      { userId: uid, action: 'PROPERTY_CREATED', entityType: 'Property', entityId: p1.id, descripcion: 'Propiedad "Depto. Palermo 3A" registrada', createdAt: daysAgo(340) },
      { userId: uid, action: 'PROPERTY_CREATED', entityType: 'Property', entityId: p3.id, descripcion: 'Propiedad "Casa Olivos" registrada', createdAt: daysAgo(310) },
      { userId: uid, action: 'TENANT_CREATED', entityType: 'Tenant', entityId: t10.id, descripcion: 'Inquilino "María González" registrada', createdAt: daysAgo(305) },
      { userId: uid, action: 'CONTRACT_CREATED', entityType: 'Contract', entityId: c10.id, descripcion: 'Contrato CTR-2024-010 firmado (histórico)', createdAt: daysAgo(300) },
      { userId: uid, action: 'CONTRACT_CREATED', entityType: 'Contract', entityId: c1.id, descripcion: 'Contrato CTR-2025-001 firmado — Depto. Palermo 3A', createdAt: daysAgo(335) },
      { userId: uid, action: 'PAYMENT_PAID', entityType: 'Payment', entityId: c1.id, descripcion: `Pago ${period(-11)} de Palermo confirmado ($185.000)`, createdAt: daysAgo(330) },
      { userId: uid, action: 'CONTRACT_CREATED', entityType: 'Contract', entityId: c2.id, descripcion: 'Contrato CTR-2025-002 firmado — PH Recoleta', createdAt: daysAgo(305) },
      { userId: uid, action: 'CONTRACT_CREATED', entityType: 'Contract', entityId: c3.id, descripcion: 'Contrato CTR-2025-003 firmado — Casa Olivos', createdAt: daysAgo(275) },
      { userId: uid, action: 'CONTRACT_EXPIRED', entityType: 'Contract', entityId: c10.id, descripcion: 'Contrato CTR-2024-010 vencido. Propiedad liberada.', createdAt: daysAgo(240) },
      { userId: uid, action: 'MAINTENANCE_CREATED', entityType: 'MaintenanceTicket', entityId: tk7.id, descripcion: 'Ticket "Portón automático garage" abierto en Casa Olivos', createdAt: daysAgo(55) },
      { userId: uid, action: 'MAINTENANCE_RESOLVED', entityType: 'MaintenanceTicket', entityId: tk7.id, descripcion: 'Ticket "Portón automático garage" cerrado. Costo: $19.500', createdAt: daysAgo(45) },
      { userId: uid, action: 'MAINTENANCE_CREATED', entityType: 'MaintenanceTicket', entityId: tk6.id, descripcion: 'Ticket "Pérdida de agua" abierto en Depto. Palermo 3A', createdAt: daysAgo(35) },
      { userId: uid, action: 'CONTRACT_CREATED', entityType: 'Contract', entityId: c9.id, descripcion: 'Contrato CTR-2025-009 firmado — Casa Nordelta ($680.000/mes)', createdAt: daysAgo(92) },
      { userId: uid, action: 'PAYMENT_PAID', entityType: 'Payment', entityId: c9.id, descripcion: `Pago ${period(-3)} de Nordelta confirmado ($680.000) — pago adelantado`, createdAt: daysAgo(88) },
      { userId: uid, action: 'PAYMENT_OVERDUE', entityType: 'Payment', entityId: c8.id, descripcion: `Pago ${period(-2)} de Belgrano marcado como VENCIDO. Inquilino notificado.`, createdAt: daysAgo(28) },
      { userId: uid, action: 'MAINTENANCE_RESOLVED', entityType: 'MaintenanceTicket', entityId: tk6.id, descripcion: 'Ticket "Pérdida de agua Palermo" resuelto. Costo final: $5.500', createdAt: daysAgo(18) },
      { userId: uid, action: 'PAYMENT_OVERDUE', entityType: 'Payment', entityId: c2.id, descripcion: `Pago ${period(-1)} del PH Recoleta marcado como VENCIDO.`, createdAt: daysAgo(15) },
      { userId: uid, action: 'PAYMENT_OVERDUE', entityType: 'Payment', entityId: c5.id, descripcion: `Pago ${period(-1)} del Local San Telmo marcado como VENCIDO.`, createdAt: daysAgo(14) },
      { userId: uid, action: 'MAINTENANCE_CREATED', entityType: 'MaintenanceTicket', entityId: tk4.id, descripcion: 'Ticket "Humedad PH Recoleta" abierto. Esperando materiales.', createdAt: daysAgo(12) },
      { userId: uid, action: 'PAYMENT_OVERDUE', entityType: 'Payment', entityId: c8.id, descripcion: `Pago ${period(-1)} de Belgrano también vencido. Inquilino clasif. MOROSO.`, createdAt: daysAgo(10) },
      { userId: uid, action: 'MAINTENANCE_CREATED', entityType: 'MaintenanceTicket', entityId: tk5.id, descripcion: 'Ticket "Cerradura Villa Crespo" creado (ALTA prioridad)', createdAt: daysAgo(4) },
      { userId: uid, action: 'MAINTENANCE_CREATED', entityType: 'MaintenanceTicket', entityId: tk2.id, descripcion: '⚡ Ticket URGENTE "Falla eléctrica Caballito" abierto', createdAt: daysAgo(3) },
      { userId: uid, action: 'PAYMENT_PAID', entityType: 'Payment', entityId: c3.id, descripcion: `Pago ${period(0)} de Casa Olivos confirmado ($450.000)`, createdAt: daysAgo(1) },
      { userId: uid, action: 'PAYMENT_PAID', entityType: 'Payment', entityId: c4.id, descripcion: `Pago ${period(0)} de Oficina Microcentro confirmado ($280.000) — débito automático`, createdAt: daysAgo(1) },
      { userId: uid, action: 'PAYMENT_PAID', entityType: 'Payment', entityId: c9.id, descripcion: `Pago ${period(0)} de Casa Nordelta confirmado ($680.000) — adelantado`, createdAt: daysAgo(0) },
    ],
  });
  console.log('✅ 25 activity logs created');

  // ─── Summary ────────────────────────────────────────────────
  const totalMensual = 185000 + 320000 + 450000 + 280000 + 240000 + 310000 + 175000 + 220000 + 680000;
  console.log(`
┌─────────────────────────────────────────────────────────┐
│   🎉  RentFlow seed complete!                           │
├─────────────────────────────────────────────────────────┤
│  ADMIN         admin@rentflow.com        Admin123*      │
│  SUPER_ADMIN   superadmin@rentflow.com   Demo123*       │
│  FINANZAS      finanzas@rentflow.com     Demo123*       │
│  VENDEDOR      vendedor@rentflow.com     Demo123*       │
│  MANTENIMIENTO mantenimiento@rentflow.com Demo123*      │
│  CLIENTE       cliente@rentflow.com      Demo123*       │
│  INQUILINO     inquilino@rentflow.com    Demo123*       │
├─────────────────────────────────────────────────────────┤
│  🏠  Propiedades: 12 (9 ocupadas · 75% · 2 publicadas)  │
│  👤  Inquilinos:  15                                    │
│  📋  Contratos:   10 (9 activos)                        │
│  💰  Facturación: $${(totalMensual / 1000).toFixed(0)}k/mes                          │
│  🔧  Mantenimiento: 8 tickets                          │
│  🎯  Leads:       6 (pipeline)                          │
│  🔔  Notificaciones: 15                                │
├─────────────────────────────────────────────────────────┤
│  📍  API:   http://localhost:3000/api/v1                │
│  📚  Docs:  http://localhost:3000/api/docs              │
└─────────────────────────────────────────────────────────┘
  `);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
