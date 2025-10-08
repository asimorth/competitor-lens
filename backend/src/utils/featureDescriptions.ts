// LLM analizi ile oluşturulmuş feature açıklamaları
export const featureDescriptions: Record<string, {
  description: string;
  businessValue: string;
  technicalComplexity: string;
  userBenefit: string;
  competitiveAdvantage: string;
}> = {
  "Web App": {
    description: "Web tarayıcısı üzerinden erişilebilen kripto borsa platformu. Kullanıcılar herhangi bir kurulum yapmadan, tarayıcı aracılığıyla tüm trading ve yönetim işlemlerini gerçekleştirebilir.",
    businessValue: "Temel giriş noktası ve en düşük maliyetli erişim kanalı. Tüm borsalar için olmazsa olmaz.",
    technicalComplexity: "Orta - Modern web framework'leri (React, Vue) ile responsive ve performanslı geliştirilebilir.",
    userBenefit: "Platform bağımsız erişim, her yerden kullanım, kurulum gerektirmez.",
    competitiveAdvantage: "Web app olmadan rekabet edilemez. UI/UX kalitesi diferansiyasyon sağlar."
  },
  "Mobile App": {
    description: "iOS ve Android platformlarında native veya cross-platform mobil uygulama. Trading, portföy takibi ve bildirimler için optimize edilmiş mobil deneyim.",
    businessValue: "Kullanıcı engagement ve retention için kritik. Mobile-first kullanıcı tabanı için zorunlu.",
    technicalComplexity: "Yüksek - Native (Swift/Kotlin) veya React Native ile development, App Store/Play Store onayları.",
    userBenefit: "Her zaman cebinizde, push bildirimleri, touch ID, hızlı erişim.",
    competitiveAdvantage: "Mobile app kalitesi kullanıcı sadakatini doğrudan etkiler. Binance'in başarısının temel taşı."
  },
  "Desktop App": {
    description: "Windows, macOS ve Linux için masaüstü uygulaması. Professional trader'lar için gelişmiş charting ve order management araçları.",
    businessValue: "Professional trader segmenti için önemli. Yüksek frekanslı trader'lar masaüstü tercih eder.",
    technicalComplexity: "Orta-Yüksek - Electron veya native development, multi-platform support.",
    userBenefit: "Daha hızlı performans, gelişmiş trading araçları, multi-monitor desteği.",
    competitiveAdvantage: "Pro trader'lar için must-have. Ancak kullanıcı sayısı web/mobile'a göre düşük."
  },
  "Spot Trading": {
    description: "Kripto paraların anında piyasa fiyatından alım-satımı. En temel ve en yaygın trading tipi. Order book, market/limit order gibi standart trading özellikleri.",
    businessValue: "Borsanın temel gelir kaynağı. Trading fee'leri ana revenue stream.",
    technicalComplexity: "Yüksek - Real-time order matching engine, liquidity management, risk kontrolü.",
    userBenefit: "Basit ve anlaşılır crypto alım-satımı. Tüm kullanıcılar için erişilebilir.",
    competitiveAdvantage: "Temel feature, diferansiyasyon fiyat/fee yapısı ve kullanıcı deneyiminde."
  },
  "Futures Trading": {
    description: "Vadeli işlem trading özellikleri. USDT-M ve COIN-M perpetual futures, leverage (kaldıraç) ile pozisyon açma. Advanced trader'lar için yüksek risk-getiri oranı.",
    businessValue: "Yüksek volume ve fee geliri. Professional trader'ları çeken özellik.",
    technicalComplexity: "Çok Yüksek - Margin management, liquidation engine, funding rate hesaplamaları, risk engine.",
    userBenefit: "Leverage ile yüksek getiri potansiyeli, short pozisyon açabilme, hedge yapabilme.",
    competitiveAdvantage: "Binance'in dominasyonunu sağlayan ana feature'lardan. Likidite çok kritik."
  },
  "Margin Trading": {
    description: "Borç alarak (margin) spot trading yapma. Cross margin ve isolated margin seçenekleri. Kaldıraçlı trading ama futures'tan daha basit.",
    businessValue: "Orta-yüksek gelir. Futures'a göre daha az riskli ama yine de attractive.",
    technicalComplexity: "Yüksek - Collateral management, liquidation, interest rate hesaplamaları.",
    userBenefit: "Spot trading'in leverage ile güçlendirilmiş hali. Daha kontrollü risk.",
    competitiveAdvantage: "Futures alternatifi olarak önemli. Bazı kullanıcılar futures yerine tercih eder."
  },
  "P2P Trading": {
    description: "Peer-to-peer, kullanıcılar arası direkt alım-satım platformu. Fiat para ile crypto alımında escrow hizmeti. Farklı ödeme yöntemleri desteği.",
    businessValue: "Fiat onboarding için kritik. Özellikle bankacılık kısıtlaması olan ülkelerde.",
    technicalComplexity: "Orta - Escrow sistemi, dispute resolution, payment method integrations.",
    userBenefit: "Banka transferi ile crypto alımı, lokal ödeme yöntemleri, rekabetçi fiyatlar.",
    competitiveAdvantage: "Emerging market'lerde çok önemli. Binance P2P'nin global başarısı bunu gösteriyor."
  },
  "Staking": {
    description: "Kripto paraları stake ederek pasif gelir elde etme. Locked (kilitli) ve flexible (esnek) staking seçenekleri. PoS coin'leri için ödül kazanma.",
    businessValue: "User retention için mükemmel. Passive income opportunity engagement artırır.",
    technicalComplexity: "Orta - Staking pool management, reward distribution, lock period tracking.",
    userBenefit: "Kripto varlıklardan pasif gelir, HODLing teşviki, compound interest.",
    competitiveAdvantage: "Earn kategorisinin en popüler feature'ı. Yüksek APY oranları rekabet avantajı."
  },
  "Locked Staking": {
    description: "Belirli bir süre için kilitlenen staking. Daha yüksek APY oranları sunar. 30/60/90 gün gibi sabit süreler.",
    businessValue: "Liquidity lock ederek platforma bağlılık yaratır. Daha yüksek APY = daha çok kullanıcı.",
    technicalComplexity: "Orta - Lock period enforcement, early withdrawal penalties, APY calculation.",
    userBenefit: "Flexible staking'den daha yüksek getiri. Uzun vadeli yatırım için ideal.",
    competitiveAdvantage: "APY rekabeti yoğun. En yüksek oranları sunmak kritik."
  },
  "Flexible Staking": {
    description: "İstediğiniz zaman çekebileceğiniz staking. Daha düşük APY ama tamamen esnek. Daily compound interest.",
    businessValue: "Kullanıcı esnekliği sunar. Lock istemeyenler için önemli.",
    technicalComplexity: "Orta - Dynamic APY calculation, instant unstaking, reward distribution.",
    userBenefit: "Likidite kaybetmeden pasif gelir. Her an çekebilme özgürlüğü.",
    competitiveAdvantage: "Locked staking'e göre daha az rekabetçi ama kullanıcı segmentasyonu için önemli."
  },
  "Copy Trading": {
    description: "Başarılı trader'ların işlemlerini otomatik kopyalama. Social trading platformu. Leader board, performance tracking.",
    businessValue: "Yeni kullanıcıları çeker. Trading volume artırır. Social aspect engagement sağlar.",
    technicalComplexity: "Yüksek - Real-time trade copying, leader selection algorithm, risk management.",
    userBenefit: "Deneyimsiz kullanıcılar uzman trader'ları takip edebilir. Passive trading.",
    competitiveAdvantage: "Niche ama loyalty yaratan feature. ByBit ve OKX'in güçlü yanı."
  },
  "Trade Bots for Users": {
    description: "Kullanıcıların kendi trading botlarını oluşturabilmesi. Grid trading, DCA bots, arbitrage bots. No-code bot builder.",
    businessValue: "Advanced user'ları çeker. Trading volume artırır. Retention sağlar.",
    technicalComplexity: "Çok Yüksek - Bot execution engine, strategy builder, backtesting, API integration.",
    userBenefit: "Otomatik trading stratejileri. 7/24 çalışan botlar. Emotion-free trading.",
    competitiveAdvantage: "Binance'in güçlü feature'larından. Technical user'lar için must-have."
  },
  "Auto-Invest (DCA)": {
    description: "Dollar Cost Averaging stratejisi. Otomatik periyodik alım yapma. Belirli aralıklarla (günlük/haftalık) sabit miktar yatırım.",
    businessValue: "Long-term investor'ları çeker. Recurring revenue sağlar. User retention artırır.",
    technicalComplexity: "Düşük-Orta - Scheduled transactions, auto-buy execution, portfolio allocation.",
    userBenefit: "Market timing stresinden kurtarır. Disiplinli yatırım. Set and forget.",
    competitiveAdvantage: "Retail investor'lar için çok popüler. Implementation kolay, impact yüksek."
  },
  "NFT / Marketplace": {
    description: "NFT alım-satım platformu. NFT minting, trading, collection showcase. Kripto borsalarının NFT dünyasına açılan kapısı.",
    businessValue: "2021-2022'de hype vardı, şimdi düştü. Ecosystem genişletme stratejisi.",
    technicalComplexity: "Orta - NFT smart contract integration, IPFS storage, marketplace mechanics.",
    userBenefit: "Crypto ve NFT'yi tek platformda. Collection trading, royalty payments.",
    competitiveAdvantage: "Artık commodity feature. Binance ve OKX'de var ama kritik değil."
  },
  "Pay (Payments)": {
    description: "Crypto ile ödeme sistemi. Merchant integration, QR code payments, crypto-to-fiat instant conversion. E-ticaret entegrasyonu.",
    businessValue: "Real-world utility. Merchant adoption ile ecosystem büyütme.",
    technicalComplexity: "Yüksek - Payment gateway, merchant API, compliance, instant settlement.",
    userBenefit: "Crypto'yu günlük hayatta kullanma. Instant conversion, low fees.",
    competitiveAdvantage: "Binance Pay ve Coinbase Commerce gibi. Adoption düşük ama strategically important."
  },
  "Public API": {
    description: "Geliştiriciler için REST ve WebSocket API. Trading bots, portfolio trackers, market data integration için.",
    businessValue: "Advanced user'ları çeker. Third-party tool ecosystem yaratır. Volume artırır.",
    technicalComplexity: "Orta - API design, rate limiting, authentication, documentation.",
    userBenefit: "Kendi toollarını yazabilme. Automation, data analysis, custom strategies.",
    competitiveAdvantage: "Must-have for serious exchanges. API kalitesi trader retention'ı etkiler."
  },
  "API Management": {
    description: "Kullanıcıların API key'lerini yönetmesi. Permission settings, IP whitelisting, API key rotation.",
    businessValue: "Security ve control. Power user'lar için önemli.",
    technicalComplexity: "Düşük-Orta - Key generation, permission system, audit logs.",
    userBenefit: "Güvenli API kullanımı. Granular permissions. Activity tracking.",
    competitiveAdvantage: "Public API'nin complement'i. İkisi birlikte olmalı."
  },
  "Sign in with Passkey": {
    description: "FIDO2/WebAuthn standardı ile biometric authentication. Fingerprint, Face ID ile passwordless login.",
    businessValue: "Security artırır. Modern authentication. User experience iyileştirir.",
    technicalComplexity: "Orta - WebAuthn implementation, device registration, fallback mechanisms.",
    userBenefit: "Şifre gerektirmez. Biometric login. Daha güvenli ve hızlı.",
    competitiveAdvantage: "Modern ve innovative. Security-conscious kullanıcıları çeker."
  },
  "Sign in with Gmail": {
    description: "Google OAuth ile giriş. Kullanıcılar Google hesaplarıyla tek tıkla kayıt/giriş yapabilir.",
    businessValue: "Onboarding friction azaltır. Conversion rate artırır.",
    technicalComplexity: "Düşük - OAuth 2.0 integration, Google SDK.",
    userBenefit: "Hızlı kayıt. Şifre hatırlama gerektirmez. Trusted identity provider.",
    competitiveAdvantage: "Standard feature. Olmamak disadvantage yaratır."
  },
  "Sign in with Apple": {
    description: "Apple ID ile giriş. iOS kullanıcıları için seamless authentication. Privacy-focused.",
    businessValue: "iOS user'ları için önemli. Apple ecosystem integration.",
    technicalComplexity: "Düşük-Orta - Apple Sign In integration, privacy features.",
    userBenefit: "Privacy-preserving. iOS'ta seamless experience. Hide my email özelliği.",
    competitiveAdvantage: "iOS kullanıcıları için must-have. Coinbase güçlü bu konuda."
  },
  "Sign in with Telegram": {
    description: "Telegram hesabı ile giriş. Crypto community'nin favori messaging app'i ile entegrasyon.",
    businessValue: "Crypto-native audience için familiar. Community engagement sağlar.",
    technicalComplexity: "Düşük - Telegram Bot API, OAuth flow.",
    userBenefit: "Crypto kullanıcıları zaten Telegram'da. Quick onboarding.",
    competitiveAdvantage: "Crypto-specific advantage. Traditional fintech'te yok."
  },
  "Sign in with Wallet": {
    description: "MetaMask, WalletConnect gibi crypto wallet'larla giriş. Web3 authentication.",
    businessValue: "DeFi user'ları çeker. Web3 native experience. Self-custody principle.",
    technicalComplexity: "Orta - Wallet Connect integration, signature verification, nonce management.",
    userBenefit: "Self-custody. Wallet'tan direkt giriş. No email/password.",
    competitiveAdvantage: "Web3 positioning için critical. DeFi integration'ın ilk adımı."
  },
  "Login with QR": {
    description: "QR code ile hızlı giriş. Mobile app ile QR scan edip web'e login. Güvenli ve hızlı.",
    businessValue: "UX improvement. Cross-device authentication.",
    technicalComplexity: "Düşük-Orta - QR generation, WebSocket for real-time, session management.",
    userBenefit: "Şifre yazmadan hızlı giriş. Mobile-to-web flow. Convenient.",
    competitiveAdvantage: "Nice-to-have. Binance ve OKX'de var."
  },
  "Convert": {
    description: "Crypto-to-crypto instant conversion. Market order atmadan direkt dönüştürme. Slippage free, simple UX.",
    businessValue: "Beginner-friendly. Trading fee geliri. Alternative to spot trading.",
    technicalComplexity: "Orta - Price oracle, instant settlement, liquidity pools.",
    userBenefit: "Kolay kullanım. Order book karmaşası yok. Instant conversion.",
    competitiveAdvantage: "Beginner onboarding için kritik. Coinbase'in strong feature'ı."
  },
  "Convert Small Assets": {
    description: "Küçük miktardaki coin'leri BNB/USDT gibi ana asset'e çevirme. Dust conversion. Portfolio temizleme.",
    businessValue: "User satisfaction. Portfolio management kolaylaştırır.",
    technicalComplexity: "Düşük - Minimum amount aggregation, automatic conversion.",
    userBenefit: "Küçük bakiyeleri değerlendirebilme. Clean portfolio.",
    competitiveAdvantage: "Small feature ama UX için önemli. Binance'de \"Convert to BNB\" çok kullanılıyor."
  },
  "Price Alarm": {
    description: "Fiyat alarmları. Belirli fiyata geldiğinde bildirim. Push notification veya email.",
    businessValue: "Engagement artırır. App'e dönüş sağlar.",
    technicalComplexity: "Düşük - Price monitoring, notification system, user preferences.",
    userBenefit: "Market'ı 7/24 takip etmeye gerek yok. Fırsat yakalama.",
    competitiveAdvantage: "Standard feature. Olmamak eksiklik yaratır."
  },
  "Loan Borrowing": {
    description: "Crypto collateral ile borç alma. Crypto satmadan likidite. Variable APR, collateralization ratio.",
    businessValue: "DeFi competition. Interest income. Liquidity sağlama.",
    technicalComplexity: "Çok Yüksek - Collateral management, liquidation engine, interest calculation, risk assessment.",
    userBenefit: "Crypto satmadan nakit. Tax efficient. Maintain crypto exposure.",
    competitiveAdvantage: "DeFi alternative olarak önemli. Binance Loans başarılı."
  },
  "VIP Loan": {
    description: "VIP kullanıcılar için özel loan şartları. Daha düşük APR, daha yüksek LTV, preferential terms.",
    businessValue: "Whale user'ları retain etme. High value segment.",
    technicalComplexity: "Orta - VIP tier integration, custom terms, manual approvals.",
    userBenefit: "Better rates. Higher limits. Preferential service.",
    competitiveAdvantage: "VIP program'ın parçası. Whale user'lar için important."
  },
  "Dual Investment": {
    description: "Structured product. Price prediction ile high yield. Bull/Bear market strategies. Options-like product.",
    businessValue: "High APY ile kullanıcı çekme. Sophisticated product.",
    technicalComplexity: "Yüksek - Options pricing, settlement logic, risk calculations.",
    userBenefit: "Yüksek getiri potansiyeli (20-100% APY). Market view ile betting.",
    competitiveAdvantage: "Binance'in innovative Earn product'ı. Differentiation sağlıyor."
  },
  "On-chain Earn": {
    description: "DeFi protokollerine direkt katılım. On-chain staking, liquidity providing. CEX arayüzü ile DeFi yield.",
    businessValue: "DeFi yield'leri platform içinde sunma. Ecosystem expansion.",
    technicalComplexity: "Çok Yüksek - Smart contract integration, wallet management, transaction handling.",
    userBenefit: "DeFi getirilerine kolay erişim. CEX güvenliği ile DeFi yields.",
    competitiveAdvantage: "CeFi ve DeFi hybrid approach. Future trend."
  },
  "NFT / Marketplace Extended": {
    description: "NFT mint, buy, sell, trade platformu. Collection showcase. Launchpad for NFT projects.",
    businessValue: "Ecosystem diversification. 2021-22'de hot ama şimdi durgun.",
    technicalComplexity: "Orta-Yüksek - NFT smart contracts, IPFS, marketplace mechanics.",
    userBenefit: "Crypto ve NFT tek platformda. Unified wallet. Easy discovery.",
    competitiveAdvantage: "Artık commodity. Binance NFT, Coinbase NFT var ama volume düşük."
  },
  "Launchpool / Launchpad": {
    description: "Yeni token launch platformu. Stake ederek yeni token kazanma (Launchpool). IEO participation (Launchpad).",
    businessValue: "Token listing revenue. Community engagement. Early access value proposition.",
    technicalComplexity: "Orta-Yüksek - Token distribution, fair allocation, KYC integration, vesting.",
    userBenefit: "Yeni projelere early access. Free token'lar (Launchpool). Investment opportunity.",
    competitiveAdvantage: "Binance Launchpad'in success story legendary. User loyalty driver."
  },
  "Social Feed (Square)": {
    description: "Kullanıcıların trading idea'larını paylaştığı social feed. Twitter-like experience. Tips and analysis.",
    businessValue: "Engagement ve retention. Community building. User-generated content.",
    technicalComplexity: "Orta - Social feed infrastructure, moderation, ranking algorithm.",
    userBenefit: "Community ile bağ. Trading idea'ları. Market sentiment.",
    competitiveAdvantage: "Binance Square başarılı. Social aspect differentiator olabilir."
  },
  "Referral": {
    description: "Referral programı. Arkadaş davet et, commission kazan. Multi-tier referral structure.",
    businessValue: "Viral growth. Acquisition cost azaltır. User-driven marketing.",
    technicalComplexity: "Düşük-Orta - Referral tracking, commission calculation, payout system.",
    userBenefit: "Passive income. Arkadaşlarını davet et, trading fee'lerinden kazan.",
    competitiveAdvantage: "Must-have for growth. Binance'in explosive growth'unda kritik rol."
  },
  "Affiliate (KOL Program)": {
    description: "Influencer ve KOL'lar için affiliate program. Higher commission rates. Marketing materials.",
    businessValue: "Influencer marketing. Mass acquisition. Brand awareness.",
    technicalComplexity: "Orta - Advanced tracking, custom commission structures, analytics dashboard.",
    userBenefit: "KOL'lar için gelir. Followers'a özel deals.",
    competitiveAdvantage: "Referral'dan daha sophisticated. Binance Angels programı gibi."
  },
  "Bug Bounty": {
    description: "Security researchers için bug bounty programı. Vulnerability reporting rewards. Security improvement.",
    businessValue: "Security enhancement. Community-driven security testing. Brand trust.",
    technicalComplexity: "Orta - Submission system, verification, reward distribution, disclosure policy.",
    userBenefit: "Güvenlik artırır. Researcher'lar için ödül.",
    competitiveAdvantage: "Security positioning. Trust building. Kraken güçlü bu konuda."
  },
  "Own Chain": {
    description: "Kendi blockchain'i. BNB Chain (BSC), Coinbase Base gibi. L1 veya L2 solution.",
    businessValue: "Ecosystem dominance. Transaction fee revenue. Developer ecosystem.",
    technicalComplexity: "Çok Çok Yüksek - Blockchain development, validator network, ecosystem incentives.",
    userBenefit: "Düşük fee'li chain. Platform-specific DeFi ecosystem.",
    competitiveAdvantage: "Ultimate differentiation. Binance'in en güçlü moat'larından (BNB Chain)."
  },
  "Own Stablecoin": {
    description: "Platform'un kendi stablecoin'i. BUSD, USDC gibi. Fiat-pegged cryptocurrency.",
    businessValue: "Trading pairs için kritik. Fee revenue. Monetary control.",
    technicalComplexity: "Çok Yüksek - Regulatory compliance, reserve management, peg maintenance.",
    userBenefit: "Stable value. Trading intermediate currency. Low volatility.",
    competitiveAdvantage: "Strategic but risky. Binance BUSD durdu, Circle USDC başarılı."
  },
  "Own Card": {
    description: "Crypto debit/credit card. Crypto harcama, cashback crypto olarak. Visa/Mastercard partnership.",
    businessValue: "Real-world utility. User loyalty. Transaction fee revenue.",
    technicalComplexity: "Çok Yüksek - Banking partnership, card issuing, compliance, KYC.",
    userBenefit: "Crypto ile günlük harcama. Cashback rewards. Instant conversion.",
    competitiveAdvantage: "Binance Card, Crypto.com Card başarılı. Differentiation tool."
  },
  "Sign up with Bank": {
    description: "Banka hesabı ile kayıt. Open banking integration. Bank verification for instant onboarding.",
    businessValue: "Trust signal. KYC acceleration. Fiat onboarding kolaylaştırır.",
    technicalComplexity: "Yüksek - Open banking API, bank partnerships, regulatory compliance.",
    userBenefit: "Hızlı verification. Bank-level trust. Easy fiat deposit.",
    competitiveAdvantage: "Emerging trend. Revolut ve Coinbase pilot yapıyor."
  },
  "Sign in with Bank": {
    description: "Banka hesabı ile login. Open banking ile authentication. Financial identity verification.",
    businessValue: "KYC simplification. Fraud reduction. Bank-grade security.",
    technicalComplexity: "Yüksek - Open banking APIs, PSD2 compliance, bank partnerships.",
    userBenefit: "Trusted authentication. Simplified KYC. Bank credential reuse.",
    competitiveAdvantage: "Innovative ama adoption düşük. Regulatory challenges."
  },
  "Gamification": {
    description: "Trading ve platform kullanımını gamification ile incentivize etme. Badges, levels, achievements, leaderboards.",
    businessValue: "Engagement artırır. Retention sağlar. Fun element.",
    technicalComplexity: "Orta - Achievement system, leaderboards, reward mechanics.",
    userBenefit: "Eğlenceli experience. Achievement unlock. Competition.",
    competitiveAdvantage: "Bybit'in güçlü yanı. Genç demographic için etkili."
  },
  "Academy for Logged-in User": {
    description: "Kullanıcılar için crypto eğitim platformu. Video courses, quizzes, certification. Learn and earn programs.",
    businessValue: "User education. Beginner retention. Learn-to-earn incentive.",
    technicalComplexity: "Orta - Content management, progress tracking, quiz system, rewards.",
    userBenefit: "Ücretsiz crypto eğitimi. Quiz ile earn. Knowledge improvement.",
    competitiveAdvantage: "Binance Academy very successful. Education = trust = retention."
  },
  "Fan Token": {
    description: "Sports ve entertainment fan token platformu. Team fan tokens, voting rights, exclusive perks.",
    businessValue: "Niche market. Partnership revenue. Brand exposure.",
    technicalComplexity: "Orta - Token economics, partnership management, utility delivery.",
    userBenefit: "Takımına support. Voting rights. Exclusive experiences.",
    competitiveAdvantage: "Niche but loyal community. Binance ve Socios partnership successful."
  },
  "DeFi Integration": {
    description: "DeFi protokollerine CEX arayüzünden erişim. Lending, staking, liquidity pools. Best of both worlds.",
    businessValue: "Yield-seeking user'ları kaybetmeme. DeFi competition'a cevap.",
    technicalComplexity: "Çok Yüksek - Smart contract integration, wallet custody, risk management.",
    userBenefit: "DeFi yields, CEX security/UX. Non-custodial options.",
    competitiveAdvantage: "Future trend. Binance Earn'ün DeFi entegrasyonu başarılı."
  },
  "Stocks & Commodity and Forex Trading": {
    description: "Traditional markets trading. Tokenized stocks, forex pairs. TradFi meets crypto.",
    businessValue: "Market expansion. New user segment. 24/7 trading advantage.",
    technicalComplexity: "Çok Yüksek - Regulatory challenges, stock tokenization, price feeds.",
    userBenefit: "Tek platform multi-asset. 24/7 stock trading. Crypto collateral.",
    competitiveAdvantage: "Binance ve FTX denedi, regulatory issues. High risk, high reward."
  },
  "Tokenized Stocks": {
    description: "Gerçek hisse senetlerinin tokenize edilmiş versiyonu. TSLA, AAPL gibi. Fractional ownership.",
    businessValue: "TradFi bridge. New market segment. Regulatory minefield.",
    technicalComplexity: "Çok Yüksek - Regulatory compliance, custody, stock backing, price oracle.",
    userBenefit: "Kripto ile stock exposure. Fractional shares. 24/7 trading.",
    competitiveAdvantage: "Very high regulatory risk. Binance stopped. FTX collapsed partly because of this."
  },
  "Global Customers": {
    description: "Global müşteri kabulü. Multi-country support. International KYC. Multi-currency.",
    businessValue: "Market expansion. Scale ekonomisi. Global brand.",
    technicalComplexity: "Çok Yüksek - Multi-country compliance, localization, payment methods.",
    userBenefit: "Worldwide service. Local payment methods. Multi-language.",
    competitiveAdvantage: "Binance'in en güçlü yanı. Global reach = network effect."
  },
  "Crypto as a Services": {
    description: "B2B crypto services. White-label solutions. Custody services. API for businesses.",
    businessValue: "B2B revenue stream. Enterprise clients. Stable income.",
    technicalComplexity: "Çok Yüksek - Enterprise-grade infrastructure, SLAs, compliance.",
    userBenefit: "Businesses için crypto infrastructure. Plug-and-play.",
    competitiveAdvantage: "Coinbase Prime, Binance Cloud gibi. High-margin business."
  },
  "Corporate Registration": {
    description: "Kurumsal hesap açma. Şirketler için trading hesabı. Higher limits, dedicated support.",
    businessValue: "Institutional segment. Large volumes. Stable customers.",
    technicalComplexity: "Orta - Corporate KYC, document verification, admin controls.",
    userBenefit: "Şirket olarak trading. Team accounts. Higher limits.",
    competitiveAdvantage: "Institutional business için must-have. Kraken ve Coinbase güçlü."
  },
  "On-Ramp / Off-Ramp (3rd Party)": {
    description: "3rd party entegrasyonları ile fiat-to-crypto. Moonpay, Simplex gibi. Credit card ile crypto alımı.",
    businessValue: "Fiat onboarding. Beginner-friendly. Partnership revenue.",
    technicalComplexity: "Düşük-Orta - 3rd party API integration, compliance passthrough.",
    userBenefit: "Kredi kartı ile crypto. Instant purchase. Simple onboarding.",
    competitiveAdvantage: "Beginner acquisition için kritik. Tüm major exchange'lerde var."
  },
  "AI Sentimentals": {
    description: "AI-powered market sentiment analysis. Social media sentiment, news analysis. Trading signals.",
    businessValue: "Innovation image. Advanced trader'ları çeker. Premium feature potential.",
    technicalComplexity: "Çok Yüksek - ML models, data aggregation, real-time analysis.",
    userBenefit: "Market sentiment insights. AI-driven trading decisions.",
    competitiveAdvantage: "Cutting-edge feature. Differentiation potential. Binance'de var."
  },
  "TRY Nemalandırma": {
    description: "Türk Lirası için faiz geliri. TL bakiyelere otomatik faiz. Banking-like feature.",
    businessValue: "TR market için önemli. TL liquidity çeker. Competitive rates.",
    technicalComplexity: "Orta - Interest calculation, compliance, reserve management.",
    userBenefit: "TL bakiyeye faiz. Banking alternatifi. Passive income.",
    competitiveAdvantage: "TR-specific. BTCTurk ve Paribu için competitive area."
  }
};

