import { validateEnvironment } from './env.validation.js';

describe('validateEnvironment', () => {
  const validEnvironment = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/pedidos',
    JWT_SECRET: '12345678901234567890123456789012',
    CORS_ORIGINS: 'http://localhost:3001',
  };

  it('convierte PORT a número para que Node no lo trate como pipe', () => {
    const result = validateEnvironment({
      ...validEnvironment,
      PORT: '3100',
    });

    expect(result.PORT).toBe(3100);
  });

  it('falla si DATABASE_URL no está definida', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, DATABASE_URL: undefined }),
    ).toThrow('DATABASE_URL');
  });

  it('rechaza secretos JWT débiles', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, JWT_SECRET: 'corto' }),
    ).toThrow('al menos 32 caracteres');
  });
});
