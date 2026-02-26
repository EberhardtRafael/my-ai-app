import { isDeveloperRole } from '@/utils/userRole';

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);

const isTruthy = (value: string | undefined): boolean =>
  Boolean(value && TRUTHY_VALUES.has(value.toLowerCase()));

export const DEV_MODE_COOKIE_NAME = 'dev_mode_enabled';

export const isDeveloperModeForced = (): boolean =>
  isTruthy(process.env.DEV_MODE) || isTruthy(process.env.NEXT_PUBLIC_DEV_MODE);

export const isDeveloperModeAvailable = (): boolean =>
  process.env.NODE_ENV === 'development' || isDeveloperModeForced();

export const parseDeveloperModeCookie = (value: string | undefined): boolean => isTruthy(value);

export const isDeveloperModeEnabled = (cookieValue?: string): boolean => {
  if (isDeveloperModeForced()) {
    return true;
  }

  if (!isDeveloperModeAvailable()) {
    return false;
  }

  return parseDeveloperModeCookie(cookieValue);
};

export const isDeveloperModeToggleAvailable = (role: string | null | undefined): boolean =>
  isDeveloperRole(role) && isDeveloperModeAvailable();

export const hasDeveloperAccess = ({
  role,
  cookieValue,
}: {
  role: string | null | undefined;
  cookieValue?: string;
}): boolean => isDeveloperRole(role) && isDeveloperModeEnabled(cookieValue);
