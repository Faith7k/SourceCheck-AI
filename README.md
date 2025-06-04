# SourceCheck AI - AI İçerik Tespit ve Kaynak Takip Sistemi

SourceCheck AI, metin, görsel ve video içeriklerinin AI tarafından üretilip üretilmediğini tespit eden ve kaynaklarını takip eden modern bir web uygulamasıdır.

## Özellikler

### 🔍 Gelişmiş İçerik Analizi
- **Metin Analizi**: ChatGPT, Claude, Gemini gibi AI modellerin ürettiği metinleri tespit
- **Görsel Analizi**: DALL-E, Midjourney, Stable Diffusion ile üretilen görselleri tanıma
- **Video Analizi**: AI ile oluşturulan video içeriklerini analiz etme

### 📊 Detaylı Raporlama
- Güven oranı ile birlikte analiz sonuçları
- Kaynak takibi ve model tespiti
- Açıklayıcı ve anlaşılır raporlar

### 🎯 Kullanıcı Dostu Arayüz
- Modern ve responsive tasarım
- Sürükle-bırak dosya yükleme
- Gerçek zamanlı sonuçlar

### 🔐 Güvenlik ve Gizlilik
- End-to-end şifreleme
- Güvenli API key yönetimi
- GDPR uyumlu veri işleme

## Teknoloji Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **UI Components**: shadcn/ui benzeri custom components
- **State Management**: React Hooks

## Kurulum

### Gereksinimler
- Node.js 18.0 veya üzeri
- npm veya yarn package manager

### Adımlar

1. **Repoyu klonlayın**
```bash
git clone https://github.com/[username]/sourcecheck-ai.git
cd sourcecheck-ai
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
# veya
yarn install
```

3. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
# veya
yarn dev
```

4. **Tarayıcınızda açın**
```
http://localhost:3000
```

## Proje Yapısı

```
sourcecheck-ai/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Dashboard sayfaları
│   │   ├── billing/            # Faturalandırma
│   │   ├── settings/           # Ayarlar
│   │   └── page.tsx           # Ana dashboard
│   ├── login/                  # Giriş sayfası
│   ├── signup/                 # Kayıt sayfası
│   ├── globals.css            # Global stiller
│   ├── layout.tsx             # Ana layout
│   └── page.tsx               # Ana sayfa (landing)
├── components/
│   └── ui/                     # UI bileşenleri
│       └── button.tsx         # Button component
├── lib/
│   └── utils.ts               # Utility fonksiyonlar
├── public/                     # Statik dosyalar
├── package.json               # Proje bağımlılıkları
├── tailwind.config.js         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
└── README.md                  # Bu dosya
```

## Sayfalar ve Özellikler

### 🏠 Ana Sayfa (Landing Page)
- Hero section ile ürün tanıtımı
- Özellik listesi ve avantajlar
- Fiyatlandırma planları (Ücretsiz, Pro, Kurumsal)
- Footer ve navigasyon

### 🔐 Kimlik Doğrulama
- **Giriş Sayfası**: E-posta/şifre veya Google ile giriş
- **Kayıt Sayfası**: Hesap oluşturma formu
- Form validasyonu ve hata yönetimi

### 📊 Dashboard
- **Ana Panel**: İçerik yükleme ve analiz arayüzü
- **Tab Sistemi**: Metin, Görsel, Video analizi seçimi
- **Sonuç Paneli**: AI tespit oranı, güven seviyesi, kaynak bilgisi
- **Sidebar Navigasyon**: Analiz, Geçmiş, Ayarlar, Faturalandırma

### ⚙️ Ayarlar Sayfası
- **API Anahtarları**: OpenAI, HuggingFace API key yönetimi
- **Model Seçimi**: Varsayılan LLM model seçimi
- **Hesap Ayarları**: Bildirimler, dil tercihi
- **Güvenlik**: Şifreli API key saklama

### 💳 Faturalandırma
- **Mevcut Plan**: Aktif plan bilgisi ve kullanım istatistikleri
- **Plan Yükseltme**: Ücretsiz, Pro, Kurumsal planlar arası geçiş
- **Ödeme Yöntemi**: Kredi kartı bilgileri (Stripe-ready)
- **Kullanım Takibi**: Aylık analiz sayısı ve limitler

## Fiyatlandırma Planları

### 🆓 Ücretsiz Plan
- Günde 10 analiz
- Temel raporlama
- E-posta desteği
- **₺0/ay**

### 🚀 Pro Plan
- Günde 500 analiz
- Gelişmiş raporlama
- API erişimi
- Öncelikli destek
- **₺99/ay**

### 🏢 Kurumsal Plan
- Sınırsız analiz
- Özel raporlama
- Özel entegrasyonlar
- 7/24 destek
- **₺499/ay**

## Mock Data ve Simülasyon

Şu anda uygulama mock data ile çalışmaktadır:

- **Login/Signup**: Form submit edildiğinde dashboard'a yönlendirme
- **Analiz**: 2 saniye loading sonrası örnek sonuç gösterimi
- **Ayarlar**: Form değişiklikleri local state'te tutulur
- **Faturalandırma**: Statik plan bilgileri ve mock kullanım verileri

## Gelecek Geliştirmeler

### Backend Entegrasyonu
- [ ] Node.js/Express veya Python/FastAPI backend
- [ ] PostgreSQL/MongoDB veritabanı
- [ ] Redis cache sistemi
- [ ] JWT authentication

### AI Model Entegrasyonları
- [ ] OpenAI GPT models
- [ ] HuggingFace Transformers
- [ ] Custom AI detection models
- [ ] Image analysis APIs

### Ödeme Sistemi
- [ ] Stripe payment gateway
- [ ] Subscription management
- [ ] Invoice generation
- [ ] Usage tracking

### Gelişmiş Özellikler
- [ ] Batch processing
- [ ] API endpoints
- [ ] Webhook integrations
- [ ] Real-time notifications
- [ ] Multi-language support

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasını inceleyin.

## İletişim

- **E-posta**: info@sourcecheck.ai
- **Website**: https://sourcecheck.ai
- **GitHub**: https://github.com/[username]/sourcecheck-ai

---

**SourceCheck AI** - AI içerik tespiti ve kaynak takibi için güvenilir çözümünüz. 🚀 