import { AsyncLock } from "./AsyncLock";

export class Cache<T> {
  private value: T | undefined = undefined;
  private valueDate = new Date(0);
  private readonly lock = new AsyncLock();

  constructor(
    private readonly valueGetter: () => Promise<T>,
    private readonly timeToLive: number
  ) {}

  private isExpired(): boolean {
    return new Date().getTime() - this.valueDate.getTime() > this.timeToLive;
  }

  async get(): Promise<T> {
    await this.lock.run(
      () => this.isExpired(),
      async () => {
        this.value = await this.valueGetter();
        this.valueDate = new Date();
      }
    );
    if (this.value === undefined) {
      throw new Error("Value is undefined");
    }

    return this.value;
  }
}
