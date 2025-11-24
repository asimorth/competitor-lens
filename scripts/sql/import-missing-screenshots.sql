-- Import Missing Screenshots
-- Maps local folder names to database competitor names

-- First, let's check what we need to import
-- BTC Turk folder → BTCTurk in DB
-- Binance TR folder → BinanceTR in DB
-- Bybit TR folder → BybitTR in DB

-- Get competitor IDs for mapping
SELECT 
    id, 
    name,
    CASE 
        WHEN name = 'BTCTurk' THEN 'BTC Turk'
        WHEN name = 'BinanceTR' THEN 'Binance TR'
        WHEN name = 'BybitTR' THEN 'Bybit TR'
        WHEN name = 'BiLira' THEN 'Bilira'
        WHEN name = 'Binance Global' THEN 'Binance Global'
        ELSE name
    END as folder_name
FROM competitors
WHERE name IN ('BTCTurk', 'BinanceTR', 'BybitTR', 'BiLira', 'Binance Global')
ORDER BY name;

