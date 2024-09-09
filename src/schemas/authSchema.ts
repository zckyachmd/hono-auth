import { z } from "zod";

export type UserLogin = {
  email: string;
  password: string;
};

export type UserRegistration = UserLogin & {
  name: string;
  confirmPassword: string;
};

export const loginSchema = z.object({
  email: z.string().email().min(1, "Email is required").max(255),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = loginSchema
  .extend({
    name: z.string().min(1, "Name is required"),
    confirmPassword: z
      .string()
      .min(1, "Password confirmation is required")
      .max(255),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
