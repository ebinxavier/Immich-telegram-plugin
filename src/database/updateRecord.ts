import sqlite3 from "sqlite3";
import {
  DB_PATH,
  FILE_STATUS_TYPE,
  FILE_UPLOAD_JOB,
  JOB_NAME,
  JOB_STATUS,
  STATUS_COMPLETED,
} from "./migration";
/**
 * Function to update fileUploadStatus and messageId for a given path.
 * @param filePath - The path of the file whose fileUploadStatus and messageId need to be updated.
 * @param messageId - The new messageId to set for the file.
 * @returns A promise indicating the success or failure of the update.
 */
export const updateFileStatus = (
  filePath: string,
  statusType: FILE_STATUS_TYPE,
  status: JOB_STATUS
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!["fileProcessingStatus", "fileUploadStatus"].includes(statusType)) {
      console.error("Invalid status type: ", statusType);
      reject();
    }

    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        return reject(`Error opening database: ${err.message}`);
      }
    });

    const query = `
        UPDATE files
        SET ${statusType} = '${status}'
        WHERE path = ?;
      `;

    db.run(query, [filePath], function (err) {
      db.close((closeErr) => {
        if (closeErr) {
          return reject(`Error closing database: ${closeErr.message}`);
        }
      });

      if (err) {
        return reject(`Error updating updateStatus: ${err.message}`);
      }

      if (this.changes === 0) {
        return reject(`No records found with the given path: ${filePath}`);
      }

      resolve(); // Resolves if the update was successful
    });
  });
};

export const insertTelegramMessageId = (
  filePath: string,
  messageId: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        return reject(`Error opening database: ${err.message}`);
      }
    });

    const query = `
          UPDATE files
          SET fileUploadStatus = '${STATUS_COMPLETED}', messageId = ?
          WHERE path = ?;
        `;

    db.run(query, [messageId, filePath], function (err) {
      db.close((closeErr) => {
        if (closeErr) {
          return reject(`Error closing database: ${closeErr.message}`);
        }
      });

      if (err) {
        return reject(
          `Error updating fileUploadStatus and messageId: ${err.message}`
        );
      }

      if (this.changes === 0) {
        return reject(`No records found with the given path: ${filePath}`);
      }

      resolve(); // Resolves if the update was successful
    });
  });
};

export const updateJobStatus = (
  jobName: JOB_NAME,
  status: JOB_STATUS,
  fileID?: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        return reject(`Error opening database: ${err.message}`);
      }
    });

    const query = `
          UPDATE jobStatus
          SET status = '${status}', fileID = ?
          WHERE jobName = '${jobName}';
        `;

    db.run(query, [fileID || null], function (err) {
      db.close((closeErr) => {
        if (closeErr) {
          return reject(`Error closing database: ${closeErr.message}`);
        }
      });

      if (err) {
        return reject(`Error updating fileID: ${err.message}`);
      }

      if (this.changes === 0) {
        return reject(`No records found!`);
      }
      console.log(`Job status updated for: ${jobName} with ${status}`);
      resolve(); // Resolves if the update was successful
    });
  });
};
