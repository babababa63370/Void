import { Router, type IRouter } from "express";
import healthRouter from "./health";
import discordAuthRouter from "./discord-auth";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(discordAuthRouter);
router.use(adminRouter);

export default router;
