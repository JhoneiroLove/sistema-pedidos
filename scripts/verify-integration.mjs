import { randomUUID } from "node:crypto";

const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:3100").replace(
  /\/$/,
  "",
);
const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:3101/api").replace(
  /\/$/,
  "",
);

async function request(url, init) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(10_000),
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${response.status} ${url}: ${JSON.stringify(body)}`);
  }
  return body;
}

const suffix = randomUUID().slice(0, 8);
const credentials = {
  nombre: `Integración ${suffix}`,
  email: `integration-${suffix}@example.test`,
  password: `Integration-${suffix}-2026!`,
};
let token;
let clienteId;

try {
  const health = await request(`${frontendUrl}/api/health`);
  if (health.backend?.database !== "connected") {
    throw new Error("El health integrado no confirmó PostgreSQL");
  }

  const cliente = await request(`${backendUrl}/auth/registro`, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  clienteId = cliente.id;

  const login = await request(`${backendUrl}/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });
  token = login.accessToken;

  const session = await request(`${backendUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (session.clienteId !== clienteId) {
    throw new Error("El JWT no corresponde al cliente registrado");
  }

  console.log("Integración OK: frontend -> backend -> PostgreSQL y JWT verificados.");
} finally {
  if (token && clienteId) {
    await request(`${backendUrl}/clientes/${clienteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
}
