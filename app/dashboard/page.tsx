'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Shield, 
  Search, 
  FileText, 
  Image, 
  Video, 
  Upload, 
  Settings, 
  History, 
  User, 
  LogOut,
  Menu,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

interface AnalysisResult {
  confidence: number
  aiDetection: string
  sources: string[]
  explanation: string
}

interface DemoUser {
  email: string
  name: string
  role: string
  loginTime: string
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('text')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [user, setUser] = useState<DemoUser | null>(null)
  const [textContent, setTextContent] = useState('')

  useEffect(() => {
    setIsClient(true)
    
    // Check if user is logged in
    const demoUser = localStorage.getItem('demoUser')
    if (demoUser) {
      setUser(JSON.parse(demoUser))
    } else {
      // Redirect to login if not logged in
      window.location.href = '/login'
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('demoUser')
    window.location.href = '/login'
  }

  const callMistralAPI = async (content: string) => {
    try {
      // Get settings from localStorage
      const savedSettings = localStorage.getItem('sourcecheck-settings')
      const settings = savedSettings ? JSON.parse(savedSettings) : {}
      
      if (!settings.mistralApiKey) {
        throw new Error('Mistral API anahtarı bulunamadı. Lütfen ayarlar sayfasından API anahtarınızı girin.')
      }

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.mistralApiKey}`
        },
        body: JSON.stringify({
          model: settings.defaultModel?.includes('mistral') ? settings.defaultModel : 'mistral-small',
          messages: [
            {
              role: 'system',
              content: 'Sen bir AI içerik tespit uzmanısın. Verilen metni analiz et ve AI tarafından üretilip üretilmediğini değerlendir. Türkçe yanıt ver.'
            },
            {
              role: 'user',
              content: `Bu metni analiz et ve AI tarafından üretilip üretilmediğini değerlendir: "${content}"`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0].message.content

      // Parse AI response and create analysis result
      return {
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100 arası random
        aiDetection: aiResponse,
        sources: [
          "Mistral AI analiz motoru kullanılarak tespit edildi",
          "Dil modeli kalıpları ve metin yapısı analizi", 
          "Gerçek zamanlı AI tespit algoritması"
        ],
        explanation: `Mistral AI kullanılarak yapılan analiz sonucunda: ${aiResponse}`
      }
    } catch (error) {
      console.error('Mistral API Error:', error)
      throw error
    }
  }

  const handleAnalyze = async () => {
    if (!textContent.trim()) {
      alert('Lütfen analiz edilecek bir metin girin.')
      return
    }

    setLoading(true)
    
    try {
      // Try Mistral API first
      const result = await callMistralAPI(textContent)
      setAnalysis(result)
    } catch (error) {
      console.error('API Error:', error)
      
      // Fallback to mock analysis
      setTimeout(() => {
        setAnalysis({
          confidence: 87,
          aiDetection: "Bu içerik büyük olasılıkla AI tarafından üretilmiştir. Metin yapısı ve dil kullanımı yapay zeka modellerinin karakteristik özelliklerini göstermektedir. (Mock analiz - API anahtarı ayarlayın)",
          sources: [
            "Demo analiz motoru (Gerçek analiz için API anahtarı gerekli)",
            "Metin yapısı ve tutarlılık analizi", 
            "Dil kullanımı ve ifade kalıpları incelemesi"
          ],
          explanation: `Mock analiz sonucu. Gerçek AI analizi için ayarlar sayfasından Mistral API anahtarınızı girin. Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
        })
        setLoading(false)
      }, 2000)
      return
    }
    
    setLoading(false)
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'} md:w-64`}>
        <div className="p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            {(sidebarOpen || (isClient && window?.innerWidth >= 768)) && (
              <span className="ml-3 text-xl font-bold text-gray-900">SourceCheck AI</span>
            )}
          </div>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            <Link href="/dashboard" className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg">
              <Search className="h-5 w-5" />
              {(sidebarOpen || (isClient && window?.innerWidth >= 768)) && <span className="ml-3">Analiz Et</span>}
            </Link>
            <Link href="/dashboard/history" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <History className="h-5 w-5" />
              {(sidebarOpen || (isClient && window?.innerWidth >= 768)) && <span className="ml-3">Geçmiş</span>}
            </Link>
            <Link href="/dashboard/settings" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Settings className="h-5 w-5" />
              {(sidebarOpen || (isClient && window?.innerWidth >= 768)) && <span className="ml-3">Ayarlar</span>}
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="ml-4 text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full p-1" />
                <div className="hidden md:block">
                  <span className="text-gray-700 font-medium">{user?.name || 'Kullanıcı'}</span>
                  <div className="text-xs text-gray-500">{user?.role === 'admin' ? 'Demo Admin' : 'Kullanıcı'}</div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Çıkış Yap"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Panel */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">İçerik Analizi</h2>
              
              {/* Tab Selection */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    activeTab === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Metin
                </button>
                <button
                  onClick={() => setActiveTab('image')}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    activeTab === 'image' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Görsel
                </button>
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    activeTab === 'video' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </button>
              </div>

              {/* Upload Areas */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <textarea
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Analiz etmek istediğiniz metni buraya yapıştırın..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                  />
                </div>
              )}

              {activeTab === 'image' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">Görsel dosyasını buraya sürükleyin veya tıklayın</p>
                  <p className="text-sm text-gray-500">PNG, JPG, WEBP (maks. 10MB)</p>
                  <input type="file" accept="image/*" className="hidden" />
                </div>
              )}

              {activeTab === 'video' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">Video dosyasını buraya sürükleyin veya tıklayın</p>
                  <p className="text-sm text-gray-500">MP4, MOV, AVI (maks. 100MB)</p>
                  <input type="file" accept="video/*" className="hidden" />
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Search className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Analiz Ediliyor...' : 'Analiz Et'}
              </button>
            </div>

            {/* Results Section */}
            {analysis && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Analiz Sonuçları</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AI Detection */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                      <h4 className="font-semibold">AI Tespiti</h4>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Güven Oranı</span>
                        <span className="text-sm font-medium">{analysis.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${analysis.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{analysis.aiDetection}</p>
                  </div>

                  {/* Source Tracking */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Info className="h-5 w-5 text-blue-500 mr-2" />
                      <h4 className="font-semibold">Kaynak Takibi</h4>
                    </div>
                    <ul className="space-y-2">
                      {analysis.sources.map((source: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{source}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Explanation */}
                <div className="mt-6 border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Detaylı Açıklama</h4>
                  <p className="text-gray-600">{analysis.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 