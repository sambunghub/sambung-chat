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
