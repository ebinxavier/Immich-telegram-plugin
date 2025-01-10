import { TelegramClient } from "telegram";
import fs from "fs";
import { StringSession } from "telegram/sessions";
import readline from "readline";
import { LogLevel } from "telegram/extensions/Logger";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const getClient = async () => {
  let client: TelegramClient;
  if (client) return client;
  client = new TelegramClient(
    new StringSession(process.env.TG_SESSION),
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
      const client = await getClient();
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
