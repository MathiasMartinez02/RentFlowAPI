import { PrismaService } from './prisma.service';

describe('PrismaService.cleanDatabase', () => {
  const originalEnv = { ...process.env };
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('refuses to run when NODE_ENV is not "test"', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'mysql://user:pass@host:3306/rentflow_test';

    await expect(service.cleanDatabase()).rejects.toThrow(/NODE_ENV=test/);
  });

  it('refuses to run when DATABASE_URL does not look like a test database', async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'mysql://root:pass@kodama.proxy.rlwy.net:21423/railway';

    await expect(service.cleanDatabase()).rejects.toThrow(/does not/);
  });

  it('passes both guards when NODE_ENV=test and DATABASE_URL names a test database', async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/rentflow_test';
    // Stop right after the guards: $queryRaw would need a real connection.
    jest
      .spyOn(service, '$queryRaw' as any)
      .mockRejectedValue(new Error('no real connection in unit test'));

    await expect(service.cleanDatabase()).rejects.toThrow('no real connection in unit test');
  });
});
