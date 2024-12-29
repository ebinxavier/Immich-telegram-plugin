import sqlite3 from "sqlite3";
import fs from "fs";

export const DB_PATH = "./data/syncInfo.db";
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
    // Create the "files" table with "path" as the primary key
    const createTable = () => {
      const query = `
      CREATE TABLE IF NOT EXISTS files (
        path TEXT PRIMARY KEY,
        messageId INTEGER,
        syncStatus BOOLEAN NOT NULL
      );
    `;
      db.run(query, (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
        } else {
          console.log(
            'Table "files" created successfully with "path" as the primary key.'
          );
        }
      });
    };

    // Example usage
    db.serialize(() => {
      createTable(); // Create the table
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
