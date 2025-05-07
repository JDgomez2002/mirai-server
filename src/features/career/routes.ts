import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.json("career path"));
app.put("/", (c) => c.json("update career path data"));

export default app;
