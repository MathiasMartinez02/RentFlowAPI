import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/database/prisma.service';
import { createTestApp } from './utils/create-test-app';

describe('Public site (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let publishedPropertyId: string;
  let unpublishedPropertyId: string;

  const credentials = {
    nombre: 'Owner',
    apellido: 'Public',
    email: 'e2e-public@rentflow.com',
    password: 'Password123*',
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(credentials)
      .expect(201);

    const accessToken = registerRes.body.data.accessToken;

    const publishedRes = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nombre: 'Depto publicado',
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
    publishedPropertyId = publishedRes.body.data.id;

    await prisma.property.update({
      where: { id: publishedPropertyId },
      data: { publicado: true },
    });

    const unpublishedRes = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nombre: 'Depto sin publicar',
        direccion: 'Av. Siempreviva 999',
        ciudad: 'Buenos Aires',
        provincia: 'CABA',
        codigoPostal: 'C1000',
        tipoPropiedad: 'APARTAMENTO',
        precioMensual: 200000,
        habitaciones: 3,
        banos: 2,
        metrosCuadrados: 70,
      })
      .expect(201);
    unpublishedPropertyId = unpublishedRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  it('lists only published properties, without requiring a token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/public/properties').expect(200);

    const ids = res.body.data.items.map((p: { id: string }) => p.id);
    expect(ids).toContain(publishedPropertyId);
    expect(ids).not.toContain(unpublishedPropertyId);
  });

  it('returns the detail of a published property without a token', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/public/properties/${publishedPropertyId}`)
      .expect(200);

    expect(res.body.data.id).toBe(publishedPropertyId);
    expect(res.body.data.ownerId).toBeUndefined();
  });

  it('returns 404 for an unpublished property on the public endpoint', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/public/properties/${unpublishedPropertyId}`)
      .expect(404);
  });

  it('creates a lead from the public contact form without a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/public/leads')
      .send({
        nombre: 'Visitante Anónimo',
        email: 'visitante@email.com',
        telefono: '+54 11 4444-4444',
        mensaje: '¿Sigue disponible?',
        propertyId: publishedPropertyId,
      })
      .expect(201);

    expect(res.body.data.estado).toBe('NUEVO');
    expect(res.body.data.origen).toBe('WEB');
  });
});
