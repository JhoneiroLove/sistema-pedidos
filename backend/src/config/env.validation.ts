type Environment = Record<string, string | undefined>;

const requiredVariables = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CORS_ORIGINS',
] as const;

export function validateEnvironment(
  environment: Environment,
): Record<string, unknown> {
  const missing = requiredVariables.filter(
    (name) => !environment[name]?.trim(), //lambda
  );

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}`,
    );
  }

  if ((environment.JWT_SECRET?.length ?? 0) < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }

  const port = Number(environment.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un puerto TCP válido');
  }

  return {
    ...environment,
    PORT: port,
    DATABASE_SCHEMA: environment.DATABASE_SCHEMA ?? 'public',
  };
}
