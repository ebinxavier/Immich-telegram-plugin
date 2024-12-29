import sqlite3 from "sqlite3";
import { DB_PATH } from "./migration";

/**
 * Function to get the first 10 records with syncStatus false from the database.
 * @returns A promise that resolves to an array of records.
 */
interface FileRecord {
  path: string;
  messageId: null | number;
  syncStatus: 0 | 1;
}
export const getFirst10RecordsWithSyncStatusFalse = (): Promise<
  FileRecord[]
> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        return reject(`Error opening database: ${err.message}`);
      }
    });

    const query = `
      SELECT * FROM files
      WHERE syncStatus = 0
      LIMIT 10;
    `;

    db.all(query, (err, rows) => {
      db.close();
      if (err) {
        return reject(`Error fetching records: ${err.message}`);
      }
      resolve(rows as FileRecord[]); // Resolves with the fetched rows
    });
  });
};
