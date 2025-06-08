import { isAfter } from "date-fns";

import type { Logger } from "@/utils/Logger.Interface";
import type { KeyValuePair } from "@/utils/TypeHelper";
import { YamlFile } from "@/utils/YamlFile";

import type { LoginSession, LoginSessionRepo } from "./LoginSessionRepo";
import type { SystemTime } from "./SystemTime";

export class LoginSessionRepoYaml implements LoginSessionRepo {
  private readonly yamlFile: YamlFile<LoginSession[]>;
  private readonly logger: Logger;

  constructor(
    logger: Logger,
    filePath: string,
    private readonly systemTime: SystemTime
  ) {
    this.logger = logger.extend("LoginSessionRepoYaml");
    this.yamlFile = new YamlFile<LoginSession[]>({
      filePath,
      fallback: [],
      logger: this.logger,
    });
  }
  async set<TExternalLoginSession extends KeyValuePair>(
    session: LoginSession<TExternalLoginSession>
  ): Promise<void> {
    const sessions = await this.yamlFile.read();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);
    if (existingIndex !== -1) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    await this.yamlFile.write(sessions);
  }
  async get<TExternalLoginSession extends KeyValuePair>(
    id: string
  ): Promise<LoginSession<TExternalLoginSession> | undefined> {
    const sessions = await this.yamlFile.read();
    return sessions.find((s) => s.id === id) as
      | LoginSession<TExternalLoginSession>
      | undefined;
  }
  async delete(id: string): Promise<void> {
    const sessions = await this.yamlFile.read();
    const existingIndex = sessions.findIndex((s) => s.id === id);
    if (existingIndex !== -1) {
      sessions.splice(existingIndex, 1);
      await this.yamlFile.write(sessions);
    }
  }
  async clearExpired(): Promise<void> {
    const now = this.systemTime.now();
    const sessions = await this.yamlFile.read();
    const validSessions = sessions.filter((s) => isAfter(s.expiredAt, now));
    await this.yamlFile.write(validSessions);
  }
}
