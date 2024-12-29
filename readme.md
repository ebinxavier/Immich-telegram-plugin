## Telegram Storage Plugin For Immich

This plugin is designed to work with the Immich photos application. It allows you to store original media files in a Telegram group that you create, helping you free up significant storage space on your server.

Immich typically uses cached, smaller-sized images to load content in the app. By integrating this plugin, you can delete the original images from your server, leaving only the smaller cached versions. When you need access to the original, high-quality images, you can generate a shared link directly from the Immich app and send it to the Telegram group where the bot is running. The bot will search for the original images and send them back on demand.

Key Features:

- Offload original media files to a Telegram group, reducing server storage usage.
- Retrieve original images on demand via a shared link sent to the Telegram bot.

### Secrets required

#### We need both Telegram User credentials and Telegram Bot credentials

- Getting Telegram User credentials: https://gram.js.org/getting-started/authorization#logging-in-as-a-user
- Getting Telegram Bot credentials: https://gram.js.org/getting-started/authorization#logging-in-as-a-bot

- Rename `sample.env` to `.env` and populate all Telegram related credentials
- Set `BASE_DIR` to the Immich installation directory `/library/upload`

### Installation

```shell
npm install
npm run build
```

### Usage

1. Check for new files uploaded to `BASE_DIR`

```shell
npm run scan
```

You can configure a cron job to execute this script in every 1 or 2 hour mins like

```shell
0 * * * * npm run upload
```

2. Run upload job

```shell
npm run upload
```

you can configure a cron job to execute this script in every 5 or 10 mins like

```shell
*/10 * * * * npm run upload
```

3. Start the Telegram Bot to download original files

```shell
npm start
```

Once the files are synced in the DB, we can ask the bot for actual images. For this we need to share the Immich share link to the Telegram Bot we created.
