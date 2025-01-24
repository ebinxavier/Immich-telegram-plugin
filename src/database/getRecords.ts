import sqlite3 from "sqlite3";
import {
  DB_PATH,
  STATUS_NOT_STARTED,
  JOB_STATUS,
  STATUS_COMPLETED,
} from "./migration";
import { MediaType } from "../scan";

/**
 * Function to get the first 10 records with fileUploadStatus false from the database.
 * @returns A promise that resolves to an array of records.
 */

interface FileRecord {
  id: number;
  path: string;
  mediaType: MediaType;
  messageId: null | number;
  fileUploadStatus: 0 | 1;
  fileProcessingStatus: string;
}
interface JobStatusRecord {
  id: number;
  jobName: string;
  status: JOB_STATUS;
}

export const getNextRecordsWithFileUploadStatusFalse = (
  limit: number
): Promise<FileRecord[]> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        return reject(`Error opening database: ${err.message}`);
      }
    });

    const query = `
      SELECT * FROM files
      WHERE fileUploadStatus = '${STATUS_NOT_STARTED}' AND foundAt < DATETIME(CURRENT_TIMESTAMP, '-1 day')
      ORDER BY foundAt ASC
      LIMIT ${limit};
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

export const getNextVideoFile = (): Promise<FileRecord> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        return reject(`Error opening database: ${err.message}`);
      }
    });

    const query = `
        SELECT * FROM files
        WHERE mediaType = 'video' AND fileProcessingStatus = '${STATUS_NOT_STARTED}' AND fileUploadStatus = '${STATUS_COMPLETED}'
        LIMIT 1;
      `;

    db.all(query, (err, rows) => {
      db.close();
      if (err) {
        return reject(`Error fetching records: ${err.message}`);
      }
      if (rows.length)
        resolve(rows[0] as FileRecord); // Resolves with the fetched rows
      else resolve(null);
    });
  });
};

export const getJobStatus = (jobName: string): Promise<JobStatusRecord> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        return reject(`Error opening database: ${err.message}`);
      }
    });

    const query = `SELECT * FROM jobStatus`;

    db.all(query, (err, rows: JobStatusRecord[]) => {
      db.close();
      if (err) {
        return reject(`Error fetching records: ${err.message}`);
      }
      const row = rows.find((row) => row.jobName === jobName);
      if (row) resolve(row);
      else reject("Error while getting job status");
    });
  });
};
