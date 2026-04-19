import app from "./app";
import { logger } from "./lib/logger";
import { startBot } from "./lib/bot";
import { initAutoAnnounce } from "./lib/autoAnnounce";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

startBot().catch((err) => logger.error({ err }, "Bot startup failed"));
initAutoAnnounce().catch((err) => logger.error({ err }, "AutoAnnounce init failed"));
