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
  Save,
  Key,
  Bot,
  Check
} from 'lucide-react'

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [settings, setSettings] = useState({
    openaiApiKey: '',
    huggingfaceApiKey: '',
    mistralApiKey: '',
    defaultModel: 'mistral-small-latest'
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('sourcecheck-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('sourcecheck-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleChange = (e: any) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    })
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
            <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Search className="h-5 w-5" />
              {(sidebarOpen || (isClient && window?.innerWidth >= 768)) && <span className="ml-3">Analiz Et</span>}
            </Link>
            <Link href="/dashboard/history" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <History className="h-5 w-5" />
              {(sidebarOpen || (isClient && window?.innerWidth >= 768)) && <span className="ml-3">Geçmiş</span>}
            </Link>
            <Link href="/dashboard/settings" className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg">
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
              <h1 className="ml-4 text-2xl font-bold text-gray-900">Ayarlar</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full p-1" />
                <span className="hidden md:block text-gray-700">Kullanıcı</span>
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Panel */}
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {/* Success Message */}
            {saved && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <Check className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-green-800">Ayarlar başarıyla kaydedildi!</span>
              </div>
            )}

            {/* API Keys Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center mb-4">
                <Key className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold">API Anahtarları</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="openaiApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                    OpenAI API Anahtarı
                  </label>
                  <input
                    type="password"
                    id="openaiApiKey"
                    name="openaiApiKey"
                    value={settings.openaiApiKey}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="sk-..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    OpenAI GPT modelleri için gerekli. API anahtarınız güvenli şekilde şifrelenir.
                  </p>
                </div>

                <div>
                  <label htmlFor="mistralApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                    Mistral AI API Anahtarı
                  </label>
                  <input
                    type="password"
                    id="mistralApiKey"
                    name="mistralApiKey"
                    value={settings.mistralApiKey}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="mr-..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Mistral AI modelleri için gerekli. <a href="https://mistral.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ücretsiz hesap</a> oluşturabilirsiniz.
                  </p>
                </div>

                <div>
                  <label htmlFor="huggingfaceApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                    HuggingFace API Anahtarı
                  </label>
                  <input
                    type="password"
                    id="huggingfaceApiKey"
                    name="huggingfaceApiKey"
                    value={settings.huggingfaceApiKey}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="hf_..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    HuggingFace modellerine erişim için gerekli. İsteğe bağlı.
                  </p>
                </div>
              </div>
            </div>

            {/* Model Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center mb-4">
                <Bot className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold">Model Ayarları</h2>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Varsayılan Model
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings.defaultModel}
                  onChange={(e) => setSettings({...settings, defaultModel: e.target.value})}
                >
                  <option value="mistral-small-latest">Mistral Small (Hızlı)</option>
                  <option value="mistral-large-latest">Mistral Large (Güçlü)</option>
                  <option value="mistral-medium-latest">Mistral Medium (Dengeli)</option>
                  <option value="open-mistral-nemo">Mistral Nemo (Çok dilli)</option>
                  <option value="codestral-latest">Codestral (Kod analizi)</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  AI analizi için kullanılacak varsayılan model seçin
                </p>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center mb-4">
                <User className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold">Hesap Ayarları</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta Bildirimleri
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-600">Analiz tamamlandığında bildir</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-600">Haftalık rapor gönder</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-600">Promosyon e-postaları</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dil Tercihi
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Ayarları Kaydet
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 