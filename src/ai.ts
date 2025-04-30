import { forbiddenIngredients, forbiddenProducts } from './forbiddenIngredients'

export async function analyzeIngredientsAI(
  ingredients: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
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
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  const result = await response.json()
  return result.choices[0]?.message?.content || 'Ошибка в ответе AI'
}
