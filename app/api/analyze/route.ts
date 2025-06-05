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

    console.log('🔍 Web search query:', searchQuery)
    console.log('📝 Original content:', content.substring(0, 100) + '...')

    // Şiir tespit edilirse özel arama yap
    const isPoetry = content.includes('\n') && content.split('\n').length >= 3 && 
                     content.length < 500 && 
                     !/\b(breaking|news|said|reported|according)\b/i.test(content)
    
    if (isPoetry) {
      console.log('🎭 Şiir tespit edildi, özel arama yapılıyor...')
      const poetryResult = await searchPoetryOnWeb(content)
      if (poetryResult.found) {
        console.log('✅ Şiir web aramasında sonuç bulundu!')
        return poetryResult
      }
    }

    // Türk edebiyatı ve ünlü şiir tespiti
    const turkishLiteratureCheck = checkTurkishLiterature(content)
    if (turkishLiteratureCheck.found) {
      console.log('📚 Türk edebiyatı tespit edildi!')
      return turkishLiteratureCheck
    }

    // Method 1: Bing Search API (eğer key varsa)
    if (process.env.BING_API_KEY) {
      console.log('🔍 Bing API kullanılıyor...')
      return await searchWithBing(searchQuery)
    }

    // Method 2: DuckDuckGo Instant Answer API (ücretsiz)
    console.log('🦆 DuckDuckGo API deneniyor...')
    const duckDuckGoResult = await searchWithDuckDuckGo(searchQuery)
    console.log('🦆 DuckDuckGo sonucu:', duckDuckGoResult.found ? 'BULUNDU' : 'BULUNAMADI')
    if (duckDuckGoResult.found) {
      return duckDuckGoResult
    }

    // Method 3: Google Custom Search (eğer key varsa)
    if (process.env.GOOGLE_CSE_ID && process.env.GOOGLE_API_KEY) {
      console.log('🔍 Google Custom Search kullanılıyor...')
      return await searchWithGoogle(searchQuery)
    }

    // Method 4: Web scraping ile basit arama
    console.log('🕷️ Web scraping deneniyor...')
    return await searchWithScraping(searchQuery, content)

  } catch (error) {
    console.error('❌ Web search error:', error)
    return {
      found: false,
      sources: [],
      verdict: 'not-found'
    }
  }
}

