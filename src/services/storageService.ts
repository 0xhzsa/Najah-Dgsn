import { User, QuizState } from '../types';

const USER_KEY = 'dgsn_prep_user_v4'; 
const USED_CODES_KEY = 'dgsn_used_codes_v2';
const PREMIUM_EMAILS_KEY = 'dgsn_premium_emails_v1';
const DEVICE_USAGE_KEY = 'dgsn_device_usage_v3';
const QUIZ_STATE_KEY = 'dgsn_quiz_state_v2';
const BOOKMARKS_KEY = 'dgsn_bookmarks_v1';
const UPLOAD_COUNT_KEY = 'dgsn_upload_count_v2';

export const storageService = {
  getUser: (): User | null => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  createUser: (name: string, emailInput: string): User => {
    const email = emailInput.trim().toLowerCase();
    
    // 1. Check if email is already in Premium Ledger
    const premiumEmails = JSON.parse(localStorage.getItem(PREMIUM_EMAILS_KEY) || '[]');
    const isPremiumEmail = premiumEmails.includes(email);
    
    // 2. ADMIN BACKDOOR
    const isAdmin = email === 'admin@dgsn.ma';

    const user: User = {
      id: `user-${Date.now()}`,
      name,
      email, 
      isPremium: isAdmin || isPremiumEmail, 
      questionsAnsweredToday: 0,
      lastLoginDate: new Date().toDateString()
    };
    storageService.saveUser(user);
    return user;
  },

  saveUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
  },

  // --- QUIZ PERSISTENCE (SAFE MODE) ---
  saveQuizState: (state: Partial<QuizState>) => {
    try {
        const current = storageService.getQuizState() || {};
        
        // CRITICAL FIX: Limit to 50 active questions to prevent localStorage crash
        let questionsToSave = state.questions || current.questions || [];
        if (questionsToSave.length > 50) {
            questionsToSave = questionsToSave.slice(0, 50); 
        }

        const updated = { 
            ...current, 
            ...state,
            questions: questionsToSave 
        };
        
        localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn("Storage quota exceeded. Progress saved partially.");
        // Fallback: save only index and score
        localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify({
            currentQuestionIndex: state.currentQuestionIndex,
            answers: state.answers
        }));
    }
  },

  getQuizState: (): Partial<QuizState> | null => {
    try {
      const data = localStorage.getItem(QUIZ_STATE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  clearQuizState: () => {
    localStorage.removeItem(QUIZ_STATE_KEY);
  },

  // --- BOOKMARKS ---
  getBookmarks: (): string[] => {
    try {
        const data = localStorage.getItem(BOOKMARKS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
  },

  saveBookmarks: (ids: string[]) => {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(ids));
  },

  // --- USAGE & PREMIUM ---
  incrementUsage: (): boolean => {
    const user = storageService.getUser();
    if (user?.isPremium) return true;

    const today = new Date().toDateString();
    const deviceUsage = JSON.parse(localStorage.getItem(DEVICE_USAGE_KEY) || '{"date": "", "count": 0}');
    
    if (deviceUsage.date !== today) {
      deviceUsage.date = today;
      deviceUsage.count = 0;
    }

    if (deviceUsage.count >= 40) return false;

    deviceUsage.count++;
    localStorage.setItem(DEVICE_USAGE_KEY, JSON.stringify(deviceUsage));

    // Sync with user obj
    if (user) {
      user.questionsAnsweredToday = deviceUsage.count;
      storageService.saveUser(user);
    }

    return true;
  },

  getRemainingTries: (): number => {
    const user = storageService.getUser();
    if (user?.isPremium) return 999;
    
    const today = new Date().toDateString();
    const deviceUsage = JSON.parse(localStorage.getItem(DEVICE_USAGE_KEY) || '{"date": "", "count": 0}');
    
    if (deviceUsage.date !== today) return 40;
    return Math.max(0, 40 - deviceUsage.count);
  },

  // --- UPLOAD TRACKING ---
  getUploadCount: (): number => {
    return parseInt(localStorage.getItem(UPLOAD_COUNT_KEY) || '0', 10);
  },

  incrementUploadCount: () => {
    const current = storageService.getUploadCount();
    localStorage.setItem(UPLOAD_COUNT_KEY, (current + 1).toString());
  },

  activatePremium: (codeInput: string): boolean => {
    const code = codeInput.trim().toUpperCase();
    const usedCodes = JSON.parse(localStorage.getItem(USED_CODES_KEY) || '[]');
    const user = storageService.getUser();
    
    if (!user) return false;

    const setPremium = () => {
        user.isPremium = true;
        storageService.saveUser(user);

        const premiumEmails = JSON.parse(localStorage.getItem(PREMIUM_EMAILS_KEY) || '[]');
        const normalizedEmail = user.email.trim().toLowerCase();
        
        if (!premiumEmails.includes(normalizedEmail)) {
            premiumEmails.push(normalizedEmail);
            localStorage.setItem(PREMIUM_EMAILS_KEY, JSON.stringify(premiumEmails));
        }
    };

    const MASTER_KEY = 'YASSINE_MASTER_2025';
    if (code === MASTER_KEY) { setPremium(); return true; }

    if (usedCodes.includes(code)) return false;

    // OFFICIAL REGEX PATTERN: DGSN-[ANYTHING]-2024
    // Examples: DGSN-AHMED-2024, DGSN-VIP-2024
    const officialPattern = /^DGSN-[A-Z0-9]+-2024$/;
    
    if (officialPattern.test(code)) {
       usedCodes.push(code);
       localStorage.setItem(USED_CODES_KEY, JSON.stringify(usedCodes));
       setPremium();
       return true;
    }
    return false;
  }
};