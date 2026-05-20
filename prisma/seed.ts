import { PrismaClient, PropertyStatus, PropertyType, TenantStatus, ContractStatus, PaymentStatus, PaymentMethod, MaintenanceStatus, MaintenancePriority, MaintenanceCategory, NotificationType, NotificationPriority } from '@prisma/client';
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
function paidDate(monthOffset: number): Date {
  const d = new Date(today);
  d.setMonth(d.getMonth() + monthOffset);
  d.setDate(5);
  return d;
}
function dueDate(monthOffset: number): Date {
  const d = new Date(today);
  d.setMonth(d.getMonth() + monthOffset);
  d.setDate(10);
  return d;
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  const reset = process.argv.includes('--reset');

  if (reset) {
    console.log('♻️  Resetting demo data...');
    await prisma.user.deleteMany({ where: { email: 'admin@rentflow.com' } });
  }

  const existing = await prisma.user.findUnique({ where: { email: 'admin@rentflow.com' } });
  if (existing) {
    console.log('⚠️  Demo user already exists. Run with --reset to re-seed.');
    return;
  }

  console.log('🌱 Seeding RentFlow demo data...\n');

  // ─── User ───────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin123*', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@rentflow.com',
      password: hashedPassword,
      nombre: 'Martín',
      apellido: 'García',
      empresa: 'Inmobiliaria García & Asociados',
      phone: '+54 11 4567-8901',
      role: 'USER',
    },
  });
  console.log(`✅ User created: ${user.email}`);

  // ─── Properties ─────────────────────────────────────────────
  const [prop1, prop2, prop3, prop4, prop5, prop6, prop7, prop8] = await Promise.all([
    prisma.property.create({ data: {
      ownerId: user.id, nombre: 'Depto. Palermo 3A',
      descripcion: 'Hermoso departamento de 2 ambientes en pleno Palermo. Luminoso, con balcón y cochera.',
      direccion: 'Av. Santa Fe 3245, Piso 3 Dto A', ciudad: 'Buenos Aires', provincia: 'CABA',
      codigoPostal: 'C1425', tipoPropiedad: PropertyType.APARTAMENTO, estado: PropertyStatus.OCUPADA,
      precioMensual: 185000, habitaciones: 2, banos: 1, metrosCuadrados: 65,
    }}),
    prisma.property.create({ data: {
      ownerId: user.id, nombre: 'Casa Olivos',
      descripcion: 'Amplia casa con jardín y pileta en zona residencial de Vicente López.',
      direccion: 'Lavalle 1870', ciudad: 'Vicente López', provincia: 'Buenos Aires',
      codigoPostal: 'B1636', tipoPropiedad: PropertyType.CASA, estado: PropertyStatus.DISPONIBLE,
      precioMensual: 380000, habitaciones: 4, banos: 2, metrosCuadrados: 180,
    }}),
    prisma.property.create({ data: {
      ownerId: user.id, nombre: 'Oficina Microcentro',
      descripcion: 'Oficina en piso 8 con vista panorámica. Planta abierta de 90m2.',
      direccion: 'Florida 540, Piso 8', ciudad: 'Buenos Aires', provincia: 'CABA',
      codigoPostal: 'C1005', tipoPropiedad: PropertyType.OFICINA, estado: PropertyStatus.OCUPADA,
      precioMensual: 260000, habitaciones: 1, banos: 1, metrosCuadrados: 90,
    }}),
    prisma.property.create({ data: {
      ownerId: user.id, nombre: 'Local San Telmo',
      descripcion: 'Local comercial en zona turística de San Telmo. Alto tránsito peatonal.',
      direccion: 'Defensa 1250, PB', ciudad: 'Buenos Aires', provincia: 'CABA',
      codigoPostal: 'C1143', tipoPropiedad: PropertyType.LOCAL, estado: PropertyStatus.DISPONIBLE,
      precioMensual: 220000, habitaciones: 1, banos: 1, metrosCuadrados: 120,
    }}),
    prisma.property.create({ data: {
      ownerId: user.id, nombre: 'Depto. Recoleta',
      descripcion: 'Departamento de 3 ambientes con amenities. Edificio categoría en Recoleta.',
      direccion: 'Arenales 2430, Piso 6', ciudad: 'Buenos Aires', provincia: 'CABA',
      codigoPostal: 'C1124', tipoPropiedad: PropertyType.APARTAMENTO, estado: PropertyStatus.OCUPADA,
      precioMensual: 230000, habitaciones: 3, banos: 2, metrosCuadrados: 100,
    }}),
    prisma.property.create({ data: {
      ownerId: user.id, nombre: 'Duplex Caballito',
      descripcion: 'Dúplex de 3 ambientes en planta baja y primer piso. Patio privado.',
      direccion: 'Rivadavia 5780', ciudad: 'Buenos Aires', provincia: 'CABA',
      codigoPostal: 'C1406', tipoPropiedad: PropertyType.DUPLEX, estado: PropertyStatus.MANTENIMIENTO,
      precioMensual: 295000, habitaciones: 3, banos: 2, metrosCuadrados: 130,
    }}),
    prisma.property.create({ data: {
      ownerId: user.id, nombre: 'Depto. Villa Crespo',
      descripcion: 'Monoambiente moderno renovado en Villa Crespo. A metros de Corrientes.',
      direccion: 'Corrientes 5460, 2B', ciudad: 'Buenos Aires', provincia: 'CABA',
      codigoPostal: 'C1414', tipoPropiedad: PropertyType.APARTAMENTO, estado: PropertyStatus.OCUPADA,
      precioMensual: 165000, habitaciones: 1, banos: 1, metrosCuadrados: 45,
    }}),
    prisma.property.create({ data: {
      ownerId: user.id, nombre: 'Casa Belgrano',
      descripcion: 'Imponente casa de 5 ambientes con garage doble en zona residencial de Belgrano.',
      direccion: 'Ciudad de La Paz 3140', ciudad: 'Buenos Aires', provincia: 'CABA',
      codigoPostal: 'C1426', tipoPropiedad: PropertyType.CASA, estado: PropertyStatus.DISPONIBLE,
      precioMensual: 425000, habitaciones: 5, banos: 3, metrosCuadrados: 250,
    }}),
  ]);
  console.log('✅ 8 properties created');

  // ─── Tenants ────────────────────────────────────────────────
  const [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10] = await Promise.all([
    prisma.tenant.create({ data: { ownerId: user.id, nombre: 'Carlos', apellido: 'Martínez', email: 'carlos.martinez@gmail.com', telefono: '+54 11 5678-1234', dni: '30456789', propertyId: prop1.id, estado: TenantStatus.ACTIVO } }),
    prisma.tenant.create({ data: { ownerId: user.id, nombre: 'María', apellido: 'González', email: 'maria.gonzalez@outlook.com', telefono: '+54 11 4523-8901', dni: '27834561', propertyId: prop3.id, estado: TenantStatus.ACTIVO } }),
    prisma.tenant.create({ data: { ownerId: user.id, nombre: 'Juan', apellido: 'Rodríguez', email: 'juan.rodriguez@gmail.com', telefono: '+54 11 6789-2345', dni: '33567891', propertyId: prop5.id, estado: TenantStatus.ACTIVO } }),
    prisma.tenant.create({ data: { ownerId: user.id, nombre: 'Laura', apellido: 'Fernández', email: 'laura.fernandez@hotmail.com', telefono: '+54 11 3456-7890', dni: '29123456', propertyId: prop7.id, estado: TenantStatus.ACTIVO } }),
    prisma.tenant.create({ data: { ownerId: user.id, nombre: 'Roberto', apellido: 'Pérez', email: 'roberto.perez@gmail.com', telefono: '+54 11 7890-3456', dni: '31789012', estado: TenantStatus.INACTIVO } }),
    prisma.tenant.create({ data: { ownerId: user.id, nombre: 'Sofía', apellido: 'López', email: 'sofia.lopez@gmail.com', telefono: '+54 11 2345-6789', dni: '28456123', estado: TenantStatus.PENDIENTE } }),
    prisma.tenant.create({ data: { ownerId: user.id, nombre: 'Andrés', apellido: 'Ramírez', email: 'andres.ramirez@outlook.com', telefono: '+54 11 8901-4567', dni: '34123789', estado: TenantStatus.MOROSO } }),
    prisma.tenant.create({ data: { ownerId: user.id, nombre: 'Valentina', apellido: 'Torres', email: 'valentina.torres@gmail.com', telefono: '+54 11 4567-8901', dni: '26789012', estado: TenantStatus.PENDIENTE } }),
    prisma.tenant.create({ data: { ownerId: user.id, nombre: 'Diego', apellido: 'Sánchez', email: 'diego.sanchez@hotmail.com', telefono: '+54 11 9012-5678', dni: '35012345', estado: TenantStatus.ACTIVO } }),
    prisma.tenant.create({ data: { ownerId: user.id, nombre: 'Camila', apellido: 'Castro', email: 'camila.castro@gmail.com', telefono: '+54 11 3456-0123', dni: '27345678', estado: TenantStatus.PENDIENTE } }),
  ]);
  console.log('✅ 10 tenants created');

  // ─── Contracts ──────────────────────────────────────────────
  const [c1, c2, c3, c4, c5] = await Promise.all([
    // Prop 1 – ACTIVO (8 meses corridos)
    prisma.contract.create({ data: {
      ownerId: user.id, codigoContrato: 'CTR-2024-DEMO1',
      propertyId: prop1.id, tenantId: t1.id,
      fechaInicio: monthsAgo(8), fechaFin: monthsFromNow(4),
      montoMensual: 185000, deposito: 370000, renovacionAutomatica: true,
      estado: ContractStatus.ACTIVO,
    }}),
    // Prop 3 – ACTIVO (5 meses)
    prisma.contract.create({ data: {
      ownerId: user.id, codigoContrato: 'CTR-2024-DEMO2',
      propertyId: prop3.id, tenantId: t2.id,
      fechaInicio: monthsAgo(5), fechaFin: monthsFromNow(7),
      montoMensual: 260000, deposito: 520000, renovacionAutomatica: false,
      estado: ContractStatus.ACTIVO,
    }}),
    // Prop 5 – PRÓXIMO A VENCER (vence en 18 días)
    prisma.contract.create({ data: {
      ownerId: user.id, codigoContrato: 'CTR-2024-DEMO3',
      propertyId: prop5.id, tenantId: t3.id,
      fechaInicio: monthsAgo(12), fechaFin: daysFromNow(18),
      montoMensual: 230000, deposito: 460000, renovacionAutomatica: true,
      estado: ContractStatus.PROXIMO_A_VENCER,
    }}),
    // Prop 7 – ACTIVO (3 meses)
    prisma.contract.create({ data: {
      ownerId: user.id, codigoContrato: 'CTR-2024-DEMO4',
      propertyId: prop7.id, tenantId: t4.id,
      fechaInicio: monthsAgo(3), fechaFin: monthsFromNow(9),
      montoMensual: 165000, deposito: 330000, renovacionAutomatica: false,
      estado: ContractStatus.ACTIVO,
    }}),
    // Vencido histórico (prop 2, tenant 5)
    prisma.contract.create({ data: {
      ownerId: user.id, codigoContrato: 'CTR-2023-DEMO5',
      propertyId: prop2.id, tenantId: t5.id,
      fechaInicio: monthsAgo(18), fechaFin: monthsAgo(6),
      montoMensual: 320000, deposito: 640000, renovacionAutomatica: false,
      estado: ContractStatus.VENCIDO, isActive: false,
    }}),
  ]);
  console.log('✅ 5 contracts created');

  // ─── Payments ───────────────────────────────────────────────
  type PaymentData = Parameters<typeof prisma.payment.create>[0]['data'];

  const payments: PaymentData[] = [
    // Contract 1 (Palermo, $185k) — 5 pagados + 1 pendiente
    ...[-5, -4, -3, -2, -1].map(offset => ({
      ownerId: user.id, contractId: c1.id, tenantId: t1.id, propertyId: prop1.id,
      periodo: period(offset), monto: 185000, totalPagado: 185000,
      estado: PaymentStatus.PAGADO, metodoPago: PaymentMethod.TRANSFERENCIA,
      fechaVencimiento: dueDate(offset), fechaPago: paidDate(offset),
      referenciaPago: `TRF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    })),
    { ownerId: user.id, contractId: c1.id, tenantId: t1.id, propertyId: prop1.id,
      periodo: period(0), monto: 185000, estado: PaymentStatus.PENDIENTE,
      fechaVencimiento: daysFromNow(5) },

    // Contract 2 (Oficina Micro, $260k) — 3 pagados + 1 vencido + 1 pendiente
    ...[-3, -2].map(offset => ({
      ownerId: user.id, contractId: c2.id, tenantId: t2.id, propertyId: prop3.id,
      periodo: period(offset), monto: 260000, totalPagado: 260000,
      estado: PaymentStatus.PAGADO, metodoPago: PaymentMethod.TRANSFERENCIA,
      fechaVencimiento: dueDate(offset), fechaPago: paidDate(offset),
    })),
    { ownerId: user.id, contractId: c2.id, tenantId: t2.id, propertyId: prop3.id,
      periodo: period(-1), monto: 260000, mora: 7800,
      estado: PaymentStatus.VENCIDO, fechaVencimiento: daysAgo(22) },
    { ownerId: user.id, contractId: c2.id, tenantId: t2.id, propertyId: prop3.id,
      periodo: period(0), monto: 260000, estado: PaymentStatus.PENDIENTE,
      fechaVencimiento: daysFromNow(8) },

    // Contract 3 (Recoleta, $230k) — 4 pagados + 1 pendiente
    ...[-4, -3, -2, -1].map(offset => ({
      ownerId: user.id, contractId: c3.id, tenantId: t3.id, propertyId: prop5.id,
      periodo: period(offset), monto: 230000, totalPagado: 230000,
      estado: PaymentStatus.PAGADO, metodoPago: PaymentMethod.EFECTIVO,
      fechaVencimiento: dueDate(offset), fechaPago: paidDate(offset),
    })),
    { ownerId: user.id, contractId: c3.id, tenantId: t3.id, propertyId: prop5.id,
      periodo: period(0), monto: 230000, estado: PaymentStatus.PENDIENTE,
      fechaVencimiento: daysFromNow(12) },

    // Contract 4 (Villa Crespo, $165k) — 2 pagados + 1 pendiente
    ...[-2, -1].map(offset => ({
      ownerId: user.id, contractId: c4.id, tenantId: t4.id, propertyId: prop7.id,
      periodo: period(offset), monto: 165000, totalPagado: 165000,
      estado: PaymentStatus.PAGADO, metodoPago: PaymentMethod.DEBITO_AUTOMATICO,
      fechaVencimiento: dueDate(offset), fechaPago: paidDate(offset),
    })),
    { ownerId: user.id, contractId: c4.id, tenantId: t4.id, propertyId: prop7.id,
      periodo: period(0), monto: 165000, estado: PaymentStatus.PENDIENTE,
      fechaVencimiento: daysFromNow(15) },
  ];

  await prisma.payment.createMany({ data: payments as any });
  console.log(`✅ ${payments.length} payments created`);

  // ─── Maintenance Tickets ────────────────────────────────────
  const tickets = await Promise.all([
    prisma.maintenanceTicket.create({ data: {
      ownerId: user.id, propertyId: prop6.id, tenantId: null,
      titulo: 'Falla en instalación eléctrica — riesgo de cortocircuito',
      descripcion: 'Se detectaron cables pelados en el tablero principal del duplex. Riesgo alto de cortocircuito. Requiere atención inmediata.',
      categoria: MaintenanceCategory.ELECTRICIDAD, prioridad: MaintenancePriority.URGENTE,
      estado: MaintenanceStatus.EN_PROGRESO, costoEstimado: 45000,
      assignedTo: 'Electricista Ramón Suárez', observaciones: 'Propiedad temporalmente fuera de servicio.',
    }}),
    prisma.maintenanceTicket.create({ data: {
      ownerId: user.id, propertyId: prop1.id, tenantId: t1.id,
      titulo: 'Pérdida de agua bajo mesada cocina',
      descripcion: 'El inquilino reporta goteo constante bajo la mesada de la cocina. Posible problema en sifón o cañería.',
      categoria: MaintenanceCategory.PLOMERIA, prioridad: MaintenancePriority.MEDIA,
      estado: MaintenanceStatus.RESUELTO, costoEstimado: 8000, costoFinal: 6500,
      fechaResolucion: daysAgo(15), assignedTo: 'Plomero Daniel Quiroga',
    }}),
    prisma.maintenanceTicket.create({ data: {
      ownerId: user.id, propertyId: prop3.id, tenantId: t2.id,
      titulo: 'Aire acondicionado no enfría correctamente',
      descripcion: 'El equipo de aire acondicionado de la oficina no baja de 24°C incluso al máximo. Requiere recarga de gas.',
      categoria: MaintenanceCategory.GENERAL, prioridad: MaintenancePriority.ALTA,
      estado: MaintenanceStatus.PENDIENTE, costoEstimado: 25000,
    }}),
    prisma.maintenanceTicket.create({ data: {
      ownerId: user.id, propertyId: prop5.id, tenantId: t3.id,
      titulo: 'Pintura descascarada en dormitorio principal',
      descripcion: 'Humedad en la pared exterior del dormitorio principal generó descascarado de pintura. Área aproximada 2m2.',
      categoria: MaintenanceCategory.PINTURA, prioridad: MaintenancePriority.BAJA,
      estado: MaintenanceStatus.ESPERANDO_REPUESTOS, costoEstimado: 18000,
      observaciones: 'Esperando que llegue la pintura anti-humedad encargada.',
    }}),
    prisma.maintenanceTicket.create({ data: {
      ownerId: user.id, propertyId: prop7.id, tenantId: t4.id,
      titulo: 'Cerradura puerta de entrada con dificultad',
      descripcion: 'La llave de la puerta de entrada trabaja con dificultad. Riesgo de quedarse sin acceso.',
      categoria: MaintenanceCategory.SEGURIDAD, prioridad: MaintenancePriority.ALTA,
      estado: MaintenanceStatus.EN_PROGRESO, costoEstimado: 12000,
      assignedTo: 'Cerrajero Gustavo Mendez',
    }}),
  ]);
  console.log('✅ 5 maintenance tickets created');

  // ─── Notifications ──────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: user.id, titulo: 'Pago pendiente — Palermo', mensaje: `El período ${period(0)} del Depto. Palermo 3A vence en 5 días.`, tipo: NotificationType.PAYMENT, prioridad: NotificationPriority.MEDIUM },
      { userId: user.id, titulo: 'Contrato próximo a vencer', mensaje: 'El contrato CTR-2024-DEMO3 del Depto. Recoleta vence en 18 días.', tipo: NotificationType.CONTRACT, prioridad: NotificationPriority.HIGH },
      { userId: user.id, titulo: 'Pago vencido — Oficina Microcentro', mensaje: `El pago del período ${period(-1)} de la Oficina Microcentro está vencido hace 22 días.`, tipo: NotificationType.PAYMENT, prioridad: NotificationPriority.HIGH },
      { userId: user.id, titulo: 'Ticket urgente creado', mensaje: 'Falla eléctrica detectada en Duplex Caballito. Requiere atención inmediata.', tipo: NotificationType.MAINTENANCE, prioridad: NotificationPriority.URGENT },
      { userId: user.id, titulo: 'Ticket resuelto', mensaje: 'La pérdida de agua del Depto. Palermo 3A fue resuelta exitosamente.', tipo: NotificationType.MAINTENANCE, prioridad: NotificationPriority.LOW, leida: true },
      { userId: user.id, titulo: 'Contrato creado', mensaje: 'Nuevo contrato CTR-2024-DEMO4 registrado para Depto. Villa Crespo.', tipo: NotificationType.CONTRACT, prioridad: NotificationPriority.LOW, leida: true },
    ],
  });
  console.log('✅ 6 notifications created');

  // ─── Activity Logs ──────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      { userId: user.id, action: 'PROPERTY_CREATED', entityType: 'Property', entityId: prop1.id, descripcion: 'Propiedad "Depto. Palermo 3A" creada en Buenos Aires', createdAt: daysAgo(60) },
      { userId: user.id, action: 'CONTRACT_CREATED', entityType: 'Contract', entityId: c1.id, descripcion: 'Contrato CTR-2024-DEMO1 creado', createdAt: daysAgo(50) },
      { userId: user.id, action: 'PAYMENT_PAID', entityType: 'Payment', entityId: 'demo-pay-1', descripcion: `Pago del período ${period(-5)} registrado como pagado`, createdAt: daysAgo(45) },
      { userId: user.id, action: 'MAINTENANCE_CREATED', entityType: 'MaintenanceTicket', entityId: tickets[1].id, descripcion: 'Ticket "Pérdida de agua bajo mesada cocina" creado (MEDIA)', createdAt: daysAgo(30) },
      { userId: user.id, action: 'MAINTENANCE_RESOLVED', entityType: 'MaintenanceTicket', entityId: tickets[1].id, descripcion: 'Ticket "Pérdida de agua bajo mesada cocina" resuelto', createdAt: daysAgo(15) },
      { userId: user.id, action: 'CONTRACT_CREATED', entityType: 'Contract', entityId: c4.id, descripcion: 'Contrato CTR-2024-DEMO4 creado para Depto. Villa Crespo', createdAt: daysAgo(12) },
      { userId: user.id, action: 'PAYMENT_PAID', entityType: 'Payment', entityId: 'demo-pay-2', descripcion: `Pago del período ${period(-1)} de Oficina Microcentro registrado`, createdAt: daysAgo(8) },
      { userId: user.id, action: 'MAINTENANCE_CREATED', entityType: 'MaintenanceTicket', entityId: tickets[0].id, descripcion: 'Ticket urgente "Falla eléctrica" creado para Duplex Caballito', createdAt: daysAgo(5) },
      { userId: user.id, action: 'PAYMENT_CREATED', entityType: 'Payment', entityId: 'demo-pay-3', descripcion: `Pago creado para período ${period(0)} — Depto. Palermo 3A`, createdAt: daysAgo(2) },
      { userId: user.id, action: 'PROPERTY_CREATED', entityType: 'Property', entityId: prop6.id, descripcion: 'Propiedad "Duplex Caballito" actualizada a estado MANTENIMIENTO', createdAt: daysAgo(1) },
    ],
  });
  console.log('✅ 10 activity logs created');

  // ─── Summary ────────────────────────────────────────────────
  console.log(`
┌─────────────────────────────────────────┐
│   🎉  RentFlow seed complete!           │
├─────────────────────────────────────────┤
│  🔑  Email:     admin@rentflow.com      │
│  🔑  Password:  Admin123*               │
│  📍  API:       http://localhost:3000   │
│  📚  Docs:      http://localhost:3000/api/docs
└─────────────────────────────────────────┘
  `);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
