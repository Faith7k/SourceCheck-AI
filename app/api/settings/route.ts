import { NextRequest, NextResponse } from 'next/server'

interface UserSettings {
  mistralApiKey?: string
  openaiApiKey?: string
  huggingfaceApiKey?: string
  defaultModel?: string
  notifications?: {
    analysisComplete?: boolean
    weeklyReport?: boolean
    promotions?: boolean
  }
  language?: string
}

// Mock database - gerçek uygulamada veritabanı kullanın
const userSettings = new Map<string, UserSettings>()

export async function GET(request: NextRequest) {
  try {
    // Demo user ID - gerçek uygulamada JWT token'dan alın
    const userId = 'demo-user'
    
    const settings = userSettings.get(userId) || {
      defaultModel: 'mistral-small-latest',
      notifications: {
        analysisComplete: true,
        weeklyReport: false,
        promotions: false
      },
      language: 'tr'
    }

    // API key'leri güvenlik için gizle
    const safeSettings = {
      ...settings,
      mistralApiKey: settings.mistralApiKey ? '***masked***' : '',
      openaiApiKey: settings.openaiApiKey ? '***masked***' : '',
      huggingfaceApiKey: settings.huggingfaceApiKey ? '***masked***' : ''
    }

    return NextResponse.json({
      success: true,
      settings: safeSettings
    })

  } catch (error) {
    console.error('Settings GET Error:', error)
    return NextResponse.json(
      { error: 'Ayarlar yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: UserSettings = await request.json()
    const userId = 'demo-user' // Demo user ID

    // Mevcut ayarları al
    const currentSettings = userSettings.get(userId) || {}

    // Yeni ayarları birleştir
    const updatedSettings = {
      ...currentSettings,
      ...body
    }

    // API key validasyonu - Mistral API dokümantasyonuna göre
    if (body.mistralApiKey && !body.mistralApiKey.startsWith('mr-')) {
      return NextResponse.json(
        { error: 'Geçersiz Mistral API anahtarı formatı. API anahtarı genellikle "mr-" ile başlar.' },
        { status: 400 }
      )
    }

    if (body.openaiApiKey && !body.openaiApiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'Geçersiz OpenAI API anahtarı formatı. "sk-" ile başlamalıdır.' },
        { status: 400 }
      )
    }

    // Model validasyonu
    if (body.defaultModel) {
      const validModels = [
        'mistral-small-latest',
        'mistral-large-latest', 
        'mistral-medium-latest',
        'open-mistral-nemo',
        'codestral-latest',
        'ministral-8b-latest',
        'ministral-3b-latest'
      ]
      
      if (!validModels.includes(body.defaultModel)) {
        return NextResponse.json(
          { error: `Geçersiz model seçimi: ${body.defaultModel}` },
          { status: 400 }
        )
      }
    }

    // Ayarları kaydet
    userSettings.set(userId, updatedSettings)

    return NextResponse.json({
      success: true,
      message: 'Ayarlar başarıyla kaydedildi'
    })

  } catch (error) {
    console.error('Settings POST Error:', error)
    return NextResponse.json(
      { error: 'Ayarlar kaydedilirken hata oluştu' },
      { status: 500 }
    )
  }
}

// API key'i güvenli şekilde almak için
export async function PUT(request: NextRequest) {
  try {
    const { action } = await request.json()
    const userId = 'demo-user'

    if (action === 'getApiKey') {
      const settings = userSettings.get(userId)
      
      return NextResponse.json({
        success: true,
        apiKey: settings?.mistralApiKey || process.env.MISTRAL_API_KEY || null
      })
    }

    return NextResponse.json(
      { error: 'Geçersiz aksiyon' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Settings PUT Error:', error)
    return NextResponse.json(
      { error: 'İşlem gerçekleştirilemedi' },
      { status: 500 }
    )
  }
} 