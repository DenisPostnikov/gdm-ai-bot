import { forbiddenIngredients, forbiddenProducts } from './forbiddenIngredients'

async function checkRateLimits(apiKey: string): Promise<{
  remaining: number
  isFreeTier: boolean
  limit: number | null
}> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to check rate limits')
    }

    const data = await response.json()
    return {
      remaining: data.data.limit ? data.data.limit - data.data.usage : Infinity,
      isFreeTier: data.data.is_free_tier,
      limit: data.data.limit,
    }
  } catch (error) {
    console.error('Error checking rate limits:', error)
    return { remaining: 0, isFreeTier: true, limit: null }
  }
}

export async function analyzeIngredientsAI(
  ingredients: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set')
    return 'Ошибка: API ключ не установлен'
  }

  // Check rate limits before sending the request
  const limits = await checkRateLimits(apiKey)

  if (limits.remaining <= 0) {
    if (limits.isFreeTier) {
      return 'Извините, достигнут дневной лимит бесплатных запросов. Пожалуйста, попробуйте завтра или обратитесь к администратору.'
    } else {
      return 'Извините, достигнут лимит запросов. Пожалуйста, обратитесь к администратору.'
    }
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

      if (response.status === 429 || response.status === 402) {
        return 'Извините, достигнут дневной лимит бесплатных запросов. Пожалуйста, попробуйте завтра или обратитесь к администратору.'
      }

      return 'Ошибка при обращении к AI сервису'
    }

    const result = await response.json()

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
