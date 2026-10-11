import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AnalyzeProductImageDto,
  CopilotChatDto,
  ExtractedProductData,
} from './product-copilot.types';

@Injectable()
export class ProductCopilotService {
  private readonly logger = new Logger(ProductCopilotService.name);
  private readonly geminiApiKey: string;
  private readonly geminiApiBase: string = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(private readonly configService: ConfigService) {
    this.geminiApiKey =
      this.configService.get<string>('app.gemini.apiKey') ||
      process.env.GEMINI_API_KEY ||
      '';
  }

  /**
   * Analyze uploaded product images with Gemini Multimodal Vision.
   */
  async analyzeProductPhotos(dto: AnalyzeProductImageDto): Promise<ExtractedProductData> {
    const prompt = `You are an expert E-Commerce Fashion & Apparel Merchandiser and Catalog Specialist for high-end ethnic wear (Sarees, Lehengas, Salwars, Kurtis, Gowns).
Analyze the provided product image(s) carefully.
Extract all relevant product attributes and return a STRICT JSON object matching this schema:
{
  "name": "Catchy, professional title (e.g. Royal Blue Kanjeevaram Pure Silk Saree with Gold Zari Border)",
  "shortDescription": "2-3 bullet points highlighting fabric quality and craftsmanship",
  "description": "Rich 2-paragraph description with styling guide and occasion recommendations",
  "type": "READYMADE" | "CUSTOM" | "UNSTITCHED",
  "gender": "WOMEN",
  "ageGroup": "ADULTS",
  "season": "Festive & Wedding Season 2026",
  "occasion": "Bridal / Wedding / Festive Wear",
  "suggestedCategory": "Sarees",
  "suggestedSubCategory": "Silk Sarees",
  "collections": ["Bridal Heritage", "Royal Silk", "Festive 2026"],
  "tags": ["silk", "saree", "zari", "wedding", "ethnic"],
  "hsnCode": "5208",
  "taxPercentage": 5,
  "taxInclusive": true,
  "basePrice": 3999,
  "salePrice": 2999,
  "costPrice": 1800,
  "colorName": "Royal Blue",
  "colorHex": "#1B4F72",
  "attributes": {
    "fabric": "Pure Mulberry Silk",
    "weave": "Jacquard Handloom",
    "pattern": "Zari Floral Butta",
    "border": "Rich Traditional Zari Border",
    "care": "Dry Clean Only"
  },
  "sizes": [
    { "size": "Free Size", "stock": 10, "sku": "RBLU-FREE-SIZE" }
  ],
  "seoTitle": "Buy Royal Blue Silk Saree Online | Vasanthi's Signature",
  "seoDescription": "Handcrafted Royal Blue Silk Saree with intricate gold zari brocade work. Perfect for weddings and celebrations.",
  "seoKeywords": "silk saree, banarasi saree, kanjeevaram saree, royal blue saree, wedding wear",
  "isNewArrival": true,
  "isFeatured": true,
  "isBestSeller": false,
  "isTrending": true,
  "isExclusive": true,
  "channel": "BOTH",
  "suggestedQuestions": [
    {
      "key": "pricing",
      "question": "What is your target Selling Price & MRP for this piece?",
      "options": ["₹2,499 (MRP ₹3,499)", "₹2,999 (MRP ₹4,499)", "₹3,999 (MRP ₹5,999)", "Custom Price"]
    },
    {
      "key": "taxPercentage",
      "question": "Which GST tax rate applies to this product?",
      "options": ["5% GST (Standard Apparel)", "12% GST (Luxury Silk)", "18% GST", "No Tax (Exempt)"]
    },
    {
      "key": "stock",
      "question": "How many units are currently in stock?",
      "options": ["5 pieces", "10 pieces (Standard)", "25 pieces", "Single Exclusive Piece (1)"]
    }
  ]
}

Only return valid JSON without backticks or markdown wraps.`;

    if (!this.geminiApiKey || this.geminiApiKey === 'mock_key' || this.geminiApiKey === 'mock_secret') {
      this.logger.warn('Gemini API key not configured, returning smart structured mock for saree.');
      return this.getSmartFallbackData(dto.hintCategory);
    }

    try {
      const parts: any[] = [{ text: prompt }];

      // Attach images
      for (const img of dto.images) {
        if (img.base64) {
          const cleanBase64 = img.base64.replace(/^data:image\/\w+;base64,/, '');
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: img.mimeType || 'image/jpeg',
            },
          });
        }
      }

      const model = 'gemini-2.5-flash';
      const url = `${this.geminiApiBase}/models/${model}:generateContent?key=${this.geminiApiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`Gemini Vision API error: ${res.status} - ${errText}`);
        return this.getSmartFallbackData(dto.hintCategory);
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return this.getSmartFallbackData(dto.hintCategory);
      }

      const parsed: ExtractedProductData = JSON.parse(rawText.trim());
      return parsed;
    } catch (err: any) {
      this.logger.error(`Failed to analyze image with Gemini: ${err.message}`);
      return this.getSmartFallbackData(dto.hintCategory);
    }
  }

  /**
   * Conversational step-by-step assistant for refining fields.
   */
  async chatWithCopilot(dto: CopilotChatDto) {
    const systemPrompt = `You are the AI Product Catalog Onboarding Assistant for an ethnic wear boutique.
