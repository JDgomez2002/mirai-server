import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) =>
  c.json("get user specific careers recomendation study plan")
);
app.put("/", (c) => c.json("update user careers recomendation data"));

export default app;
