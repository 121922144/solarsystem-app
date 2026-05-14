export interface QuestionType {
  questionNumber: string;
  aiFeedback: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  userAnswer?: 'A' | 'B' | 'C' | 'D';
}

/**
 * 用于"发给 AI 但不在聊天 UI 中显示"的用户消息前缀。
 * - 在 sendMessage 时把它拼到 content 最前面；
 * - 自定义 UserMessage 渲染时检测到该前缀的消息直接不渲染（返回 null）。
 * 不要修改这个值，否则前后两端不一致会导致指令在对话框里露出来。
 */
export const HIDDEN_USER_PREFIX = '[[SYSTEM_DIRECTIVE]] ';
