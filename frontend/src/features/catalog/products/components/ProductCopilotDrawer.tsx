'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Camera,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  X,
  Send,
  Mic,
  MicOff,
  Tag,
  DollarSign,
  Package,
  Layers,
  Palette,
  Eye,
  Rocket,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { productCopilotService, ExtractedProductData } from '../product-copilot.service';

interface ProductCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToForm: (data: ExtractedProductData, imageUrls: string[]) => void;
  onDirectPublish?: (data: ExtractedProductData, imageUrls: string[]) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  options?: string[];
  extractedCard?: ExtractedProductData;
}

export default function ProductCopilotDrawer({
  isOpen,
  onClose,
  onApplyToForm,
  onDirectPublish,
}: ProductCopilotDrawerProps) {
  const [images, setImages] = useState<Array<{ url: string; base64?: string; file?: File }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProductData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [activeStep, setActiveStep] = useState<'upload' | 'chat' | 'preview'>('upload');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  // Handle image upload
  const handleImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImgs: Array<{ url: string; base64?: string; file?: File }> = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const url = URL.createObjectURL(file);
        setImages((prev) => [...prev, { url, base64, file }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Trigger AI Analysis
  const handleStartAnalysis = async () => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    setActiveStep('chat');

    // Add user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: `Uploaded ${images.length} product photo(s). Analyzing catalog details...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([userMsg]);

    try {
      const payload = images.map((img) => ({
        base64: img.base64,
        mimeType: img.file?.type || 'image/jpeg',
      }));

      const data = await productCopilotService.analyzePhoto(payload);
      setExtractedData(data);

      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `✨ I analyzed your photo! I detected **${data.name}** (${data.attributes.fabric || 'Silk'}, Color: **${data.colorName}**).\n\nLet's verify the price and stock:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: [
          `Selling Price: ₹${data.salePrice || 2999} (MRP: ₹${data.basePrice || 3999})`,
          `GST Slab: ${data.taxPercentage}% GST`,
          `Stock: 10 Units in stock`,
          `🚀 Looks Perfect, Publish Now!`,
        ],
        extractedCard: data,
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `I had trouble connecting to the Vision API, but I have prepared a smart template for your saree. You can tweak the details below:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: ['Set Price to ₹2,999', 'Set GST to 5%', 'Set Stock to 10', 'Apply to Form'],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick Option Click Handler
  const handleOptionClick = (option: string) => {
    if (!extractedData) return;

    if (option.includes('Publish Now') || option.includes('Looks Perfect')) {
      handleApply(true);
      return;
    }

    if (option.includes('Apply to Form')) {
      handleApply(false);
      return;
    }

    if (option.includes('GST')) {
      const match = option.match(/(\d+)%/);
      if (match) {
        setExtractedData((prev) => prev ? { ...prev, taxPercentage: Number(match[1]) } : null);
      }
    }

    // Add user message & AI response
    const uMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: option,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const aiFollowUp: ChatMessage = {
      id: `ai-${Date.now() + 1}`,
      sender: 'ai',
      text: `Updated! Anything else you'd like to adjust, or ready to apply to your catalog?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: ['Confirm & Apply to Form', '🚀 Direct Publish to Store', 'Change Stock Quantity'],
    };

    setMessages((prev) => [...prev, uMsg, aiFollowUp]);
  };

  // Text message send
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');

    const uMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, uMsg]);

    try {
      const res = await productCopilotService.chat(
        [{ role: 'user', content: text }],
        extractedData || undefined
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: res.suggestedOptions || ['Apply to Form', 'Publish to Store'],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackAiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Got it! I've noted: "${text}". Ready to push this to the catalog?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: ['Apply to Form', 'Publish to Store'],
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    }
  };

  // Voice Input Toggle (Web Speech API)
  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleApply = (directPublish = false) => {
    if (!extractedData) return;
    const imgUrls = images.map((i) => i.url);
    if (directPublish && onDirectPublish) {
      onDirectPublish(extractedData, imgUrls);
    } else {
      onApplyToForm(extractedData, imgUrls);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="flex h-full w-full max-w-2xl flex-col bg-slate-900 border-l border-slate-700/80 shadow-2xl text-slate-100">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">AI Product Onboarding Copilot</h2>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  Agent 1 Active
                </span>
              </div>
              <p className="text-xs text-slate-400">Upload photos & chat to auto-generate catalog entries with 100% field parity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {activeStep === 'upload' && images.length === 0 ? (
            /* Step 0: Upload Dropzone */
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group flex w-full max-w-lg cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500/40 bg-slate-800/40 p-10 hover:border-indigo-400 hover:bg-slate-800/70 transition-all duration-200"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">Drop product or saree photo here</h3>
                <p className="mt-1 text-xs text-slate-400">Supports JPG, PNG, WEBP (Single or Multiple angles)</p>
                <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors">
                  <Camera className="h-4 w-4" /> Browse Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 text-left max-w-lg">
                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <span className="text-xs font-semibold text-indigo-400">1. Vision Extraction</span>
                  <p className="mt-1 text-[11px] text-slate-400">Auto-identifies fabric, color, zari patterns, and style.</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <span className="text-xs font-semibold text-indigo-400">2. Complete Parity</span>
                  <p className="mt-1 text-[11px] text-slate-400">Auto-populates all 8 tabs & 35+ fields in seconds.</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <span className="text-xs font-semibold text-indigo-400">3. 1-Click Publish</span>
                  <p className="mt-1 text-[11px] text-slate-400">Review the live card & publish directly to store.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Chat & Interactive Flow */
            <div className="flex flex-1 flex-col overflow-hidden">
              
              {/* Photo Thumbnails Bar */}
              <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-900/90 px-6 py-3 overflow-x-auto">
                <span className="text-xs font-medium text-slate-400 whitespace-nowrap">Photos ({images.length}):</span>
                <div className="flex items-center gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                      <img src={img.url} alt={`Upload ${idx + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </div>
                {activeStep === 'upload' && images.length > 0 && (
                  <button
                    onClick={handleStartAnalysis}
                    className="ml-auto inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-indigo-500"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Start AI Analysis
                  </button>
                )}
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Live Extracted Summary Card */}
                      {msg.extractedCard && (
                        <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-semibold text-indigo-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Extracted Product Schema
                            </span>
                            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                              {msg.extractedCard.suggestedCategory}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-slate-300">
                            <div><span className="text-slate-500">Fabric:</span> {msg.extractedCard.attributes.fabric}</div>
                            <div><span className="text-slate-500">Color:</span> {msg.extractedCard.colorName}</div>
                            <div><span className="text-slate-500">MRP:</span> ₹{msg.extractedCard.basePrice}</div>
                            <div><span className="text-slate-500">Sale Price:</span> ₹{msg.extractedCard.salePrice}</div>
                            <div><span className="text-slate-500">GST:</span> {msg.extractedCard.taxPercentage}% (Inclusive)</div>
                            <div><span className="text-slate-500">SKU:</span> {msg.extractedCard.sizes[0]?.sku || 'AUTOGEN'}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick-reply options */}
                    {msg.options && msg.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                        {msg.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleOptionClick(opt)}
                            className="rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="mt-1 text-[10px] text-slate-500">{msg.timestamp}</span>
                  </div>
                ))}

                {isAnalyzing && (
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-800/60 p-4 border border-slate-700/60 w-fit">
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                    <span className="text-xs text-slate-300">Gemini Vision is inspecting fabric, color, and patterns...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input & Action Bar */}
              <div className="border-t border-slate-800 bg-slate-950/90 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title={isListening ? 'Listening... click to stop' : 'Click to speak'}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message or adjustment (e.g., 'Change price to ₹3,499')..."
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                {/* Bottom Action Triggers */}
                {extractedData && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleApply(false)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      <Layers className="h-3.5 w-3.5 text-indigo-400" /> Apply to 8-Tab Form
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApply(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500"
                    >
                      <Rocket className="h-3.5 w-3.5" /> 🚀 1-Click Direct Publish
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
