import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.json("User data"));
app.put("/", (c) => c.json("update user data"));
app.delete("/", (c) => c.json("delete user data"));

export default app;
