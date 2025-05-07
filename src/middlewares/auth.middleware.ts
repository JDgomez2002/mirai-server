import { Context, Next } from "hono";
import { verify } from "hono/jwt";

export async function authMiddleware(c: Context, next: Next) {
  try {
    // const token = c.req.header("Authorization")?.split(" ")[1];

    // if (!token) {
    //   return c.json({ message: "No token provided" }, 401);
    // }

    // // You'll need to set your JWT_SECRET in your environment variables
    // const payload = await verify(token, process.env.JWT_SECRET || "");

    // // Add the decoded user to the context for use in protected routes
    // c.set("user", payload);

    await next();
  } catch (error) {
    return c.json({ message: "Invalid or expired token" }, 401);
  }
}
