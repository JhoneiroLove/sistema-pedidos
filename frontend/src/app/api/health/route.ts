import { NextResponse } from "next/server";

import { apiRequest } from "@/shared/lib/api-client";

interface BackendHealth {
  status: string;
  database: string;
  timestamp: string;
}

export async function GET() {
  try {
    const backend = await apiRequest<BackendHealth>("/health", {}, false);
    return NextResponse.json({
      status: "ok",
      frontend: "connected",
      backend,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        frontend: "connected",
        backend: "unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
