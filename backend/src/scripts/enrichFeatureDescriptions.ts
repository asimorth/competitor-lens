import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// LLM ile oluşturulmuş zengin feature açıklamaları
const enrichedDescriptions: Record<string, string> = {
  "Web App": "Web tarayıcısı üzerinden erişilebilen kripto borsa platformu. Kullanıcılar herhangi bir kurulum yapmadan, tarayıcı aracılığıyla tüm trading ve yönetim işlemlerini gerçekleştirebilir. Responsive design ile mobil tarayıcılarda da optimize edilmiş deneyim sunar.",
  
  "Mobile App": "iOS ve Android platformlarında native veya cross-platform mobil uygulama. Trading, portföy takibi ve bildirimler için optimize edilmiş mobil deneyim. Push notifications, touch ID/face ID entegrasyonu, offline mode gibi mobile-specific özellikler.",
  
  "Desktop App": "Windows, macOS ve Linux için masaüstü uygulaması. Professional trader'lar için gelişmiş charting, order management ve multi-monitor desteği. Yüksek frekanslı trading için optimize edilmiş performans.",
  
  "Corporate Registration": "Kurumsal müşteriler için özel hesap açma süreci. Şirket dokümanları ile KYC, daha yüksek limitler, dedicated account manager ve toplu işlem yetkisi.",
  
  "Stocks & Commodity and Forex Trading": "Geleneksel piyasalarda (hisse senedi, emtia, forex) trading yapabilme. Tokenize edilmiş veya CFD olarak sunulabilir. TradFi meets crypto konsepti.",
  
  "Tokenized Stocks": "Gerçek hisse senetlerinin blockchain üzerinde tokenize edilmiş versiyonları. TSLA, AAPL gibi. Fractional ownership ve 24/7 trading imkanı. Yüksek regulatory risk.",
  
  "Global Customers": "Global müşteri kabulü ve hizmet verme yeteneği. Multi-country compliance, localization, international payment methods. Worldwide accessibility.",
  
  "Crypto as a Services": "B2B crypto hizmetleri. White-label çözümleri, custody services, API for businesses. Enterprise segment için infrastructure sağlama.",
  
  "Own Stablecoin": "Platform'un kendi stablecoin'i (BUSD, USDC gibi). Fiat-pegged cryptocurrency. Trading pairs için temel, ecosystem control, regulatory compliance required.",
  
  "Own Chain": "Kendi blockchain'i. BNB Chain, Base, Cronos gibi. L1 veya L2 solution. Ecosystem dominance ve transaction fee revenue için ultimate move.",
  
  "Own Card": "Crypto debit/credit card. Visa/Mastercard partnership ile günlük harcamalarda crypto kullanımı. Cashback crypto olarak. Real-world utility.",
  
  "Sign up with Bank": "Open banking ile banka hesabı doğrulama üzerinden kayıt. Instant verification, KYC acceleration, bank-level trust signal.",
  
  "Sign in with Bank": "Banka hesabı ile authentication. Open banking APIs kullanarak financial identity verification. Simplified KYC flow.",
  
  "Sign in with Passkey": "FIDO2/WebAuthn standardı ile biometric authentication. Fingerprint, Face ID ile passwordless login. Modern ve güvenli.",
  
  "Sign in with Gmail": "Google OAuth entegrasyonu. Tek tıkla kayıt/giriş. Onboarding friction azaltır, conversion rate artırır.",
  
  "Sign in with Apple": "Apple ID authentication. iOS kullanıcıları için seamless experience. Privacy-focused, hide my email özelliği.",
  
  "Sign in with Telegram": "Telegram hesabı ile giriş. Crypto community'nin favori messaging app'i. Crypto-native audience için familiar.",
  
  "Sign in with Wallet": "MetaMask, WalletConnect gibi crypto wallet'larla Web3 authentication. Self-custody principle, DeFi kullanıcıları için ideal.",
  
  "Login with QR": "QR code scan ile hızlı giriş. Mobile app ile QR okutup web'e login. Cross-device authentication, convenient UX.",
  
  "Public API": "Geliştiriciler için REST ve WebSocket API. Trading bots, portfolio trackers, market data için. Rate limiting, authentication, comprehensive documentation.",
  
  "AI Sentimentals": "AI-powered market sentiment analizi. Social media, news, on-chain data analizi. Trading signals ve market insights. Innovation showcase.",
  
  "Copy Trading": "Başarılı trader'ların işlemlerini otomatik kopyalama. Social trading, leaderboard, performance tracking. Beginner-friendly passive trading.",
  
  "Trade Bots for Users": "Kullanıcıların kendi trading botlarını oluşturması. Grid trading, DCA bots, arbitrage. No-code bot builder, backtesting, 7/24 otomatik trading.",
  
  "Auto-Invest (DCA)": "Dollar Cost Averaging stratejisi. Otomatik periyodik alım. Günlük/haftalık scheduled investments. Market timing stresinden kurtarır, disiplinli yatırım.",
  
  "Convert": "Crypto-to-crypto instant conversion. Market order karmaşası olmadan direkt dönüştürme. Beginner-friendly, slippage-free, simple UX.",
  
  "Convert Small Assets": "Küçük coin bakiyelerini (dust) ana asset'e çevirme. Portfolio temizleme, small balances'ı değerlendirme. UX improvement feature.",
  
  "Price Alarm": "Fiyat alarm sistemi. Belirli fiyata geldiğinde push notification veya email. 7/24 market takip gereği ortadan kaldırır, fırsat yakalama.",
  
  "Locked Staking": "Belirli süre kilitle, yüksek APY kazan. 30/60/90 gün lock periods. Early withdrawal penalties. Yüksek getiri için liquidity sacrifice.",
  
  "Flexible Staking": "İstediğin zaman çekebileceğin staking. Düşük APY ama tam esneklik. Daily compound interest. Liquidity kaybetmeden passive income.",
  
  "Loan Borrowing": "Crypto collateral ile fiat/stablecoin borrowing. Crypto satmadan likidite. Variable APR, collateralization ratio, liquidation risk management.",
  
  "Referral": "Arkadaş davet et, commission kazan. Multi-tier structure. Viral growth tool, user-driven marketing, passive income opportunity.",
  
  "Affiliate (KOL Program)": "Influencer ve KOL'lar için özel affiliate program. Higher commissions, marketing materials, analytics dashboard. Mass acquisition tool.",
  
  "Bug Bounty": "Security researchers için vulnerability reporting rewards. Responsible disclosure program. Community-driven security, brand trust building.",
  
  "On-Ramp / Off-Ramp (3rd Party)": "Moonpay, Simplex gibi 3rd party entegrasyonları. Credit card ile crypto alımı. Instant fiat-to-crypto conversion.",
  
  "Academy for Logged-in User": "Crypto eğitim platformu. Video courses, quizzes, certification. Learn-to-earn programs. User education = retention = trust.",
  
  "NFT / Marketplace": "NFT minting, trading, showcase platformu. Collection discovery, royalty management. Crypto ecosystem diversification.",
  
  "Fan Token": "Sports ve entertainment fan token platformu. Team support, voting rights, exclusive perks. Niche market, loyal community, partnership revenue.",
  
  "Gamification": "Trading ve platform kullanımını gamification ile incentivize. Badges, achievements, leaderboards. Fun element, engagement driver.",
  
  "Launchpool / Launchpad": "Yeni token launch platformu. Stake edip yeni token kazan (Launchpool) veya IEO'ya katıl (Launchpad). Early access, investment opportunity.",
  
  "Social Feed (Square)": "Twitter-like social feed. Trading ideas paylaşımı, market discussion. Community engagement, user-generated content, network effect.",
  
  "Pay (Payments)": "Crypto ile ödeme sistemi. Merchant integration, QR payments, crypto-to-fiat conversion. E-commerce entegrasyonu, real-world utility.",
  
  "API Management": "API key yönetimi. Permission settings, IP whitelisting, rotation. Security control, granular permissions, activity tracking.",
  
  "Dual Investment": "Structured product. Price prediction ile high yield. Bull/bear strategies. Options-like, 20-100% APY potential, sophisticated product.",
  
  "On-chain Earn": "DeFi protokollerine CEX arayüzünden erişim. On-chain staking, liquidity pools. CeFi güvenliği ile DeFi yields. Best of both worlds.",
  
  "VIP Loan": "VIP kullanıcılar için özel loan terms. Düşük APR, yüksek LTV, preferential service. Whale retention tool.",
  
  "TRY Nemalandırma": "Türk Lirası bakiyelere faiz. Banking alternatifi. TL liquidity çekme. TR market için competitive feature."
};

async function enrichDescriptions() {
  console.log('📝 Feature description\'ları zenginleştiriliyor...\n');
  
  let updatedCount = 0;
  let skippedCount = 0;

  for (const [featureName, description] of Object.entries(enrichedDescriptions)) {
    try {
      const feature = await prisma.feature.findUnique({
        where: { name: featureName }
      });

      if (feature) {
        await prisma.feature.update({
          where: { id: feature.id },
          data: { description }
        });
        console.log(`✅ ${featureName} - güncellendi`);
        updatedCount++;
      } else {
        console.log(`⏭️  ${featureName} - veritabanında bulunamadı`);
        skippedCount++;
      }
    } catch (error: any) {
      console.error(`❌ ${featureName} - hata: ${error.message}`);
    }
  }

  console.log(`\n🎉 Tamamlandı!`);
  console.log(`✅ Güncellenen: ${updatedCount}`);
  console.log(`⏭️  Atlanan: ${skippedCount}`);

  await prisma.$disconnect();
}

enrichDescriptions().catch(console.error);
