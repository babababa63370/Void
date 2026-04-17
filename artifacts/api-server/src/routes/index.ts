import { Router, type IRouter } from "express";
import healthRouter from "./health";
import discordAuthRouter from "./discord-auth";
import adminRouter from "./admin";
import playersRouter from "./players";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(discordAuthRouter);
router.use(adminRouter);
router.use(playersRouter);
router.use(storageRouter);

export default router;
