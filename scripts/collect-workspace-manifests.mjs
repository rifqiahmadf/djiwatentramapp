#!/usr/bin/env node
// Copy only lock/workspace manifests into one Docker cache layer.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
const [source, destination] = process.argv.slice(2).map((path) => resolve(path));
if (!source || !destination || source === destination) throw new Error("Provide separate source and destination directories");
const files = ["package.json", "bun.lock"];
for (const folder of ["apps", "packages"]) {
  for (const entry of readdirSync(resolve(source, folder), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = `${folder}/${entry.name}/package.json`;
    if (existsSync(resolve(source, file))) files.push(file);
  }
}
for (const file of files) {
  const target = resolve(destination, file);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(resolve(source, file), target);
}
console.log(`Collected ${files.length} manifests/lockfiles`);
