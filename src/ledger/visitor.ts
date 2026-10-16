// Server-side only. A visitor's own demo state beyond the ledger: call-offs and the simulated outbox.
// Same two modes as the ledger (ADR D-19): an append-only file next to it locally, a per-browser cookie when hosted.

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { cookies } from "next/headers";
import type { ZodType } from "zod";
import { CallOffSchema, OutboxRowSchema, type CallOff, type OutboxRow } from "@/data/schema";
import { decodeList, encodeList, MAX_VISITOR_COOKIE_CHARS } from "./visitor-codec";
import { ledgerMode } from "./mode";
import { ledgerPath } from "./store";

const EIGHT_HOURS_S = 8 * 60 * 60;

export interface VisitorStore<T> {
  read(): Promise<T[]>;
  /** False when the visitor's cookie is full; nothing is written in that case. */
  append(item: T): Promise<boolean>;
  /** Cookie mode only: the file is append-only, like the ledger. */
  clear(): Promise<void>;
}

export function visitorStore<T>(name: string, schema: ZodType<T>): VisitorStore<T> {
  const cookieName = `plr_${name}`;
  const file = () => join(dirname(ledgerPath()), `${name}.jsonl`);
  return {
    async read() {
      if (ledgerMode() === "cookie") return decodeList((await cookies()).get(cookieName)?.value, schema);
      if (!existsSync(file())) return [];
      return readFileSync(file(), "utf8")
        .split("\n")
        .flatMap((line) => {
          if (line.trim() === "") return [];
          try {
            const parsed = schema.safeParse(JSON.parse(line));
            return parsed.success ? [parsed.data] : [];
          } catch {
            return [];
          }
        });
    },
    async append(item) {
      const checked = schema.parse(item);
      if (ledgerMode() === "file") {
        mkdirSync(dirname(file()), { recursive: true });
        appendFileSync(file(), `${JSON.stringify(checked)}\n`, { encoding: "utf8", flag: "a" });
        return true;
      }
      const jar = await cookies();
      const value = encodeList([...decodeList(jar.get(cookieName)?.value, schema), checked]);
      if (value.length > MAX_VISITOR_COOKIE_CHARS) return false;
      jar.set(cookieName, value, { httpOnly: true, sameSite: "lax", path: "/", maxAge: EIGHT_HOURS_S, secure: process.env.NODE_ENV === "production" });
      return true;
    },
    async clear() {
      if (ledgerMode() === "cookie") (await cookies()).delete(cookieName);
    },
  };
}

export const callOffStore = visitorStore<CallOff>("calloffs", CallOffSchema);
export const outboxStore = visitorStore<OutboxRow>("outbox", OutboxRowSchema);
