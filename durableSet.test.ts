import { defaultSeparator } from "./durableBase.ts";
import { DurableSet } from "./durableSet.ts";
import { assertEquals } from "./dev_deps.ts";

const testFilename = "./dbdir/testSet.db";

Deno.test("Set function works", async () => {
  const ds = new DurableSet(testFilename);
  assertEquals(ds.size, 0);
  ds.add("a");
  assertEquals(ds.has("a"), true);
  await ds.destroy();
});

Deno.test("Durability works", async () => {
  const ds = new DurableSet(testFilename);
  assertEquals(ds.size, 0);
  ds.add("a");
  const ds2 = new DurableSet(testFilename);
  await ds2.load();
  assertEquals(ds2.has("a"), true);
  await ds.destroy();
});

Deno.test("Compact works", async () => {
  const ds = new DurableSet(testFilename);
  assertEquals(ds.size, 0);
  ds.add("a");
  ds.add("b");
  ds.clear();
  ds.add("c");
  ds.delete("c");
  ds.add("d");
  const sepTest = `hello${defaultSeparator}world!`;
  ds.add(sepTest);
  await ds.compact();
  const ds2 = new DurableSet(testFilename);
  await ds2.load();
  assertEquals(ds2.has("a"), false);
  assertEquals(ds2.has("b"), false);
  assertEquals(ds2.has("c"), false);
  assertEquals(ds2.has("d"), true);
  assertEquals(ds2.has(sepTest), true);
  await ds.destroy();
});

Deno.test("Compact and destroy with empty set works", async () => {
  const ds = new DurableSet(testFilename);
  await ds.compact();
  const ds2 = new DurableSet(testFilename);
  await ds2.load();
  assertEquals(ds2.size, 0);
  await ds.destroy();
});

Deno.test("Example in Readme works", async () => {
  const ds = new DurableSet("./dbdir/dataSet.db", {
    // all options have defaults
    mode: 0o660, // 0o600 (rw- --- ---), file mode to be used
    separator: "\r\n", // "\n", separator between records
    decode: (line: string) => atob(line), // (line)=>line ,line decoder
    encode: (line: string) => btoa(line), // (line)=>line ,line encoder
  });
  await ds.load(); // load previously stored data
  ds.add("value of a");
  await ds.compact(); // compact record log on disk
  await ds.destroy(); // destroy data stored on disk, not in memory !
});
