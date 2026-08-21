-- Los campos son opcionales para conservar clientes comerciales preexistentes.
-- Todo cliente creado mediante /auth/registro recibe ambas credenciales.
ALTER TABLE "clientes"
ADD COLUMN "email" VARCHAR(254),
ADD COLUMN "password_hash" VARCHAR(255);

CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");
