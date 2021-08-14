# durable_data

The durable_data module is made to provide durability to data structures across
restarts of code.

## Usage

The following modules are exposed in `mod.ts`. This module persists data to the
filesystem so Deno should be run with
`deno run <script> --allow-read=<database directory> --allow-write <database directory>`

### DurableMap

A DurableMap is a TypeScript Map with durability added. All normal Map operations work in memory. The  `set`, `delete` and `clear` operations are written to a log. 

```ts
import {
  DurableMap
} from "https://deno.land/x/durable_data/mod.ts";

const dm = new DurableMap('dataMap.db',{
    // all options have defaults
    mode: 0o660, // 0o600 (rw- --- ---), file mode to be used
    separator: "\r\n", // "\n", separator between records
    decode: (line:string) => atob(line), // (line)=>line ,line decoder
    encode: (line:string) => btoa(line), // (line)=>line ,line encoder
});
await dm.load(); // load previously stored data
dm.set("a","value of a");
await dm.compact(); // compact record log on disk
await dm.destroy(); // destroy data stored on disk, not in memory !
```

### DurableSet

A DurableSet is a TypeScript Set with durability added. All normal Set operations work in memory. The  `add`, `delete` and `clear` operations are written to a log. 

```ts
import {
  DurableSet
} from "https://deno.land/x/durable_data/mod.ts";

const ds = new DurableSet('dataSet.db', {
    // all options have defaults
    mode: 0o660, // 0o600 (rw- --- ---), file mode to be used
    separator: "\r\n", // "\n", separator between records
    decode: (line:string) => atob(line), // (line)=>line ,line decoder
    encode: (line:string) => btoa(line), // (line)=>line ,line encoder
});
await ds.load(); // load previously stored data
ds.add("value of a");
await ds.compact(); // compact record log on disk
await ds.destroy(); // destroy data stored on disk, not in memory !
```

## API

DurableMap and DurableSet have the same api apart from the native differences between Map and Set.
use `deno doc` to view the API.

### encode/decode

The encode/decode combo can be used for all kinds of transformations including encrypt/decrypt. 
Make sure that decode is the inverse of encode.

## Log format

The default log format is [Newline Delimited JSON](http://ndjson.org/)

For DurableMap, e.g.:
```json
{"cmd":"set","key":"a","value":{"l0":{"l01":1,"l02":2}}}
{"cmd":"set","key":"b","value":"b"}
{"cmd":"clear"}
{"cmd":"set","key":"c","value":"c"}
{"cmd":"delete","key":"c"}
{"cmd":"set","key":"d","value":"d"}
``` 

For DurableSet, e.g:
```json
{"cmd":"add","key":"a"}
{"cmd":"add","key":"b"}
{"cmd":"clear"}
{"cmd":"add","key":"c"}
{"cmd":"delete","key":"c"}
{"cmd":"add","key":"d"}
```

Compaction using `compact()` will reduce the volume by processing all updates and writing new `set` or `add` records.

### Notes

- `JSON.stringify` and `JSON.parse` are used in writing and reading data, so you can only persist data that can be handled by `JSON.stringify`! If you wish to alter this behaviour you can either prepare your data before `set` or `add` or overload `JSON.stringify` and `JSON.parse`.

- Each database should be connected to a single process. Multiple concurrent readers/writers is *not* supported !