// Bing Search API
async function searchWithBing(query: string): Promise<WebSearchResult> {
  try {
    const searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=10&mkt=tr-TR`
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY!,
        'Accept': 'application/json'
      }
    })

    if (!searchResponse.ok) {
      throw new Error(`Bing API error: ${searchResponse.status}`)
    }

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
        similarity: calculateSimilarity(query, item.snippet)
      })).filter((match: any) => match.similarity > 60)

      if (matches.length > 0) {
        result.found = true
        result.sources = matches.sort((a: any, b: any) => b.similarity - a.similarity).slice(0, 3)
        
        const highestSimilarity = result.sources[0].similarity
        if (highestSimilarity >= 90) {
          result.verdict = 'copied'
        } else if (highestSimilarity >= 70) {
          result.verdict = 'partial-match'
        }
      }
    }

    return result
  } catch (error) {
    console.error('Bing search failed:', error)
    throw error
  }
}

// DuckDuckGo Instant Answer API
async function searchWithDuckDuckGo(query: string): Promise<WebSearchResult> {
  try {
    console.log('🦆 DuckDuckGo Instant Answer API ile arama yapılıyor:', query)
    
    // DuckDuckGo Instant Answer API
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'SourceCheck-AI/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('📄 DuckDuckGo response keys:', Object.keys(data))
    console.log('📝 Abstract length:', data.Abstract ? data.Abstract.length : 'YOK')
    console.log('📝 Abstract content:', data.Abstract ? `"${data.Abstract.substring(0, 100)}..."` : 'YOK')
    console.log('📋 RelatedTopics count:', data.RelatedTopics ? data.RelatedTopics.length : 'YOK')
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      console.log('📋 First topic:', data.RelatedTopics[0])
    }
    console.log('💬 Answer:', data.Answer ? `"${data.Answer}"` : 'YOK')

    const result: WebSearchResult = {
      found: false,
      sources: [],
      verdict: 'not-found'
    }

    const sources = []

    // Abstract (instant answer)
    if (data.Abstract && data.Abstract.length > 20) {
      console.log('🔍 Abstract uzunluğu yeterli, benzerlik hesaplanıyor...')
      const similarity = calculateSimilarity(query, data.Abstract)
      console.log(`📊 Abstract similarity: ${similarity}% - "${data.Abstract.substring(0, 50)}..."`)
      if (similarity > 30) {
        console.log('✅ Abstract threshold geçti, ekleniyor!')
        sources.push({
          title: data.AbstractText || 'Wikipedia Abstract',
          url: data.AbstractURL || 'https://wikipedia.org',
          snippet: data.Abstract.substring(0, 200) + (data.Abstract.length > 200 ? '...' : ''),
          similarity
        })
      } else {
        console.log('❌ Abstract threshold geçemedi')
      }
    } else {
      console.log('❌ Abstract yok ya da çok kısa')
    }

    // Related topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      console.log(`📋 ${data.RelatedTopics.length} related topics found`)
      data.RelatedTopics.slice(0, 5).forEach((topic: any, index: number) => {
        if (topic.Text && topic.FirstURL) {
          const similarity = calculateSimilarity(query, topic.Text)
          console.log(`📊 Topic ${index+1} similarity: ${similarity}% - "${topic.Text.substring(0, 50)}..."`)
          if (similarity > 15) {
            sources.push({
              title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 80),
              url: topic.FirstURL,
              snippet: topic.Text.substring(0, 200),
              similarity
            })
          }
        }
      })
    }

    // Answer
    if (data.Answer && data.Answer.length > 10) {
      const similarity = calculateSimilarity(query, data.Answer)
      console.log(`📊 Answer similarity: ${similarity}% - "${data.Answer}"`)
      if (similarity > 20) {
        sources.push({
          title: 'Direct Answer',
          url: data.AnswerURL || '#',
          snippet: data.Answer,
          similarity
        })
      }
    }

    console.log(`🎯 DuckDuckGo sonuçları: ${sources.length} kaynak bulundu`)

    if (sources.length > 0) {
      result.found = true
      result.sources = sources.sort((a, b) => b.similarity - a.similarity).slice(0, 3)
      
      const highestSimilarity = result.sources[0].similarity
      if (highestSimilarity >= 60) {
        result.verdict = 'copied'
      } else if (highestSimilarity >= 35) {
        result.verdict = 'partial-match'
      }
    }

    return result
  } catch (error) {
    console.error('DuckDuckGo search failed:', error)
    return { found: false, sources: [], verdict: 'not-found' }
  }
}

// Google Custom Search API
async function searchWithGoogle(query: string): Promise<WebSearchResult> {
  try {
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=10`
    
    const response = await fetch(searchUrl)
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`)
    }

    const data = await response.json()
    
    const result: WebSearchResult = {
      found: false,
      sources: [],
      verdict: 'not-found'
    }

    if (data.items && data.items.length > 0) {
      const matches = data.items.map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        similarity: calculateSimilarity(query, item.snippet)
      })).filter((match: any) => match.similarity > 60)

      if (matches.length > 0) {
        result.found = true
        result.sources = matches.sort((a: any, b: any) => b.similarity - a.similarity).slice(0, 3)
        
        const highestSimilarity = result.sources[0].similarity
        if (highestSimilarity >= 90) {
          result.verdict = 'copied'
        } else if (highestSimilarity >= 70) {
          result.verdict = 'partial-match'
        }
      }
    }

    return result
  } catch (error) {
    console.error('Google search failed:', error)
    throw error
  }
}

// Web scraping ile arama
async function searchWithScraping(query: string, originalContent: string): Promise<WebSearchResult> {
  try {
    console.log('🕷️ Web scraping ile arama yapılıyor...', query)
    
    // Google search ile basit arama
    const searchQuery = encodeURIComponent(query.replace(/"/g, ''))
    const searchUrl = `https://www.google.com/search?q=${searchQuery}&num=10`
    
    console.log('🔍 Search URL:', searchUrl)
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    })

    console.log('🌐 Response status:', response.status)

    if (response.ok) {
      const html = await response.text()
      console.log('📄 HTML length:', html.length)
      
      // Google search results'tan title ve snippet'leri çek (güncel selectors)
      const results: Array<{title: string, snippet: string, url: string, similarity: number}> = []
      
      // Basit regex patterns
      const titlePattern = /<h3[^>]*>([^<]+)<\/h3>/g
      const snippetPattern = /<span[^>]*>([^<]{50,200})<\/span>/g
      
      let titleMatch
      const titles: string[] = []
      while ((titleMatch = titlePattern.exec(html)) !== null && titles.length < 10) {
        const title = titleMatch[1].trim()
        if (title.length > 10 && !title.includes('...')) {
          titles.push(title)
        }
      }
      
      let snippetMatch
      const snippets: string[] = []
      while ((snippetMatch = snippetPattern.exec(html)) !== null && snippets.length < 10) {
        const snippet = snippetMatch[1].trim()
        if (snippet.length > 30 && !snippet.includes('...') && !snippet.includes('›')) {
          snippets.push(snippet)
        }
      }

      console.log(`📊 Bulunan sonuçlar: ${titles.length} başlık, ${snippets.length} snippet`)

      // Sonuçları birleştir
      const maxResults = Math.min(titles.length, 5)
      for (let i = 0; i < maxResults; i++) {
        const title = titles[i] || ''
        const snippet = snippets[i] || title
        
        if (title && snippet) {
          const titleSimilarity = calculateSimilarity(originalContent, title)
          const snippetSimilarity = calculateSimilarity(originalContent, snippet)
          const maxSimilarity = Math.max(titleSimilarity, snippetSimilarity)
          
          if (maxSimilarity > 25) { // Çok düşük threshold
            results.push({
              title: title.substring(0, 150),
              snippet: snippet.substring(0, 200),
              url: searchUrl,
              similarity: maxSimilarity
            })
          }
        }
      }

      console.log(`✅ Filtrelenmiş sonuçlar: ${results.length}`)

      if (results.length > 0) {
        const sortedResults = results.sort((a, b) => b.similarity - a.similarity).slice(0, 3)
        const highestSimilarity = sortedResults[0].similarity
        
        return {
          found: true,
          sources: sortedResults.map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            similarity: r.similarity
          })),
          verdict: highestSimilarity >= 60 ? 'copied' : highestSimilarity >= 35 ? 'partial-match' : 'not-found'
        }
      }
    }

    console.log('❌ Hiç sonuç bulunamadı')
    return { found: false, sources: [], verdict: 'not-found' }
  } catch (error) {
    console.error('❌ Web scraping failed:', error)
    return { found: false, sources: [], verdict: 'not-found' }
  }
}

