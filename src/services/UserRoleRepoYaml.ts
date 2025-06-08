import type { Logger } from "@/utils/Logger.Interface";
import { YamlFile } from "@/utils/YamlFile";

import type { UserRoleRepo } from "./UserRoleRepo";

export type UserRoleEntry = {
  userId: string;
  roles: string[];
};

export class UserRoleRepoYaml implements UserRoleRepo {
  private readonly yamlFile: YamlFile<UserRoleEntry[]>;
  private readonly logger: Logger;

  constructor(logger: Logger, filePath: string) {
    this.logger = logger.extend("UserRoleRepoYaml", {
      emoji: "🎭",
    });
    this.yamlFile = new YamlFile<UserRoleEntry[]>({
      filePath,
      fallback: [],
      logger: this.logger,
    });
  }
  async get(userId: string): Promise<string[] | undefined> {
    const all = await this.yamlFile.read();
    const entry = all.find((e) => e.userId === userId);
    return entry?.roles;
  }
}
