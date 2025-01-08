import env from "dotenv";
import fs from "fs";
import ProgressBar from "cli-progress";

env.config();
const progressBar = new ProgressBar.SingleBar(
  {
    format: "Uploading |{bar}| {percentage}% | {value}/{total}",
  },
  ProgressBar.Presets.shades_classic
);

import {
  getJobStatus,
  getNextRecordsWithFileUploadStatusFalse,
} from "./database/getRecords";
import {
  FILE_UPLOAD_JOB,
  migration,
  STATUS_COMPLETED,
  STATUS_ERROR,
  STATUS_IN_PROGRESS,
  STATUS_NOT_STARTED,
} from "./database/migration";
import { uploadMedia } from "./telegram/tgClient";
import {
  insertTelegramMessageId,
  updateFileStatus,
  updateJobStatus,
} from "./database/updateRecord";
import { getFullPathFromImmichOriginalPath, moveFile } from "./utils";

const getFileSizeInMB = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        return reject(`Error reading file stats: ${err.message}`);
      }

      // Convert the size from bytes to MB
      const sizeInMB = stats.size / (1024 * 1024); // 1 MB = 1024 * 1024 bytes
      resolve(sizeInMB);
    });
  });
};

const main = async () => {
  try {
    // Check whether upload job in progress
    const jobStatus = await getJobStatus(FILE_UPLOAD_JOB);
    if (jobStatus.status === STATUS_NOT_STARTED) {
      await migration();
      let totalFileSize = 0;
      let filesUploaded = [];
      const uploadLimitMB =
        Number(process.env.MAX_UPLOAD_LIMIT_PER_RUN_IN_MB) || 100;

      const limit = Number(process.env.MAX_UPLOAD_FILE_COUNT_PER_RUN || 20);
      console.log("Uploading files to Telegram");
      console.log(
        `Upload settings: UPLOAD_LIMIT= ${uploadLimitMB} MB, UPLOAD_FILE_COUNT_LIMIT= ${limit}`
      );
      try {
        const records = await getNextRecordsWithFileUploadStatusFalse(limit);

        if (!records.length) {
          console.log("No files are available to be uploaded, file age should be greater than 1 day.");
          process.exit(0);
        }

        for (let record of records) {
          const fullPath = getFullPathFromImmichOriginalPath(record.path);
          const fileSize = await getFileSizeInMB(fullPath);
          console.log("Uploading filename: " + record.path);
          console.log("Uploading file size: " + fileSize.toFixed(2) + " MB");
          totalFileSize += fileSize;
          progressBar.start(100, 0);
          try {
            await updateFileStatus(
              record.path,
              "fileUploadStatus",
              STATUS_IN_PROGRESS
            );
            await updateJobStatus(
              FILE_UPLOAD_JOB,
              STATUS_IN_PROGRESS,
              record.id
            );
            const res = await uploadMedia(fullPath, (value) => {
              progressBar.update(value * 100);
            });
            await insertTelegramMessageId(record.path, res.id);
            await updateFileStatus(
              record.path,
              "fileUploadStatus",
              STATUS_COMPLETED
            );

            // If file is IMAGE, delete original file because the image will be served from thumbnails of Immich
            if (record.mediaType === "image") {
              console.log("Moving image file to /tmp: " + record.path);
              await moveFile(
                fullPath,
                "/tmp/immich-deleted-files/" + record.path
              );
            }
          } catch (error) {
            console.log("Error:", error);
            await updateFileStatus(
              record.path,
              "fileUploadStatus",
              STATUS_ERROR
            );
          } finally {
            await updateJobStatus(FILE_UPLOAD_JOB, STATUS_NOT_STARTED);
          }
          progressBar.stop();
          filesUploaded.push(record.path);
          console.log("Uploaded successfully.\n");
          if (totalFileSize >= uploadLimitMB) {
            console.log("Upload limit exceeded!");
            break; // Limit exceeded per run, next files will be uploaded in next run.
          }
        }

        console.log(
          `Run completed Uploaded ${totalFileSize.toFixed(
            2
          )} MB data, Uploaded files:`,
          filesUploaded
        );
      } catch (err) {
        console.error("Error uploading file to Telegram:", err);
      }
    } else {
      console.error("Another upload job in progress, try again later.");
    }
  } catch (error) {
    console.log("Error:", error);
  } finally {
    process.exit(0);
  }
};

main();
