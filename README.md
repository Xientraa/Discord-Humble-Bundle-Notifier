# Discord Humble Bundle Notifier

[![GitHub License](https://img.shields.io/github/license/Xientraa/Discord-Humble-Bundle-Notifier)](https://github.com/Xientraa/Discord-Humble-Bundle-Notifier/blob/main/LICENSE)
[![Static Badge](https://img.shields.io/badge/Discord-252138?style=flat&logo=discord)](https://discord.gg/CWqVj6tTbx)

This project is designed to send out webhook notifications to Discord whenever a new bundle, or Humble Choice releases on Humble Bundle.

Consider joining our Discord for notifications, if you do not wish to host your own version of this notifier.

> [!CAUTION]
> **DISCLAIMER**: This project is in no way endorsed by, or affiliated with Humble Bundle or any of it's parent companies, or subsidiaries.

## Docker Compose

Download the [docker-compose.yml](https://github.com/Xientraa/Discord-Humble-Bundle-Notifier/blob/main/docker-compose.yml) and save the [.env.example](https://github.com/Xientraa/Discord-Humble-Bundle-Notifier/blob/main/.env.example) as a file named ".env" to customize the notifier to your liking.

Then to start the container:

```bash
docker compose up -d
```
