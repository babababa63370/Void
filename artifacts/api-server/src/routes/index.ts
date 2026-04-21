import { Router, type IRouter } from "express";
import healthRouter from "./health";
import discordAuthRouter from "./discord-auth";
import adminRouter from "./admin";
import staffRouter from "./staff";
import botRouter from "./bot";
import playersRouter from "./players";
import matcherinoRouter from "./matcherino";
import brawlRouter from "./brawl";
import dbAdminRouter from "./db-admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(discordAuthRouter);
router.use(adminRouter);
router.use(staffRouter);
router.use(botRouter);
router.use(playersRouter);
router.use(matcherinoRouter);
router.use(brawlRouter);
router.use(dbAdminRouter);

export default router;
