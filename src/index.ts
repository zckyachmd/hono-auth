import { Hono } from "hono";
import authRoute from "@/routes/authRoute";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// API route
app.route("/auth", authRoute);

export default app;
