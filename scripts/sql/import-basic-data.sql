-- Delete existing data
DELETE FROM competitor_feature_screenshots;
DELETE FROM competitor_features;
DELETE FROM features;
DELETE FROM competitors;

-- Insert competitors
INSERT INTO competitors (id, name, description, website, created_at, updated_at) VALUES 
('1', 'Binance', 'Global kripto para borsası', 'https://binance.com', NOW(), NOW()),
('2', 'Coinbase', 'ABD merkezli kripto borsası', 'https://coinbase.com', NOW(), NOW()),
('3', 'BTCTurk', 'Türkiye kripto borsası', 'https://btcturk.com', NOW(), NOW()),
('4', 'Kraken', 'ABD kripto borsası', 'https://kraken.com', NOW(), NOW()),
('5', 'OKX TR', 'OKX Türkiye', 'https://okx.com', NOW(), NOW()),
('6', 'Paribu', 'Türkiye kripto borsası', 'https://paribu.com', NOW(), NOW()),
('7', 'Bitexen', 'Türkiye kripto borsası', 'https://bitexen.com', NOW(), NOW()),
('8', 'Garanti Kripto', 'Garanti BBVA kripto platformu', 'https://garantibbva.com.tr', NOW(), NOW()),
('9', 'Binance TR', 'Binance Türkiye', 'https://trbinance.com', NOW(), NOW()),
('10', 'Stablex', 'Stablex kripto borsası', 'https://stablex.com', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  website = EXCLUDED.website,
  updated_at = NOW();

-- Insert features
INSERT INTO features (id, name, description, category, priority, created_at, updated_at) VALUES 
-- Platform features
('1', 'Mobile App', 'Mobil uygulama desteği', 'Platform', 'high', NOW(), NOW()),
('2', 'Web Trading', 'Web tabanlı işlem platformu', 'Platform', 'high', NOW(), NOW()),
('3', 'API Access', 'API erişimi', 'Platform', 'medium', NOW(), NOW()),
('4', 'Desktop App', 'Masaüstü uygulama', 'Platform', 'low', NOW(), NOW()),

-- Trading features
('5', 'Spot Trading', 'Spot işlem desteği', 'Trading', 'high', NOW(), NOW()),
('6', 'Futures Trading', 'Vadeli işlem desteği', 'Trading', 'medium', NOW(), NOW()),
('7', 'Convert', 'Kripto dönüştürme', 'Trading', 'high', NOW(), NOW()),
('8', 'OTC Trading', 'Tezgahüstü işlemler', 'Trading', 'low', NOW(), NOW()),
('9', 'P2P Trading', 'Kişiden kişiye işlem', 'Trading', 'medium', NOW(), NOW()),

-- Security features
('10', '2FA', 'İki faktörlü doğrulama', 'Security', 'high', NOW(), NOW()),
('11', 'Cold Storage', 'Soğuk cüzdan desteği', 'Security', 'high', NOW(), NOW()),
('12', 'Insurance', 'Sigorta koruması', 'Security', 'medium', NOW(), NOW()),

-- Financial features
('13', 'Staking', 'Stake etme özelliği', 'Financial', 'medium', NOW(), NOW()),
('14', 'Lending', 'Borç verme', 'Financial', 'low', NOW(), NOW()),
('15', 'Savings', 'Tasarruf hesapları', 'Financial', 'medium', NOW(), NOW()),

-- Payment features
('16', 'Bank Transfer', 'Banka havalesi', 'Payment', 'high', NOW(), NOW()),
('17', 'Credit Card', 'Kredi kartı desteği', 'Payment', 'high', NOW(), NOW()),
('18', 'On-Ramp / Off-Ramp', 'Fiat giriş/çıkış', 'Payment', 'high', NOW(), NOW()),

-- User features
('19', 'KYC', 'Kimlik doğrulama', 'User', 'high', NOW(), NOW()),
('20', 'Portfolio Tracking', 'Portföy takibi', 'User', 'medium', NOW(), NOW()),
('21', 'Referral Program', 'Referans programı', 'User', 'low', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Insert competitor features (basic data for TR exchanges)
INSERT INTO competitor_features (id, competitor_id, feature_id, has_feature, implementation_quality, notes, created_at, updated_at) VALUES 
-- BTCTurk
(gen_random_uuid(), '3', '1', true, 'excellent', 'iOS ve Android uygulamaları', NOW(), NOW()),
(gen_random_uuid(), '3', '2', true, 'excellent', 'Gelişmiş web platformu', NOW(), NOW()),
(gen_random_uuid(), '3', '5', true, 'excellent', 'Spot işlemler', NOW(), NOW()),
(gen_random_uuid(), '3', '7', true, 'good', 'Convert özelliği', NOW(), NOW()),
(gen_random_uuid(), '3', '10', true, 'excellent', '2FA desteği', NOW(), NOW()),
(gen_random_uuid(), '3', '16', true, 'excellent', 'TL banka havalesi', NOW(), NOW()),
(gen_random_uuid(), '3', '17', true, 'good', 'Kredi kartı desteği', NOW(), NOW()),
(gen_random_uuid(), '3', '19', true, 'excellent', 'KYC zorunlu', NOW(), NOW()),

-- Paribu
(gen_random_uuid(), '6', '1', true, 'excellent', 'iOS ve Android uygulamaları', NOW(), NOW()),
(gen_random_uuid(), '6', '2', true, 'good', 'Web platformu', NOW(), NOW()),
(gen_random_uuid(), '6', '5', true, 'excellent', 'Spot işlemler', NOW(), NOW()),
(gen_random_uuid(), '6', '7', true, 'good', 'Convert özelliği', NOW(), NOW()),
(gen_random_uuid(), '6', '10', true, 'excellent', '2FA desteği', NOW(), NOW()),
(gen_random_uuid(), '6', '16', true, 'excellent', 'TL banka havalesi', NOW(), NOW()),
(gen_random_uuid(), '6', '19', true, 'excellent', 'KYC zorunlu', NOW(), NOW()),

-- OKX TR
(gen_random_uuid(), '5', '1', true, 'excellent', 'iOS ve Android uygulamaları', NOW(), NOW()),
(gen_random_uuid(), '5', '2', true, 'excellent', 'Gelişmiş web platformu', NOW(), NOW()),
(gen_random_uuid(), '5', '5', true, 'excellent', 'Spot işlemler', NOW(), NOW()),
(gen_random_uuid(), '5', '6', true, 'excellent', 'Futures işlemler', NOW(), NOW()),
(gen_random_uuid(), '5', '7', true, 'excellent', 'Convert özelliği', NOW(), NOW()),
(gen_random_uuid(), '5', '10', true, 'excellent', '2FA desteği', NOW(), NOW()),
(gen_random_uuid(), '5', '16', true, 'excellent', 'TL banka havalesi', NOW(), NOW()),
(gen_random_uuid(), '5', '19', true, 'excellent', 'KYC zorunlu', NOW(), NOW()),

-- Binance TR
(gen_random_uuid(), '9', '1', true, 'excellent', 'iOS ve Android uygulamaları', NOW(), NOW()),
(gen_random_uuid(), '9', '2', true, 'excellent', 'Gelişmiş web platformu', NOW(), NOW()),
(gen_random_uuid(), '9', '5', true, 'excellent', 'Spot işlemler', NOW(), NOW()),
(gen_random_uuid(), '9', '7', true, 'excellent', 'Convert özelliği', NOW(), NOW()),
(gen_random_uuid(), '9', '9', true, 'excellent', 'P2P trading', NOW(), NOW()),
(gen_random_uuid(), '9', '10', true, 'excellent', '2FA desteği', NOW(), NOW()),
(gen_random_uuid(), '9', '16', true, 'excellent', 'TL banka havalesi', NOW(), NOW()),
(gen_random_uuid(), '9', '19', true, 'excellent', 'KYC zorunlu', NOW(), NOW()),

-- Stablex (limited features for now)
(gen_random_uuid(), '10', '2', true, 'basic', 'Web platformu geliştiriliyor', NOW(), NOW()),
(gen_random_uuid(), '10', '5', true, 'basic', 'Spot işlemler planlanıyor', NOW(), NOW()),
(gen_random_uuid(), '10', '10', true, 'good', '2FA desteği', NOW(), NOW()),
(gen_random_uuid(), '10', '19', true, 'good', 'KYC süreci', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
