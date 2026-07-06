import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/database/prisma.service';
import { createTestApp } from './utils/create-test-app';

describe('Properties → Tenants → Contracts → Payments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  const credentials = {
    nombre: 'Owner',
    apellido: 'E2E',
    email: 'e2e-flow@rentflow.com',
    password: 'Password123*',
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(credentials) // no role → defaults to CLIENTE, which can manage the whole flow
      .expect(201);

    accessToken = registerRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${accessToken}` });

  it('runs the full property → tenant → contract → payment lifecycle', async () => {
    const propertyRes = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set(auth())
      .send({
        nombre: 'Depto E2E',
        direccion: 'Av. Siempreviva 742',
        ciudad: 'Buenos Aires',
        provincia: 'CABA',
        codigoPostal: 'C1000',
        tipoPropiedad: 'APARTAMENTO',
        precioMensual: 180000,
        habitaciones: 2,
        banos: 1,
        metrosCuadrados: 55,
      })
      .expect(201);

    const propertyId = propertyRes.body.data.id;
    expect(propertyId).toBeDefined();

    const tenantRes = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set(auth())
      .send({
        nombre: 'Inquilino',
        apellido: 'E2E',
        email: 'inquilino-e2e@rentflow.com',
        telefono: '+54 11 5555-5555',
        dni: '30999888',
      })
      .expect(201);

    const tenantId = tenantRes.body.data.id;
    expect(tenantId).toBeDefined();

    const contractRes = await request(app.getHttpServer())
      .post('/api/v1/contracts')
      .set(auth())
      .send({
        propertyId,
        tenantId,
        fechaInicio: '2026-01-01',
        fechaFin: '2027-01-01',
        montoMensual: 180000,
        deposito: 360000,
      })
      .expect(201);

    const contractId = contractRes.body.data.id;
    expect(contractId).toBeDefined();
    expect(contractRes.body.data.codigoContrato).toMatch(/^CTR-\d{4}-/);

    // A second active contract on the same property must be rejected.
    await request(app.getHttpServer())
      .post('/api/v1/contracts')
      .set(auth())
      .send({
        propertyId,
        tenantId,
        fechaInicio: '2026-01-01',
        fechaFin: '2027-01-01',
        montoMensual: 180000,
        deposito: 360000,
      })
      .expect(409);

    const paymentRes = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set(auth())
      .send({
        contractId,
        periodo: '2026-07',
        fechaVencimiento: '2026-07-05',
        monto: 180000,
      })
      .expect(201);

    const paymentId = paymentRes.body.data.id;
    expect(paymentId).toBeDefined();

    // Duplicate payment for the same contract/periodo must be rejected.
    await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set(auth())
      .send({
        contractId,
        periodo: '2026-07',
        fechaVencimiento: '2026-07-05',
        monto: 180000,
      })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/api/v1/payments/${paymentId}`)
      .set(auth())
      .send({ estado: 'PAGADO', fechaPago: '2026-07-03' })
      .expect(200);

    const statsRes = await request(app.getHttpServer())
      .get('/api/v1/payments/stats/overview')
      .set(auth())
      .expect(200);

    expect(statsRes.body.data).toBeDefined();

    const dashboardRes = await request(app.getHttpServer())
      .get('/api/v1/dashboard/overview')
      .set(auth())
      .expect(200);

    expect(dashboardRes.body.data).toBeDefined();
  });
});
