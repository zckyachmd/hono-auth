import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import authRoute from "@/routes/authRoute";

const app = new OpenAPIHono();

// Global middleware
app
  .use(
    cors({
      origin: "*",
    })
  )
  .use(logger());

// Web routes
app.get("/", (c) => {
  return c.json(
    {
      description:
        "Hono Auth API. It provides user authentication and token management. It also provides an API reference for the OpenAPI specification. You can also use it as a boilerplate for your own custom API.",
      ui: `/ui`,
    },
    200
  );
});

app.get(
  "/ui",
  apiReference({
    spec: {
      url: "/openapi.json",
    },
  })
);
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "Auth API",
    description: "API for authentication using JWT tokens with HonoJS.",
  },
});

// API route
app.route("/auth", authRoute);

export default app;
