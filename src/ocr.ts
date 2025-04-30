import Tesseract from 'tesseract.js'
const { Jimp } = require('jimp')

export const recognizeText = async (imagePath: string): Promise<string> => {
  const worker = await Tesseract.createWorker('rus+eng')
  await worker.setParameters({
    tessedit_char_whitelist:
      'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя0123456789.,:;()- ',
    preserve_interword_spaces: '1',
    user_defined_dpi: '300',
  })
  const { data } = await worker.recognize(imagePath)
  await worker.terminate()
  return data.text
}

export const preprocessImage = async (
  inputPath: string,
  outputPath: string
): Promise<void> => {
  const image = await Jimp.read(inputPath)
  const height = Math.round(image.bitmap.height * (1000 / image.bitmap.width))
  image
    .resize({ w: 1000, h: height }) // resize width to 1000, maintain aspect ratio
    .greyscale() // convert to grayscale
    .contrast(0.5) // increase contrast
    .normalize() // normalize the image
    .write(outputPath)
}
