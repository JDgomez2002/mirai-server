import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.json("get user profession recommendations"));
app.put("/", (c) => c.json("update user profession recommendations data"));

export default app;
