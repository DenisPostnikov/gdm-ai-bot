import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import express from 'express'

import { recognizeText, preprocessImage } from './ocr'
import { analyzeIngredientsAI } from './ai'

dotenv.config()

const token = process.env.TELEGRAM_BOT_TOKEN
const port = process.env.PORT || 3000

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set')
}

const app = express()
const bot = new TelegramBot(token)

// Middleware to parse JSON
app.use(express.json())

// Webhook endpoint
app.post(`/webhook/${token}`, (req, res) => {
  bot.processUpdate(req.body)
  res.sendStatus(200)
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.sendStatus(200)
})

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

// Set webhook
const webhookUrl = process.env.WEBHOOK_URL
if (webhookUrl) {
  bot
    .setWebHook(`${webhookUrl}/webhook/${token}`)
    .then(() => console.log('Webhook set successfully'))
    .catch((err) => console.error('Error setting webhook:', err))
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id

  if (msg.text && !msg.text.includes('/')) {
    bot.sendMessage(
      chatId,
      'Нужно прислать фото состава продукта, а не текст. Попробуй еще раз.'
    )
  } else if (msg.text === '/stop') {
    bot.sendMessage(chatId, 'Спасибо за использование бота!')
  } else if (msg.text === '/start') {
    bot.sendMessage(
      chatId,
      'Привет! Пришли мне фото состава продукта, и я определю, можно ли его есть при ГСД.'
    )
  }
})

bot.on('photo', async (msg) => {
  const chatId = msg.chat.id
  const photo = msg.photo?.pop()

  if (!photo) return

  try {
    bot.sendMessage(chatId, 'Фото получено! Сейчас распознаю текст...')

    const file = await bot.getFile(photo.file_id)
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`
    const res = await axios.get(fileUrl, { responseType: 'arraybuffer' })

    // Use temporary directory from Render
    const tempDir = process.env.TEMP_DIR || '/tmp'
    const filePath = path.join(tempDir, `photo_${Date.now()}.jpg`)
    const processedPath = path.join(tempDir, `processed_${Date.now()}.jpg`)

    fs.writeFileSync(filePath, res.data)
    await preprocessImage(filePath, processedPath)

    const text = await recognizeText(processedPath)

    if (!text.trim()) {
      bot.sendMessage(
        chatId,
        'Не удалось распознать текст на фото. Пожалуйста, отправьте более четкое фото.'
      )
      return
    }

    bot.sendMessage(chatId, 'Текст распознан! Анализирую состав...')

    const analysis = await analyzeIngredientsAI(text)
    const message = analysis.includes(
      'достигнут дневной лимит бесплатных запросов'
    )
      ? analysis
      : `ИИ-анализ состава продукта: \n${analysis}`

    bot.sendMessage(chatId, message, { parse_mode: 'HTML' })

    // Clean up temporary files
    try {
      fs.unlinkSync(filePath)
      fs.unlinkSync(processedPath)
    } catch (cleanupError) {
      console.error('Error cleaning up files:', cleanupError)
    }
  } catch (error) {
    console.error(error)
    bot.sendMessage(
      chatId,
      'Произошла ошибка при обработке фото. Пожалуйста, попробуйте еще раз.'
    )
  }
})
