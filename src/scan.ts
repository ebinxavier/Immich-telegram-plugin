import env from "dotenv";
env.config();
import { insertFileInfo } from "./database/insertRecord";
import fs from "fs";
import path from "path";
const mime = require("mime-types");
const ffmpeg = require("fluent-ffmpeg");
import { STATUS_NOT_STARTED, migration } from "./database/migration";

/**
 * Function to check if the file is an image or a video
 * @param {string} filePath - The file path to check
 * @returns {Promise<MediaType>} - 'video' if it's a video, 'image' if it's an image
 */

export type MediaType = "image" | "video";

function getMediaType(filePath): Promise<MediaType> {
  return new Promise((resolve, reject) => {
    const fileType = mime.lookup(filePath); // Get MIME type from file extension

    // Check if the MIME type indicates an image or video
    if (fileType) {
      if (fileType.startsWith("image/")) {
        resolve("image");
      } else if (fileType.startsWith("video/")) {
        resolve("video");
      } else {
        // If MIME type is unrecognized, use ffmpeg to verify video
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            reject("Could not determine media type");
          } else {
            if (
              metadata.format &&
              metadata.format.format_name.startsWith("video")
            ) {
              resolve("video");
            } else {
              resolve("image");
            }
          }
        });
      }
    } else {
      resolve("image");
    }
  });
}

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
    if (file.startsWith(".") || file.endsWith(".compressed.mp4")) {
      continue;
    }
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      await insertAllFilesFromDirectory(fullPath);
    } else if (stat.isFile()) {
      try {
        // Insert file path into the database
        const mediaType = await getMediaType(relativePath);
        await insertFileInfo(
          `upload/upload${relativePath}`,
          mediaType || "image",
          null,
          STATUS_NOT_STARTED,
          STATUS_NOT_STARTED
        );
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
