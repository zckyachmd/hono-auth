import * as bcrypt from "bcrypt";

const saltKey = process.env.SALT_KEY || "secret";

/**
 * Hashes a given password with a salt.
 *
 * @param password The password to hash.
 * @returns A Promise that resolves to the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(parseInt(saltKey));
  return await bcrypt.hash(password, salt);
};

/**
 * Verifies a given password against a hashed password.
 *
 * @param password The password to verify.
 * @param hashedPassword The hashed password to compare against.
 * @returns A Promise that resolves to a boolean indicating whether the password matches the hashed password.
 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
