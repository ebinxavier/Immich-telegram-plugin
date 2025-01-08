import sqlite3 from "sqlite3";
import fs from "fs";

export const DB_PATH = "./data/syncInfo.db";
export const FILE_UPLOAD_JOB = "fileUploadJob";
export const VIDEO_COMPRESSION_JOB = "fileCompressionJob";
export const SCANNING_FILES_JOB = "scanningFilesJob";

// Status string constants
export const STATUS_IN_PROGRESS = "INPROGRESS";
export const STATUS_COMPLETED = "COMPLETED";
export const STATUS_ERROR = "ERROR";
export const STATUS_NOT_STARTED = "NOT_STARTED";

export type JOB_STATUS = "INPROGRESS" | "COMPLETED" | "ERROR" | "NOT_STARTED";
export type JOB_NAME =
  | "fileUploadJob"
  | "fileCompressionJob"
  | "scanningFilesJob";
export type FILE_STATUS_TYPE = "fileUploadStatus" | "fileProcessingStatus";

const DB_HOME = "./data";

const createDatabase = () => {
  return new Promise((resolve, reject) => {
    // Open a database connection
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
      } else {
        console.log("Connected to SQLite database.");
      }
    });

    const createFilesTable = () => {
      const query = `
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path STRING UNIQUE NOT NULL,
        mediaType STRING,
        messageId INTEGER,
        fileUploadStatus STRING NOT NULL,
        fileProcessingStatus STRING NOT NULL,
        foundAt TIMESTAMP
      );
    `;
      db.run(query, (err) => {
        if (err) {
          console.error("Error creating table files: ", err.message);
        } else {
          console.log(
            'Table "files" created successfully with "path" as the primary key.'
          );
        }
      });
    };

    const createJobStatusTable = () => {
      const query = `
        CREATE TABLE IF NOT EXISTS jobStatus (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         jobName STRING,
         status STRING,
         fileID INTEGER
        );
      `;
      db.run(query, (err) => {
        if (err) {
          console.error("Error creating table jobStatus: ", err.message);
        } else {
          console.log(
            'Table "jobStatus" created successfully with "id" as the primary key.'
          );
        }
      });

      // SQL to insert rows into jobStatus table
      const insertRowQuery = `
    INSERT INTO jobStatus (jobName, status) VALUES (?, ?);
    `;

      // Insert rows
      const jobs = [
        [FILE_UPLOAD_JOB, STATUS_NOT_STARTED],
        [VIDEO_COMPRESSION_JOB, STATUS_NOT_STARTED],
        [SCANNING_FILES_JOB, STATUS_NOT_STARTED],
      ];

      jobs.forEach((job) => {
        db.run(insertRowQuery, job, function (err) {
          if (err) {
            console.error("Error inserting row:", err.message);
          }
        });
      });
    };

    // Example usage
    db.serialize(() => {
      createFilesTable(); // Create the table
      createJobStatusTable();
    });

    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
        reject("Error closing database");
      } else {
        console.log("Database connection closed.");
        resolve("");
      }
    });
  });
};

export const migration = async () => {
  if (!fs.existsSync(DB_HOME)) {
    fs.mkdirSync(DB_HOME, { recursive: true });
    console.log(`Directory created: ${DB_HOME}`);
  }

  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database file not found: ${DB_PATH}, creating fresh one...`);
    await createDatabase();
  }
};
