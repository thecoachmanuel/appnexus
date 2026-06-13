/**
 * Demo Mode Utility
 * 
 * Controls demo/test mode via:
 * 1. NEXT_PUBLIC_DEMO_MODE env variable (primary override)
 * 2. system_settings.demo_mode database setting (fallback)
 * 
 * When demo mode is OFF, demo accounts are treated as regular accounts.
 * When demo mode is ON, demo accounts get special treatment (banner, tour, credit bypass).
 */

const DEMO_EMAILS = ["admin@demo.com", "user@demo.com"];

/**
 * Check if demo mode is enabled via .env
 * Returns: true (forced on), false (forced off), or null (defer to DB setting)
 */
export function getEnvDemoMode(): boolean | null {
  const envVal = process.env.NEXT_PUBLIC_DEMO_MODE;
  if (envVal === undefined || envVal === "") return null;
  if (envVal === "true" || envVal === "1") return true;
  if (envVal === "false" || envVal === "0") return false;
  return null;
}

/**
 * Resolve whether demo mode is active.
 * Priority: .env override → database setting → false
 */
export function isDemoModeEnabled(dbDemoMode?: boolean): boolean {
  const envOverride = getEnvDemoMode();
  if (envOverride !== null) return envOverride;
  return dbDemoMode ?? false;
}

/**
 * Check if a given email is a demo account AND demo mode is active.
 */
export function isDemoAccount(email: string | undefined | null, dbDemoMode?: boolean): boolean {
  if (!email) return false;
  if (!isDemoModeEnabled(dbDemoMode)) return false;
  return DEMO_EMAILS.includes(email.toLowerCase());
}

/**
 * Check if a given email is the admin demo account AND demo mode is active.
 */
export function isAdminDemoAccount(email: string | undefined | null, dbDemoMode?: boolean): boolean {
  if (!email) return false;
  if (!isDemoModeEnabled(dbDemoMode)) return false;
  return email.toLowerCase() === "admin@demo.com";
}

export { DEMO_EMAILS };
