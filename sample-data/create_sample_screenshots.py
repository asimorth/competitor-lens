#!/usr/bin/env python3
"""
Kripto borsa ekran görüntüleri için örnek PNG dosyaları oluşturur.
Bu script PIL (Pillow) kütüphanesini kullanır.

Kurulum: pip install Pillow
Çalıştırma: python3 create_sample_screenshots.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Ekran görüntüsü boyutları
WIDTH = 1200
HEIGHT = 800

# Renkler
COLORS = {
    'binance': '#F3BA2F',
    'coinbase': '#0052FF', 
    'kraken': '#5741D9',
    'kucoin': '#24AE8F',
    'bybit': '#F7A600',
    'okx': '#000000',
    'huobi': '#2E7EFF',
    'gate': '#64B5F6'
}

# Borsa ve feature kombinasyonları
SCREENSHOTS = [
    # Binance
    ('binance', 'spot', 'Binance Spot Trading Ana Arayüzü'),
    ('binance', 'spot-orders', 'Binance Gelişmiş Order Tipleri'),
    ('binance', 'spot-chart', 'Binance Trading Chart ve Analiz'),
    ('binance', 'futures', 'Binance Futures Trading Paneli'),
    ('binance', 'p2p', 'Binance P2P Trading Arayüzü'),
    
    # Coinbase
    ('coinbase', 'spot', 'Coinbase Basit Trading Arayüzü'),
    ('coinbase', 'spot-pro', 'Coinbase Pro Gelişmiş Trading'),
    
    # Kraken
    ('kraken', 'spot', 'Kraken Trading Terminali'),
    
    # KuCoin
    ('kucoin', 'spot', 'KuCoin Spot Trading Arayüzü'),
    
    # OKX
    ('okx', 'spot', 'OKX Trading Arayüzü'),
    
    # Bybit
    ('bybit', 'futures', 'Bybit Futures Trading'),
    
    # Huobi
    ('huobi', 'spot', 'Huobi Spot Trading'),
    
    # Gate.io
    ('gate', 'spot', 'Gate.io Spot Trading')
]

def create_screenshot(exchange, feature, title):
    """Tek bir ekran görüntüsü oluşturur"""
    
    # Yeni görsel oluştur
    img = Image.new('RGB', (WIDTH, HEIGHT), 'white')
    draw = ImageDraw.Draw(img)
    
    # Arka plan rengi
    bg_color = COLORS.get(exchange, '#CCCCCC')
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=bg_color)
    
    # Header bar
    draw.rectangle([0, 0, WIDTH, 80], fill='white')
    
    # Logo alanı (placeholder)
    draw.rectangle([20, 20, 120, 60], fill=bg_color)
    
    try:
        # Font yüklemeye çalış (sistem fontları)
        title_font = ImageFont.truetype('/System/Library/Fonts/Arial.ttf', 24)
        header_font = ImageFont.truetype('/System/Library/Fonts/Arial.ttf', 18)
        text_font = ImageFont.truetype('/System/Library/Fonts/Arial.ttf', 14)
    except:
        # Eğer font bulunamazsa default font kullan
        title_font = ImageFont.load_default()
        header_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
    
    # Başlık
    draw.text((140, 25), exchange.upper(), fill='black', font=header_font)
    draw.text((140, 45), title, fill='gray', font=text_font)
    
    # Ana içerik alanı
    content_y = 100
    
    # Trading interface mockup
    if 'spot' in feature or 'futures' in feature:
        # Sol panel - Order book
        draw.rectangle([20, content_y, 300, content_y + 400], outline='#DDD', width=2)
        draw.text((30, content_y + 10), 'Order Book', fill='black', font=header_font)
        
        # Orta panel - Chart
        draw.rectangle([320, content_y, 880, content_y + 400], outline='#DDD', width=2)
        draw.text((330, content_y + 10), 'Price Chart', fill='black', font=header_font)
        
        # Chart çizgisi (basit)
        import random
        points = []
        for i in range(0, 540, 10):
            x = 330 + i
            y = content_y + 50 + random.randint(50, 300)
            points.append((x, y))
        
        for i in range(len(points) - 1):
            draw.line([points[i], points[i + 1]], fill='#00FF00', width=2)
        
        # Sağ panel - Orders
        draw.rectangle([900, content_y, 1180, content_y + 400], outline='#DDD', width=2)
        draw.text((910, content_y + 10), 'Open Orders', fill='black', font=header_font)
        
    elif 'p2p' in feature:
        # P2P interface
        draw.rectangle([20, content_y, 1180, content_y + 200], outline='#DDD', width=2)
        draw.text((30, content_y + 10), 'P2P Marketplace', fill='black', font=header_font)
        
        # P2P listesi
        for i in range(5):
            y = content_y + 50 + (i * 30)
            draw.text((30, y), f'Seller {i+1} - Rate: 4.{9-i} - Price: ${45000 + i*100}', fill='black', font=text_font)
    
    # Alt bilgi
    draw.text((20, HEIGHT - 40), f'Sample Screenshot - {exchange.title()} {feature.title()}', fill='white', font=text_font)
    draw.text((20, HEIGHT - 20), 'Generated for CompetitorLens Platform', fill='white', font=text_font)
    
    return img

def main():
    """Ana fonksiyon"""
    
    # Çıktı klasörü oluştur
    output_dir = '../backend/uploads/screenshots'
    os.makedirs(output_dir, exist_ok=True)
    
    print("Kripto borsa ekran görüntüleri oluşturuluyor...")
    
    for exchange, feature, title in SCREENSHOTS:
        filename = f'{exchange}-{feature}.png'
        filepath = os.path.join(output_dir, filename)
        
        print(f"Oluşturuluyor: {filename}")
        
        img = create_screenshot(exchange, feature, title)
        img.save(filepath, 'PNG')
    
    print(f"\n✅ {len(SCREENSHOTS)} ekran görüntüsü oluşturuldu!")
    print(f"📁 Konum: {os.path.abspath(output_dir)}")
    
    # README dosyası oluştur
    readme_path = os.path.join(output_dir, 'README.md')
    with open(readme_path, 'w') as f:
        f.write("# Kripto Borsa Ekran Görüntüleri\n\n")
        f.write("Bu klasör örnek kripto borsa ekran görüntülerini içerir.\n\n")
        f.write("## Dosyalar\n\n")
        
        for exchange, feature, title in SCREENSHOTS:
            filename = f'{exchange}-{feature}.png'
            f.write(f"- **{filename}**: {title}\n")
        
        f.write("\n## Kullanım\n\n")
        f.write("Bu görüntüler CompetitorLens platformunda feature detay sayfalarında kullanılabilir.\n")
        f.write("Gerçek projede bu görseller yerine gerçek borsa ekran görüntüleri kullanılmalıdır.\n")
    
    print(f"📝 README dosyası oluşturuldu: {readme_path}")

if __name__ == '__main__':
    main()
