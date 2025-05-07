import { Hono } from "hono";

const app = new Hono();

app.get("/login", (c) => c.json("login"));
app.post("/register", (c) => c.json("register"));

export default app;