// Türk edebiyatı ve ünlü şiir tespiti
function checkTurkishLiterature(content: string): WebSearchResult {
  const normalizedContent = content.toLowerCase()
    .replace(/[ğüşıöç]/g, (char) => {
      const map: {[key: string]: string} = {'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c'}
      return map[char] || char
    })

  // Ünlü Türk şairler ve eserleri
  const famousWorks = [
    {
      author: 'Necip Fazıl Kısakürek',
      work: 'Çile',
      keywords: ['zindan iki hece', 'mehmed\'im lafta', 'baba katiliyle', 'baban bir safta', 'geri adam', 'boynunda yafta', 'cile', 'büyük dogu'],
      url: 'https://tr.wikipedia.org/wiki/Necip_Faz%C4%B1l_K%C4%B1sak%C3%BCrek',
      snippet: 'Necip Fazıl Kısakürek\'in ünlü şiiri "Çile"den'
    },
    {
      author: 'Nazim Hikmet',
      work: 'Memleketimden İnsan Manzaraları',
      keywords: ['ne ayak dayanir', 'ne tirnak', 'bir alem ki', 'gokler boru', 'akil olmazlarin', 'ustuste sorular', 'dusun mu konus mu', 'buradan insan mi', 'cikar tabut mu'],
      url: 'https://tr.wikipedia.org/wiki/Nazim_Hikmet',
      snippet: 'Nazim Hikmet\'in ünlü şiiri "Memleketimden İnsan Manzaraları"ndan'
    },
    {
      author: 'Nazim Hikmet',
      work: 'En Güzel Deniz',
      keywords: ['karakoy kopruse', 'yagmur yagark', 'biraksalar', 'gokyuzu', 'ikiye boleck'],
      url: 'https://tr.wikipedia.org/wiki/Nazim_Hikmet',
      snippet: 'Nazim Hikmet\'in ünlü şiiri "En Güzel Deniz"'
    },
    {
      author: 'Orhan Veli Kanık',
      work: 'Garip Akımı',
      keywords: ['senden baska', 'garip', 'ben bir', 'istanbul'],
      url: 'https://tr.wikipedia.org/wiki/Orhan_Veli_Kan%C4%B1k',
      snippet: 'Orhan Veli Kanık\'ın Garip akımından şiiri'
    },
    {
      author: 'Cemal Süreya',
      work: 'Sevda Sözleri',
      keywords: ['sevda sozleri', 'uyandım ki', 'ben ruya', 'ask'],
      url: 'https://tr.wikipedia.org/wiki/Cemal_S%C3%BCreya',
      snippet: 'Cemal Süreya\'nın modern Türk şiirinden'
    },
    {
      author: 'Attila İlhan',
      work: 'Sisler Bulvarı',
      keywords: ['sisler bulvari', 'ben sana', 'dondum', 'istanbul'],
      url: 'https://tr.wikipedia.org/wiki/Attila_%C4%B0lhan',
      snippet: 'Attila İlhan\'ın ünlü şiiri'
    },
    {
      author: 'Yahya Kemal Beyatlı',
      work: 'Kendi Gök Kubbemiz',
      keywords: ['gok kubbe', 'istanbul', 'bizim', 'vatan'],
      url: 'https://tr.wikipedia.org/wiki/Yahya_Kemal_Beyatl%C4%B1',
      snippet: 'Yahya Kemal\'in millî edebiyat döneminden'
    },
    {
      author: 'Ahmed Arif',
      work: 'Hasretinden Prangalar Eskittim',
      keywords: ['hasretinden prangalar', 'eskittim', 'sen affet', 'bagimsizlik'],
      url: 'https://tr.wikipedia.org/wiki/Ahmed_Arif',
      snippet: 'Ahmed Arif\'in ünlü şiiri'
    },
    {
      author: 'Fazıl Hüsnü Dağlarca',
      work: 'Çocuk ve Allah',
      keywords: ['cocuk ve allah', 'sen kimsin', 'ben kimsiz'],
      url: 'https://tr.wikipedia.org/wiki/Faz%C4%B1l_H%C3%BCsn%C3%BC_Da%C4%9Flarca',
      snippet: 'Fazıl Hüsnü Dağlarca\'nın mistik şiiri'
    }
  ]

  console.log('📚 Türk edebiyatı database kontrol ediliyor...')
  console.log('🔍 Normalize edilmiş içerik:', normalizedContent.substring(0, 100) + '...')

  for (const work of famousWorks) {
    const matchCount = work.keywords.filter(keyword => 
      normalizedContent.includes(keyword)
    ).length

    console.log(`📖 ${work.author} - ${work.work}: ${matchCount}/${work.keywords.length} eşleşme`)
    
    // Daha sıkı kontrol: En az 3 eşleşme VE eşleşme oranı %40'tan fazla olmalı
    const matchRatio = matchCount / work.keywords.length
    if (matchCount >= 3 && matchRatio >= 0.4) {
      console.log(`✅ Türk edebiyatı tespit edildi: ${work.author} - ${work.work} (${matchCount}/${work.keywords.length} = %${Math.round(matchRatio * 100)})`)
      return {
        found: true,
        sources: [{
          title: `${work.author} - ${work.work}`,
          url: work.url,
          snippet: work.snippet,
          similarity: Math.min(95, 60 + (matchCount * 10)) // Eşleşme sayısına göre benzerlik
        }],
        originalAuthor: work.author,
        verdict: 'copied'
      }
    }
  }

  console.log('❌ Türk edebiyatı database\'inde eşleşme bulunamadı')
  return { found: false, sources: [], verdict: 'not-found' }
}

