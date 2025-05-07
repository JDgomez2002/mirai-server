import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.json("user assessments"));
app.put("/", (c) => c.json("update assessments data"));

export default app;
