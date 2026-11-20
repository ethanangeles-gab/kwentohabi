import { db, persist } from "./store";

/** Failed attempts only. Valid classroom sign-ins never spend a shared NAT budget. */
export class LoginProtection {
  private buckets = new Map<string, { count: number; until: number }>();
  constructor(
    private now = () => Date.now(),
    private persistent = false,
  ) {}
  private read(key: string) {
    const value = this.persistent
      ? db.rateLimits[key]
      : this.buckets.get(key);
    if (value && value.until > this.now()) return value;
    if (this.persistent) delete db.rateLimits[key];
    else this.buckets.delete(key);
    return { count: 0, until: this.now() + 15 * 60_000 };
  }
  blocked(ip: string, username: string) {
    return (
      this.read(`account:${username}`).count >= 10 ||
      this.read(`pair:${ip}:${username}`).count >= 5 ||
      this.read(`ip:${ip}`).count >= 150
    );
  }
  failure(ip: string, username: string) {
    for (const key of [
      `account:${username}`,
      `pair:${ip}:${username}`,
      `ip:${ip}`,
    ]) {
      const bucket = this.read(key);
      bucket.count++;
      if (this.persistent) db.rateLimits[key] = bucket;
      else this.buckets.set(key, bucket);
    }
    if (this.persistent) persist();
    if (this.persistent) {
      if (Object.keys(db.rateLimits).length > 10000)
        for (const [key, value] of Object.entries(db.rateLimits))
          if (value.until <= this.now()) delete db.rateLimits[key];
    } else if (this.buckets.size > 10000) {
      for (const [key, value] of this.buckets)
        if (value.until <= this.now()) this.buckets.delete(key);
    }
  }
  success(ip: string, username: string) {
    if (this.persistent) {
      delete db.rateLimits[`account:${username}`];
      delete db.rateLimits[`pair:${ip}:${username}`];
    } else {
      this.buckets.delete(`account:${username}`);
      this.buckets.delete(`pair:${ip}:${username}`);
    }
    if (this.persistent) persist();
  }
  reset(username: string) {
    if (this.persistent) {
      delete db.rateLimits[`account:${username}`];
      for (const key of Object.keys(db.rateLimits))
        if (key.startsWith("pair:") && key.endsWith(`:${username}`))
          delete db.rateLimits[key];
    } else {
      this.buckets.delete(`account:${username}`);
      for (const key of this.buckets.keys())
        if (key.startsWith("pair:") && key.endsWith(`:${username}`))
          this.buckets.delete(key);
    }
    if (this.persistent) persist();
  }
}

export function canonicalOrigin(value: string | undefined) {
  if (!value) return undefined;
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "APP_ORIGIN must be an http(s) origin without a path or credentials.",
    );
  return url.origin;
}
