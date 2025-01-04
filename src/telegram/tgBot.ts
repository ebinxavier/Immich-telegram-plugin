const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TG_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true, logLevel: "silent" });
import { getClient } from "./tgClient";
import { getMessageIdByPath } from "../database/getMessageIdByPath";
import { handleDownloadLink } from "../utils";

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
