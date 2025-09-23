import sqlite3 from "sqlite3";
import { DB_PATH } from "./migration";

/**
 * Function to get the messageId for a given file path.
 * @param filePath - The path to the file.
 * @returns A promise that resolves to the messageId if found, or rejects if not found.
 */
export const getMessageIdByPath = (filePath: string): Promise<number> => {
  // Sometime path prefix will be added in the request, path should always starts with upload/upload/UUID
  filePath = filePath.replace(/^.*upload\/upload\//, "upload/upload/");
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        return reject(`Error opening database: ${err.message}`);
      }
    });

    const query = `
      SELECT messageId
      FROM files
      WHERE path LIKE '%' || ?;
    `;

    db.get(query, [filePath], (err, row: any) => {
      db.close((closeErr) => {
        if (closeErr) {
          return reject(`Error closing database: ${closeErr.message}`);
        }
      });

      if (err) {
        return reject(`Error retrieving messageId: ${err.message}`);
      }

      if (!row) {
        return reject(`No record found with the path: ${filePath}`);
      }

      resolve(row.messageId); // Resolves with the messageId
    });
  });
};
