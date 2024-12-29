import sqlite3 from "sqlite3";
import { DB_PATH } from "./migration";
/**
 * Function to update syncStatus and messageId for a given path.
 * @param filePath - The path of the file whose syncStatus and messageId need to be updated.
 * @param messageId - The new messageId to set for the file.
 * @returns A promise indicating the success or failure of the update.
 */
export const updateRecord = (
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
        SET syncStatus = 1, messageId = ?
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
          `Error updating syncStatus and messageId: ${err.message}`
        );
      }

      if (this.changes === 0) {
        return reject(`No records found with the given path: ${filePath}`);
      }

      resolve(); // Resolves if the update was successful
    });
  });
};
