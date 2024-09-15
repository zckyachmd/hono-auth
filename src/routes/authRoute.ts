import type { Context } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { login, register, regenToken, logout } from "@/services/authService";
import { registerSchema, loginSchema } from "@/schemas/authSchema";
import { getCookie, setCookie } from "hono/cookie";

const authRoute = new OpenAPIHono();
const API_TAGS = ["Auth"];

const setTokenCookie = (c: Context, refreshToken: string) => {
  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 60 * 60 * 24 * 30,
  });
};

// Register Route
authRoute.openapi(
  {
    method: "post",
    path: "/register",
    summary: "Register a new user",
    description:
      "Register a new user with name, email, password, and confirm password.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: registerSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "User successfully registered",
      },
      400: {
        description: "Invalid input or registration failed",
      },
    },
    tags: API_TAGS,
  },
  async (c: Context) => {
    const body = await c.req.json();

    try {
      const user = await register(body);
      return c.json({ status: "success", data: user }, 201);
    } catch (error: Error | any) {
      return c.json(
        { status: "failed", error: error.message || "Registration failed!" },
        400
      );
    }
  }
);

// Login Route
authRoute.openapi(
  {
    method: "post",
    path: "/login",
    summary: "Log in a user",
    description: "Log in a user with email and password.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: loginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Login successful",
      },
      401: {
        description: "Invalid email or password",
      },
    },
    tags: API_TAGS,
  },
  async (c: Context) => {
    const body = await c.req.json();

    try {
      const token = await login(body);
      setTokenCookie(c, token.refreshToken);
      return c.json({ status: "success", data: token.accessToken }, 200);
    } catch (error: Error | any) {
      return c.json(
        { status: "failed", error: error.message || "Login failed!" },
        401
      );
    }
  }
);

// Refresh Token Route
authRoute.openapi(
  {
    method: "post",
    path: "/refresh-token",
    summary: "Refresh access token",
    description: "Refresh the access token using the refresh token.",
    responses: {
      200: {
        description: "Token successfully refreshed",
      },
      401: {
        description: "Refresh token is missing or invalid",
      },
    },
    tags: API_TAGS,
  },
  async (c: Context) => {
    const refreshToken = getCookie(c, "refreshToken");
    if (!refreshToken) {
      return c.json({ message: "Refresh token is required" }, 401);
    }

    try {
      const result = await regenToken(refreshToken);
      setTokenCookie(c, result.refreshToken);
      return c.json({ status: "success", data: result }, 200);
    } catch (error: Error | any) {
      return c.json({ error: "Failed to refresh token" }, 401);
    }
  }
);

// Logout Route
authRoute.openapi(
  {
    method: "post",
    path: "/logout",
    summary: "Log out a user",
    description: "Log out a user by invalidating the refresh token.",
    responses: {
      200: {
        description: "Logout successful",
      },
      401: {
        description: "Refresh token is missing or invalid",
      },
      500: {
        description: "Failed to log out",
      },
    },
    tags: API_TAGS,
  },
  async (c: Context) => {
    const refreshToken = getCookie(c, "refreshToken");
    if (!refreshToken) {
      return c.json({ message: "Refresh token is required" }, 401);
    }

    try {
      await logout(refreshToken);
      setCookie(c, "refreshToken", "", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 0,
      });
      return c.json({ message: "Logout successful" }, 200);
    } catch (error: Error | any) {
      return c.json({ message: "Failed to logout" }, 500);
    }
  }
);

export default authRoute;
