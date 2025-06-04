import { NextRequest, NextResponse } from 'next/server'

interface AnalysisRequest {
  content: string
  type: 'text' | 'image' | 'video'
  settings?: {
    model?: string
    apiKey?: string
  }
}

interface MistralResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

const DEFAULT_MISTRAL_MODEL = 'mistral-small'

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()
    const { content, type, settings } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'İçerik boş olamaz' },
        { status: 400 }
      )
    }

    // API key kontrolü - önce request'ten, sonra environment'tan
    const apiKey = settings?.apiKey || process.env.MISTRAL_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Mistral API anahtarı bulunamadı. Lütfen ayarlar sayfasından API anahtarınızı girin.',
          needsApiKey: true 
        },
        { status: 400 }
      )
    }

    // Model seçimi
    const model = settings?.model || DEFAULT_MISTRAL_MODEL

    // İçerik türüne göre prompt hazırlama
    let systemPrompt = ''
    let userPrompt = ''

    if (type === 'text') {
      systemPrompt = `Sen bir AI içerik tespit uzmanısın. Verilen metni analiz et ve aşağıdaki kriterlere göre değerlendir:

1. Dil kullanımı ve ifade kalıpları
2. Metin yapısı ve tutarlılık  
3. AI modellerinin karakteristik özellikleri
4. İnsan yazım stiline özgü doğallık

Yanıtını şu formatta ver:
- AI_CONFIDENCE: 0-100 arası güven puanı
- DETECTION: "ai-generated", "human-generated" veya "uncertain"  
- EXPLANATION: Detaylı açıklama (Türkçe)
- INDICATORS: Tespit edilen önemli göstergeler listesi

Sadece bu format ile yanıt ver, başka bir şey ekleme.`

      userPrompt = `Bu metni analiz et: "${content}"`
    }

    // Mistral API çağrısı
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user', 
            content: userPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })
    })

    if (!mistralResponse.ok) {
      const errorData = await mistralResponse.text()
      console.error('Mistral API Error:', errorData)
      
      if (mistralResponse.status === 401) {
        return NextResponse.json(
          { error: 'Geçersiz API anahtarı. Lütfen ayarlar sayfasından doğru API anahtarınızı girin.' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `Mistral API hatası: ${mistralResponse.status}` },
        { status: 500 }
      )
    }

    const mistralData: MistralResponse = await mistralResponse.json()
    const aiResponse = mistralData.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'AI yanıtı alınamadı' },
        { status: 500 }
      )
    }

    // AI yanıtını parse etme
    const parseAIResponse = (response: string) => {
      const lines = response.split('\n')
      let confidence = 85 // default
      let detection = 'uncertain'
      let explanation = response
      let indicators: string[] = []

      for (const line of lines) {
        if (line.includes('AI_CONFIDENCE:')) {
          const match = line.match(/(\d+)/)
          if (match) confidence = parseInt(match[1])
        } else if (line.includes('DETECTION:')) {
          if (line.includes('ai-generated')) detection = 'ai-generated'
          else if (line.includes('human-generated')) detection = 'human-generated'
          else if (line.includes('uncertain')) detection = 'uncertain'
        } else if (line.includes('EXPLANATION:')) {
          explanation = line.replace('EXPLANATION:', '').trim()
        } else if (line.includes('INDICATORS:')) {
          // Extract indicators from remaining lines
          const indicatorIndex = lines.indexOf(line)
          indicators = lines.slice(indicatorIndex + 1)
            .filter(l => l.trim().length > 0)
            .map(l => l.replace(/^[-•*]\s*/, '').trim())
        }
      }

      return { confidence, detection, explanation, indicators }
    }

    const parsedResult = parseAIResponse(aiResponse)

    // Sonuç formatını hazırlama
    const result = {
      confidence: parsedResult.confidence,
      aiDetection: parsedResult.detection,
      explanation: parsedResult.explanation,
      sources: [
        `Mistral AI ${model} modeli kullanılarak analiz edildi`,
        'Gelişmiş dil modeli kalıpları analizi',
        'Metin yapısı ve tutarlılık değerlendirmesi',
        ...parsedResult.indicators.slice(0, 3) // En önemli 3 gösterge
      ].filter(Boolean),
      model: model,
      timestamp: new Date().toISOString(),
      processingTime: Date.now(),
      rawResponse: aiResponse // Debug için
    }

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Analysis Error:', error)
    return NextResponse.json(
      { error: 'Analiz sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
} 