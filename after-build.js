import fs from "fs";

// Copy package.json to build directory
fs.copyFileSync("package.json", "build/package.json");
fs.copyFileSync("package-lock.json", "build/package-lock.json");