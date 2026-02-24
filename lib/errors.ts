import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function handleApiError(error: unknown, context: string) {
  if (error instanceof ApiError) {
    return noStoreJson({ message: error.message }, { status: error.status });
  }

  logger.error(`${context} failed`, {
    error: error instanceof Error ? error.message : String(error),
  });

  return noStoreJson({ message: "Internal server error" }, { status: 500 });
}
