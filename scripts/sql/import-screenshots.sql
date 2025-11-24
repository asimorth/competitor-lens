-- Import some screenshot data for competitors
INSERT INTO competitor_feature_screenshots (id, competitor_feature_id, screenshot_path, caption, created_at)
SELECT 
  gen_random_uuid(),
  cf.id,
  CASE 
    WHEN c.name = 'BTCTurk' AND f.name = 'Mobile App' THEN '/uploads/screenshots/BTC Turk/IMG_7866.png'
    WHEN c.name = 'BTCTurk' AND f.name = 'Web Trading' THEN '/uploads/screenshots/BTC Turk/IMG_7867.png'
    WHEN c.name = 'BTCTurk' AND f.name = 'Convert' THEN '/uploads/screenshots/BTC Turk/IMG_7868.png'
    WHEN c.name = 'OKX TR' AND f.name = 'Mobile App' THEN '/uploads/screenshots/OKX TR/IMG_7876.png'
    WHEN c.name = 'OKX TR' AND f.name = 'Web Trading' THEN '/uploads/screenshots/OKX TR/IMG_7877.png'
    WHEN c.name = 'OKX TR' AND f.name = 'Convert' THEN '/uploads/screenshots/OKX TR/IMG_7878.png'
    WHEN c.name = 'Binance TR' AND f.name = 'Mobile App' THEN '/uploads/screenshots/Binance TR/IMG_7843.png'
    WHEN c.name = 'Binance TR' AND f.name = 'Web Trading' THEN '/uploads/screenshots/Binance TR/IMG_7844.png'
    WHEN c.name = 'Garanti Kripto' AND f.name = 'Mobile App' THEN '/uploads/screenshots/Garanti Kripto/IMG_7791.png'
    WHEN c.name = 'Garanti Kripto' AND f.name = 'Web Trading' THEN '/uploads/screenshots/Garanti Kripto/IMG_7792.png'
  END as screenshot_path,
  CASE 
    WHEN f.name = 'Mobile App' THEN 'Mobil uygulama arayüzü'
    WHEN f.name = 'Web Trading' THEN 'Web işlem platformu'
    WHEN f.name = 'Convert' THEN 'Kripto dönüştürme ekranı'
    ELSE 'Platform ekran görüntüsü'
  END as caption,
  NOW()
FROM competitor_features cf
JOIN competitors c ON cf.competitor_id = c.id
JOIN features f ON cf.feature_id = f.id
WHERE 
  (c.name IN ('BTCTurk', 'OKX TR', 'Binance TR', 'Garanti Kripto'))
  AND f.name IN ('Mobile App', 'Web Trading', 'Convert')
  AND cf.has_feature = true
ON CONFLICT (id) DO NOTHING;
