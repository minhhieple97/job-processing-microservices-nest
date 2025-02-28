import { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const createCookieOptions = (
  isProduction: boolean,
  expiresIn: number
): CookieOptions => ({
  httpOnly: true,
  secure: isProduction, // Only send cookie over HTTPS in production
  sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
  maxAge: expiresIn * 1000, // Convert to milliseconds
  path: '/', // Cookie is available for all routes
});

// Helper to parse JWT expiration time to milliseconds
export const parseJwtExpiresIn = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 86400; // Default to 1 day in seconds
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 86400;
  }
};
