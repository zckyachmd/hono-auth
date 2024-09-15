import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import authRoute from "@/routes/authRoute";

const app = new OpenAPIHono();

// Web routes
app.get("/", (c) => {
  return c.text("Hello, World!");
});
app.get("/ui", swaggerUI({ url: "/spec.json" }));
app.doc("/spec.json", {
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
