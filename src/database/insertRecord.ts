import sqlite3 from "sqlite3";
import { DB_PATH } from "./migration";

/**
 * Function to insert a row into the "files" table.
 * @param path - The unique path of the file.
 * @param messageId - The message ID associated with the file.
 * @param fileUploadStatus - The synchronization status of the file.
 */
export function insertFileInfo(
  path: string,
  mediaType: string,
  messageId: number,
  fileUploadStatus: string,
  fileProcessingStatus: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Open a database connection
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        return reject(`Error opening database: ${err.message}`);
      }
    });

    // Insert query
    const query = `
      INSERT INTO files (path, mediaType, messageId, fileUploadStatus, fileProcessingStatus, foundAt)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
    `;

    // Execute the query
    db.run(
      query,
      [path, mediaType, messageId, fileUploadStatus, fileProcessingStatus],
      function (err) {
        if (err) {
          db.close(); // Ensure the database connection is closed on error
          return reject(`Error inserting row: ${err.message}`);
        }

        db.close((closeErr) => {
          if (closeErr) {
            return reject(`Error closing database: ${closeErr.message}`);
          }
          resolve();
        });
      }
    );
  });
}
