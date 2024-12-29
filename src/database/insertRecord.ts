import sqlite3 from "sqlite3";
import { DB_PATH } from "./migration";

/**
 * Function to insert a row into the "files" table.
 * @param path - The unique path of the file.
 * @param messageId - The message ID associated with the file.
 * @param syncStatus - The synchronization status of the file.
 */
export function insertFileInfo(
  path: string,
  messageId: number,
  syncStatus: boolean
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
      INSERT INTO files (path, messageId, syncStatus)
      VALUES (?, ?, ?);
    `;

    // Execute the query
    db.run(query, [path, messageId, syncStatus], function (err) {
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
    });
  });
}
