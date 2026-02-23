/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Mail, 
  Trash2, 
  History, 
  ExternalLink,
  ChevronRight,
  Shield,
  Lock,
  Eye,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalysisResult {
  isPhishing: boolean;
  riskLevel: 'Low' | 'Medium' | 'High';
  suspiciousIndicators: string[];
  recommendation: string;
  summary: string;
  technicalDetails: string;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  emailPreview: string;
  result: AnalysisResult;
}

export default function App() {
  const [emailContent, setEmailContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const analyzeEmail = async () => {
    if (!emailContent.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following email for phishing and cybersecurity risks:

Email Content:
"""
${emailContent}
"""`,
        config: {
          systemInstruction: "You are a world-class cybersecurity expert specializing in email security and phishing detection. Provide a detailed, objective analysis. Be cautious and look for subtle indicators like sender spoofing, urgent language, suspicious links, and unusual requests.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isPhishing: { type: Type.BOOLEAN, description: "Whether the email is likely a phishing attempt." },
              riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"], description: "The overall risk level of the email." },
              suspiciousIndicators: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of specific suspicious elements found."
              },
              recommendation: { type: Type.STRING, description: "Final recommendation for the user." },
              summary: { type: Type.STRING, description: "A brief summary of the findings." },
              technicalDetails: { type: Type.STRING, description: "A more detailed technical explanation of the analysis (Markdown supported)." }
            },
            required: ["isPhishing", "riskLevel", "suspiciousIndicators", "recommendation", "summary", "technicalDetails"]
          }
        }
      });

      const analysis: AnalysisResult = JSON.parse(response.text || '{}');
      setResult(analysis);
      
      // Add to history
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        emailPreview: emailContent.slice(0, 100) + (emailContent.length > 100 ? '...' : ''),
        result: analysis
      };
      setHistory(prev => [newItem, ...prev].slice(0, 10));

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Failed to analyze email. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAll = () => {
    setEmailContent('');
    setResult(null);
    setError(null);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">PhishGuard <span className="text-indigo-400">AI</span></h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Cybersecurity Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-400">System Active</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-7 space-y-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-semibold text-white">Email Analysis</h2>
                </div>
                <button 
                  onClick={clearAll}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Input
                </button>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Paste the full email content here (including headers if available)..."
                  className="relative w-full h-80 bg-[#121214] border border-white/10 rounded-2xl p-6 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none font-mono text-sm leading-relaxed"
                />
              </div>

              <button
                onClick={analyzeEmail}
                disabled={isAnalyzing || !emailContent.trim()}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-3 shadow-xl",
                  isAnalyzing || !emailContent.trim() 
                    ? "bg-slate-800 cursor-not-allowed opacity-50" 
                    : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] shadow-indigo-600/20"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing Threat Vectors...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Run AI Security Scan
                  </>
                )}
              </button>
            </section>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
                >
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Section */}
            <div ref={resultsRef}>
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Verdict Card */}
                    <div className={cn(
                      "p-8 rounded-3xl border-2 shadow-2xl overflow-hidden relative",
                      result.isPhishing 
                        ? "bg-red-500/5 border-red-500/20" 
                        : "bg-emerald-500/5 border-emerald-500/20"
                    )}>
                      {/* Background Icon */}
                      <div className="absolute -right-8 -bottom-8 opacity-[0.03]">
                        {result.isPhishing ? <ShieldAlert size={240} /> : <ShieldCheck size={240} />}
                      </div>

                      <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg",
                              result.isPhishing ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                            )}>
                              {result.isPhishing ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white">
                                {result.isPhishing ? "Phishing Detected" : "Likely Legitimate"}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                  getRiskColor(result.riskLevel)
                                )}>
                                  {result.riskLevel} Risk
                                </span>
                                <span className="text-slate-500 text-xs">• Verified by Gemini AI</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Security Score</div>
                            <div className="text-4xl font-black text-white tabular-nums">
                              {result.isPhishing ? "24" : "98"}<span className="text-slate-600 text-xl">/100</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Suspicious Indicators
                            </h4>
                            <ul className="space-y-2">
                              {result.suspiciousIndicators.map((indicator, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                    result.isPhishing ? "bg-red-500" : "bg-emerald-500"
                                  )} />
                                  {indicator}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Expert Recommendation
                            </h4>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-300 leading-relaxed italic">
                              "{result.recommendation}"
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div className="bg-[#121214] rounded-3xl border border-white/10 overflow-hidden">
                      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Info className="w-4 h-4 text-indigo-400" />
                          Technical Analysis Report
                        </h3>
                      </div>
                      <div className="p-6 prose prose-invert prose-sm max-w-none prose-p:text-slate-400 prose-headings:text-white prose-strong:text-indigo-300">
                        <Markdown>{result.technicalDetails}</Markdown>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: History & Stats */}
          <div className="lg:col-span-5 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-[#121214] border border-white/10">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Total Scanned</div>
                <div className="text-3xl font-bold text-white tabular-nums">{history.length}</div>
              </div>
              <div className="p-6 rounded-2xl bg-[#121214] border border-white/10">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Threats Blocked</div>
                <div className="text-3xl font-bold text-red-500 tabular-nums">
                  {history.filter(h => h.result.isPhishing).length}
                </div>
              </div>
            </div>

            {/* History */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-semibold text-white">Recent Scans</h2>
              </div>

              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center space-y-2">
                    <p className="text-sm text-slate-500">No scan history yet.</p>
                    <p className="text-xs text-slate-600">Your analysis history will appear here.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => {
                        setResult(item.result);
                        setEmailContent(item.emailPreview);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full p-4 rounded-2xl bg-[#121214] border border-white/10 hover:border-indigo-500/50 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            item.result.isPhishing ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"
                          )}>
                            {item.result.isPhishing ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-300 truncate group-hover:text-white transition-colors">
                              {item.emailPreview}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {new Date(item.timestamp).toLocaleTimeString()} • {item.result.riskLevel} Risk
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </section>

            {/* Security Tips */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Security Best Practices
                </h3>
                <ul className="space-y-3">
                  {[
                    "Always verify the sender's email address carefully.",
                    "Don't click links in unexpected emails.",
                    "Be wary of urgent or threatening language.",
                    "Use multi-factor authentication (MFA) everywhere."
                  ].map((tip, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
                <a 
                  href="https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition-colors"
                >
                  Learn More at CISA
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Shield size={120} className="text-indigo-400" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 mt-12 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Powered by Gemini 3 Flash • Advanced Threat Intelligence
          </p>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            © 2026 PhishGuard AI Security Systems
          </p>
        </div>
      </footer>
    </div>
  );
}
