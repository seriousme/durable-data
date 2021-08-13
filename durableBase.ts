export type Durable = Map<any, any> | Set<any>;

export function defaultEncoder(line: string) {
  return line;
}

export function defaultDecoder(line: string) {
  return line;
}

export const defaultSeparator = "\n";

export const defaultMode = 0o600;

export async function readLog(
  filename: string,
  lineDecoder: Function,
  decode: Function,
  separator: string,
  object: any,
): Promise<void> {
  try {
    const encodedLog = await Deno.readTextFile(filename);
    const lines = encodedLog.split(separator);
    for (const encoded of lines) {
      if (encoded.length > 0) {
        lineDecoder(decode(encoded), object, filename);
      }
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }
    throw err;
  }
  return;
}

export function writeData(
  filename: string,
  mode: number,
  encode: Function,
  separator: string,
  data: any,
): void {
  const encoded = encode(JSON.stringify(data)) + separator;
  const opts = {
    mode,
    append: true,
  };
  Deno.writeTextFileSync(filename, encoded, opts);
}

export async function compact(
  filename: string,
  mode: number,
  encode: Function,
  separator: string,
  cmd: string,
  object: Durable,
): Promise<void> {
  const tmpFile = `${filename}~`;
  try {
    await Deno.remove(tmpFile);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  if (object instanceof Set) {
    for (const key of object.keys()) {
      writeData(tmpFile, mode, encode, separator, { cmd, key });
    }
  } else {
    for (const [key, value] of object.entries()) {
      writeData(tmpFile, mode, encode, separator, { cmd, key, value });
    }
  }
  Deno.renameSync(tmpFile, filename);
}
