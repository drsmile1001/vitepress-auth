import { type SystemTime } from "./SystemTime.Interface";

export class SystemTimeReal implements SystemTime {
  now(): Date {
    return new Date();
  }
}
