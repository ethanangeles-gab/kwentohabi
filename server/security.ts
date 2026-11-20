/** Failed attempts only. Valid classroom sign-ins never spend a shared NAT budget. */
export class LoginProtection {
  private buckets = new Map<string, { count: number; until: number }>();
  constructor(private now = () => Date.now()) {}
  private read(key: string) {
    const value = this.buckets.get(key);
    if (value && value.until > this.now()) return value;
    this.buckets.delete(key);
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
      this.buckets.set(key, bucket);
    }
    if (this.buckets.size > 10000)
      for (const [key, value] of this.buckets)
        if (value.until <= this.now()) this.buckets.delete(key);
  }
  success(ip: string, username: string) {
    this.buckets.delete(`account:${username}`);
    this.buckets.delete(`pair:${ip}:${username}`);
  }
  reset(username: string) {
    this.buckets.delete(`account:${username}`);
    for (const key of this.buckets.keys())
      if (key.startsWith("pair:") && key.endsWith(`:${username}`))
        this.buckets.delete(key);
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
