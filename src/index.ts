import { Hono } from "hono";
import auth from "./features/auth/routes";
import user from "./features/user/routes";
import assessment from "./features/assessment/routes";
import career from "./features/career/routes";
import recommendation from "./features/recommendation/routes";
import studyPlan from "./features/study_plan/routes";
import { authMiddleware } from "./middlewares/auth.middleware";

const app = new Hono();

app.route("/auth", auth);

app.use("*", authMiddleware);

app.route("/user", user);
app.route("/assessment", assessment);
app.route("/career", career);
app.route("/recommendation", recommendation);
app.route("/plan", studyPlan);

export default app;