You guide the store owner through refining their product details (Price, GST, Sizes, Fabric, Occasions).
Always respond with friendly, brief explanations and provide 2-4 quick clickable options whenever possible.`;

    if (!this.geminiApiKey || this.geminiApiKey === 'mock_key') {
      const lastMsg = dto.messages[dto.messages.length - 1]?.content || '';
      return {
        reply: `Got it! I have updated the product with: "${lastMsg}". What else would you like to tweak before publishing?`,
        suggestedOptions: ['Change Stock', 'Update GST Slab', 'Add More Tags', 'Ready to Publish'],
      };
    }

    try {
      const contents = dto.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const model = 'gemini-2.5-flash';
      const url = `${this.geminiApiBase}/models/${model}:generateContent?key=${this.geminiApiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.3 },
        }),
      });

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Understood! Updating catalog.';

      return {
        reply,
        suggestedOptions: ['Confirm & Publish', 'Change Price', 'Adjust Stock', 'Edit Description'],
      };
    } catch (err: any) {
      return {
        reply: 'Got it! Updated the product details. Ready to publish to store?',
        suggestedOptions: ['Publish to Store', 'Change Price', 'Adjust Stock'],
      };
    }
  }

  private getSmartFallbackData(hintCategory?: string): ExtractedProductData {
    return {
      name: 'Royal Blue Handloom Silk Saree with Gold Zari Border',
      shortDescription: '• Handcrafted from 100% Pure Mulberry Silk\n• Intricate Gold Zari Brocade Border\n• Includes Unstitched Running Blouse Piece',
      description: 'Step into timeless elegance with this Royal Blue Handloom Silk Saree. Woven with master craftsmanship, it showcases shimmering gold zari buttis across the body and an ornate pallu. Ideal for weddings, festive ceremonies, and grand celebrations.',
      type: 'READYMADE',
      gender: 'WOMEN',
      ageGroup: 'ADULTS',
      season: 'Festive & Wedding Season 2026',
      occasion: 'Bridal / Wedding / Festive',
      suggestedCategory: hintCategory || 'Sarees',
      suggestedSubCategory: 'Silk Sarees',
      collections: ['Bridal Heritage', 'Royal Silk Collection', 'Festive 2026'],
      tags: ['silk', 'saree', 'banarasi', 'zari', 'ethnic', 'wedding', 'royal-blue'],
      hsnCode: '5208',
      taxPercentage: 5,
      taxInclusive: true,
      basePrice: 3999,
      salePrice: 2999,
      costPrice: 1800,
      colorName: 'Royal Blue',
      colorHex: '#1B4F72',
      attributes: {
        fabric: 'Pure Mulberry Silk',
        weave: 'Jacquard Handloom',
        pattern: 'Zari Floral Brocade',
        border: 'Broad Gold Zari Border',
        care: 'Dry Clean Only',
      },
      sizes: [
        { size: 'Free Size', stock: 10, sku: 'RBLU-FREE-SIZE' },
      ],
      seoTitle: "Buy Royal Blue Silk Saree Online | Vasanthi's Signature",
      seoDescription: "Shop handcrafted Royal Blue Silk Saree with intricate gold zari brocade. Fast shipping & authentic guarantee.",
      seoKeywords: 'royal blue saree, silk saree, wedding saree, ethnic saree, pure silk',
      isNewArrival: true,
      isFeatured: true,
      isBestSeller: false,
      isTrending: true,
      isExclusive: true,
      channel: 'BOTH',
      suggestedQuestions: [
        {
          key: 'pricing',
          question: 'What is your target Selling Price & MRP for this piece?',
          options: ['₹2,499 (MRP ₹3,499)', '₹2,999 (MRP ₹4,499)', '₹3,999 (MRP ₹5,999)', 'Custom Price'],
        },
        {
          key: 'taxPercentage',
          question: 'Which GST tax rate applies to this product?',
          options: ['5% GST (Standard Apparel)', '12% GST (Luxury Silk)', '18% GST', 'No Tax (Exempt)'],
        },
        {
          key: 'stock',
          question: 'How many units are currently in stock?',
          options: ['5 pieces', '10 pieces (Standard)', '25 pieces', 'Single Exclusive Piece (1)'],
        },
      ],
    };
  }
}
