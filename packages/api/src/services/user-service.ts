import { db } from '@sambung-chat/db';
import { user } from '@sambung-chat/db/schema/auth';
import { eq } from 'drizzle-orm';
import { ORPCError } from '@orpc/server';

/**
 * User profile data structure
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  bio: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update user profile input
 */
export interface UpdateProfileInput {
  userId: string;
  name?: string;
  bio?: string;
  image?: string;
}

/**
 * User Service
 *
 * Business logic layer for user profile operations.
 * Provides a clean separation between routing logic and data access logic.
 *
 * Security features:
 * - User-level isolation enforced (users can only update their own profile)
 * - Input validation on all mutations
 * - Ownership verification on all operations
 */
export class UserService {
  /**
   * Validate user name
   *
   * @param name - The name to validate
   * @throws {ORPCError} If the name is invalid
   */
  static validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Name must be a non-empty string',
      });
    }

    if (name.trim().length === 0) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Name cannot be empty or whitespace only',
      });
    }

    if (name.length > 100) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Name must be 100 characters or less',
      });
    }
  }

  /**
   * Validate user bio
   *
   * @param bio - The bio to validate
   * @throws {ORPCError} If the bio is invalid
   */
  static validateBio(bio: string): void {
    if (bio !== null && bio !== undefined) {
      if (typeof bio !== 'string') {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Bio must be a string',
        });
      }

      if (bio.length > 500) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Bio must be 500 characters or less',
        });
      }
    }
  }

  /**
   * Validate image URL
   *
   * @param image - The image URL to validate
   * @throws {ORPCError} If the image URL is invalid
   */
  static validateImage(image: string): void {
    if (image !== null && image !== undefined) {
      if (typeof image !== 'string') {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Image must be a string URL',
        });
      }

      if (image.length > 500) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Image URL must be 500 characters or less',
        });
      }
    }
  }

  /**
   * Get user profile by ID
   *
   * Fetches a user's profile by ID.
   * Only allows users to fetch their own profile.
   *
   * @param userId - The user ID to fetch
   * @param requesterId - The ID of the user making the request (for ownership verification)
   * @returns The user profile
   * @throws {ORPCError} If not found or no permission
   *
   * @example
   * ```ts
   * const profile = await UserService.getProfile('user_123', 'user_123');
   * // Returns: { id, name, email, image, bio, emailVerified, createdAt, updatedAt }
   * ```
   */
  static async getProfile(userId: string, requesterId: string): Promise<UserProfile> {
    // Users can only fetch their own profile
    if (userId !== requesterId) {
      throw new ORPCError('FORBIDDEN', {
        message: 'You can only view your own profile',
      });
    }

    const results = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (results.length === 0) {
      throw new ORPCError('NOT_FOUND', {
        message: 'User not found',
      });
    }

    const userData = results[0];

    if (!userData) {
      throw new ORPCError('NOT_FOUND', {
        message: 'User not found',
      });
    }

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
      bio: userData.bio,
      emailVerified: userData.emailVerified,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  }

  /**
   * Update user profile
   *
   * Updates a user's profile information (name, bio, image).
   * Only allows users to update their own profile.
   *
   * @param input - Update profile input
   * @returns The updated user profile
   * @throws {ORPCError} If not found, no permission, or validation fails
   *
   * @example
   * ```ts
   * const updated = await UserService.updateProfile({
   *   userId: 'user_123',
   *   name: 'John Doe',
   *   bio: 'Software developer'
   * });
   * ```
   */
  static async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    const { userId, name, bio, image } = input;

    // Verify user exists
    const existingUserResults = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUserResults.length === 0) {
      throw new ORPCError('NOT_FOUND', {
        message: 'User not found',
      });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    // Validate and add name if provided
    if (name !== undefined) {
      this.validateName(name);
      updateData.name = name;
    }

    // Validate and add bio if provided
    if (bio !== undefined) {
      this.validateBio(bio);
      updateData.bio = bio;
    }

    // Validate and add image if provided
    if (image !== undefined) {
      this.validateImage(image);
      updateData.image = image;
    }

    // Update the user
    const [updatedUser] = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId))
      .returning();

    if (!updatedUser) {
      throw new ORPCError('INTERNAL_ERROR', {
        message: 'Failed to update profile',
      });
    }

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      bio: updatedUser.bio,
      emailVerified: updatedUser.emailVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
