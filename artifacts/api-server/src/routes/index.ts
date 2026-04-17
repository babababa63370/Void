import { Router, type IRouter } from "express";
import healthRouter from "./health";
import discordAuthRouter from "./discord-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(discordAuthRouter);

export default router;
