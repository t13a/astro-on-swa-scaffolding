// Based on @marplex/hono-azurefunc-adapter
// Copyright (c) 2024 Marco - MIT License
// https://github.com/marplex/hono-azurefunc-adapter

import type {
  Cookie,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import type { Hono } from "hono";

export type AzureEnv = {
  Bindings: {
    context: InvocationContext;
  };
};

export function azureHonoHandler(app: Hono<AzureEnv>) {
  return async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    const response = await app.fetch(toRequest(req), { context });
    return toAzureResponse(response);
  };
}

function toRequest(req: HttpRequest): Request {
  const hasBody = !["GET", "HEAD"].includes(req.method);
  return new Request(req.url, {
    method: req.method,
    headers: headersToObject(req.headers),
    ...(hasBody
      ? { body: req.body as BodyInit | null | undefined, duplex: "half" }
      : {}),
  });
}

function toAzureResponse(res: Response): HttpResponseInit {
  const headers = headersToObject(res.headers);
  const cookies = cookiesFromHeaders(res.headers);
  return {
    cookies,
    headers,
    status: res.status,
    body: streamToAsyncIterator(res.body),
  };
}

function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((v, k) => (obj[k] = v));
  return obj;
}

function cookiesFromHeaders(headers: Headers): Cookie[] | undefined {
  const cookies = headers.getSetCookie();
  if (cookies.length === 0) return undefined;
  return cookies.map(parseCookieString);
}

function parseCookieString(cookieString: string): Cookie {
  const [[name, encodedValue], ...attributesArray] = cookieString
    .split(";")
    .map((x) => x.split("="))
    .map(([key, value]) => [key.trim().toLowerCase(), value ?? "true"]);
  const attrs = Object.fromEntries(attributesArray);
  return {
    name,
    value: decodeURIComponent(encodedValue),
    path: attrs["path"],
    sameSite: attrs["samesite"],
    secure: attrs["secure"] === "true",
    httpOnly: attrs["httponly"] === "true",
    domain: attrs["domain"],
    expires: attrs["expires"] ? new Date(attrs["expires"]) : undefined,
    maxAge: attrs["max-age"] ? parseInt(attrs["max-age"]) : undefined,
  };
}

function streamToAsyncIterator(
  readable: ReadableStream<Uint8Array> | null
): AsyncIterableIterator<Uint8Array> | null {
  if (readable == null) return null;
  const reader = readable.getReader();
  return {
    next() {
      return reader.read();
    },
    return() {
      reader.releaseLock();
      return Promise.resolve({ done: true as const, value: undefined });
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}
