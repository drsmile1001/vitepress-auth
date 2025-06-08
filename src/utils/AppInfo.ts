import { file } from "bun";

export type AppInfo = {
  name: string;
  version: string;
  description: string;
};

export async function getAppInfo() {
  const {
    name,
    version,
    description,
  }: { name: string; version: string; description: string } =
    await file("./package.json").json();
  return { name, version, description };
}
