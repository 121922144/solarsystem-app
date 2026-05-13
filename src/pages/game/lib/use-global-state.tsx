import React, { createContext, ReactNode, useContext, useState } from 'react';
import { QuestionType } from '../types';

export type GameState =
  | 'idle'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'q5'
  | 'q6'
  | 'q7'
  | 'q8'
  | 'gameOver';

interface GlobalState {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  questionList: QuestionType[];
  setQuestionList: React.Dispatch<React.SetStateAction<QuestionType[]>>;
}

export const GlobalStateContext = createContext<GlobalState | null>(null);

export function useGlobalState(): GlobalState {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [questionList, setQuestionList] = useState<QuestionType[]>([]);

  return (
    <GlobalStateContext.Provider
      value={{
        gameState,
        setGameState,
        questionList,
        setQuestionList,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
}
