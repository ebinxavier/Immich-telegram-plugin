import env from "dotenv";
import fs from "fs";
import ProgressBar from "cli-progress";

env.config();
const progressBar = new ProgressBar.SingleBar(
  {},
  ProgressBar.Presets.shades_classic
);

import { getFirst10RecordsWithSyncStatusFalse } from "./database/getRecords";
import { migration } from "./database/migration";
import { uploadMedia } from "./telegram/tgClient";
import { updateRecord } from "./database/updateRecord";

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
  await migration();
  let totalFileSize = 0;
  let filesUploaded = [];
  const uploadLimitMB =
    Number(process.env.MAX_UPLOAD_LIMIT_PER_RUN_IN_MB) || 100;
  try {
    const records = await getFirst10RecordsWithSyncStatusFalse();

    if (!records.length) {
      console.log("All files are in synced state!");
      process.exit(0);
    }

    for (let record of records) {
      const fullPath =
        process.env.BASE_DIR + record.path.split("upload/upload")[1];
      console.log("Uploading file: " + record.path);
      const fileSize = await getFileSizeInMB(fullPath);
      totalFileSize += fileSize;
      progressBar.start(100, 0);
      const res = await uploadMedia(fullPath, (value) => {
        progressBar.update(value * 100);
      });
      progressBar.stop();
      await updateRecord(record.path, res.id);
      filesUploaded.push(record.path);
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
    console.error("Error fetching records:", err);
  }
  process.exit(0);
};

main();
