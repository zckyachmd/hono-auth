import { z } from "@hono/zod-openapi";

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .max(255)
  .openapi({
    description: "The password of the user.",
    example: "secret",
  });

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Login is required")
    .max(128)
    .refine(
      (value) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const isUsername = /^[a-zA-Z0-9_]{3,32}$/.test(value);
        return isEmail || isUsername;
      },
      {
        message: "Must be a valid username (3-32 characters) or email",
      }
    )
    .openapi({
      description: "The username or email of the user.",
      example: "user@mail.com or username123",
    }),
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255).openapi({
      description: "The name of the user.",
      example: "User",
    }),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(32, "Username cannot be longer than 32 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain alphanumeric characters or underscores"
      )
      .openapi({
        description: "The username of the user.",
        example: "user123",
      }),
    email: z.string().email("Invalid email address").max(128).openapi({
      description: "The email of the user.",
      example: "user@mail.com",
    }),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
