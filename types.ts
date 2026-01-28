
export type Operator = '<' | '>' | '=';
export type QuestionType = 'MORE' | 'LESS' | 'EQUAL' | 'FILL_BOXES';

export interface MathProblem {
  leftCount: number;
  rightCount: number;
  itemName: string;
  itemEmoji: string;
  correctOperator: Operator;
  questionType: QuestionType;
  praise: string;
  encouragement: string;
}

export interface GameState {
  score: number;
  currentProblemIndex: number;
  problems: MathProblem[];
  status: 'intro' | 'loading' | 'playing' | 'feedback' | 'finished' | 'drawing_intro' | 'drawing' | 'reward_ask' | 'filling_game';
  selectedOperator: Operator | null;
  isCorrect: boolean | null;
  mode: 'choice' | 'drawing' | 'filling';
  // State for the new game mode
  fillingLeft: number;
  fillingRight: number;
  activeSide: 'left' | 'right';
}
