import { defaultSeparator } from "./durableBase.ts";
import { DurableMap } from "./durableMap.ts";
import { assertEquals } from "https://deno.land/std@0.103.0/testing/asserts.ts";

const testFilename = "./dbdir/testMap.db";

Deno.test("Map function works", async () => {
  const dm = new DurableMap(testFilename);
  assertEquals(dm.size, 0);
  dm.set("a", "a");
  assertEquals(dm.get("a"), "a");
  await dm.destroy();
});

Deno.test("Durability works", async () => {
  const dm = new DurableMap(testFilename);
  assertEquals(dm.size, 0);
  dm.set("a", "a");
  const dm2 = new DurableMap(testFilename);
  await dm2.load();
  assertEquals(dm2.get("a"), "a");
  await dm.destroy();
});

Deno.test("Compact works", async () => {
  const dm = new DurableMap(testFilename);
  dm.set("b", "a");
  dm.set("b", "b");
  await dm.compact();
  const dm2 = new DurableMap(testFilename);
  await dm2.load();
  assertEquals(dm2.get("b"), "b");
  await dm.destroy();
});

Deno.test("Delete works", async () => {
  const dm = new DurableMap(testFilename);
  dm.set("a", "a");
  dm.set("b", "b");
  dm.set("c", "c");
  dm.set("d", "d");
  dm.delete("d");
  const dm2 = new DurableMap(testFilename);
  await dm2.load();
  assertEquals(dm2.has("d"), false);
  await dm.destroy();
});

Deno.test("clear works", async () => {
  const dm = new DurableMap(testFilename);
  dm.set("a", {
    "l0": {
      "l01": 1,
      "l02": 2,
    },
  });
  dm.set("b", "b");
  dm.clear();
  dm.set("c", "c");
  dm.delete("c");
  dm.set("d", "d");
  const sepTest = `hello${defaultSeparator}world!`;
  dm.set("e", sepTest);
  const dm2 = new DurableMap(testFilename);
  await dm2.load();
  assertEquals(dm2.has("a"), false);
  assertEquals(dm2.has("c"), false);
  assertEquals(dm2.has("d"), true);
  assertEquals(dm2.get("e"), sepTest);
  await dm.destroy();
});

Deno.test("Example in Readme works", async () => {
  const dm = new DurableMap("./dbdir/dataMap.db", {
    // all options have defaults
    mode: 0o660, // 0o600 (rw- --- ---), file mode to be used
    separator: "\r\n", // "\n", separator between records
    decode: (line: string) => atob(line), // (line)=>line ,line decoder
    encode: (line: string) => btoa(line), // (line)=>line ,line encoder
  });
  await dm.load(); // load previously stored data
  dm.set("a", "value of a");
  await dm.compact(); // compact record log on disk
  await dm.destroy(); // destroy data stored on disk, not in memory !
});
