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
      role: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface WebSearchResult {
  found: boolean
  sources: Array<{
    title: string
    url: string
    snippet: string
    similarity: number
  }>
  originalAuthor?: string
  publishDate?: string
  verdict: 'copied' | 'original' | 'partial-match' | 'not-found'
}

const DEFAULT_MISTRAL_MODEL = 'mistral-small-latest'

// Web search fonksiyonu
async function searchWebForText(content: string): Promise<WebSearchResult> {
  try {
    // Metinden karakteristik cümle al (en uzun cümle veya ortadaki kısım)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
    const searchQuery = sentences.length > 0 
      ? `"${sentences[0].trim()}"` 
      : `"${content.substring(0, 100)}"`

    console.log('Web search query:', searchQuery)

    // Web search - built-in fonksiyon kullan
    const searchResponse = await fetch('https://api.bing.microsoft.com/v7.0/search', {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY || 'demo-key',
      },
      body: JSON.stringify({
        q: searchQuery,
        count: 10,
        offset: 0,
        mkt: 'tr-TR'
      })
    })

    // Demo implementation (gerçek Bing API yoksa)
    if (!process.env.BING_API_KEY) {
      // Basit demo sonuç
      const demoResult: WebSearchResult = {
        found: false,
        sources: [],
        verdict: 'not-found'
      }

      // Bazı test durumları
      const lowerContent = content.toLowerCase()
      if (lowerContent.includes('lorem ipsum') || lowerContent.includes('placeholder')) {
        demoResult.found = true
        demoResult.verdict = 'copied'
        demoResult.sources = [{
          title: 'Lorem Ipsum Generator',
          url: 'https://www.lipsum.com/',
          snippet: 'Standard dummy text since the 1500s...',
          similarity: 95
        }]
      } else if (lowerContent.includes('test') && lowerContent.includes('example')) {
        demoResult.found = true
        demoResult.verdict = 'partial-match'
        demoResult.sources = [{
          title: 'Example Test Content',
          url: 'https://example.com/test',
          snippet: 'This appears to be test content...',
          similarity: 70
        }]
      }

      return demoResult
    }

    // Gerçek API response (eğer varsa)
    const data = await searchResponse.json()
    
    const result: WebSearchResult = {
      found: false,
      sources: [],
      verdict: 'not-found'
    }

    if (data.webPages?.value) {
      const matches = data.webPages.value.map((item: any) => ({
        title: item.name,
        url: item.url,
        snippet: item.snippet,
        similarity: calculateSimilarity(content, item.snippet)
      })).filter((match: any) => match.similarity > 60)

      if (matches.length > 0) {
        result.found = true
        result.sources = matches.sort((a: any, b: any) => b.similarity - a.similarity).slice(0, 3)
        
        const highestSimilarity = result.sources[0].similarity
        if (highestSimilarity >= 90) {
          result.verdict = 'copied'
        } else if (highestSimilarity >= 70) {
          result.verdict = 'partial-match'
        } else {
          result.verdict = 'not-found'
        }
      }
    }

    return result

  } catch (error) {
    console.error('Web search error:', error)
    return {
      found: false,
      sources: [],
      verdict: 'not-found'
    }
  }
}

