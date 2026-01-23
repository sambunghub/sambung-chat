import { db } from '@sambung-chat/db';
import { user, session } from '@sambung-chat/db/schema/auth';
import { eq, and, gt } from 'drizzle-orm';
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
  bio?: string | null | undefined;
  image?: string | null | undefined;
}

/**
 * Change password input
 */
export interface ChangePasswordInput {
  userId?: string;
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}

/**
 * User session data structure
 */
export interface UserSession {
  id: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
}

/**
 * Revoke session input
 */
export interface RevokeSessionInput {
  userId: string;
  token: string;
}

/**
 * Upload avatar input
 */
export interface UploadAvatarInput {
  userId: string;
  file: string; // base64 encoded image
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
  static validateBio(bio: string | null | undefined): void {
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
  static validateImage(image: string | null): void {
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

    const results = await db.select().from(user).where(eq(user.id, userId)).limit(1);

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
      bio: (userData as any).bio || null,
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
    const existingUserResults = await db.select().from(user).where(eq(user.id, userId)).limit(1);

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

    // Validate and add bio if provided (null means clear the field)
    if (bio !== undefined) {
      if (bio !== null) {
        this.validateBio(bio);
      }
      updateData.bio = bio;
    }

    // Validate and add image if provided (null means clear the field)
    if (image !== undefined) {
      if (image !== null) {
        this.validateImage(image);
      }
      updateData.image = image;
    }

    // Guard against empty profile updates (no fields to update)
    if (Object.keys(updateData).length === 0) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'At least one field (name, bio, or image) must be provided to update profile',
      });
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
      bio: (updatedUser as any).bio || null,
      emailVerified: updatedUser.emailVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  /**
   * Validate password strength
   *
   * @param password - The password to validate
   * @throws {ORPCError} If the password doesn't meet security requirements
   */
  static validatePasswordStrength(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Password must be a non-empty string',
      });
    }

    if (password.length < 8) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Password must be at least 8 characters long',
      });
    }

    // Check for at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Password must contain at least one letter and one number',
      });
    }
  }

  /**
   * Change user password
   *
   * Changes a user's password using Better Auth API.
   * Validates password strength and current password before changing.
   *
   * @param input - Change password input
   * @returns Success message
   * @throws {ORPCError} If validation fails or password change fails
   *
   * @example
   * ```ts
   * await UserService.changePassword({
   *   userId: 'user_123',
   *   currentPassword: 'oldPassword123',
   *   newPassword: 'newPassword456',
   *   revokeOtherSessions: true
   * });
   * ```
   */
  static async changePassword(
    input: ChangePasswordInput,
    headers: Record<string, string> | Headers
  ): Promise<{ success: boolean }> {
    const { currentPassword, newPassword, revokeOtherSessions = true } = input;

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Import auth here to avoid circular dependencies
    const { auth } = await import('@sambung-chat/auth');

    try {
      // Use Better Auth's changePassword API with request context for session validation
      await auth.api.changePassword({
        headers,
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions,
        },
      });

      return { success: true };
    } catch (error) {
      // Better Auth throws an error if current password is wrong
      if (error instanceof Error) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message || 'Failed to change password',
        });
      }

      throw new ORPCError('INTERNAL_ERROR', {
        message: 'An unexpected error occurred while changing password',
      });
    }
  }

  /**
   * Delete user account
   *
   * Permanently deletes a user account and all associated data.
   * Due to database cascade constraints, this will also delete:
   * - All sessions (authentication tokens)
   * - All accounts (OAuth providers, credentials)
   * - All chats and messages
   * - All folders
   * - All agents
   * - All API keys
   * - All prompts
   * - All models
   *
   * This operation is irreversible.
   *
   * @param userId - The user ID to delete
   * @returns Success message
   * @throws {ORPCError} If user not found or deletion fails
   *
   * @example
   * ```ts
   * await UserService.deleteAccount('user_123');
   * // Returns: { success: true }
   * ```
   */
  static async deleteAccount(userId: string): Promise<{ success: boolean }> {
    // Verify user exists before attempting deletion
    const existingUserResults = await db.select().from(user).where(eq(user.id, userId)).limit(1);

    if (existingUserResults.length === 0) {
      throw new ORPCError('NOT_FOUND', {
        message: 'User not found',
      });
    }

    try {
      // Delete the user - cascade deletion will handle all related data
      await db.delete(user).where(eq(user.id, userId));

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        throw new ORPCError('INTERNAL_ERROR', {
          message: error.message || 'Failed to delete account',
        });
      }

      throw new ORPCError('INTERNAL_ERROR', {
        message: 'An unexpected error occurred while deleting account',
      });
    }
  }

  /**
   * Get all active sessions for a user
   *
   * Fetches all active (non-expired) sessions for the authenticated user.
   * Identifies the current session based on the provided session token.
   *
   * @param userId - The user ID to fetch sessions for
   * @param currentToken - The token of the current session (to identify current session), or undefined if not available
   * @returns Array of user sessions
   * @throws {ORPCError} If user not found
   *
   * @example
   * ```ts
   * const sessions = await UserService.getSessions('user_123', 'current_token_xyz');
   * // Returns: [{ id, token, expiresAt, ipAddress, userAgent, isCurrent, ... }]
   * ```
   */
  static async getSessions(userId: string, currentToken?: string): Promise<UserSession[]> {
    // Fetch all active (non-expired) sessions for the user
    const sessions = await db
      .select()
      .from(session)
      .where(
        and(
          eq(session.userId, userId),
          gt(session.expiresAt, new Date()) // Only non-expired sessions
        )
      )
      .orderBy(session.createdAt);

    // Transform and identify current session
    return sessions.map((s) => ({
      id: s.id,
      token: s.token,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      isCurrent: s.token === currentToken, // Mark current session
    }));
  }

  /**
   * Revoke a user session
   *
   * Revokes (deletes) a specific session for the authenticated user.
   * This is useful for logging out from specific devices or locations.
   *
   * @param input - Revoke session input containing userId and token
   * @returns Success message
   * @throws {ORPCError} If session not found, no permission, or deletion fails
   *
   * @example
   * ```ts
   * await UserService.revokeSession({
   *   userId: 'user_123',
   *   token: 'session_token_xyz'
   * });
   * // Returns: { success: true }
   * ```
   */
  static async revokeSession(input: RevokeSessionInput): Promise<{ success: boolean }> {
    const { userId, token } = input;

    // Find the session to verify ownership
    const sessionResults = await db.select().from(session).where(eq(session.token, token)).limit(1);

    if (sessionResults.length === 0) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Session not found',
      });
    }

    const sessionData = sessionResults[0]!; // Non-null assertion: we verified length > 0 above

    // Verify the session belongs to the user
    if (sessionData.userId !== userId) {
      throw new ORPCError('FORBIDDEN', {
        message: 'You can only revoke your own sessions',
      });
    }

    try {
      // Delete the session
      await db.delete(session).where(eq(session.token, token));

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        throw new ORPCError('INTERNAL_ERROR', {
          message: error.message || 'Failed to revoke session',
        });
      }

      throw new ORPCError('INTERNAL_ERROR', {
        message: 'An unexpected error occurred while revoking session',
      });
    }
  }

  /**
   * Upload avatar image
   *
   * Validates and uploads an avatar image for the user.
   * Accepts base64 encoded image data.
   * Validates image type, size, and format.
   *
   * Supported formats: JPEG, PNG, GIF, WebP
   * Maximum size: 2MB
   *
   * @param input - Upload avatar input containing userId and base64 file
   * @returns The updated user profile with new avatar URL
   * @throws {ORPCError} If validation fails or upload fails
   *
   * @example
   * ```ts
   * const updated = await UserService.uploadAvatar({
   *   userId: 'user_123',
   *   file: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
   * });
   * // Returns: { id, name, email, image: 'data:image/png;base64,...', ... }
   * ```
   */
  static async uploadAvatar(input: UploadAvatarInput): Promise<UserProfile> {
    const { userId, file } = input;

    // Validate base64 string
    if (!file || typeof file !== 'string') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'File must be a valid base64 string',
      });
    }

    // Check if it's a data URI
    const dataUriMatch = file.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!dataUriMatch) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'File must be a valid base64 data URI (e.g., data:image/png;base64,...)',
      });
    }

    const mimeType = dataUriMatch[1];
    const base64Data = dataUriMatch[2];

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!mimeType || !allowedTypes.includes(mimeType)) {
      throw new ORPCError('BAD_REQUEST', {
        message: `Invalid image type. Allowed types: ${allowedTypes.join(', ')}`,
      });
    }

    // Decode base64 to check file size
    let decodedSize: number;
    try {
      const buffer = Buffer.from(base64Data || '', 'base64');
      decodedSize = buffer.length;

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (decodedSize > maxSize) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Image size must be less than 2MB',
        });
      }

      // Ensure image is not empty
      if (decodedSize === 0) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Image cannot be empty',
        });
      }
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('BAD_REQUEST', {
        message: 'Invalid base64 encoding',
      });
    }

    // Verify user exists
    const existingUserResults = await db.select().from(user).where(eq(user.id, userId)).limit(1);

    if (existingUserResults.length === 0) {
      throw new ORPCError('NOT_FOUND', {
        message: 'User not found',
      });
    }

    // Update user's avatar with the data URI
    // In production, you would upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we store the data URI directly
    try {
      const [updatedUser] = await db
        .update(user)
        .set({
          image: file, // Store the data URI
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
        .returning();

      if (!updatedUser) {
        throw new ORPCError('INTERNAL_ERROR', {
          message: 'Failed to upload avatar',
        });
      }

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        bio: (updatedUser as any).bio || null,
        emailVerified: updatedUser.emailVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }

      throw new ORPCError('INTERNAL_ERROR', {
        message: error instanceof Error ? error.message : 'Failed to upload avatar',
      });
    }
  }
}
