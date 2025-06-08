import type {
  Factory,
  ServiceContainer,
  ServiceMap,
} from "./ServiceContainer.Interface";

export class ServiceContainerDefault<TService extends ServiceMap>
  implements ServiceContainer<TService>
{
  static create<TService extends ServiceMap>(): ServiceContainer<TService> {
    return new ServiceContainerDefault<TService>();
  }
  private services = new Map<keyof TService, TService[keyof TService]>();
  private factories = new Map<
    keyof TService,
    {
      deps: readonly (keyof TService)[];
      factory: (deps: Partial<TService>) => unknown;
    }
  >();
  private constructing = new Set<keyof TService>();

  // === 註冊實例 ===
  register<K extends keyof TService>(
    key: K,
    instance: TService[K]
  ): ServiceContainer<TService & Record<K, TService[K]>, Omit<TService, K>>;

  // === 註冊工廠 ===
  register<
    K extends string & keyof TService,
    Deps extends readonly (keyof TService)[],
    R extends TService[K],
  >(
    key: K,
    deps: Deps,
    factory: Factory<TService, Deps, R>
  ): ServiceContainer<TService & Record<K, R>, Omit<TService, K>>;

  // === 實作 ===
  register<
    K extends keyof TService,
    Deps extends readonly (keyof TService)[],
    R extends TService[K],
  >(
    key: K,
    depsOrInstance: Deps | TService[K],
    factory?: Factory<TService, Deps, R>
  ): ServiceContainer<TService & Record<K, R>, Omit<TService, K>> {
    if (factory) {
      this.factories.set(key, {
        deps: depsOrInstance as Deps,
        factory: factory as (deps: Partial<TService>) => unknown,
      });
    } else {
      this.services.set(key, depsOrInstance as TService[K]);
    }

    return this as any;
  }

  // === 解析服務 ===
  resolve<K extends keyof TService>(key: K): TService[K] {
    if (this.services.has(key)) {
      return this.services.get(key)! as TService[K];
    }

    if (this.constructing.has(key)) {
      throw new Error(
        `❌ Circular dependency detected while resolving '${String(key)}'`
      );
    }

    const factoryEntry = this.factories.get(key);
    if (!factoryEntry) {
      throw new Error(`❌ Service '${String(key)}' not found.`);
    }

    const { deps, factory } = factoryEntry;
    const resolvedDeps: Partial<TService> = {};
    this.constructing.add(key);
    try {
      for (const dep of deps) {
        resolvedDeps[dep] = this.resolve(dep);
      }
      const instance = factory(resolvedDeps) as TService[K];
      this.services.set(key, instance);
      return instance;
    } finally {
      this.constructing.delete(key);
    }
  }

  // === 重設所有服務與工廠（測試用途）===
  reset(): void {
    this.services.clear();
    this.factories.clear();
    this.constructing.clear();
  }
}
