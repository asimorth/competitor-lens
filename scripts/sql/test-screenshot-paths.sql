-- Screenshot path'lerini analiz et
-- Production database'de çalıştırılacak

-- 1. Toplam screenshot sayısı ve CDN durumu
SELECT 
    COUNT(*) as total_screenshots,
    COUNT(cdn_url) FILTER (WHERE cdn_url IS NOT NULL) as with_cdn,
    COUNT(*) FILTER (WHERE cdn_url IS NULL) as without_cdn
FROM screenshots;

-- 2. File path formatları
SELECT 
    CASE 
        WHEN file_path LIKE '/uploads/%' THEN 'absolute_path'
        WHEN file_path LIKE 'uploads/%' THEN 'relative_path'
        WHEN file_path LIKE 'screenshots/%' THEN 'screenshots_only'
        ELSE 'other'
    END as path_type,
    COUNT(*) as count,
    array_agg(file_path LIMIT 3) as examples
FROM screenshots
GROUP BY path_type;

-- 3. Competitor başına screenshot sayıları
SELECT 
    c.name as competitor_name,
    COUNT(s.id) as screenshot_count,
    COUNT(s.cdn_url) FILTER (WHERE s.cdn_url IS NOT NULL) as with_cdn_count
FROM competitors c
LEFT JOIN screenshots s ON s.competitor_id = c.id
GROUP BY c.id, c.name
ORDER BY screenshot_count DESC
LIMIT 15;

-- 4. Feature'lı vs feature'sız screenshot'lar
SELECT 
    CASE 
        WHEN feature_id IS NOT NULL THEN 'with_feature'
        WHEN is_onboarding = true THEN 'onboarding'
        ELSE 'uncategorized'
    END as category,
    COUNT(*) as count
FROM screenshots
GROUP BY category;

-- 5. Örnek screenshot path'leri göster
SELECT 
    c.name as competitor,
    f.name as feature,
    s.file_name,
    s.file_path,
    s.cdn_url,
    s.is_onboarding
FROM screenshots s
LEFT JOIN competitors c ON s.competitor_id = c.id
LEFT JOIN features f ON s.feature_id = f.id
LIMIT 20;

