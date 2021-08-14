#!/bin/sh
DB_DIR="dbdir"
mkdir -p  $DB_DIR
deno test --doc --import-map doc.importmap.json --allow-read=$DB_DIR --allow-write=$DB_DIR
