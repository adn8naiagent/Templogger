#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Common unused variables to prefix with underscore
const COMMON_UNUSED_VARS = [
  "open",
  "data",
  "id",
  "userId",
  "code",
  "statusCode",
  "templateId",
  "fridgeId",
  "completionId",
  "sectionsData",
  "templateData",
  "completionData",
  "responsesData",
  "recordData",
  "updates",
  "filters",
];

function fixUnusedVarsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Fix function parameters
    COMMON_UNUSED_VARS.forEach((varName) => {
      // Match function parameter patterns
      const patterns = [
        new RegExp(`\\b${varName}\\b(?=\\s*[,)])`, "g"), // parameter in function
        new RegExp(`\\b${varName}\\b(?=\\s*:)`, "g"), // parameter with type
      ];

      patterns.forEach((pattern) => {
        if (pattern.test(content)) {
          content = content.replace(pattern, `_${varName}`);
          modified = true;
        }
      });
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed unused vars in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith(".") && file !== "node_modules") {
      walkDirectory(filePath);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fixUnusedVarsInFile(filePath);
    }
  });
}

// Run the fix
console.log("Fixing unused variables...");
walkDirectory("./client/src");
walkDirectory("./server");
walkDirectory("./shared");
console.log("Done!");