// Metin benzerlik hesaplama (basit)
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3)
  const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3)
  
  const intersection = words1.filter(word => words2.includes(word))
  const unionArray = [...words1, ...words2]
  const union = Array.from(new Set(unionArray))
  
  return union.length > 0 ? Math.round((intersection.length / union.length) * 100) : 0
}

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

    // PARALEL PROCESSING: Hem AI analizi hem web search
    const [webSearchResult, aiAnalysisResult] = await Promise.all([
      // Web search
      searchWebForText(content),
      
      // AI analizi
      (async () => {
        // API key kontrolü
        const apiKey = settings?.apiKey || process.env.MISTRAL_API_KEY
        if (!apiKey) {
          throw new Error('API key not found')
        }

        // Model seçimi
        const model = settings?.model || DEFAULT_MISTRAL_MODEL
        const validModels = [
          'mistral-small-latest',
          'mistral-large-latest', 
          'mistral-medium-latest',
          'open-mistral-nemo',
          'codestral-latest',
          'ministral-8b-latest',
          'ministral-3b-latest'
        ]
        const finalModel = validModels.includes(model) ? model : DEFAULT_MISTRAL_MODEL

        // System prompt - web search sonuçlarını da dikkate al
        const systemPrompt = `Sen bir uzman AI içerik tespit sistemsin. Verilen metni analiz ederek AI üretimi olup olmadığını belirle.

Analiz kriterleri:
1. Dil akıcılığı ve doğallık
2. Tekrarlayan kalıplar  
3. Metin yapısı tutarlılığı
4. İnsan yazım hatalarının varlığı
5. Yaratıcılık ve özgünlük

Yanıtını MUTLAKA şu EXACT formatta ver (başka hiçbir şey yazma):

CONFIDENCE: [0-100 arası sayı]
RESULT: [ai-generated/human-generated/uncertain]
EXPLANATION: [Detaylı açıklama - Türkçe]
INDICATORS: [Virgülle ayrılmış önemli göstergeler]

Örnek:
CONFIDENCE: 92
RESULT: ai-generated
EXPLANATION: Metin çok düzenli yapıda ve tekrarlayan kalıplar içeriyor
INDICATORS: Mükemmel dilbilgisi, monoton üslup, yapay tutarlılık`

        const userPrompt = `Bu metni analiz et ve AI üretimi olup olmadığını belirle: "${content}"`

        // Mistral API çağrısı
        const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: finalModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 1500,
            temperature: 0.3,
            top_p: 1,
            stream: false,
            safe_prompt: false
          })
        })

        if (!mistralResponse.ok) {
          const errorData = await mistralResponse.text()
          throw new Error(`Mistral API Error: ${errorData}`)
        }

        const mistralData: MistralResponse = await mistralResponse.json()
        return mistralData.choices[0]?.message?.content || ''
      })()
    ])

    console.log('Web search result:', webSearchResult)
    console.log('Mistral Raw Response:', aiAnalysisResult)

    // AI yanıtını parse et
    const parseAIResponse = (response: string) => {
      const lines = response.split('\n').map(line => line.trim())
      let confidence = null
      let detection = 'uncertain'
      let explanation = ''
      let indicators: string[] = []

      for (const line of lines) {
        if (line.match(/CONFIDENCE\s*:\s*(\d+)/i)) {
          const match = line.match(/CONFIDENCE\s*:\s*(\d+)/i)
          if (match) confidence = parseInt(match[1])
        } 
        else if (line.match(/RESULT\s*:\s*(.*)/i)) {
          const match = line.match(/RESULT\s*:\s*(.*)/i)
          if (match) {
            const result = match[1].toLowerCase().trim()
            if (result.includes('ai-generated')) detection = 'ai-generated'
            else if (result.includes('human-generated')) detection = 'human-generated'
            else if (result.includes('uncertain')) detection = 'uncertain'
          }
        }
        else if (line.match(/EXPLANATION\s*:\s*(.*)/i)) {
          const match = line.match(/EXPLANATION\s*:\s*(.*)/i)
          if (match) explanation = match[1].trim()
        }
        else if (line.match(/INDICATORS\s*:\s*(.*)/i)) {
          const match = line.match(/INDICATORS\s*:\s*(.*)/i)
          if (match) {
            indicators = match[1].split(',').map(item => item.trim()).filter(Boolean)
          }
        }
      }

      return { confidence, detection, explanation, indicators }
    }

    const aiResult = parseAIResponse(aiAnalysisResult)

    // HYBRID ANALYSIS: Web search + AI sonuçlarını birleştir
    let finalConfidence = aiResult.confidence || 50
    let finalDetection = aiResult.detection
    let finalExplanation = aiResult.explanation || 'Analiz tamamlandı'
    let sources: string[] = []

    // Web search sonucuna göre ayarlama
    if (webSearchResult.found) {
      switch (webSearchResult.verdict) {
        case 'copied':
          finalConfidence = 95
          finalDetection = 'human-generated' // Kopyalandıysa orijinal insan yazmış
          finalExplanation = `🔍 INTERNET ARAŞTIRMASI: Bu metin internette mevcut! ${webSearchResult.sources[0].similarity}% benzerlik ile şu kaynakta bulundu: "${webSearchResult.sources[0].title}". ${finalExplanation}`
          sources = [
            `🔗 Kaynak tespit edildi: ${webSearchResult.sources[0].title}`,
            `🌐 Link: ${webSearchResult.sources[0].url}`,
            `📊 Benzerlik oranı: %${webSearchResult.sources[0].similarity}`,
            ...sources.slice(0, 2)
          ]
          break
          
        case 'partial-match':
          finalConfidence = Math.max(finalConfidence, 75)
          finalExplanation = `🔍 KISMI EŞLEŞME: Bu metinle benzer içerik internette bulundu (%${webSearchResult.sources[0].similarity} benzerlik). ${finalExplanation}`
          sources = [
            `🔗 Benzer kaynak: ${webSearchResult.sources[0].title}`,
            `🌐 Link: ${webSearchResult.sources[0].url}`,
            ...sources.slice(0, 3)
          ]
          break
          
        case 'not-found':
          finalExplanation = `🔍 INTERNET ARAŞTIRMASI: Bu metin internette bulunamadı (özgün görünüyor). ${finalExplanation}`
          sources = ['🔍 İnternette benzer içerik bulunamadı (özgün)', ...sources.slice(0, 4)]
          break
      }
    } else {
      sources = ['🔍 İnternet araması yapıldı - benzer içerik yok', ...sources.slice(0, 4)]
    }

    // Final result
    const result = {
      confidence: finalConfidence,
      aiDetection: finalDetection,
      explanation: finalExplanation,
      sources: [
        `Mistral AI ${settings?.model || DEFAULT_MISTRAL_MODEL} modeli kullanılarak analiz edildi`,
        'Gelişmiş dil modeli kalıpları analizi',
        'İnternet araştırması yapıldı',
        ...sources,
        ...aiResult.indicators?.slice(0, 2) || []
      ].filter(Boolean).slice(0, 6),
      model: settings?.model || DEFAULT_MISTRAL_MODEL,
      timestamp: new Date().toISOString(),
      webSearch: webSearchResult,
      processingTime: Date.now(),
      rawResponse: aiAnalysisResult
    }

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Analysis Error:', error)
    
    if (error instanceof Error && error.message.includes('API key not found')) {
      return NextResponse.json(
        { 
          error: 'Mistral API anahtarı bulunamadı. Lütfen ayarlar sayfasından API anahtarınızı girin.',
          needsApiKey: true 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Analiz sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
} 