import fetch from "isomorphic-fetch";
const fs = require("fs/promises");
const path = require("path");
// Define the structure of the response data
interface Asset {
  id: string;
  originalPath: string;
  originalFileName: string;
  fileCreatedAt: string;
}

interface SharedLinksResponse {
  assets: Asset[];
}

export const getFullPathFromImmichOriginalPath = (path: string) => {
  return process.env.BASE_DIR + path.split("upload/upload")[1];
};

export const getSharedLinkInfo = (link: string) => {};

const extractBaseUrlAndToken = (url) => {
  // Regular expression to validate the link format (with optional port)
  const regex = /^(https?):\/\/([^\/]+)(?::(\d+))?\/share\/([^\/]+)$/;

  // Test the URL against the regular expression
  const match = url.match(regex);

  if (match) {
    // Extract the base URL and the token
    const baseUrl = match[3]
      ? `${match[1]}://${match[2]}:${match[3]}` // Include port if present
      : `${match[1]}://${match[2]}`; // Omit port if not present
    const token = match[4]; // Token after /share/

    return { baseUrl, token };
  } else {
    // Invalid URL format
    throw new Error("Invalid URL format. Expected format: /share/*");
  }
};

// Function to fetch shared link data
async function getSharedLinkData(
  baseUrl: string,
  apiKey: string
): Promise<Asset[]> {
  // Construct the URL using the base URL and API key
  const url = `${baseUrl}/api/shared-links/me?key=${apiKey}`;

  try {
    // Fetch data from the API
    const response = await fetch(url);

    // Check if the response is successful (status code 200)
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    // Parse the JSON response
    const data: SharedLinksResponse = await response.json();

    // Return the JSON data
    const assets = data.assets.map((asset) => {
      return {
        id: asset.id,
        originalPath: asset.originalPath,
        originalFileName: asset.originalFileName,
        fileCreatedAt: asset.fileCreatedAt,
      } as Asset;
    });
    return assets;
  } catch (error) {
    console.error("Error:", error);
  }
}

export const handleDownloadLink = async (link: string): Promise<Asset[]> => {
  const { baseUrl, token } = extractBaseUrlAndToken(link);
  const assets = await getSharedLinkData(baseUrl, token);
  return assets;
};

export async function moveFile(source, target) {
  try {
    // Resolve absolute paths for source and target
    const resolvedSource = path.resolve(source);
    const resolvedTargetDir = path.resolve(target);

    // Extract the filename from the source path
    const fileName = path.basename(resolvedSource);

    // Construct the full target file path
    const targetFilePath = path.join(resolvedTargetDir, fileName);

    // Ensure the target directory exists
    await fs.mkdir(resolvedTargetDir, { recursive: true });

    // Move the file
    await fs.rename(resolvedSource, targetFilePath);

    console.log(`File moved successfully to: ${targetFilePath}`);
  } catch (err) {
    console.error("Error while moving file:", err);
  }
}
