export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  headline: string;
  industry: string;
  authProvider: "mock" | "linkedin";
  providerId: string;
  createdAt: number;
};

export type Quiz = {
  id: string;
  slug: string;
  creatorId: string;
  title: string;
  description: string | null;
  industry: string;
  status: "draft" | "published";
  playCount: number;
  createdAt: number;
  publishedAt: number | null;
};

export type Question = {
  id: string;
  quizId: string;
  order: number;
  text: string;
  explanation: string | null;
};

export type AnswerOption = {
  id: string;
  questionId: string;
  order: number;
  text: string;
  isCorrect: boolean;
};

export type AttemptAnswer = {
  questionId: string;
  optionId: string | null; // null = timed out / no answer
  correct: boolean;
  timeMs: number;
};

export type Attempt = {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  maxScore: number;
  durationMs: number;
  answers: AttemptAnswer[];
  isReplay: boolean;
  sharedAt: number | null;
  createdAt: number;
};

export type QuestionWithOptions = Question & { options: AnswerOption[] };

export type QuizWithCreator = Quiz & {
  creatorName: string;
  creatorAvatarUrl: string | null;
  creatorHeadline: string;
};

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  headline: string;
  score: number;
  maxScore: number;
  durationMs: number;
  createdAt: number;
};

// Shape used by the quiz builder (client) and draft-save actions.
export type DraftQuestion = {
  text: string;
  explanation: string;
  options: { text: string; isCorrect: boolean }[];
};

export type DraftQuiz = {
  title: string;
  description: string;
  industry: string;
  questions: DraftQuestion[];
};
