import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  History, 
  Copy, 
  RotateCcw, 
  Download, 
  Trash2, 
  Check, 
  ChevronRight, 
  Mail, 
  Languages, 
  Type as TypeIcon,
  User,
  Layout,
  Plus,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateEmail } from './services/gemini';
import { EmailRequest, GeneratedEmail, Tone, Recipient, Length } from './types';

export default function App() {
  // State
  const [request, setRequest] = useState<EmailRequest>({
    purpose: '',
    recipient: 'general',
    tone: 'professional',
    keyPoints: '',
    length: 'medium',
    language: 'English'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<GeneratedEmail | null>(null);
  const [history, setHistory] = useState<GeneratedEmail[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState('');
  const [editedSubject, setEditedSubject] = useState('');

  // Refs
  const outputRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('mailcraft_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('mailcraft_history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async () => {
    if (!request.purpose) return;
    
    setIsGenerating(true);
    setIsEditing(false);
    
    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      setIsGenerating(false);
      alert('Request timed out. The AI service is taking too long to respond. Please try again.');
    }, 30000);

    try {
      const result = await generateEmail(request);
      if (isTimedOut) return;
      clearTimeout(timeoutId);
      
      const newEmail: GeneratedEmail = {
        id: crypto.randomUUID(),
        subject: result.subject,
        body: result.body,
        timestamp: Date.now(),
        request: { ...request }
      };
      setCurrentEmail(newEmail);
      setHistory(prev => [newEmail, ...prev].slice(0, 50));
      setEditedSubject(result.subject);
      setEditedBody(result.body);
      
      // Scroll to output on mobile
      if (window.innerWidth < 768) {
        outputRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error: any) {
      if (isTimedOut) return;
      clearTimeout(timeoutId);
      console.error('Generation failed:', error);
      const errorMessage = error?.message || 'Unknown error';
      
      if (errorMessage.includes('API key not found') || errorMessage.includes('API_KEY_INVALID')) {
        alert('API Key Error: Please ensure your GEMINI_API_KEY is correctly set in your environment variables.');
      } else if (errorMessage.includes('busy') || errorMessage.includes('high demand') || errorMessage.includes('503')) {
        alert('AI is currently busy: Google\'s servers are experiencing high demand. Please wait 10 seconds and try again.');
      } else if (errorMessage.includes('security') || errorMessage.includes('leaked')) {
        alert('Security Alert: Your API key has been disabled. Please generate a new one from Google AI Studio.');
      } else {
        alert(`Generation Error: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const text = `Subject: ${isEditing ? editedSubject : currentEmail?.subject}\n\n${isEditing ? editedBody : currentEmail?.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentEmail) return;
    const text = `Subject: ${isEditing ? editedSubject : currentEmail.subject}\n\n${isEditing ? editedBody : currentEmail.body}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-${currentEmail.subject.slice(0, 20)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentEmail?.id === id) setCurrentEmail(null);
  };

  const handleSelectHistory = (email: GeneratedEmail) => {
    setCurrentEmail(email);
    setEditedSubject(email.subject);
    setEditedBody(email.body);
    setIsEditing(false);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const startNew = () => {
    setCurrentEmail(null);
    setRequest({
      purpose: '',
      recipient: 'general',
      tone: 'professional',
      keyPoints: '',
      length: 'medium',
      language: 'English'
    });
    setIsEditing(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed inset-y-0 left-0 z-50 w-72 glass border-r flex flex-col lg:relative"
          >
            <div className="p-6 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-display font-bold tracking-tight">MailCraft</h1>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <button 
                onClick={startNew}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600/10 hover:bg-brand-600/20 text-brand-600 rounded-xl font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                New Email
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <History className="w-3 h-3" />
                History
              </div>
              {history.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No history yet
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id}
                    className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                      currentEmail?.id === item.id 
                        ? 'bg-brand-50 border-brand-200 border' 
                        : 'hover:bg-slate-100 border border-transparent'
                    }`}
                    onClick={() => handleSelectHistory(item)}
                  >
                    <div className="text-sm font-medium truncate pr-6">
                      {item.subject || 'No Subject'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHistory(item.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 glass border-b flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
              >
                <Layout className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-display font-semibold">Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-xs font-medium">
              <Check className="w-3 h-3" />
              AI Powered
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <section className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold tracking-tight">Craft your email</h3>
                <p className="text-slate-500 text-sm">Fill in the details and let AI do the writing for you.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-brand-500" />
                    Email Purpose
                  </label>
                  <textarea 
                    value={request.purpose}
                    onChange={(e) => setRequest(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="e.g., Requesting a meeting to discuss the Q3 project timeline..."
                    className="input-field min-h-[120px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <User className="w-4 h-4 text-brand-500" />
                      Recipient
                    </label>
                    <select 
                      value={request.recipient}
                      onChange={(e) => setRequest(prev => ({ ...prev, recipient: e.target.value as Recipient }))}
                      className="input-field"
                    >
                      <option value="general">General</option>
                      <option value="boss">Boss</option>
                      <option value="teacher">Teacher</option>
                      <option value="client">Client</option>
                      <option value="colleague">Colleague</option>
                      <option value="friend">Friend</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <TypeIcon className="w-4 h-4 text-brand-500" />
                      Tone
                    </label>
                    <select 
                      value={request.tone}
                      onChange={(e) => setRequest(prev => ({ ...prev, tone: e.target.value as Tone }))}
                      className="input-field"
                    >
                      <option value="professional">Professional</option>
                      <option value="formal">Formal</option>
                      <option value="friendly">Friendly</option>
                      <option value="casual">Casual</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-brand-500" />
                    Key Points (Optional)
                  </label>
                  <input 
                    type="text"
                    value={request.keyPoints}
                    onChange={(e) => setRequest(prev => ({ ...prev, keyPoints: e.target.value }))}
                    placeholder="e.g., mention the deadline, include the budget file..."
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Layout className="w-4 h-4 text-brand-500" />
                      Length
                    </label>
                    <select 
                      value={request.length}
                      onChange={(e) => setRequest(prev => ({ ...prev, length: e.target.value as Length }))}
                      className="input-field"
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Languages className="w-4 h-4 text-brand-500" />
                      Language
                    </label>
                    <select 
                      value={request.language}
                      onChange={(e) => setRequest(prev => ({ ...prev, language: e.target.value }))}
                      className="input-field"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !request.purpose}
                  className="btn-primary w-full py-4 text-lg shadow-lg shadow-brand-500/20"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Generate Email
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Output Section */}
            <section ref={outputRef} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-bold">Generated Result</h3>
                {currentEmail && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCopy}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-all relative"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                      title="Download as text"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleGenerate}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                      title="Regenerate"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="min-h-[400px] glass rounded-2xl overflow-hidden flex flex-col shadow-xl">
                {!currentEmail && !isGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Mail className="w-8 h-8 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Your generated email will appear here</p>
                      <p className="text-slate-300 text-sm">Fill the form and click generate</p>
                    </div>
                  </div>
                ) : isGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-brand-100 rounded-full" />
                      <div className="absolute top-0 w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="space-y-2 text-center">
                      <p className="text-lg font-medium animate-pulse">Crafting your message...</p>
                      <p className="text-sm text-slate-400">Analyzing tone and context</p>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col"
                  >
                    {/* Subject Line */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</span>
                        {isEditing ? (
                          <button onClick={() => setIsEditing(false)} className="text-xs text-brand-600 font-medium">Cancel</button>
                        ) : (
                          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-600 transition-colors">
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                      </div>
                      {isEditing ? (
                        <input 
                          type="text"
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          className="w-full bg-transparent font-semibold text-lg outline-none focus:ring-1 focus:ring-brand-500 rounded px-1"
                        />
                      ) : (
                        <h4 className="font-semibold text-lg">{currentEmail?.subject}</h4>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-6 relative group">
                      {isEditing ? (
                        <textarea 
                          value={editedBody}
                          onChange={(e) => setEditedBody(e.target.value)}
                          className="w-full h-full min-h-[300px] bg-transparent resize-none outline-none leading-relaxed text-slate-700"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                          {currentEmail?.body}
                        </div>
                      )}
                      
                      {isEditing && (
                        <div className="absolute bottom-4 right-4">
                          <button 
                            onClick={() => {
                              if (currentEmail) {
                                const updated = { ...currentEmail, subject: editedSubject, body: editedBody };
                                setCurrentEmail(updated);
                                setHistory(prev => prev.map(item => item.id === updated.id ? updated : item));
                                setIsEditing(false);
                              }
                            }}
                            className="btn-primary shadow-lg"
                          >
                            <Save className="w-4 h-4" />
                            Save Changes
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