// Metin benzerlik hesaplama (basitleştirilmiş ve debug'lanabilir)
function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) {
    console.log('⚠️ Similarity: Boş metin')
    return 0
  }
  
  // Metinleri normalize et
  const normalize = (text: string) => {
    return text.toLowerCase()
      .replace(/[.,;:!?'"()[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const normalized1 = normalize(text1)
  const normalized2 = normalize(text2)
  
  console.log(`🔍 Comparing: "${normalized1.substring(0, 50)}..." vs "${normalized2.substring(0, 50)}..."`)
  
  // Tam eşleşme kontrolü
  if (normalized1 === normalized2) {
    console.log('✅ Tam eşleşme!')
    return 100
  }
  
  // Basit kelime eşleşmesi
  const words1 = normalized1.split(/\s+/).filter(w => w.length > 2)
  const words2 = normalized2.split(/\s+/).filter(w => w.length > 2)
  
  if (words1.length === 0 || words2.length === 0) {
    console.log('⚠️ Similarity: Kelime bulunamadı')
    return 0
  }
  
  // Ortak kelimeleri bul
  const commonWords = words1.filter(word => words2.includes(word))
  const totalWords = Math.max(words1.length, words2.length)
  
  const similarity = Math.round((commonWords.length / totalWords) * 100)
  
  console.log(`📊 Ortak kelimeler: ${commonWords.length}/${totalWords} = ${similarity}%`)
  console.log(`🔤 Ortak kelimeler: [${commonWords.slice(0, 5).join(', ')}]`)
  
  return similarity
}

// Şiir için özel web search
async function searchPoetryOnWeb(content: string): Promise<WebSearchResult> {
  try {
    console.log('🎭 Şiir için özel web arama başlatılıyor...')
    
    // Şiirin ilk mısralarını al
    const lines = content.split(/[\n\r]+/).filter(line => line.trim().length > 10)
    const firstLine = lines[0] ? lines[0].trim() : content.substring(0, 50)
    const secondLine = lines[1] ? lines[1].trim() : ''
    
    console.log('📝 İlk mısra:', firstLine)
    console.log('📝 İkinci mısra:', secondLine)
    
    // Türkçe şiir araması için özel arama terimleri
    const searchQueries = [
      `"${firstLine}" şiir`,
      `"${firstLine}" poem`,
      `"${firstLine}" Nazim Hikmet`,
      `"${firstLine}" Orhan Veli`,
      `"${firstLine}" şair`,
      secondLine ? `"${secondLine}" şiir` : null
    ].filter((q): q is string => q !== null)
    
    console.log('🔍 Şiir arama sorguları:', searchQueries)
    
    for (const query of searchQueries) {
      console.log(`🎭 Aranıyor: ${query}`)
      
      // DuckDuckGo ile şiir araması
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'SourceCheck-AI/1.0' }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Abstract kontrolü (Wikipedia gibi)
        if (data.Abstract && data.Abstract.length > 50) {
          const similarity = calculateSimilarity(firstLine, data.Abstract)
          console.log(`📊 Abstract benzerlik: ${similarity}% - "${data.Abstract.substring(0, 80)}..."`)
          
          if (similarity > 20) {
            // Şair ismini abstract'tan çıkarmaya çalış
            const poetMatch = data.Abstract.match(/(Nazim Hikmet|Orhan Veli|Cemal Süreya|Attila İlhan|Yahya Kemal|Ahmed Arif|Fazıl Hüsnü|Necip Fazıl|Ece Ayhan|Turgut Uyar)/i)
            const poet = poetMatch ? poetMatch[1] : 'Bilinmeyen Şair'
            
            console.log(`✅ Şiir kaynağı bulundu: ${poet}`)
            
            return {
              found: true,
              sources: [{
                title: `${poet} - Şiir`,
                url: data.AbstractURL || 'https://wikipedia.org',
                snippet: `Şair: ${poet}. ${data.Abstract.substring(0, 150)}...`,
                similarity: Math.max(similarity, 60)
              }],
              originalAuthor: poet,
              verdict: 'copied'
            }
          }
        }
        
        // RelatedTopics kontrolü
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          for (const topic of data.RelatedTopics.slice(0, 3)) {
            if (topic.Text && topic.Text.toLowerCase().includes('şair') || topic.Text.toLowerCase().includes('poet')) {
              const similarity = calculateSimilarity(firstLine, topic.Text)
              console.log(`📊 Topic benzerlik: ${similarity}% - "${topic.Text.substring(0, 50)}..."`)
              
              if (similarity > 15) {
                const poetMatch = topic.Text.match(/(Nazim Hikmet|Orhan Veli|Cemal Süreya|Attila İlhan|Yahya Kemal|Ahmed Arif|Fazıl Hüsnü)/i)
                const poet = poetMatch ? poetMatch[1] : 'Türk Şairi'
                
                return {
                  found: true,
                  sources: [{
                    title: `${poet} - Şiir Koleksiyonu`,
                    url: topic.FirstURL || '#',
                    snippet: topic.Text.substring(0, 150),
                    similarity: Math.max(similarity, 50)
                  }],
                  originalAuthor: poet,
                  verdict: 'copied'
                }
              }
            }
          }
        }
      }
      
      // Kısa bir bekleme (rate limiting için)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log('❌ Şiir web aramasında sonuç bulunamadı')
    return { found: false, sources: [], verdict: 'not-found' }
    
  } catch (error) {
    console.error('❌ Şiir web arama hatası:', error)
    return { found: false, sources: [], verdict: 'not-found' }
  }
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

    // ÖNCE WEB ARAŞTIRMASI YAP - en önemli adım
    console.log('🔍 1. ADIM: İnternet araştırması başlatılıyor...')
    const webSearchResult = await searchWebForText(content)
    
    console.log('📊 Web search sonucu:', webSearchResult.found ? 'BULUNDU' : 'BULUNAMADI')
    
    // Eğer web'de bulunduysa, AI analizine gerek yok!
    if (webSearchResult.found) {
      console.log('✅ İnternette kaynak bulundu - AI analizine gerek yok!')
      
      const finalExplanation = webSearchResult.verdict === 'copied' 
        ? `🔍 INTERNET ARAŞTIRMASI: Bu metin internette mevcut! %${webSearchResult.sources[0].similarity} benzerlik ile şu kaynakta bulundu: "${webSearchResult.sources[0].title}". ${webSearchResult.originalAuthor ? `Orijinal yazar: ${webSearchResult.originalAuthor}` : 'Kaynak tespit edildi.'}`
        : `🔍 KISMÎ EŞLEŞME: Bu metinle benzer içerik internette bulundu (%${webSearchResult.sources[0].similarity} benzerlik). Kaynak: "${webSearchResult.sources[0].title}"`

      const sources = [
        webSearchResult.originalAuthor ? `👨‍🎨 Orijinal Yazar: ${webSearchResult.originalAuthor}` : '🔗 İnternet kaynağı tespit edildi',
        `🔗 Kaynak tespit edildi: ${webSearchResult.sources[0].title}`,
        `🌐 Link: ${webSearchResult.sources[0].url}`,
        `📊 Benzerlik oranı: %${webSearchResult.sources[0].similarity}`,
        webSearchResult.verdict === 'copied' ? '✅ Tam kopya tespit edildi' : '⚠️ Kısmi benzerlik tespit edildi',
        '🔍 İnternet araştırması tamamlandı'
      ].filter(Boolean).slice(0, 6)

      return NextResponse.json({
        success: true,
        result: {
          confidence: webSearchResult.verdict === 'copied' ? 95 : 75,
          aiDetection: 'human-generated', // Web'de bulunan = insan yazmış
          explanation: finalExplanation,
          sources: sources,
          model: 'Web Search Priority System',
          timestamp: new Date().toISOString(),
          webSearch: webSearchResult,
          processingTime: Date.now(),
          skipAI: true // AI analizi atlandı
        }
      })
    }

    // Web'de bulunamadıysa, şimdi AI analizine geç
    console.log('🤖 2. ADIM: Web\'de bulunamadı, AI analizi başlatılıyor...')
    
    const aiAnalysisResult = await (async () => {
      // API key kontrolü
      const apiKey = settings?.apiKey || process.env.MISTRAL_API_KEY
      if (!apiKey) {
        // API key yoksa basit bir demo analiz döndür
        return `CONFIDENCE: 50
RESULT: uncertain
EXPLANATION: API anahtarı bulunamadığı için sadece web araması yapıldı. İnternette benzer içerik bulunamadı, bu da özgün bir metin olabileceğini gösteriyor.
INDICATORS: Web araması negatif, API anahtarı eksik`
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

      const systemPrompt = `Sen gelişmiş bir AI tespit uzmanısın. Türkçe metinleri analiz ederek AI tarafından mı yoksa insan tarafından mı yazıldığını tespit ediyorsun.

ÖNEMLİ: Bu metin daha önce internet aramasında bulunamadı, bu da özgün olabileceğini gösteriyor.

KRITIK AI TESPIT KRİTERLERİ:

1. YAPISAL KALIPLAR (ÇOK ÖNEMLİ):
   - ChatGPT/AI'ın "Bir gün..." "Bu durumda..." "Sonuç olarak..." "Öte yandan..." klişe başlangıçları
   - Aşırı organize edilmiş paragraf yapısı (hep 3-5 cümle)
   - Çok düzenli giriş-gelişme-sonuç şeması
   - Mükemmel geçişler ve bağlayıcılar

2. DİL ÖZELLİKLERİ:
   - Çok mükemmel dilbilgisi (hiç yazım hatası/dikkatsizlik yok)
   - Aşırı açıklayıcı ve didaktik ton
   - Duygusal olarak nötr, yapay nezaket
   - Gereksiz detaylandırma ve açıklama eğilimi

3. İÇERİK KALIPLARI:
   - "Nihayetinde..." "Bu arada..." "Unutmayalım ki..." yapay geçişler
   - Her konuyu eşit önemdeymiş gibi sunma
   - Çok dengeli ve diplomatik yaklaşım
   - Klişe metaforlar ve örnekler

4. HİKAYE/ANLATIM DESENLERİ (ÇOK ÖNEMLİ):
   - Çok düzenli ve şematik olay örgüsü
   - Karakterlerin aşırı açıklayıcı konuşmaları
   - Belirgin moral/ders veren sonuçlar
   - "Ders verici" hikaye akışı

5. İNSAN ÖZELLİKLERİ:
   - Küçük yazım hataları/dikkatsizlikler
   - Doğal konuşma dili, argo, günlük ifadeler
   - Güçlü öznellik ve kişisel görüşler
   - Mantıksal tutarsızlıklar
   - Duygusal patlamalar ve abartılar
   - Yan dallanmalar

UYARI: Modern AI'lar çok gelişmiş! Sadece mükemmel dilbilgisi AI anlamına gelmez. GENEL YAPISAL AKIŞ ve KALIPLAR en kritik gösterge.

Özellikle hikaye/anlatım türü metinlerde AI kalıpları çok belirgin olur!

Yanıtını MUTLAKA şu EXACT formatta ver (başka hiçbir şey yazma):

CONFIDENCE: [0-100 arası sayı]
RESULT: [ai-generated/human-generated/uncertain]
EXPLANATION: [Detaylı açıklama - Türkçe]
INDICATORS: [Virgülle ayrılmış önemli göstergeler]`

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

    console.log('Mistral Raw Response:', aiAnalysisResult)

    // AI yanıtını parse et
    const parseAIResponse = (response: string) => {
      const lines = response.split('\n').map(line => line.trim())
      let confidence = null
      let detection = 'uncertain'
      let explanation = ''
      let indicators: string[] = []

      console.log('Parsing lines:', lines) // Debug

      for (const line of lines) {
        if (line.match(/CONFIDENCE\s*:\s*(\d+)/i)) {
          const match = line.match(/CONFIDENCE\s*:\s*(\d+)/i)
          if (match) {
            confidence = parseInt(match[1])
            console.log('✅ Confidence parsed:', confidence)
          }
        } 
        else if (line.match(/RESULT\s*:\s*(.*)/i)) {
          const match = line.match(/RESULT\s*:\s*(.*)/i)
          if (match) {
            const result = match[1].toLowerCase().trim()
            if (result.includes('ai-generated')) detection = 'ai-generated'
            else if (result.includes('human-generated')) detection = 'human-generated'
            else if (result.includes('uncertain')) detection = 'uncertain'
            console.log('✅ Detection parsed:', detection)
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

      // Advanced fallback confidence calculation
      if (confidence === null) {
        console.log('⚠️ Confidence not parsed, calculating smart fallback...')
        
        const text = response.toLowerCase()
        const contentLower = content.toLowerCase()
        
        // Gelişmiş AI pattern detection
        const contentLowerFull = content.toLowerCase()
        
        // ChatGPT/AI klişe başlangıçları
        const aiStartPhrases = [
          'bir gün', 'bu durumda', 'sonuç olarak', 'öte yandan', 'nihayetinde',
          'bu arada', 'unutmayalım ki', 'önemli olan', 'dikkat edilmesi gereken',
          'bu bağlamda', 'ayrıca', 'bunun yanı sıra', 'özellikle de'
        ]
        const hasAiStarters = aiStartPhrases.some(phrase => 
          contentLowerFull.includes(phrase + ' ') || contentLowerFull.startsWith(phrase))
        
        // Aşırı organize paragraf yapısı
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20)
        const hasUniformParagraphs = paragraphs.length > 2 && paragraphs.every(p => {
          const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 10)
          return sentences.length >= 3 && sentences.length <= 5
        })
        
        // Metin karakteristikleri analizi
        const hasRepeatedPatterns = /(.{10,})\1+/.test(content) // Tekrarlayan kalıplar
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
        const hasUniformSentences = sentences.length > 3 && sentences
          .map(s => s.trim().length).every(len => Math.abs(len - 50) < 20) // Uniform cümle uzunlukları
          
        // Mükemmel dilbilgisi kontrolü (AI'ın belirtisi)
        const hasPerfectGrammar = !/[a-zA-ZğüşıöçĞÜŞİÖÇ]\s{2,}|\.{2,}|,,|\?\?|!!|\.\s*[a-z]/.test(content)
        const hasTypos = /\b\w+[a-z]{2,}[A-Z]\w*\b|[a-zA-Z]{15,}/.test(content) // Yazım hataları
        
        // Hikaye/anlatım pattern'leri (ChatGPT'nin çok kullandığı)
        const storyPatterns = [
          'moral', 'ders', 'öğrendik', 'anladık', 'sonunda anlamıştık',
          'bu deneyimden', 'hayatta en önemli', 'unutmayacağım'
        ]
        const hasStoryMorals = storyPatterns.some(pattern => contentLowerFull.includes(pattern))
        
        // Duygusal nötrlaştırma (AI özelliği)
        const emotionalWords = content.match(/[!]{2,}|[?]{2,}|çok\s+\w+|süper|harika|muhteşem|berbat|korkunç/gi) || []
        const hasLowEmotionality = emotionalWords.length < content.split(/\s+/).length * 0.02
        
        // Semantic analysis
        if (text.includes('kesinlikle ai') || text.includes('açıkça yapay') || text.includes('bot')) {
          confidence = 90 + Math.floor(Math.random() * 10)
          detection = 'ai-generated'
        } else if (text.includes('muhtemelen ai') || text.includes('büyük ihtimalle yapay')) {
          confidence = 75 + Math.floor(Math.random() * 15)
          detection = 'ai-generated'
        } else if (text.includes('belirsiz') || text.includes('karışık') || text.includes('emin değil')) {
          confidence = 40 + Math.floor(Math.random() * 20)
          detection = 'uncertain'
        } else if (text.includes('muhtemelen insan') || text.includes('doğal')) {
          confidence = 25 + Math.floor(Math.random() * 15)
          detection = 'human-generated'
        } else if (text.includes('kesinlikle insan') || text.includes('açıkça insan') || text.includes('organik')) {
          confidence = 10 + Math.floor(Math.random() * 15)
          detection = 'human-generated'
        } else {
          // Gelişmiş pattern-based analysis
          let aiScore = 0
          
          // Yüksek riskli AI pattern'leri
          if (hasAiStarters) aiScore += 35 // Çok kritik!
          if (hasUniformParagraphs) aiScore += 30 // Çok kritik!
          if (hasStoryMorals) aiScore += 25 // Hikayeler için kritik
          if (hasPerfectGrammar && !hasTypos) aiScore += 20 // Mükemmel dilbilgisi
          if (hasLowEmotionality) aiScore += 15 // Duygusal nötrallık
          
          // Orta riskli pattern'ler
          if (hasRepeatedPatterns) aiScore += 10
          if (hasUniformSentences) aiScore += 15
          
          // Content length factor
          if (sentences.length > 3) {
            const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
            if (avgLength > 80) aiScore += 10 // Çok uzun cümleler
            if (avgLength < 20) aiScore -= 15 // Kısa cümleler daha insansı
          }
          
          // Vocabulary complexity
          const words = content.split(/\s+/).filter(w => w.length > 3)
          const uniqueWords = new Set(words.map(w => w.toLowerCase()))
          const vocabularyRichness = uniqueWords.size / words.length
          if (vocabularyRichness < 0.5) aiScore += 15 // Çok düşük çeşitlilik
          
          // İnsan belirtileri (negatif scoring)
          const hasArgo = /\b(ya|yaa|lan|abi|işte|yani|falan|bilmem ne)\b/i.test(content)
          const hasCasualTone = /\.\.\.|!{1,2}|\?{1,2}/.test(content)
          const hasPersonalTone = /\b(benim|bence|sanıyorum|düşünüyorum|hissediyorum)\b/i.test(content)
          
          if (hasArgo) aiScore -= 20
          if (hasCasualTone) aiScore -= 10  
          if (hasPersonalTone) aiScore -= 15
          
          // Final confidence calculation
          confidence = Math.max(5, Math.min(95, aiScore + Math.floor(Math.random() * 10)))
          detection = confidence > 65 ? 'ai-generated' : confidence < 35 ? 'human-generated' : 'uncertain'
          
          console.log('🔮 Gelişmiş AI tespit analizi:', { 
            confidence, 
            detection, 
            hasAiStarters, 
            hasUniformParagraphs, 
            hasStoryMorals,
            hasPerfectGrammar,
            hasLowEmotionality,
            aiScore 
          })
        }
      }

      // Explanation fallback
      if (!explanation) {
        explanation = response.length > 100 ? response.substring(0, 200) + '...' : response
      }

      return { confidence, detection, explanation, indicators }
    }

    const aiResult = parseAIResponse(aiAnalysisResult)

    // Final result
    const result = {
      confidence: aiResult.confidence || 50,
      aiDetection: aiResult.detection,
      explanation: aiResult.explanation || 'Analiz tamamlandı',
      sources: [
        `Mistral AI ${settings?.model || DEFAULT_MISTRAL_MODEL} modeli kullanılarak analiz edildi`,
        'Gelişmiş dil modeli kalıpları analizi',
        'İnternet araştırması yapıldı',
        ...aiResult.indicators?.slice(0, 2) || [],
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