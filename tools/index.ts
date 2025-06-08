import { cac } from "cac";

import { listFiles } from "./func/ListFiles";

const cli = cac("test-cli");

cli
  .command("list-project", "列出所有檔案")
  .option("--ext <ext>", "指定要列出的副檔名，逗號分隔")
  .option("--exclude <dirs>", "排除的目錄，逗號分隔", {
    default: "node_modules,dist,.git,scripts",
  })
  .option("--flat", "是否扁平輸出")
  .option("--output <path>", "輸出檔案", {
    default: "dist/project-files.txt",
  })
  .action(async (options) => {
    const ext = options.ext?.split(",") ?? [];
    const exclude = options.exclude.split(",");
    await listFiles({
      rootDir: process.cwd(),
      extensions: ext,
      excludeDirs: exclude,
      flat: options.flat ?? false,
      outputPath: options.output,
    });
  });

cli.help();
cli.parse(process.argv, { run: false });

if (!cli.matchedCommand) {
  cli.outputHelp();
  process.exit(0);
}

try {
  await cli.runMatchedCommand();
} catch (err) {
  console.error("❌ CLI Error:", err);
  process.exit(1);
}
