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
        name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
        bio: z.string().max(500, 'Bio must be 500 characters or less').nullable().optional(),
        image: z.string().url('Invalid image URL').max(500, 'Image URL must be 500 characters or less').nullable().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      return await UserService.updateProfile({
        userId,
        ...input,
      });
    }),
};
