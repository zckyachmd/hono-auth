import { z } from "@hono/zod-openapi";
import { registerSchema, loginSchema } from "@/schemas/authSchema";
import { passwordHash, passwordVerify } from "@/libs/password";
import db from "@/libs/db";
import * as jwt from "@/libs/jwt";

/**
 * Registers a new user.
 *
 * @param data The user data to register.
 * @returns The registered user.
 * @throws {Error} If the email is already in use.
 */
export const register = async (data: z.infer<typeof registerSchema>) => {
  return await db.$transaction(async (prisma) => {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw new Error("Email or Username already registered!");
    }

    let role = await prisma.role.findUnique({
      where: { name: "USER" },
      select: { id: true },
    });

    if (!role) {
      role = await prisma.role.create({
        data: { name: "USER" },
      });
    }

    const hashedPassword = await passwordHash(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        roleId: role.id,
      },
    });

    return { name: user.name, email: user.email };
  });
};

/**
 * Logs in a user and returns JWT access and refresh tokens.
 *
 * @param data The login data (email/username and password).
 * @returns The generated access and refresh tokens.
 * @throws {Error} If the credentials are invalid.
 */
export const login = async (data: z.infer<typeof loginSchema>) => {
  const { username, password: inputPassword } = loginSchema.parse(data);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);

  const user = await db.user.findUnique({
    where: isEmail ? { email: username } : { username: username },
  });

  if (!user || !(await passwordVerify(inputPassword, user.password))) {
    throw new Error("Invalid login credentials");
  }

  const [accessToken, refreshToken] = await Promise.all([
    jwt.createAccessToken(user.id),
    jwt.createRefreshToken(user.id),
  ]);

  return { accessToken, refreshToken };
};

/**
 * Retrieves the profile of a user by ID.
 *
 * @param userId The ID of the user to retrieve.
 * @returns The user profile.
 * @throws {Error} If the user does not exist.
 */
export const profile = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      username: true,
      email: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role?.name || null,
  };
};

/**
 * Processes a refresh token by either revoking it or regenerating a new token pair.
 *
 * @param refreshToken The refresh token to process.
 * @param action The action to take on the token. If "REVOKE", the token is revoked.
 * If "REGENERATE", a new token pair is generated and returned.
 * @returns If action is "REVOKE", returns a boolean indicating success. If action is
 * "REGENERATE", returns an object with the new access and refresh tokens.
 * @throws {Error} If the token is invalid or expired.
 */
const processToken = async (
  refreshToken: string,
  action: "REVOKE" | "REGENERATE"
) => {
  const decodedToken = await jwt.validateToken(refreshToken);
  if (!decodedToken?.subject) {
    throw new Error("Invalid or expired refresh token");
  }

  const userId = decodedToken.subject;

  return await db.$transaction(async (prisma) => {
    const tokenRecords = await prisma.userToken.findMany({
      where: {
        userId,
        revoked: false,
        expiresAt: { gte: new Date() },
      },
    });

    const validTokenRecord = await Promise.all(
      tokenRecords.map(async (tokenRecord) => {
        const isValidToken = await passwordVerify(
          refreshToken,
          tokenRecord.token
        );
        return isValidToken ? tokenRecord : null;
      })
    ).then((results) => results.find((record) => record !== null));

    if (!validTokenRecord) {
      throw new Error("Refresh token is invalid or already revoked!");
    }

    await prisma.userToken.update({
      where: { id: validTokenRecord.id },
      data: { revoked: true },
    });

    await prisma.userToken.deleteMany({
      where: {
        userId,
        OR: [
          {
            expiresAt: { lt: new Date() },
          },
          {
            revoked: true,
          },
        ],
      },
    });

    if (action === "REGENERATE") {
      const [newAccessToken, newRefreshToken] = await Promise.all([
        jwt.createAccessToken(userId.toString()),
        jwt.createRefreshToken(userId.toString()),
      ]);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    return true;
  });
};

/**
 * Regenerates a new access and refresh token pair for the given refresh token.
 * @param refreshToken The refresh token to use for regenerating the tokens.
 * @returns The new access and refresh token pair as an object with `accessToken` and `refreshToken` properties.
 */
export const regenToken = async (refreshToken: string): Promise<any> => {
  return await processToken(refreshToken, "REGENERATE");
};

/**
 * Logs out a user by invalidating their refresh token.
 *
 * @param refreshToken The refresh token to revoke.
 * @returns A boolean indicating success.
 */
export const logout = async (refreshToken: string) => {
  return await processToken(refreshToken, "REVOKE");
};
