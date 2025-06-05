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
  Info,
  Loader2
} from 'lucide-react'

interface AnalysisResult {
  confidence: number
  aiDetection: string
  sources: string[]
  explanation: string
  model?: string
  timestamp?: string
  feedbackGiven?: boolean
  feedbackCorrect?: boolean
  userCorrection?: string
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
  const [error, setError] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

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

  const handleAnalyze = async () => {
    if (!textContent.trim()) {
      setError('Lütfen analiz edilecek bir metin girin.')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Get user settings for API key
      const savedSettings = localStorage.getItem('sourcecheck-settings')
      const settings = savedSettings ? JSON.parse(savedSettings) : {}

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: textContent,
          type: activeTab,
          settings: {
            model: settings.defaultModel || 'mistral-small-latest',
            apiKey: settings.mistralApiKey
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.needsApiKey) {
          setError(`${data.error} Ayarlar sayfasından API anahtarınızı girebilirsiniz.`)
        } else {
          setError(data.error || 'Analiz sırasında hata oluştu')
        }
        return
      }

      if (data.success) {
        setAnalysis(data.result)
        
        // Save to history
        const historyItem = {
          id: Date.now().toString(),
          type: activeTab,
          content: textContent,
          confidence: data.result.confidence,
          result: data.result.aiDetection,
          createdAt: new Date().toISOString()
        }
        
        const existingHistory = JSON.parse(localStorage.getItem('sourcecheck-history') || '[]')
        const updatedHistory = [historyItem, ...existingHistory].slice(0, 50) // Max 50 items
        localStorage.setItem('sourcecheck-history', JSON.stringify(updatedHistory))
      }

    } catch (error) {
      console.error('Analysis Error:', error)
      setError('Ağ hatası: Analiz servisi ile bağlantı kurulamadı')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = (isCorrect: boolean, userCorrection?: string) => {
    if (!analysis) return

    const updatedAnalysis = {
      ...analysis,
      feedbackGiven: true,
      feedbackCorrect: isCorrect,
      userCorrection: userCorrection
    }

    setAnalysis(updatedAnalysis)
    setShowFeedback(false)

    // Save feedback to a separate storage for future analysis
    const feedbackData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      content: textContent,
      type: activeTab,
      originalResult: analysis.aiDetection,
      confidence: analysis.confidence,
      isCorrect: isCorrect,
      userCorrection: userCorrection,
      model: analysis.model,
      sources: analysis.sources,
      explanation: analysis.explanation
    }

    const existingFeedback = JSON.parse(localStorage.getItem('sourcecheck-feedback') || '[]')
    const updatedFeedback = [feedbackData, ...existingFeedback]
    localStorage.setItem('sourcecheck-feedback', JSON.stringify(updatedFeedback))

    // Update history item if it exists
    const existingHistory = JSON.parse(localStorage.getItem('sourcecheck-history') || '[]')
    const updatedHistory = existingHistory.map((item: any) => {
      if (item.content === textContent && !item.feedbackGiven) {
        return { ...item, feedbackGiven: true, feedbackCorrect: isCorrect, userCorrection }
      }
      return item
    })
    localStorage.setItem('sourcecheck-history', JSON.stringify(updatedHistory))
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'ai-generated': return 'text-red-600 bg-red-50 border-red-200'
      case 'human-generated': return 'text-green-600 bg-green-50 border-green-200'
      case 'uncertain': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getResultText = (result: string) => {
    switch (result) {
      case 'ai-generated': return '🤖 AI Üretimi'
      case 'human-generated': return '👤 İnsan Üretimi'
      case 'uncertain': return '❓ Belirsiz'
      default: return '❓ Bilinmiyor'
    }
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
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
                <div>
                  <span className="text-red-800">{error}</span>
                  {error.includes('API anahtarı') && (
                    <div className="mt-2">
                      <Link 
                        href="/dashboard/settings" 
                        className="text-blue-600 hover:underline text-sm"
                      >
                        → Ayarlar sayfasına git
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                    onChange={(e) => {
                      setTextContent(e.target.value)
                      setError(null) // Clear error when user types
                    }}
                  />
                </div>
              )}

              {activeTab === 'image' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">Görsel dosyasını buraya sürükleyin veya tıklayın</p>
                  <p className="text-sm text-gray-500">PNG, JPG, WEBP (maks. 10MB)</p>
                  <p className="text-xs text-orange-600 mt-2">Yakında aktif olacak...</p>
                  <input type="file" accept="image/*" className="hidden" />
                </div>
              )}

              {activeTab === 'video' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">Video dosyasını buraya sürükleyin veya tıklayın</p>
                  <p className="text-sm text-gray-500">MP4, MOV, AVI (maks. 100MB)</p>
                  <p className="text-xs text-orange-600 mt-2">Yakında aktif olacak...</p>
                  <input type="file" accept="video/*" className="hidden" />
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading || (activeTab === 'text' && !textContent.trim()) || activeTab !== 'text'}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    {activeTab === 'text' ? 'Analiz Et' : 'Yakında Aktif'}
                  </>
                )}
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
                    
                    <div className={`mb-3 px-3 py-2 rounded-lg border ${getResultColor(analysis.aiDetection)}`}>
                      <span className="font-medium">{getResultText(analysis.aiDetection)}</span>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Güven Oranı</span>
                        <span className="text-sm font-medium">{analysis.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            analysis.confidence >= 80 ? 'bg-red-500' :
                            analysis.confidence >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${analysis.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {analysis.model && (
                      <p className="text-xs text-gray-500">Model: {analysis.model}</p>
                    )}
                  </div>

                  {/* Source Tracking */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Info className="h-5 w-5 text-blue-500 mr-2" />
                      <h4 className="font-semibold">Tespit Kaynakları</h4>
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
                  
                  {analysis.timestamp && (
                    <p className="text-xs text-gray-400 mt-3">
                      Analiz tarihi: {new Date(analysis.timestamp).toLocaleString('tr-TR')}
                    </p>
                  )}
                </div>

                {/* Feedback Section */}
                <div className="mt-6 border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold mb-3 text-blue-900">Bu tespit doğru mu?</h4>
                  
                  {!analysis.feedbackGiven ? (
                    !showFeedback ? (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleFeedback(true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Evet, doğru
                        </button>
                        <button
                          onClick={() => setShowFeedback(true)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Hayır, hatalı
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700">Doğru cevap nedir?</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleFeedback(false, 'ai-generated')}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                          >
                            🤖 AI Üretimi
                          </button>
                          <button
                            onClick={() => handleFeedback(false, 'human-generated')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                          >
                            👤 İnsan Üretimi
                          </button>
                          <button
                            onClick={() => handleFeedback(false, 'uncertain')}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                          >
                            ❓ Belirsiz
                          </button>
                        </div>
                        <button
                          onClick={() => setShowFeedback(false)}
                          className="text-gray-600 hover:text-gray-800 text-sm underline"
                        >
                          İptal
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center space-x-2">
                      {analysis.feedbackCorrect ? (
                        <div className="flex items-center text-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">Teşekkürler! Tespitin doğru olduğunu belirttiniz.</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-orange-700">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            Teşekkürler! Doğru cevabın {getResultText(analysis.userCorrection || '')} olduğunu belirttiniz.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-blue-700 mt-2">
                    💡 Geri bildirimleriniz sistemin geliştirilmesi için kullanılır.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 