'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, RotateCcw, Settings as SettingsIcon, User, Key } from 'lucide-react'
import { useTranslations } from '@/lib/language-context'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { t, tSettings, tProfile } = useTranslations()
  const [activeTab, setActiveTab] = useState<'language' | 'api' | 'profile'>('language')
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('mistral-small-latest')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const models = [
    { value: 'mistral-small-latest', label: 'Mistral Small (Hızlı)' },
    { value: 'mistral-large-latest', label: 'Mistral Large (En İyi)' },
    { value: 'mistral-medium-latest', label: 'Mistral Medium (Dengeli)' },
    { value: 'open-mistral-nemo', label: 'Open Mistral Nemo' },
    { value: 'codestral-latest', label: 'Codestral (Kod İçin)' }
  ]

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // LocalStorage'a kaydet
      if (apiKey) {
        localStorage.setItem('mistral-api-key', apiKey)
      }
      localStorage.setItem('mistral-model', selectedModel)
      
      setSaveMessage(tSettings('settingsSaved'))
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage(tSettings('settingsError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetSettings = () => {
    setApiKey('')
    setSelectedModel('mistral-small-latest')
    localStorage.removeItem('mistral-api-key')
    localStorage.removeItem('mistral-model')
    setSaveMessage('Ayarlar sıfırlandı')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  React.useEffect(() => {
    // Mevcut ayarları yükle
    const savedApiKey = localStorage.getItem('mistral-api-key') || ''
    const savedModel = localStorage.getItem('mistral-model') || 'mistral-small-latest'
    setApiKey(savedApiKey)
    setSelectedModel(savedModel)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {t('navigation.home')}
              </Link>
              <div className="flex items-center">
                <SettingsIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
              </div>
            </div>
            <LanguageSwitcher variant="compact" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('language')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'language'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-3" />
                  {tSettings('languageSettings')}
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('api')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'api'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <Key className="h-5 w-5 mr-3" />
                  {tSettings('apiSettings')}
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3" />
                  {tProfile('userProfile')}
                </div>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {/* Language Settings Tab */}
              {activeTab === 'language' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {tSettings('languageSettings')}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {tSettings('selectLanguage')}
                    </p>
                  </div>
                  
                  <LanguageSwitcher variant="settings" />
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Dil Değişikliği Hakkında</h3>
                    <p className="text-blue-800 text-sm">
                      Dil değişikliği anında uygulanır ve tüm arayüz elementleri seçilen dilde görünür. 
                      Ayarınız tarayıcınızda saklanır.
                    </p>
                  </div>
                </div>
              )}

              {/* API Settings Tab */}
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {tSettings('apiSettings')}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Mistral AI servislerini kullanmak için API anahtarınızı ve model tercihinizi ayarlayın.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tSettings('mistralApiKey')}
                      </label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        API anahtarınız tarayıcınızda güvenli şekilde saklanır ve hiçbir zaman sunucularımıza gönderilmez.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tSettings('modelSelection')}
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {models.map((model) => (
                          <option key={model.value} value={model.value}>
                            {model.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Kaydediliyor...' : tSettings('saveSettings')}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleResetSettings}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {tSettings('resetSettings')}
                    </Button>
                  </div>

                  {saveMessage && (
                    <div className={`p-3 rounded-md ${
                      saveMessage.includes('Error') || saveMessage.includes('hatası')
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {saveMessage}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Settings Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {tProfile('userProfile')}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {tProfile('personalInfo')}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-900 mb-2">Geliştirme Aşamasında</h3>
                    <p className="text-yellow-800 text-sm">
                      Kullanıcı profili özellikleri şu anda geliştirme aşamasındadır. 
                      Yakında hesap yönetimi, analiz geçmişi ve daha fazla özelleştirme seçeneği eklenecektir.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 