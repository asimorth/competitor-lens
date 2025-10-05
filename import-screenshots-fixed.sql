-- Import screenshot data for BTCTurk
INSERT INTO competitor_feature_screenshots (id, competitor_feature_id, screenshot_path, caption, created_at)
SELECT 
  gen_random_uuid(),
  cf.id,
  '/uploads/screenshots/BTC Turk/IMG_7866.png',
  'BTCTurk mobil uygulama arayüzü',
  NOW()
FROM competitor_features cf
JOIN competitors c ON cf.competitor_id = c.id
JOIN features f ON cf.feature_id = f.id
WHERE c.name = 'BTCTurk' AND f.name = 'Mobile App' AND cf.has_feature = true
ON CONFLICT (id) DO NOTHING;

-- More BTCTurk screenshots
INSERT INTO competitor_feature_screenshots (id, competitor_feature_id, screenshot_path, caption, created_at)
SELECT 
  gen_random_uuid(),
  cf.id,
  '/uploads/screenshots/BTC Turk/IMG_7867.png',
  'BTCTurk web trading platformu',
  NOW()
FROM competitor_features cf
JOIN competitors c ON cf.competitor_id = c.id
JOIN features f ON cf.feature_id = f.id
WHERE c.name = 'BTCTurk' AND f.name = 'Web Trading' AND cf.has_feature = true
ON CONFLICT (id) DO NOTHING;

-- OKX TR screenshots
INSERT INTO competitor_feature_screenshots (id, competitor_feature_id, screenshot_path, caption, created_at)
SELECT 
  gen_random_uuid(),
  cf.id,
  '/uploads/screenshots/OKX TR/IMG_7876.png',
  'OKX TR mobil uygulama',
  NOW()
FROM competitor_features cf
JOIN competitors c ON cf.competitor_id = c.id
JOIN features f ON cf.feature_id = f.id
WHERE c.name = 'OKX TR' AND f.name = 'Mobile App' AND cf.has_feature = true
ON CONFLICT (id) DO NOTHING;

-- Binance TR screenshots
INSERT INTO competitor_feature_screenshots (id, competitor_feature_id, screenshot_path, caption, created_at)
SELECT 
  gen_random_uuid(),
  cf.id,
  '/uploads/screenshots/Binance TR/IMG_7843.png',
  'Binance TR mobil uygulama',
  NOW()
FROM competitor_features cf
JOIN competitors c ON cf.competitor_id = c.id
JOIN features f ON cf.feature_id = f.id
WHERE c.name = 'Binance TR' AND f.name = 'Mobile App' AND cf.has_feature = true
ON CONFLICT (id) DO NOTHING;
