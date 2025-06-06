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
  CreditCard,
  Check,
  Crown,
  Zap
} from 'lucide-react'

export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPlan] = useState('free') // free, pro, enterprise
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'} md:w-64`}>
        <div className="p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            {(sidebarOpen || (isClient && window.innerWidth >= 768)) && (
              <span className="ml-3 text-xl font-bold text-gray-900">SourceCheck AI</span>
            )}
          </div>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Search className="h-5 w-5" />
              {(sidebarOpen || (isClient && window.innerWidth >= 768)) && <span className="ml-3">Analiz Et</span>}
            </Link>
            <Link href="/dashboard/history" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <History className="h-5 w-5" />
              {(sidebarOpen || (isClient && window.innerWidth >= 768)) && <span className="ml-3">Geçmiş</span>}
            </Link>
            <Link href="/dashboard/settings" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Settings className="h-5 w-5" />
              {(sidebarOpen || (isClient && window.innerWidth >= 768)) && <span className="ml-3">Ayarlar</span>}
            </Link>
            <Link href="/dashboard/billing" className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg">
              <CreditCard className="h-5 w-5" />
              {(sidebarOpen || (isClient && window.innerWidth >= 768)) && <span className="ml-3">Faturalandırma</span>}
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
              <h1 className="ml-4 text-2xl font-bold text-gray-900">Faturalandırma</h1>
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
          <div className="max-w-4xl mx-auto">
            {/* Current Plan */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Mevcut Planınız</h2>
              
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="flex items-center">
                  {currentPlan === 'free' && <Zap className="h-8 w-8 text-gray-500 mr-3" />}
                  {currentPlan === 'pro' && <Crown className="h-8 w-8 text-blue-500 mr-3" />}
                  {currentPlan === 'enterprise' && <Crown className="h-8 w-8 text-purple-500 mr-3" />}
                  
                  <div>
                    <h3 className="text-lg font-semibold capitalize">
                      {currentPlan === 'free' && 'Ücretsiz Plan'}
                      {currentPlan === 'pro' && 'Pro Plan'}
                      {currentPlan === 'enterprise' && 'Kurumsal Plan'}
                    </h3>
                    <p className="text-gray-600">
                      {currentPlan === 'free' && 'Günde 10 analiz • Temel özellikler'}
                      {currentPlan === 'pro' && 'Günde 500 analiz • Gelişmiş özellikler'}
                      {currentPlan === 'enterprise' && 'Sınırsız analiz • Tüm özellikler'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {currentPlan === 'free' && '₺0'}
                    {currentPlan === 'pro' && '₺99'}
                    {currentPlan === 'enterprise' && '₺499'}
                  </div>
                  <div className="text-gray-600">/ay</div>
                </div>
              </div>

              {currentPlan === 'free' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    💡 Pro plana geçerek günde 500 analiz yapabilir ve gelişmiş özelliklere erişebilirsiniz.
                  </p>
                </div>
              )}
            </div>

            {/* Usage Statistics */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Bu Ay Kullanımınız</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">47</div>
                  <div className="text-gray-600">Toplam Analiz</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {currentPlan === 'free' ? '310 analiz kaldı' : 'Sınırsız'}
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">32</div>
                  <div className="text-gray-600">Metin Analizi</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">15</div>
                  <div className="text-gray-600">Görsel Analizi</div>
                </div>
              </div>
            </div>

            {/* Upgrade Options */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Plan Seçenekleri</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free Plan */}
                <div className={`border-2 rounded-lg p-6 ${currentPlan === 'free' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Ücretsiz</h3>
                    <div className="text-3xl font-bold mb-4">₺0<span className="text-lg text-gray-600">/ay</span></div>
                    
                    <ul className="text-left space-y-3 mb-6">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">Günde 10 analiz</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">Temel raporlama</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">E-posta desteği</span>
                      </li>
                    </ul>
                    
                    {currentPlan === 'free' ? (
                      <div className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium">
                        Mevcut Plan
                      </div>
                    ) : (
                      <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50">
                        Ücretsiz'e Geç
                      </button>
                    )}
                  </div>
                </div>

                {/* Pro Plan */}
                <div className={`border-2 rounded-lg p-6 relative ${currentPlan === 'pro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  {currentPlan !== 'pro' && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">Popüler</span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Pro</h3>
                    <div className="text-3xl font-bold mb-4">₺99<span className="text-lg text-gray-600">/ay</span></div>
                    
                    <ul className="text-left space-y-3 mb-6">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">Günde 500 analiz</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">Gelişmiş raporlama</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">API erişimi</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">Öncelikli destek</span>
                      </li>
                    </ul>
                    
                    {currentPlan === 'pro' ? (
                      <div className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium">
                        Mevcut Plan
                      </div>
                    ) : (
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium">
                        Pro'ya Yükselt
                      </button>
                    )}
                  </div>
                </div>

                {/* Enterprise Plan */}
                <div className={`border-2 rounded-lg p-6 ${currentPlan === 'enterprise' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Kurumsal</h3>
                    <div className="text-3xl font-bold mb-4">₺499<span className="text-lg text-gray-600">/ay</span></div>
                    
                    <ul className="text-left space-y-3 mb-6">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">Sınırsız analiz</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">Özel raporlama</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">Özel entegrasyonlar</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">7/24 destek</span>
                      </li>
                    </ul>
                    
                    {currentPlan === 'enterprise' ? (
                      <div className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium">
                        Mevcut Plan
                      </div>
                    ) : (
                      <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium">
                        İletişime Geçin
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            {currentPlan !== 'free' && (
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4">Ödeme Yöntemi</h2>
                
                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div className="flex items-center">
                    <CreditCard className="h-6 w-6 text-gray-500 mr-3" />
                    <div>
                      <div className="font-medium">•••• •••• •••• 4242</div>
                      <div className="text-sm text-gray-600">Visa ile biten 4242</div>
                    </div>
                  </div>
                  
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Güncelle
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 