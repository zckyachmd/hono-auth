import { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { validateToken } from "@/libs/jwt";
import db from "@/libs/db";

/**
 * A middleware that authenticates the request using a JWT token in the Authorization header.
 *
 * The middleware extracts the token from the header and verifies it using the `validateToken` function.
 * If the token is valid, it retrieves the user using the `db.user.findUnique` method and sets the `userId`
 * and `userRole` properties on the context object.
 *
 * If the token is invalid or the user is not found, it returns an error response with a 401 or 404 status
 * code, respectively.
 *
 * @param c The context object.
 * @param next The next middleware or route handler.
 */
const authMiddleware = createMiddleware(async (c: Context, next) => {
  const token = extractToken(c.req.header("Authorization"));

  if (!token) {
    return respondWithError(c, "Authorization token is required!", 401);
  }

  try {
    const decodedToken = await validateToken(token);
    const userId = decodedToken?.subject;

    if (!userId || typeof userId !== "string" || userId.length === 0) {
      return respondWithError(c, "Invalid user ID in token!", 401);
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return respondWithError(c, "User not found!", 404);
    }

    c.set("userId", user.id);
    c.set("userRole", user.role.name);

    await next();
  } catch (error) {
    return respondWithError(c, "Authentication failed", 401);
  }
});

/**
 * Extracts a token from an Authorization header.
 *
 * @param authHeader The Authorization header to extract the token from.
 * @returns The extracted token, or null if the header is missing or invalid.
 */
const extractToken = (authHeader: string | undefined): string | null => {
  return authHeader ? authHeader.split(" ")[1] : null;
};

/**
 * Responds with an error to the client.
 *
 * @param c The Hono Context object.
 * @param message The error message to send to the client.
 * @param status The HTTP status code to respond with.
 * @returns The response object.
 */
const respondWithError = (c: Context, message: string, status: number) => {
  return c.json({ message }, { status });
};

export default authMiddleware;
