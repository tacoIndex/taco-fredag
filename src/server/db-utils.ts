import { prisma } from "~/server/db";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const retriablePatterns = [
  /sleep/i,
  /branch.*missing/i,
  /timeout/i,
  /ECONN/i,
  /reset/i,
  /ENOTFOUND/i,
  /Connection.*closed/i,
];

export function isRetriableDbError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return retriablePatterns.some((re) => re.test(msg));
}

export async function pingDb(maxRetries = 3, delayMs = 500): Promise<void> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // Postgres ping
      await prisma.$queryRawUnsafe("SELECT 1");
      return;
    } catch (e) {
      attempt += 1;
      if (attempt > maxRetries || !isRetriableDbError(e)) throw e;
      await sleep(delayMs * attempt);
    }
  }
}

export async function withDbRetries<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number; prePing?: boolean } = {},
): Promise<T> {
  const { retries = 2, delayMs = 700, prePing = true } = options;
  if (prePing) await pingDb();

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (e) {
      if (!isRetriableDbError(e) || attempt >= retries) throw e;
      attempt += 1;
      await sleep(delayMs * attempt);
    }
  }
}
