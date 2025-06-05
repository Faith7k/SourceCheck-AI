'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Shield, 
  Search, 
  Settings, 
  History, 
  User, 
  LogOut,
  Menu,
  FileText,
  Image,
  Video,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  Download,
  Filter,
  Archive
} from 'lucide-react'

interface HistoryItem {
  id: string
  type: 'text' | 'image' | 'video'
  content: string
  confidence: number
  result: 'ai-generated' | 'human-generated' | 'uncertain'
  createdAt: string
  fileName?: string
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

export default function HistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [user, setUser] = useState<DemoUser | null>(null)
  const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'video'>('all')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showDemoData, setShowDemoData] = useState(false)
  const [showFeedback, setShowFeedback] = useState<{[key: string]: boolean}>({})

  // Demo veriler
  const demoHistory: HistoryItem[] = [
    {
      id: '1',
      type: 'text',
      content: 'Yapay zeka teknolojisinin gelişimi ile birlikte içerik üretiminde devrim niteliğinde değişiklikler yaşanmaktadır.',
      confidence: 89,
      result: 'ai-generated',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      type: 'image',
      content: 'landscape_image.jpg',
      confidence: 76,
      result: 'ai-generated',
      createdAt: '2024-01-14T15:45:00Z',
      fileName: 'landscape_image.jpg'
    },
    {
      id: '3',
      type: 'text',
      content: 'Bu sabah kahvaltıda yediğim menemen çok lezzetliydi. Annemin tarifiyle yapılan bu menemen...',
      confidence: 23,
      result: 'human-generated',
      createdAt: '2024-01-13T09:15:00Z'
    }
  ]

  useEffect(() => {
    setIsClient(true)
    
    // Check if user is logged in
    const demoUser = localStorage.getItem('demoUser')
    if (demoUser) {
      setUser(JSON.parse(demoUser))
    } else {
      window.location.href = '/login'
    }

    // Load history from localStorage
    const savedHistory = localStorage.getItem('sourcecheck-history')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('demoUser')
    window.location.href = '/login'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-5 w-5" />
      case 'image': return <Image className="h-5 w-5" />
      case 'video': return <Video className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'ai-generated': return 'text-red-600 bg-red-50'
      case 'human-generated': return 'text-green-600 bg-green-50'
      case 'uncertain': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredHistory = showDemoData ? demoHistory : history
  const displayHistory = filter === 'all' ? filteredHistory : filteredHistory.filter(item => item.type === filter)

  const loadDemoData = () => {
    setShowDemoData(true)
  }

  const clearHistory = () => {
    setHistory([])
    setShowDemoData(false)
    localStorage.removeItem('sourcecheck-history')
  }

  const handleHistoryFeedback = (itemId: string, isCorrect: boolean, userCorrection?: string) => {
    const updatedHistory = history.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          feedbackGiven: true,
          feedbackCorrect: isCorrect,
          userCorrection: userCorrection
        }
      }
      return item
    })

    setHistory(updatedHistory)
    localStorage.setItem('sourcecheck-history', JSON.stringify(updatedHistory))
    
    // Hide feedback form for this item
    setShowFeedback(prev => ({ ...prev, [itemId]: false }))

    // Save to feedback storage
    const item = history.find(h => h.id === itemId)
    if (item) {
      const feedbackData = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        content: item.content,
        type: item.type,
        originalResult: item.result,
        confidence: item.confidence,
        isCorrect: isCorrect,
        userCorrection: userCorrection,
        historyItemId: itemId
      }

      const existingFeedback = JSON.parse(localStorage.getItem('sourcecheck-feedback') || '[]')
      const updatedFeedback = [feedbackData, ...existingFeedback]
      localStorage.setItem('sourcecheck-feedback', JSON.stringify(updatedFeedback))
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'} md:w-64`}>
        <div className="p-4">
          <Link href="/dashboard" className="flex items-center hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
            <Shield className="h-8 w-8 text-blue-600" />
            {(sidebarOpen || (isClient && window?.innerWidth >= 768)) && (
              <span className="ml-3 text-xl font-bold text-gray-900">SourceCheck AI</span>
            )}
          </Link>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Search className="h-5 w-5" />
              {(sidebarOpen || (isClient && window?.innerWidth >= 768)) && <span className="ml-3">Analiz Et</span>}
            </Link>
            <Link href="/dashboard/history" className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg">
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
              <h1 className="ml-4 text-2xl font-bold text-gray-900">Analiz Geçmişi</h1>
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
          <div className="max-w-6xl mx-auto">
            
            {/* Filters and Actions */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1 rounded-full text-sm ${filter === 'all' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Tümü
                    </button>
                    <button
                      onClick={() => setFilter('text')}
                      className={`px-3 py-1 rounded-full text-sm ${filter === 'text' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Metin
                    </button>
                    <button
                      onClick={() => setFilter('image')}
                      className={`px-3 py-1 rounded-full text-sm ${filter === 'image' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Görsel
                    </button>
                    <button
                      onClick={() => setFilter('video')}
                      className={`px-3 py-1 rounded-full text-sm ${filter === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Video
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!showDemoData && history.length === 0 && (
                    <button
                      onClick={loadDemoData}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Demo Verileri Yükle
                    </button>
                  )}
                  {(showDemoData || history.length > 0) && (
                    <button
                      onClick={clearHistory}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Temizle
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* History Content */}
            {displayHistory.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Archive className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Henüz analiz geçmişi yok
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  İlk analizinizi yaptığınızda sonuçlar burada görünecek. 
                  Analiz yapmaya başlamak için dashboard'a gidin.
                </p>
                <div className="flex justify-center space-x-4">
                  <Link 
                    href="/dashboard"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    İlk Analizini Yap
                  </Link>
                  {!showDemoData && (
                    <button
                      onClick={loadDemoData}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium"
                    >
                      Demo Verileri Gör
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* History List */
              <div className="space-y-4">
                {displayHistory.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 bg-gray-100 rounded-lg">
                          {getTypeIcon(item.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultColor(item.result)}`}>
                              {getResultText(item.result)}
                            </span>
                            <span className="text-sm text-gray-500">
                              Güven: %{item.confidence}
                            </span>
                          </div>
                          
                          <div className="mb-2">
                            {item.type === 'text' ? (
                              <p className="text-gray-900 line-clamp-2 break-words text-sm leading-relaxed">
                                {item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content}
                              </p>
                            ) : (
                              <p 
                                className="text-gray-900 font-medium break-words text-sm"
                                title={item.fileName || item.content}
                              >
                                {(item.fileName || item.content).length > 60 ? 
                                  `${(item.fileName || item.content).substring(0, 40)}...${(item.fileName || item.content).includes('.') ? (item.fileName || item.content).substring((item.fileName || item.content).lastIndexOf('.')) : ''}` : 
                                  (item.fileName || item.content)
                                }
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(item.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                          title="Detayları Gör"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                          title="İndir"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Feedback Section */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {!item.feedbackGiven ? (
                        !showFeedback[item.id] ? (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Bu tespit doğru mu?</span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleHistoryFeedback(item.id, true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-medium flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Doğru
                              </button>
                              <button
                                onClick={() => setShowFeedback(prev => ({ ...prev, [item.id]: true }))}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-medium flex items-center"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Hatalı
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">Doğru cevap nedir?</p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleHistoryFeedback(item.id, false, 'ai-generated')}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-medium"
                              >
                                🤖 AI Üretimi
                              </button>
                              <button
                                onClick={() => handleHistoryFeedback(item.id, false, 'human-generated')}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-medium"
                              >
                                👤 İnsan Üretimi
                              </button>
                              <button
                                onClick={() => handleHistoryFeedback(item.id, false, 'uncertain')}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-xs font-medium"
                              >
                                ❓ Belirsiz
                              </button>
                              <button
                                onClick={() => setShowFeedback(prev => ({ ...prev, [item.id]: false }))}
                                className="text-gray-600 hover:text-gray-800 text-xs underline px-2"
                              >
                                İptal
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center space-x-2">
                          {item.feedbackCorrect ? (
                            <div className="flex items-center text-green-700">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              <span className="text-sm">Tespit doğru olarak işaretlendi</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-orange-700">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              <span className="text-sm">
                                Doğru cevap: {getResultText(item.userCorrection || '')} olarak düzeltildi
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 