import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

import { recognizeText, preprocessImage } from './ocr'
import { analyzeIngredientsAI } from './ai'

dotenv.config()

const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set')
}

const bot = new TelegramBot(token, { polling: true })
// bot.onText(/\/start/, (msg) => {
//   bot.sendMessage(
//     msg.chat.id,
//     'Привет! Пришли мне фото состава продукта, и я определю, можно ли его есть при ГСД.'
//   )
// })
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
    const filePath = path.join(__dirname, 'last_photo.jpg')

    fs.writeFileSync(filePath, res.data)
    await preprocessImage(filePath, 'processed.jpg')

    const text = await recognizeText('processed.jpg')

    if (!text.trim()) {
      bot.sendMessage(
        chatId,
        'Не удалось распознать текст на фото. Пожалуйста, отправьте более четкое фото.'
      )
      return
    }

    bot.sendMessage(chatId, 'Текст распознан! Анализирую состав...')

    const analysis = await analyzeIngredientsAI(text)

    bot.sendMessage(chatId, `ИИ-анализ состава продукта: \n${analysis}`, {
      parse_mode: 'HTML',
    })
  } catch (error) {
    console.error(error)
    bot.sendMessage(
      chatId,
      'Произошла ошибка при обработке фото. Пожалуйста, попробуйте еще раз.'
    )
  }
})