// Feature'ın PM açısından değerlendirmesi
export const getFeaturePMInsights = (featureName: string, coverage: number, implementedBy: number, totalExchanges: number) => {
  const insights: string[] = [];
  
  // Coverage-based insights
  if (coverage < 30) {
    insights.push(`🎯 **Büyük Fırsat**: Sadece ${implementedBy} borsa implement etmiş. Early mover advantage potansiyeli yüksek.`);
  } else if (coverage < 50) {
    insights.push(`⚡ **Orta Fırsat**: ${implementedBy}/${totalExchanges} borsa. Hala diferansiyasyon şansı var.`);
  } else if (coverage >= 80) {
    insights.push(`⚠️ **Must-Have**: ${coverage}% coverage = Industry standard. Olmamak competitive disadvantage.`);
  }
  
  // Priority-based insights
  const desc = featureDescriptions[featureName];
  if (desc) {
    if (desc.competitiveAdvantage.includes('must-have') || desc.competitiveAdvantage.includes('Must-have')) {
      insights.push(`🔴 **Kritik**: ${desc.competitiveAdvantage}`);
    }
    
    if (desc.technicalComplexity.includes('Yüksek') && coverage < 50) {
      insights.push(`💡 **Differentiation Şansı**: Yüksek technical complexity + düşük coverage = barrier to entry.`);
    }
  }
  
  return insights;
};
