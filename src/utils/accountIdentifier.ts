export const ACCOUNT_IDENTIFIER_MAX_LENGTH = 254;

export function normalizeAccountIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

// Accept the existing username format or a normal, unquoted email address.
// This checks account-name syntax; it does not verify mailbox ownership.
export function isValidAccountIdentifier(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const identifier = normalizeAccountIdentifier(value);
  if (!identifier.includes("@")) return /^[a-z0-9._-]{3,80}$/.test(identifier);
  if (identifier.length > ACCOUNT_IDENTIFIER_MAX_LENGTH) return false;
  const parts = identifier.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (
    !local ||
    local.length > 64 ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..")
  )
    return false;
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  const labels = domain.split(".");
  return (
    labels.length >= 2 &&
    labels.every(
      (label) =>
        label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
    )
  );
}
