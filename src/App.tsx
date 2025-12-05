import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppMode, Question, User } from './types';
import { analyzeExamImage, generatePracticeQuestions } from './services/geminiService';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { Button } from './components/Button';
import { QuizCard } from './components/QuizCard';
import { AuthModal } from './components/AuthModal';
import { PremiumModal } from './components/PremiumModal';
import { INITIAL_QUESTIONS } from './data/initialQuestions';
import { generateBulkQuestions } from './utils/proceduralEngine';

// --- COUNTDOWN COMPONENT ---
const CountdownBanner = () => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, mins: number} | null>(null);

  useEffect(() => {
    // TARGET DATE: December 7th, 2025
    const targetDate = new Date('2025-12-07T08:00:00').getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(null);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #DC143C 0%, #8B0000 100%)',
      color: 'white',
      padding: '12px 20px',
      textAlign: 'center',
      position: 'relative', 
      zIndex: 1000,
      boxShadow: '0 4px 20px rgba(220, 20, 60, 0.4)'
    }} className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 backdrop-blur-md">
      <div className="font-bold text-lg md:text-xl tracking-tight flex items-center gap-2">
        <span className="animate-pulse">⏰</span>
        <span>الامتحان يوم 7 دجنبر 2025</span>
        <span className="mx-2 opacity-50">|</span>
        <span className="font-mono bg-black/20 px-2 py-1 rounded-lg dir-ltr">
           {timeLeft.days}d {timeLeft.hours}h {timeLeft.mins}m
        </span>
      </div>
      <span className="text-sm font-medium opacity-90 hidden md:inline-block border-r border-white/20 pr-4 mr-4">
        آخر فرصة للتحضير. بعد الامتحان الموقع سيغلق نهائياً.
      </span>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quiz State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [quizSessionQuestions, setQuizSessionQuestions] = useState<Question[]>([]);
  
  // Category Selection
  const [quizCategory, setQuizCategory] = useState<string | null>(null);
  const [showCategorySelect, setShowCategorySelect] = useState(false);

  // Timer State
  const EXAM_DURATION = 45 * 60; 
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [isTimerPaused, setIsTimerPaused] = useState(false); 
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);

  // Study Mode State
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Upload/Review State
  const [uploadQuestions, setUploadQuestions] = useState<Question[]>([]);

  // INIT
  useEffect(() => {
    const coreQuestions = INITIAL_QUESTIONS;
    const bulkQuestions = generateBulkQuestions();
    const all = [...coreQuestions, ...bulkQuestions];
    const uniqueQs = Array.from(new Map(all.map(item => [item.id, item])).values()).sort(() => 0.5 - Math.random());
    setQuestions(uniqueQs);

    const existingUser = storageService.getUser();
    if (existingUser) {
      setUser(existingUser);
      setBookmarkedIds(storageService.getBookmarks());
      
      const savedState = storageService.getQuizState();
      if (savedState && savedState.questions && savedState.questions.length > 0) {
         setQuizSessionQuestions(savedState.questions);
         setCurrentQIndex(savedState.currentQuestionIndex || 0);
         setUserAnswers(savedState.answers || {});
      }
    } else {
      setShowAuthModal(true);
    }
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (mode === AppMode.QUIZ && isTimerEnabled && !isTimerPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
             clearInterval(interval);
             setMode(AppMode.RESULTS);
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, isTimerPaused, timeLeft, isTimerEnabled]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const uniqueCategories = useMemo(() => {
    const cats = Array.from(new Set(questions.map(q => q.category || 'عام')));
    return ['الكل', ...cats.sort()];
  }, [questions]);

  // Handle Navigation
  const handleNavigation = (newMode: AppMode) => {
    if (newMode === AppMode.QUIZ) {
        if (quizSessionQuestions.length > 0) {
            setMode(AppMode.QUIZ);
        } else {
            setShowCategorySelect(true);
        }
    } else {
        setMode(newMode);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (name: string, email: string) => {
    const newUser = storageService.createUser(name, email);
    setUser(newUser);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setMode(AppMode.HOME);
    setShowAuthModal(true);
  };

  const handlePremiumActivate = (code: string) => {
    if (storageService.activatePremium(code)) {
        const updatedUser = storageService.getUser();
        setUser(updatedUser);
        return true;
    }
    return false;
  };

  // --- QUIZ LOGIC ---
  const startQuiz = (category?: string) => {
    let pool = questions;
    if (category) {
        pool = questions.filter(q => q.category === category);
    }
    const sessionQs = pool.sort(() => 0.5 - Math.random()).slice(0, 30);
    
    setQuizSessionQuestions(sessionQs);
    setQuizCategory(category || null);
    setCurrentQIndex(0);
    setUserAnswers({});
    setShowResult(false);
    setTimeLeft(EXAM_DURATION);
    setIsTimerPaused(false);
    
    setMode(AppMode.QUIZ);
    setShowCategorySelect(false);
    
    storageService.saveQuizState({ 
        questions: sessionQs,
        currentQuestionIndex: 0,
        score: 0,
        answers: {},
        isFinished: false 
    });
    
    window.scrollTo(0,0);
  };

  const cancelQuiz = () => {
      setQuizSessionQuestions([]);
      setCurrentQIndex(0);
      setUserAnswers({});
      storageService.clearQuizState();
      setMode(AppMode.HOME);
      setTimeout(() => setShowCategorySelect(true), 100);
  };

  const handleAnswer = (optionIndex: number) => {
    const currentQ = quizSessionQuestions[currentQIndex];
    if (!currentQ) return;

    const newAnswers = { ...userAnswers, [currentQ.id]: optionIndex };
    setUserAnswers(newAnswers);
    setShowResult(true);

    storageService.saveQuizState({
        answers: newAnswers,
        currentQuestionIndex: currentQIndex 
    });
  };

  const nextQuestion = () => {
    if (currentQIndex < quizSessionQuestions.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      
      const nextQ = quizSessionQuestions[nextIdx];
      if (userAnswers[nextQ?.id] !== undefined) {
          setShowResult(true);
      } else {
          setShowResult(false);
      }
      
      storageService.saveQuizState({ currentQuestionIndex: nextIdx });
    } else {
      setMode(AppMode.RESULTS);
    }
    window.scrollTo(0,0);
  };

  const prevQuestion = () => {
      if (currentQIndex > 0) {
          const prevIdx = currentQIndex - 1;
          setCurrentQIndex(prevIdx);
          setShowResult(true);
          storageService.saveQuizState({ currentQuestionIndex: prevIdx });
      }
  };

  const handleGenerateMore = async () => {
    if (!user?.isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setLoading(true);
    try {
      const newQs = await generatePracticeQuestions(questions, mode === AppMode.QUIZ ? (quizCategory || 'عام') : activeCategory);
      
      if (mode === AppMode.QUIZ) {
          const newSession = [...quizSessionQuestions];
          newSession.splice(currentQIndex + 1, 0, ...newQs);
          setQuizSessionQuestions(newSession);
          storageService.saveQuizState({ questions: newSession });
          alert(`✅ تم إضافة ${newQs.length} سؤال جديد للاختبار الحالي!`);
      } else {
          setQuestions(prev => [...newQs, ...prev]);
          alert(`✅ تم إضافة ${newQs.length} سؤال جديد لبنك الأسئلة!`);
      }
    } catch (e) {
      alert("تعذر توليد الأسئلة. المرجو المحاولة لاحقاً.");
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.isPremium) {
        const uploadCount = storageService.getUploadCount();
        if (uploadCount >= 2) {
            setShowPremiumModal(true);
            return;
        }
        storageService.incrementUploadCount();
    }

    setOcrLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const extractedQuestions = await analyzeExamImage(base64);
        if (extractedQuestions.length > 0) {
            setUploadQuestions(extractedQuestions);
            setMode(AppMode.REVIEW_UPLOAD);
        } else {
            alert("لم يتم العثور على أسئلة في الصورة.");
        }
      } catch (err) {
        alert("فشل تحليل الصورة.");
      }
      setOcrLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleBookmark = (id: string) => {
      let newBookmarks;
      if (bookmarkedIds.includes(id)) {
          newBookmarks = bookmarkedIds.filter(b => b !== id);
      } else {
          newBookmarks = [...bookmarkedIds, id];
      }
      setBookmarkedIds(newBookmarks);
      storageService.saveBookmarks(newBookmarks);
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center max-w-7xl mx-auto">
        
        {/* PREMIUM HERO CARD (Status Symbol) */}
        <div 
            onClick={() => !user?.isPremium && setShowPremiumModal(true)}
            className={`w-full max-w-md mx-auto mb-12 relative group cursor-pointer perspective-1000 ${user?.isPremium ? 'opacity-90' : ''}`}
        >
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-blue-600 rounded-[2rem] blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative h-56 bg-gradient-to-br from-slate-900 to-slate-950 rounded-[1.8rem] border border-white/10 p-6 flex flex-col justify-between overflow-hidden transform transition-all duration-500 group-hover:scale-[1.02] group-hover:rotate-y-12 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none z-10"></div>

                <div className="flex justify-between items-start z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10">
                            <span className="font-black text-white">D</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">ACCESS PASS</p>
                            <p className="text-white font-bold tracking-wide">DGSN PRO</p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${user?.isPremium ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-white/5 text-slate-500 border-white/5'}`}>
                        {user?.isPremium ? 'ACTIVATED' : 'LOCKED'}
                    </div>
                </div>

                <div className="text-right z-20">
                    <p className="text-sm text-slate-400 font-medium mb-1">الحالة الحالية</p>
                    <p className={`text-2xl font-black tracking-tight ${user?.isPremium ? 'text-emerald-400' : 'text-white'}`}>
                        {user?.isPremium ? 'عضو مميز' : 'نسخة مجانية'}
                    </p>
                </div>
            </div>
        </div>

        {/* VERIFIED BADGE */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-6 animate-fade-in">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
           </svg>
           مصدر موثوق • تحديث 2025
        </div>

        {/* COPYWRITING OVERHAUL */}
        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-tight drop-shadow-2xl max-w-4xl">
          هل أنت مستعد لمباراة الأمن الوطني؟
        </h2>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-light leading-relaxed">
          لا تعتمد على الحظ. اعتمد على 800 سؤال من قلب المباريات السابقة.
        </p>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
            <button 
                onClick={() => onNavigate(AppMode.STUDY)}
                className="group relative overflow-hidden rounded-3xl bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30 p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(30,58,138,0.3)] text-right"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">المراجعة الشاملة</h3>
                <p className="text-blue-200 font-medium">ابدأ التدريب مجاناً</p>
            </button>

            <button 
                onClick={() => onNavigate(AppMode.QUIZ)}
                className="group relative overflow-hidden rounded-3xl bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(153,27,27,0.3)] text-right"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">بدء الاختبار</h3>
                <p className="text-red-200 font-medium">اختبر معلوماتك الآن</p>
            </button>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex gap-4">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-bold transition-all"
            >
                تصحيح امتحان
            </button>
            
            {!user?.isPremium && (
                <button 
                    onClick={() => setShowPremiumModal(true)}
                    className="px-6 py-3 rounded-2xl bg-white text-black font-black text-sm hover:bg-slate-200 transition-all shadow-lg"
                >
                    الترقية الآن
                </button>
            )}
        </div>

        <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
        />
    </div>
  );

  const renderQuiz = () => {
    const currentQ = quizSessionQuestions[currentQIndex];
    if (!currentQ) return <div className="text-white text-center mt-20">جاري تحميل الاختبار...</div>;

    const progress = ((currentQIndex + 1) / quizSessionQuestions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <span className="text-slate-400 font-mono text-sm whitespace-nowrap">
                   سؤال {currentQIndex + 1} / {quizSessionQuestions.length} (من بنك 800+)
                </span>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                    <span>{formatTime(timeLeft)}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                </div>
                
                <button 
                    onClick={handleGenerateMore}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                >
                    {loading ? (
                        <span className="animate-spin">⌛</span>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    )}
                    توليد أسئلة (+50)
                    {!user?.isPremium && <span className="text-[10px] bg-black/30 px-1.5 rounded">PRO</span>}
                </button>
            </div>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full mb-8 overflow-hidden">
            <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
            ></div>
        </div>

        <QuizCard 
          question={currentQ}
          selectedOptionIndex={userAnswers[currentQ?.id]}
          onSelectOption={handleAnswer}
          showResult={showResult}
        />

        <div className="flex justify-between mt-8">
            <Button 
                onClick={prevQuestion} 
                variant="outline" 
                disabled={currentQIndex === 0}
                className="w-32"
            >
                السابق
            </Button>

            {showResult ? (
                <Button 
                    onClick={nextQuestion} 
                    className="w-32 bg-emerald-600 hover:bg-emerald-500 animate-fade-in"
                >
                    {currentQIndex === quizSessionQuestions.length - 1 ? 'إنهاء' : 'التالي'}
                </Button>
            ) : (
                <div className="w-32"></div> 
            )}
        </div>
      </div>
    );
  };

  const renderStudyMode = () => {
    const isFree = !user?.isPremium;
    const DISPLAY_LIMIT = isFree ? 100 : 9999;
    
    const filteredQuestions = questions.filter(q => {
        const matchesCategory = activeCategory === 'الكل' || q.category === activeCategory;
        const matchesSearch = q.text.includes(searchTerm) || q.explanation.includes(searchTerm);
        const matchesBookmark = showBookmarksOnly ? bookmarkedIds.includes(q.id) : true;
        return matchesCategory && matchesSearch && matchesBookmark;
    });

    const displayedQuestions = filteredQuestions.slice(0, DISPLAY_LIMIT);
    const hiddenCount = Math.max(0, 800 - 100); 

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
            <div className="flex flex-wrap gap-2 items-center w-full">
                <button
                    onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 grow sm:grow-0 justify-center ${
                        showBookmarksOnly 
                        ? 'bg-amber-500 text-white border-amber-500' 
                        : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                    المفضلة
                </button>
                <div className="hidden sm:block w-px h-6 bg-white/10 mx-2"></div>
                {uniqueCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border grow sm:grow-0 ${
                            activeCategory === cat 
                            ? 'bg-white text-slate-900 border-white' 
                            : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
                 <div className="relative grow lg:grow-0">
                    <input 
                        type="text" 
                        placeholder="بحث..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full lg:w-64 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-white text-sm focus:border-blue-500 outline-none"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 
                 <button 
                    onClick={handleGenerateMore}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                 >
                    {loading && <span className="animate-spin">⌛</span>}
                    توليد أسئلة (+50)
                 </button>
            </div>
        </div>

        {/* Questions List */}
        <div className="grid gap-6">
            {displayedQuestions.map((q, idx) => (
                <div key={q.id} className="glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all group relative">
                    {/* Bookmark */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(q.id); }}
                        className={`absolute top-4 left-4 p-2 rounded-full transition-colors ${bookmarkedIds.includes(q.id) ? 'text-amber-400 bg-amber-400/10' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                    </button>

                    <div className="flex items-start gap-4 mb-4">
                        <span className="bg-slate-800 text-slate-400 text-xs font-mono px-2 py-1 rounded">#{idx + 1}</span>
                        <h3 className="text-lg font-bold text-white leading-relaxed">{q.text}</h3>
                    </div>

                    <div className="space-y-2 mb-4 pr-4 border-r-2 border-slate-800">
                        {q.options.map((opt, i) => (
                            <div key={i} className={`text-sm ${i === q.correctAnswerIndex ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                                {i === q.correctAnswerIndex && '✓ '} {opt}
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-950/50 rounded-xl p-4 text-sm text-slate-300 border border-white/5">
                        <span className="text-blue-400 font-bold block mb-1">الشرح:</span>
                        {q.explanation}
                    </div>
                </div>
            ))}
        </div>

        {/* LOCKED CONTENT BANNER */}
        {isFree && (
            <div className="mt-8 relative overflow-hidden rounded-3xl border border-white/10">
                {/* Blur Layer */}
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl z-10 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-2xl shadow-black">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-2">المحتوى المميز مقفول</h3>
                    <p className="text-slate-400 text-lg mb-8">هناك <span className="text-emerald-400 font-bold">+{hiddenCount} سؤال إضافي</span> (شامل جميع التخصصات) متاح حصرياً للأعضاء المميزين.</p>
                    <button 
                        onClick={() => setShowPremiumModal(true)}
                        className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white font-black tracking-wide shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
                    >
                        فتح جميع الأسئلة
                    </button>
                </div>
                {/* Fake Content Background */}
                <div className="opacity-10 filter blur-sm pointer-events-none select-none p-6">
                    {[1,2,3].map(i => (
                        <div key={i} className="mb-4 h-32 bg-slate-800 rounded-xl w-full"></div>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
      const correctCount = Object.keys(userAnswers).filter(qid => {
          const q = quizSessionQuestions.find(i => i.id === qid);
          return q && userAnswers[qid] === q.correctAnswerIndex;
      }).length;
      const total = quizSessionQuestions.length;
      const percentage = Math.round((correctCount / total) * 100);

      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in px-4">
              <div className="w-32 h-32 rounded-full border-4 border-slate-700 flex items-center justify-center mb-8 relative">
                  <span className={`text-4xl font-black ${percentage >= 50 ? 'text-emerald-400' : 'text-red-500'}`}>{percentage}%</span>
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" stroke={percentage >= 50 ? '#10b981' : '#ef4444'} strokeWidth="4" strokeDasharray={`${percentage * 2.89} 289`} strokeLinecap="round" />
                  </svg>
              </div>
              
              <h2 className="text-4xl font-bold text-white mb-4">
                  {percentage >= 70 ? 'ممتاز! 🎉' : percentage >= 50 ? 'جيد، واصل! 👍' : 'تحتاج للمزيد من المراجعة 💪'}
              </h2>
              <p className="text-slate-400 text-lg mb-12">أجبت بشكل صحيح على {correctCount} من أصل {total} سؤال</p>

              <div className="flex gap-4">
                  <Button onClick={() => setMode(AppMode.HOME)} variant="outline">العودة للرئيسية</Button>
                  <Button onClick={() => startQuiz()} className="bg-blue-600 hover:bg-blue-500">بدء اختبار جديد</Button>
              </div>
          </div>
      );
  };

  const renderUploadReview = () => (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">نتائج التصحيح الذكي</h2>
              <Button onClick={() => setMode(AppMode.HOME)} variant="outline" className="px-4 py-2 text-xs">إغلاق</Button>
          </div>
          
          <div className="space-y-6">
              {uploadQuestions.map((q, idx) => (
                  <div key={idx} className="glass-card rounded-2xl p-6 border border-white/10">
                      <h3 className="text-xl font-bold text-white mb-4 text-right" dir="rtl">{q.text}</h3>
                      <div className="grid gap-2 mb-4">
                          {q.options.map((opt, i) => (
                              <div key={i} className={`p-3 rounded-lg text-right border ${i === q.correctAnswerIndex ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-transparent text-slate-400'}`}>
                                  {opt}
                              </div>
                          ))}
                      </div>
                      <div className="bg-blue-900/20 p-4 rounded-xl text-right border border-blue-500/20">
                          <p className="text-blue-300 text-sm">{q.explanation}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const onNavigate = (newMode: AppMode) => handleNavigation(newMode);

  return (
    <div className="min-h-screen pb-20 relative">
      <CountdownBanner />
      <Navbar onNavigate={onNavigate} currentMode={mode} user={user} onLogout={handleLogout} />
      
      <main className="pt-8">
        {mode === AppMode.HOME && renderHome()}
        {mode === AppMode.STUDY && renderStudyMode()}
        {mode === AppMode.QUIZ && renderQuiz()}
        {mode === AppMode.RESULTS && renderResults()}
        {mode === AppMode.REVIEW_UPLOAD && renderUploadReview()}
      </main>

      {showAuthModal && <AuthModal onLogin={handleLogin} />}
      
      {showPremiumModal && (
        <PremiumModal 
            onActivate={handlePremiumActivate} 
            onClose={() => setShowPremiumModal(false)} 
        />
      )}

      {showCategorySelect && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowCategorySelect(false)}>
              <div className="glass-card rounded-3xl p-8 max-w-2xl w-full text-center relative" onClick={e => e.stopPropagation()}>
                  <h3 className="text-2xl font-bold text-white mb-8">اختر موضوع الاختبار</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {uniqueCategories.filter(c => c !== 'الكل').map(cat => (
                          <button
                              key={cat}
                              onClick={() => startQuiz(cat)}
                              className="p-4 rounded-xl bg-slate-800 hover:bg-blue-600 border border-white/5 hover:border-blue-400 transition-all text-white font-bold text-sm md:text-base shadow-lg"
                          >
                              {cat}
                          </button>
                      ))}
                      <button
                          onClick={() => startQuiz()}
                          className="p-4 rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white font-bold text-sm md:text-base shadow-lg col-span-2 md:col-span-3 mt-4"
                      >
                          اختبار شامل (جميع المواضيع)
                      </button>
                  </div>
              </div>
          </div>
      )}

      {ocrLoading && (
          <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center backdrop-blur-xl">
              <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 m-auto h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 animate-pulse">جاري تحليل الوثيقة...</h3>
              <p className="text-slate-400 text-sm">الذكاء الاصطناعي يقرأ الأسئلة</p>
          </div>
      )}
    </div>
  );
};

export default App;