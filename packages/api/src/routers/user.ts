import z from 'zod';
import { protectedProcedure } from '../index';
import { UserService } from '../services/user-service';

/**
 * User Router
 * Provides endpoints for user profile management
 *
 * Security features:
 * - All endpoints require authentication
 * - Users can only access and modify their own profile
 * - Input validation on all mutations
 * - User-friendly error messages
 */
export const userRouter = {
  /**
   * Get current user's profile
   * Returns the authenticated user's profile information
   */
  getProfile: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return await UserService.getProfile(userId, userId);
  }),

  /**
   * Update user profile
   * Allows users to update their name, bio, and avatar image
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(1, 'Name is required')
          .max(100, 'Name must be 100 characters or less')
          .optional(),
        bio: z.string().max(500, 'Bio must be 500 characters or less').nullable().optional(),
        image: z
          .string()
          .url('Invalid image URL')
          .max(500, 'Image URL must be 500 characters or less')
          .nullable()
          .optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      return await UserService.updateProfile({
        userId,
        name: input.name,
        bio: input.bio,
        image: input.image,
      });
    }),

  /**
   * Change user password
   * Allows users to change their password using Better Auth API
   * Requires current password for verification
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
        revokeOtherSessions: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      return await UserService.changePassword(
        {
          userId,
          ...input,
        },
        context.headers
      );
    }),

  /**
   * Delete user account
   * Permanently deletes the user account and all associated data
   * This action is irreversible - all data will be lost
   *
   * Cascade deletion will remove:
   * - All sessions (authentication tokens)
   * - All accounts (OAuth providers, credentials)
   * - All chats and messages
   * - All folders
   * - All agents
   * - All API keys
   * - All prompts
   * - All models
   */
  deleteAccount: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return await UserService.deleteAccount(userId);
  }),

  /**
   * Get all active sessions for the current user
   * Returns all active (non-expired) sessions with device/browser information
   * The current session is marked with isCurrent: true
   */
  getSessions: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    // Extract the session token from the Better Auth session object
    // The session object has structure: { user: {...}, session: {...} }
    const sessionData = context.session as
      | { session?: { token?: string }; token?: string }
      | undefined;
    const currentToken = sessionData?.session?.token || sessionData?.token;
    return await UserService.getSessions(userId, currentToken);
  }),

  /**
   * Revoke a specific session
   * Allows users to revoke (delete) a specific session to logout from a device
   * Users can only revoke their own sessions
   */
  revokeSession: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1, 'Session token is required'),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      return await UserService.revokeSession({
        userId,
        token: input.token,
      });
    }),

  /**
   * Upload avatar image
   * Allows users to upload an avatar image
   * Accepts base64 encoded image data (data URI format)
   * Validates image type (JPEG, PNG, GIF, WebP) and size (max 2MB)
   */
  uploadAvatar: protectedProcedure
    .input(
      z.object({
        file: z.string().min(1, 'File is required'),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      return await UserService.uploadAvatar({
        userId,
        file: input.file,
      });
    }),
};
