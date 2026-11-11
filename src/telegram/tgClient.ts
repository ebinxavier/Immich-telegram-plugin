import { TelegramClient } from "telegram";
import fs from "fs";
import { StringSession } from "telegram/sessions";
import readline from "readline";
import { LogLevel } from "telegram/extensions/Logger";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let client: TelegramClient;
export const getClient = async (session = process.env.TG_SESSION) => {
  if (client) return client;
  client = new TelegramClient(
    new StringSession(session),
    Number(process.env.TG_APP_ID),
    process.env.TG_API_HASH,
    {
      connectionRetries: 5,
    }
  );

  client.logger.setLevel(LogLevel.ERROR);
  await client.start({
    phoneNumber: async () =>
      new Promise((resolve) =>
        rl.question("Please enter your number: ", resolve)
      ),
    password: async () =>
      new Promise((resolve) =>
        rl.question("Please enter your password: ", resolve)
      ),
    phoneCode: async () =>
      new Promise((resolve) =>
        rl.question("Please enter the code you received: ", resolve)
      ),
    onError: (err) => console.log(err),
  });

  //   Uncomment the following to get Telegram Session Token
  // const sessionString = client.session.save();
  // console.log("Your session string is:", sessionString); // Save the session string
  // fs.writeFileSync("telegramToken.txt", sessionString as any, "utf8");

  return client;
};

export const uploadMedia = (
  imgSrc: string,
  progressCallback?: any
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Telegram rejects one session used by two processes at once (AUTH_KEY_DUPLICATED),
      // so the upload job (cron) uses a separate session from the bot (pm2).
      const client = await getClient(
        process.env.TG_UPLOAD_SESSION || process.env.TG_SESSION
      );
      const result = await client.sendFile(process.env.TG_CHANNEL_ID, {
        file: imgSrc,
        forceDocument: true,
        progressCallback: progressCallback || console.log,
      });
      console.log("Completed!");
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

export const downloadMedia = async (
  messageId: number,
  progressCallback?: any
) => {
  const client = await getClient();
  const messages = await client.getMessages(process.env.TG_CHANNEL_ID, {
    ids: messageId,
  });
  const message = messages[0];
  const fileName = message.message;
  const buffer = await client.downloadMedia(message, {
    progressCallback: progressCallback || console.log,
  });
  return { buffer, fileName };
};

export const deleteMedia = async (messageId: number) => {
  const client = await getClient();
  const res = await client.deleteMessages(
    process.env.TG_CHANNEL_ID,
    [messageId],
    {
      revoke: true,
    }
  );
  console.log(res);
};
