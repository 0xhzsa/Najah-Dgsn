export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number; // 0-based index
  explanation: string;
  category?: string;
}

export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  isFinished: boolean;
}

export enum AppMode {
  HOME = 'HOME',
  UPLOAD = 'UPLOAD',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  STUDY = 'STUDY',
  REVIEW_UPLOAD = 'REVIEW_UPLOAD'
}

export interface User {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  questionsAnsweredToday: number;
  lastLoginDate: string;
}

export interface AnalysisResult {
  questions: Question[];
}