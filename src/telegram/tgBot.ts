const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TG_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true, logLevel: "silent" });
import fetch from "isomorphic-fetch";
import { getClient } from "./tgClient";
import { getMessageIdByPath } from "../database/getMessageIdByPath";

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

const handleDownloadLink = async (message: string): Promise<Asset[]> => {
  const { baseUrl, token } = extractBaseUrlAndToken(message);
  const assets = await getSharedLinkData(baseUrl, token);
  return assets;
};

const updateLoadingMessage = (chatId, loadingMessage, newMessage: string) => {
  bot.editMessageText(newMessage, {
    chat_id: chatId,
    message_id: loadingMessage.message_id,
  });
};

export const initializeBot = async () => {
  bot.on("message", async (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;

    try {
      const assets = await handleDownloadLink(msg.text);
      const loadingMessage = await bot.sendMessage(chatId, "Loading...");
      updateLoadingMessage(
        chatId,
        loadingMessage,
        "Total Assets found: " + assets.length
      );
      let messageIds = [];
      for (let asset of assets) {
        const messageId = await getMessageIdByPath(asset.originalPath);
        if (messageId) {
          messageIds.push(messageId);
        }
      }

      updateLoadingMessage(
        chatId,
        loadingMessage,
        "Original files found: " + messageIds.length + "/" + assets.length
      );

      for (let messageId of messageIds) {
        const client = await getClient();
        const messages = await client.getMessages(process.env.TG_CHANNEL_ID, {
          ids: messageId,
        });
        await client.sendMessage(process.env.TG_CHANNEL_ID, {
          message: messages[0],
        });
      }

      //   if (assets) bot.sendMessage(chatId, JSON.stringify({ assets }));
    } catch (e) {
      console.log("Invalid URL");
      bot.sendMessage(
        chatId,
        "Invalid URL, share a proper URL from Immich application!"
      );
    }
  });
};
