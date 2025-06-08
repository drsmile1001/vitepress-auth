export type Resource = {
  type: "safeExt" | "safeJs" | "page" | "unknown";
  page: string | null;
};
