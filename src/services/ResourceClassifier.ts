import type { Resource } from "@/schemas/Resource";

export interface ResourceClassifier {
  classify(pathname: string): Resource;
}
