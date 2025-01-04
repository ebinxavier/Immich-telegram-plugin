import env from "dotenv";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { getJobStatus, getNextVideoFile } from "./database/getRecords";
import {
  STATUS_IN_PROGRESS,
  VIDEO_COMPRESSION_JOB,
  STATUS_NOT_STARTED,
  STATUS_ERROR,
  STATUS_COMPLETED,
} from "./database/migration";
import { getFullPathFromImmichOriginalPath } from "./utils";
import { updateFileStatus, updateJobStatus } from "./database/updateRecord";

env.config();

export type VIDEO_COMPRESSION_LEVEL =
  | "ultra_small_no_audio"
  | "ultra_small"
  | "small"
  | "medium";

const compressionConfigs = {
  ultra_small_no_audio: {
    videoCodec: "libx265",
    videoFilters: "scale=160:-2,fps=1",
    outputOptions: ["-crf 30", "-preset veryslow"],
    audio: false, // No audio
  },
  ultra_small: {
    videoCodec: "libx265",
    videoFilters: "scale=160:-2,fps=1",
    audioCodec: "aac",
    audioBitrate: "8k",
    audioFrequency: 11025,
    outputOptions: ["-crf 30", "-preset veryslow"],
  },
  small: {
    videoCodec: "libx265",
    videoFilters: "scale=320:-2,fps=15",
    audioCodec: "aac",
    audioBitrate: "16k",
    audioFrequency: 22050,
    outputOptions: ["-crf 28", "-preset slower"],
  },
  medium: {
    videoCodec: "libx265",
    videoFilters: "scale=640:-2,fps=24",
    audioCodec: "aac",
    audioBitrate: "32k",
    audioFrequency: 44100,
    outputOptions: ["-crf 25", "-preset medium"],
  },
};

function compressVideo(
  inputFile: string,
  outputFile: string,
  compression_level: VIDEO_COMPRESSION_LEVEL = "ultra_small"
): Promise<void> {
  const config: any =
    compressionConfigs[compression_level] || compressionConfigs["ultra_small"];

  if (!compressionConfigs[compression_level]) {
    console.log("Compression level default to 'ultra_small'");
  } else {
    console.log("Compression level is " + compression_level);
  }
  return new Promise((resolve, reject) => {
    // Start building the ffmpeg command
    let command = ffmpeg(inputFile).videoCodec(config.videoCodec);

    // Add video filters
    if (config.videoFilters) {
      command = command.videoFilters(config.videoFilters);
    }

    // Add audio settings if applicable
    if (config.audio !== false) {
      command = command
        .audioCodec(config.audioCodec)
        .audioBitrate(config.audioBitrate)
        .audioFrequency(config.audioFrequency);
    } else {
      // Remove audio
      command = command.noAudio();
    }

    // Add output options
    if (config.outputOptions) {
      command = command.outputOptions(config.outputOptions);
    }

    command
      .on("start", (commandLine) => {
        console.log(`FFmpeg process started with command: ${commandLine}`);
      })
      .on("progress", (progress) => {
        console.log(`Processing: ${progress.percent?.toFixed(2)}% done`);
      })
      .on("end", () => {
        console.log("FFmpeg processing completed successfully.");
        resolve();
      })
      .on("error", (err, stdout, stderr) => {
        console.error("FFmpeg processing failed:", err);
        console.error("FFmpeg stdout:", stdout);
        console.error("FFmpeg stderr:", stderr);
        reject(err);
      })
      .save(outputFile);
  });
}

const main = async () => {
  try {
    console.log("Starting a new compress job..");
    const jobStatus = await getJobStatus(VIDEO_COMPRESSION_JOB);
    if (jobStatus.status == STATUS_NOT_STARTED) {
      const video = await getNextVideoFile();
      if (!video) {
        console.log("No video files are ready to be compressed and deleted.");
        return;
      }

      const fullPath = getFullPathFromImmichOriginalPath(video.path);

      // Video compression
      try {
        // Update files table fileProcessingStatus to STATUS_IN_PROGRESS
        await updateJobStatus(
          VIDEO_COMPRESSION_JOB,
          STATUS_IN_PROGRESS,
          video.id
        );
        await updateFileStatus(
          video.path,
          "fileProcessingStatus",
          STATUS_IN_PROGRESS
        );
        console.log("Video file: " + fullPath);
        console.log("Video compression starts..");
        await compressVideo(
          path.resolve(fullPath),
          path.resolve(fullPath) + ".compressed.mp4",
          process.env.VIDEO_COMPRESSION_LEVEL as VIDEO_COMPRESSION_LEVEL
        );
      } catch (error) {
        console.log("Error while compressing video", error);
        await updateFileStatus(
          video.path,
          "fileProcessingStatus",
          STATUS_ERROR
        );
      } finally {
        await updateJobStatus(VIDEO_COMPRESSION_JOB, STATUS_NOT_STARTED);
        await updateFileStatus(
          video.path,
          "fileProcessingStatus",
          STATUS_COMPLETED
        );
      }
      try {
        console.log("Replacing original video with compressed one");
        fs.unlinkSync(path.resolve(fullPath));
        console.log("Deleted original video");
        fs.renameSync(
          path.resolve(fullPath) + ".compressed.mp4",
          path.resolve(fullPath)
        );
        console.log("Renamed new video with original one");
      } catch (error) {
        console.log("Error while renaming original video", error);
      }
    } else {
      console.error("A compression job already running, try after sometime");
    }
  } catch (error) {
    console.log("Error", error);
  }
};

main();
