import { Bcrypt } from "oslo/password";

const saltRounds = parseInt(process.env.SALT_ROUNDS || "10");
const bcrypt = new Bcrypt({ cost: saltRounds });

/**
 * Hashes a given password with a salt.
 *
 * @param password The password to hash.
 * @returns A Promise that resolves to the hashed password.
 */
export const passwordHash = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password);
  } catch (error) {
    throw new Error("Failed to hash password.", { cause: error });
  }
};

/**
 * Verifies a given password against a hashed password.
 *
 * @param password The password to verify.
 * @param hashedValue The hashed password to compare against.
 * @returns A Promise that resolves to a boolean indicating whether the password matches the hashed password.
 */
export const passwordVerify = async (
  value: string,
  hashedValue: string
): Promise<boolean> => {
  try {
    return await bcrypt.verify(hashedValue, value);
  } catch (error) {
    throw new Error("Failed to verify password.", { cause: error });
  }
};
