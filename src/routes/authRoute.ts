import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  UserRegistration,
  registerSchema,
  UserLogin,
  loginSchema,
} from "@/schemas/authSchema";
import { register, login } from "@/services/authService";

const app = new Hono();

app.post("/register", zValidator("json", registerSchema), async (c) => {
  const body = c.req.valid("json");
  const { name, email, password, confirmPassword }: UserRegistration = body;
  try {
    const user = await register({
      name,
      email,
      password,
      confirmPassword,
    });
    return c.json(
      {
        status: "success",
        data: user,
      },
      201
    );
  } catch (error: Error | any) {
    return c.json(
      { status: "failed", error: error.message || "Registration failed!" },
      400
    );
  }
});

app.post("/login", zValidator("json", loginSchema), async (c) => {
  const body = c.req.valid("json") as UserLogin;
  try {
    const token = await login(body);
    const data = {
      status: "success",
      data: { email: body.email, token: token },
    };
    return c.json(data, 200);
  } catch (error: Error | any) {
    return c.json(
      { status: "failed", error: error.message || "Login failed!" },
      401
    );
  }
});

export default app;
