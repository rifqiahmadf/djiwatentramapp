import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

/** Use the same TensorFlow version's modular entry so Rollup can split its modules. */
export function modularTensorflowCore(appDirectory: string) {
  const require = createRequire(resolve(appDirectory, "package.json"));
  const faceApiDirectory = dirname(require.resolve("face-api.js/package.json"));
  return require.resolve("@tensorflow/tfjs-core", { paths: [faceApiDirectory] });
}
