import env from "dotenv";
env.config();
import { insertFileInfo } from "./database/insertRecord";
import fs from "fs";
import path from "path";
import { migration } from "./database/migration";

/**
 * Recursively reads a directory and inserts file paths into the database.
 * @param dirPath - The directory to scan for files.
 */

let newFiles = 0;
const insertAllFilesFromDirectory = async (dirPath: string): Promise<void> => {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const relativePath = fullPath.split(process.env.BASE_DIR)[1];
    // Skip hidden files (those starting with a dot)
    if (file.startsWith(".")) {
      continue;
    }
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      await insertAllFilesFromDirectory(fullPath);
    } else if (stat.isFile()) {
      try {
        // Insert file path into the database
        const syncStatus = false; // Default sync status
        await insertFileInfo(`upload/upload${relativePath}`, null, syncStatus);
        newFiles++;
      } catch (err) {
        const errorString = `${err}`;
        if (!errorString.includes("SQLITE_CONSTRAINT: UNIQUE")) {
          console.error(`Error inserting file: ${relativePath}, Error: ${err}`);
        }
      }
    }
  }
};

const main = async () => {
  if (process.env.BASE_DIR) {
    await migration();
    newFiles = 0;
    await insertAllFilesFromDirectory(process.env.BASE_DIR);
    console.log("New files: " + newFiles);
    console.log("New file check completed!");
  } else {
    console.log("Add $BASE_DIR variable inside .env file");
  }
};

main();
