import fs from "fs";
import path from "path";

const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err: any) {
    return err.code === "EPERM";
  }
};

/**
 * Acquires a PID based lock file. Returns false if another live process holds it.
 * A lock left behind by a dead process (killed/crashed run) is reclaimed.
 * The lock is released automatically when this process exits.
 */
export const acquireLock = (lockFile: string): boolean => {
  fs.mkdirSync(path.dirname(lockFile), { recursive: true });

  const tryCreate = () => {
    try {
      fs.writeFileSync(lockFile, String(process.pid), { flag: "wx" });
      return true;
    } catch {
      return false;
    }
  };

  if (!tryCreate()) {
    const pid = Number(fs.readFileSync(lockFile, "utf8"));
    if (pid && isProcessAlive(pid)) return false;
    console.warn(`Removing stale lock file left by dead process ${pid}.`);
    fs.rmSync(lockFile, { force: true });
    if (!tryCreate()) return false;
  }

  process.on("exit", () => fs.rmSync(lockFile, { force: true }));
  return true;
};
