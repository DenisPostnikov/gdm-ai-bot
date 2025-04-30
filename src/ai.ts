import { forbiddenIngredients, forbiddenProducts } from './forbiddenIngredients'

export async function analyzeIngredientsAI(
  ingredients: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set')
    return 'Ошибка: API ключ не установлен'
  }

  const body = {
    model: 'google/gemma-3-27b-it:free',
    messages: [
      {
        role: 'system',
        content: `Ты нутрициолог. На основе списка запрещённых продуктов при гестационном диабете (ГСД), а также этого списка запрещенных ингредиентов ${forbiddenIngredients} и продуктов ${forbiddenProducts}, оцени состав продукта как: "можно", "с осторожностью", "нельзя" и возвращай статус в виде "✅", "⚠️", "❌". С пояснением и рекомендациями. Если в составе присутствует один из ингредиентов отсюда ${forbiddenIngredients} или продуктов ${forbiddenProducts}, то строго возвращай "❌" Нельзя.

        Ответ всегда возвращай строго в формате:
        <b>Статус:</b> [✅/⚠️/❌]

        <b>Пояснение:</b> [краткое пояснение]

        <b>Рекомендации:</b> [рекомендации]`,
      },
      {
        role: 'user',
        content: `Состав: ${ingredients}`,
      },
    ],
  }

  try {
    console.log('Sending request to OpenRouter API...')
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://your-domain.com',
          'X-Title': 'GDM Bot',
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      return 'Ошибка при обращении к AI сервису'
    }

    const result = await response.json()
    console.log('API Response:', JSON.stringify(result, null, 2))

    let content = null

    if (result.choices?.[0]?.message?.content) {
      content = result.choices[0].message.content
    } else if (result.response) {
      content = result.response
    } else if (typeof result === 'string') {
      content = result
    }

    if (!content) {
      console.error('Unexpected API response format:', result)
      return 'Ошибка: неверный формат ответа от AI'
    }

    return content
  } catch (error) {
    console.error('Error in analyzeIngredientsAI:', error)
    return 'Произошла ошибка при анализе состава'
  }
}
