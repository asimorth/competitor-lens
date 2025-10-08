import Tesseract from 'tesseract.js';
import OpenAI from 'openai';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { prisma } from '../lib/db';
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface AnalysisResult {
  featureName: string | null;
  confidence: number;
  metadata: {
    extractedText: string;
    detectedElements: any[];
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

export interface BatchAnalysisResult {
  filePath: string;
  competitorName: string;
  isOnboarding: boolean;
  analysis: AnalysisResult | null;
  error?: string;
}

export class ScreenshotAnalysisService {
  private tesseractWorker: Tesseract.Worker | null = null;

  async initialize() {
    // Tesseract worker'ı başlat
    this.tesseractWorker = await Tesseract.createWorker('tur+eng');
  }

  async cleanup() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
    }
  }

  /**
   * Tek bir screenshot'ı analiz eder
   */
  async analyzeScreenshot(imagePath: string): Promise<AnalysisResult> {
    try {
      // 1. Görsel metadata'sını al
      const metadata = await this.getImageMetadata(imagePath);
      
      // 2. OCR ile metin çıkarımı
      const textContent = await this.extractText(imagePath);
      
      // 3. OpenAI Vision API ile analiz (opsiyonel)
      let aiAnalysis = null;
      if (openai) {
        aiAnalysis = await this.analyzeWithAI(imagePath);
      }
      
      // 4. Feature tahmini
      const featurePrediction = await this.predictFeature(textContent, aiAnalysis);
      
      return {
        featureName: featurePrediction.name,
        confidence: featurePrediction.confidence,
        metadata: {
          extractedText: textContent,
          detectedElements: aiAnalysis?.elements || [],
          dimensions: metadata
        }
      };
    } catch (error) {
      console.error('Screenshot analysis error:', error);
      throw error;
    }
  }

  /**
   * OCR ile metin çıkarımı
   */
  private async extractText(imagePath: string): Promise<string> {
    if (!this.tesseractWorker) {
      await this.initialize();
    }

    try {
      const { data: { text } } = await this.tesseractWorker!.recognize(imagePath);
      return text.trim();
    } catch (error) {
      console.error('OCR error:', error);
      return '';
    }
  }

  /**
   * OpenAI Vision API ile görsel analizi
   */
  private async analyzeWithAI(imagePath: string): Promise<any> {
    if (!openai) return null;
    
    try {
      // Görseli base64'e çevir
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Bu kripto borsa uygulaması ekran görüntüsünü analiz et. Hangi özellik gösteriliyor? UI elementlerini tanımla. JSON formatında yanıt ver: {feature: string, elements: string[], confidence: number}"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 300,
      });

      const content = response.choices[0].message.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          return { feature: content, elements: [], confidence: 0.5 };
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      return null;
    }
  }

  /**
   * Feature tahmini algoritması
   */
  private async predictFeature(
    extractedText: string, 
    aiAnalysis: any
  ): Promise<{ name: string | null, confidence: number }> {
    // Basit keyword matching + AI sonuçları
    const keywords = {
      'login': ['giriş', 'login', 'sign in', 'oturum aç', 'kullanıcı adı', 'şifre', 'password'],
      'register': ['kayıt', 'register', 'sign up', 'hesap oluştur', 'üye ol'],
      'kyc': ['kimlik', 'kyc', 'doğrulama', 'verification', 'tc kimlik', 'pasaport'],
      'wallet': ['cüzdan', 'wallet', 'bakiye', 'balance', 'varlıklarım', 'assets'],
      'trading': ['al', 'sat', 'trade', 'işlem', 'piyasa', 'market', 'fiyat', 'price'],
      'deposit': ['yatır', 'deposit', 'para yatırma', 'havale', 'eft'],
      'withdraw': ['çek', 'withdraw', 'para çekme', 'transfer'],
      'staking': ['stake', 'staking', 'kilitle', 'faiz', 'getiri'],
      'p2p': ['p2p', 'peer to peer', 'doğrudan', 'alıcı', 'satıcı'],
      'earn': ['kazan', 'earn', 'getiri', 'yield', 'faiz'],
      'futures': ['vadeli', 'futures', 'kaldıraç', 'leverage', 'margin'],
      'spot': ['spot', 'anlık', 'piyasa', 'market'],
      'convert': ['dönüştür', 'convert', 'çevir', 'swap'],
      'chart': ['grafik', 'chart', 'teknik analiz', 'indicator'],
      'orderbook': ['emir defteri', 'order book', 'alış', 'satış', 'derinlik'],
      'portfolio': ['portföy', 'portfolio', 'varlıklarım', 'dağılım'],
      'history': ['geçmiş', 'history', 'işlem geçmişi', 'transaction'],
      'settings': ['ayarlar', 'settings', 'tercihler', 'preferences'],
      'profile': ['profil', 'profile', 'hesap', 'account'],
      'security': ['güvenlik', 'security', '2fa', 'iki faktör'],
      'api': ['api', 'api key', 'api anahtarı', 'geliştirici'],
      'referral': ['referans', 'referral', 'davet', 'invite', 'arkadaş'],
      'support': ['destek', 'support', 'yardım', 'help', 'ticket'],
      'notification': ['bildirim', 'notification', 'uyarı', 'alert'],
      'news': ['haber', 'news', 'duyuru', 'announcement'],
      'learn': ['öğren', 'learn', 'eğitim', 'education', 'akademi']
    };

    const lowerText = extractedText.toLowerCase();
    let bestMatch = { name: null as string | null, confidence: 0 };

    // Keyword matching
    for (const [feature, featureKeywords] of Object.entries(keywords)) {
      const matchCount = featureKeywords.filter(keyword => 
        lowerText.includes(keyword)
      ).length;
      
      if (matchCount > 0) {
        const confidence = Math.min(matchCount * 0.3, 0.8);
        if (confidence > bestMatch.confidence) {
          bestMatch = { name: feature, confidence };
        }
      }
    }

    // AI analizi varsa, güven skorunu artır
    if (aiAnalysis?.feature) {
      const aiFeature = aiAnalysis.feature.toLowerCase();
      for (const [feature, featureKeywords] of Object.entries(keywords)) {
        if (aiFeature.includes(feature) || featureKeywords.some(k => aiFeature.includes(k))) {
          bestMatch.name = feature;
          bestMatch.confidence = Math.min(bestMatch.confidence + (aiAnalysis.confidence || 0.3), 1.0);
          break;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Dizindeki tüm screenshot'ları toplu analiz eder
   */
  async batchAnalyze(directoryPath: string): Promise<BatchAnalysisResult[]> {
    const results: BatchAnalysisResult[] = [];
    
    try {
      // Dizin yapısını tara
      const competitors = await fs.readdir(directoryPath);
      
      for (const competitorName of competitors) {
        const competitorPath = path.join(directoryPath, competitorName);
        const stat = await fs.stat(competitorPath);
        
        if (!stat.isDirectory()) continue;
        
        // Competitor dizinindeki dosyaları tara
        const files = await this.scanCompetitorDirectory(competitorPath);
        
        for (const file of files) {
          const isOnboarding = file.includes('/onboarding/') || 
                             file.toLowerCase().includes('onboarding');
          
          try {
            const analysis = await this.analyzeScreenshot(file);
            results.push({
              filePath: file,
              competitorName,
              isOnboarding,
              analysis
            });
          } catch (error: any) {
            results.push({
              filePath: file,
              competitorName,
              isOnboarding,
              analysis: null,
              error: error.message
            });
          }
        }
      }
    } catch (error) {
      console.error('Batch analysis error:', error);
      throw error;
    }
    
    return results;
  }

  /**
   * Competitor dizinini recursive olarak tara
   */
  private async scanCompetitorDirectory(dirPath: string): Promise<string[]> {
    const imageFiles: string[] = [];
    const supportedFormats = ['.png', '.jpg', '.jpeg', '.webp'];
    
    async function scan(currentPath: string) {
      const items = await fs.readdir(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await scan(fullPath);
        } else if (supportedFormats.includes(path.extname(item).toLowerCase())) {
          imageFiles.push(fullPath);
        }
      }
    }
    
    await scan(dirPath);
    return imageFiles;
  }

  /**
   * Görsel metadata'sını al
   */
  private async getImageMetadata(imagePath: string): Promise<{ width: number, height: number }> {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0
      };
    } catch (error) {
      console.error('Image metadata error:', error);
      return { width: 0, height: 0 };
    }
  }

  /**
   * Analiz sonucunu veritabanına kaydet
   */
  async saveAnalysisResult(
    screenshotId: string, 
    analysis: AnalysisResult,
    aiProvider: string = 'tesseract'
  ) {
    return await prisma.screenshotAnalysis.create({
      data: {
        screenshotId,
        featurePrediction: analysis.featureName,
        confidenceScore: analysis.confidence,
        extractedText: analysis.metadata.extractedText,
        detectedElements: analysis.metadata.detectedElements,
        aiProvider
      }
    });
  }

  /**
   * Dosya hash'i hesapla (sync için)
   */
  async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }
}
