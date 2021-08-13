import {
  compact,
  defaultDecoder,
  defaultEncoder,
  defaultMode,
  defaultSeparator,
  readLog,
  writeData,
} from "./durableBase.ts";

function processSetLine(decoded: string, object: DurableSet, filename: string) {
  const { cmd, key } = JSON.parse(decoded);
  switch (cmd) {
    case "add":
      object.add(key);
      break;
    case "delete":
      object.delete(key);
      break;
    case "clear":
      object.clear();
      break;
    default:
      throw new Error(`Unknown command '${cmd}' in ${filename}`);
  }
}

export class DurableSet extends Set {
  readonly filename: string;
  private mode: number;
  private separator: string;
  private decode: Function;
  private encode: Function;
  private loading: boolean;

  constructor(filename: string, options?: {
    mode?: number;
    separator: string;
    decode?: Function;
    encode?: Function;
  }) {
    super();
    this.filename = filename;
    this.mode = options?.mode || defaultMode;
    this.separator = options?.separator || defaultSeparator;
    this.encode = options?.encode || defaultEncoder;
    this.decode = options?.decode || defaultDecoder;
    this.loading = false;
    const testData = JSON.stringify(Deno.build);
    if (this.decode(this.encode(testData)) !== testData) {
      throw Error("Decode is not the inverse of Encode!");
    }
  }

  add(key: any): this {
    const cmd = "add";
    this.writeLog({ cmd, key });
    return super.add(key);
  }

  delete(key: any): boolean {
    const cmd = "delete";
    this.writeLog({ cmd, key });
    return super.delete(key);
  }

  clear() {
    const cmd = "clear";
    this.writeLog({ cmd });
    return super.clear();
  }

  private writeLog(data: any): void {
    if (!this.loading) {
      writeData(this.filename, this.mode, this.encode, this.separator, data);
    }
  }

  async load(): Promise<void> {
    this.loading = true;
    await readLog(
      this.filename,
      processSetLine,
      this.decode,
      this.separator,
      this,
    );
    this.loading = false;
  }

  async compact(): Promise<void> {
    await compact(
      this.filename,
      this.mode,
      this.encode,
      this.separator,
      "add",
      this,
    );
  }

  async destroy(): Promise<void> {
    await Deno.remove(this.filename);
  }
}
