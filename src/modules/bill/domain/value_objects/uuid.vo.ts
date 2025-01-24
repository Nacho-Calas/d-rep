import { randomUUID } from "node:crypto";

type CustomUuidGenerator = () => string;

export class UUID {
  constructor(private uuid: string) {}

  static create(customGenerator: CustomUuidGenerator = randomUUID): UUID {
    return new UUID(customGenerator());
  }

  getUUID(): string {
    return this.uuid;
  }
}
