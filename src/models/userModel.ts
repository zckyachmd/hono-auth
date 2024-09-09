import { PrismaClient, User as PrismaUser } from "@prisma/client";

const prisma = new PrismaClient();

export type User = Omit<PrismaUser, "id" | "createdAt" | "updatedAt">;

/**
 * Creates a new user.
 * @param data The user data to create.
 * @returns The created user.
 */
export const createUser = async (data: User): Promise<PrismaUser> => {
  return await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
    },
  });
};

/**
 * Gets a user by email.
 *
 * @param email The email of the user to find.
 * @returns The found user, or null if not found.
 */
export const getUser = async (email: string): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  return user as User | null;
};
