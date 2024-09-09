import ms from "ms";
import { sign, verify } from "hono/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

/**
 * Creates a JWT token for the given username.
 *
 * @param username The username to generate the token for.
 * @returns A Promise that resolves to the JWT token.
 */
export const createToken = async (username: string): Promise<string> => {
  const expiryInMilliseconds = ms(JWT_EXPIRES_IN);
  const expiryInSeconds = Math.floor(expiryInMilliseconds / 1000);
  const payload = {
    username: username,
    exp: Math.floor(Date.now() / 1000) + expiryInSeconds,
  };

  return await sign(payload, JWT_SECRET);
};

/**
 * Verifies a JWT token.
 *
 * @param token The JWT token to verify.
 * @returns A Promise that resolves to the decoded payload, or rejects with an error.
 */
export const verifyToken = async (token: string) => {
  return await verify(token, JWT_SECRET);
};
