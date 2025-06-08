import type {
  ServiceMap,
  ServiceResolver,
} from "@/utils/ServiceContainer.Interface";

export class StaticResolver<T extends ServiceMap>
  implements ServiceResolver<T>
{
  constructor(private readonly map: T) {}

  resolve<K extends keyof T>(key: K): T[K] {
    return this.map[key];
  }
}
