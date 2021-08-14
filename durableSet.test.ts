import { defaultSeparator } from "./durableBase.ts";
import { DurableSet } from "./durableSet.ts";
import { assertEquals } from "https://deno.land/std@0.103.0/testing/asserts.ts";

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
