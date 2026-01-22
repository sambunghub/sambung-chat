/**
 * Profile form data structure
 * Matches the user schema fields that can be edited
 */
export type ProfileFormData = {
  name: string;
  bio: string;
};

/**
 * Change password form data structure
 */
export type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * Session data structure (matches backend UserSession)
 */
export type SessionData = {
  id: string;
  token: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
};
