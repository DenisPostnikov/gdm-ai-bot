# :robot_face: GDM AI Telegram Bot

A Telegram bot that helps women with gestational diabetes mellitus (GDM) make informed food choices by analyzing ingredient lists from product photos. Built with Node.js and TypeScript, this bot uses OCR and AI to classify products based on their glycemic index.

## :rocket: Features

- Upload product photos via Telegram
- OCR processing of ingredient lists using `tesseract.js`
- Text preprocessing with `jimp`
- Ingredient analysis with AI via OpenRouter
- Returns classification based on glycemic index:
  - :white_check_mark: Safe (Low GI)
  - :warning: Consider with caution (Medium GI)
  - :x: Avoid (High GI)

## 🛠 Tech Stack

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [tesseract.js](https://github.com/naptha/tesseract.js)
- [jimp](https://github.com/jimp-dev/jimp) – for image preprocessing
- [dotenv](https://github.com/motdotla/dotenv) – environment config
- [axios](https://axios-http.com/) – HTTP requests
- [OpenRouter AI](https://openrouter.ai/) - access to language models
- [Render](https://render.com) – free server hosting for backend

## :package: Installation

```bash
git clone https://github.com/DenisPostikov/gdm-ai-bot.git
cd gdm-ai-bot
npm install
