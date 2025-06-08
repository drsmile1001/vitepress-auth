import { cac } from "cac";

import { getAppLogger } from "./infra/AppLogger";

const logger = getAppLogger().extend("cli");
const cli = cac();

cli.command("serve", "啟動服務").action(async () => {
  const { serve } = await import("@/app/Serve");
  await serve(logger);
});
cli.help();

try {
  cli.parse(process.argv, { run: false });
  if (!cli.matchedCommand) {
    cli.outputHelp();
    process.exit(0);
  }
  await cli.runMatchedCommand();
} catch (error) {
  logger.error({ error }, "執行 CLI 時發生錯誤");
  process.exit(1);
}
