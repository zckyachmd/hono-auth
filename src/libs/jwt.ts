import * as crypto from "@/libs/crypto";
import { createJWT, validateJWT } from "oslo/jwt";
import { TimeSpan } from "oslo";
import db from "@/libs/db";

/**
 * Gets the secret token as an encoded ArrayBuffer.
 *
 * @throws {Error} If the secret token is not defined.
 */
const getEncodedSecret = async () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Secret token is not defined");

  return new TextEncoder().encode(secret).buffer as ArrayBuffer;
};

/**
 * Creates an access JWT token with a short expiration time.
 *
 * @param userId The user ID to include in the token.
 * @param expiresInMinutes The number of minutes until the token expires.
 * @returns The created JWT token, or null if an error occurred.
 */
export const createAccessToken = async (
  userId: string,
  expiresInMinutes = 15
) => {
  try {
    const secret = await getEncodedSecret();
    const options = {
      subject: userId,
      expiresIn: new TimeSpan(expiresInMinutes, "m"),
      includeIssuedTimestamp: true,
    };

    return await createJWT("HS256", secret, {}, options);
  } catch (error) {
    throw new Error("Failed to create access token.", { cause: error });
  }
};

/**
 * Validates a given JWT token against the secret token.
 *
 * @param token The token to validate.
 * @returns The result of the validation.
 */
export const validateToken = async (token: string) => {
  try {
    const secret = await getEncodedSecret();
    return await validateJWT("HS256", secret, token);
  } catch (error) {
    throw new Error("Failed to validate token.", { cause: error });
  }
};

/**
 * Creates a refresh JWT token with a longer expiration time and saves it to the database.
 *
 * @param userId The user ID to create a refresh token for.
 * @param expiresInDays The number of days until the refresh token expires.
 * @returns The created refresh token.
 */
export const createRefreshToken = async (
  userId: string,
  expiresInDays: number = 30
) => {
  try {
    const secret = await getEncodedSecret();
    const refreshToken = await createJWT(
      "HS256",
      secret,
      {},
      {
        subject: userId,
        expiresIn: new TimeSpan(expiresInDays, "d"),
        includeIssuedTimestamp: true,
      }
    );
    const hashedToken = await crypto.hashValue(refreshToken);
    await db.userToken.create({
      data: {
        token: hashedToken,
        userId: parseInt(userId, 10),
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      },
    });

    return refreshToken;
  } catch (error) {
    throw new Error("Failed to create refresh token.", { cause: error });
  }
};