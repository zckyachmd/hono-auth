import { UserRegistration, UserLogin } from "@/schemas/authSchema";
import { createUser, getUser } from "@/models/userModel";
import { createToken } from "@/utils/jwtUtils";
import { hashPassword, verifyPassword } from "@/utils/authUtils";

/**
 * Registers a new user.
 *
 * @param data The user data to register.
 * @returns The registered user.
 * @throws {Error} If the passwords do not match, or if the email is already in use.
 */
export const register = async (data: UserRegistration) => {
  const existingUser = await getUser(data.email);
  if (existingUser) {
    throw new Error("Email already registered!");
  }

  const user = await createUser({
    name: data.name,
    email: data.email,
    password: await hashPassword(data.password),
  });

  return {
    name: user.name,
    email: user.email,
  };
};

/**
 * Logs in a user with the given email and password.
 * 
 * @param email The email to log in.
 * @param password The password to log in.
 * @returns A Promise that resolves to a JWT token if the credentials are valid, or rejects with an error.
 */
export const login = async (data: UserLogin) => {
  const { email, password } = data;
  const user = await getUser(email);
  if (!user || !(await verifyPassword(password, user.password))) {
    throw new Error("Email or password is incorrect!");
  }

  const token = await createToken(email);
  return token;
};
