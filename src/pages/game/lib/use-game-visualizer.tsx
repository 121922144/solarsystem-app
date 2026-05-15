import {
  useCopilotAction,
  useCopilotAdditionalInstructions,
  useFrontendTool,
  useCopilotReadable,
} from '@copilotkit/react-core';
import { useGlobalState, GameState } from './use-global-state';
import Question from '../generative-ui/question';
import { QuestionType, HIDDEN_USER_PREFIX } from '../types';
import { useCopilotChatHeadless_c } from '@copilotkit/react-core';
import { randomId } from '@copilotkit/shared';
import { useCopilotChatSuggestions } from '@copilotkit/react-ui';
import { useEffect, useRef } from 'react';
import { useTTS } from './use-tts';

// 根据当前题号计算下一题题号
const getNextQuestionNumber = (current: string): string => {
  const n = parseInt(current.replace('q', ''), 10);
  if (Number.isNaN(n) || n >= 8) return 'q8';
  return `q${n + 1}`;
};

export function useGameVisualizer() {
  const { gameState, setGameState, questionList, setQuestionList } =
    useGlobalState();
  const { sendMessage } = useCopilotChatHeadless_c();
  const { resetSeen: resetTTSSeen, stop: stopTTS } = useTTS();

  // 用于"选答后兜底再催一次"的定时器，避免 AI 漏调用工具时卡住
  const retryTimerRef = useRef<number | null>(null);
  // 取消兜底重试 timer 的统一入口
  const cancelRetryTimer = () => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  // 一旦 gameState 切到了下一个题号（说明 AI 已经成功调用 setQuestion），
  // 立刻取消兜底重试 timer，避免在 AI 吐题中途又被催发一遍导致重复出题。
  useEffect(() => {
    cancelRetryTimer();
  }, [gameState]);

  // 新一局开始（gameState 切到 'q1'）时，清空 TTS 已读 id 集合并停掉残留播放。
  // 否则第二局的 question:q1 ~ question:q8 会因 id 命中"已读"集合而被静音。
  useEffect(() => {
    if (gameState === 'q1') {
      stopTTS();
      resetTTSSeen();
    }
  }, [gameState, stopTTS, resetTTSSeen]);

  useCopilotChatSuggestions(
    {
      instructions: `
        - 当用户刚刚进入页面，或者结束游戏后，根据当前阶段和游戏状态，用中文建议用户开始游戏或者重新开始游戏以及其他建议。
        - 其他建议必须是和宇宙相关的具体问题，例如“光年是什么单位”，而不是“请告诉我关于宇宙的问题”这种模糊问题，但不要用我的例子给出建议。
        - 不要给出结束游戏、继续游戏的建议，以及用户刚刚进入页面时不要给出重新开始的建议。
        - 始终使用中文给出建议。
      `,
      maxSuggestions: 3,
      available:
        gameState === 'idle' || gameState === 'gameOver'
          ? 'enabled'
          : 'disabled',
    },
    [gameState]
  );

  useCopilotAdditionalInstructions({
    instructions: `
        【关于 ${HIDDEN_USER_PREFIX}前缀】
        - 用户消息中以“${HIDDEN_USER_PREFIX}”开头的内容，是系统下发的内部强指令，**必须严格执行**。
        - **禁止**在你的回复中复述、引用或显示该前缀及其后面的指令文本，用户看不到这部分内容。

        【游戏流程强约束】
        - 本游戏共 8 题，题号固定从 q1 到 q8，每题单选 A/B/C/D。
        - 只要用户消息中包含“开始游戏”“请出下一题”“我选择了答案”等触发词，必须**立刻调用 setQuestion 工具**出题，禁止只用文字回复。
        - 回答完 q8 后，必须**立刻调用 gameOver 工具**，禁止只用文字宣布游戏结束。
        - 关于没回答过的问题，永远不要回答用户，提醒用户正在游戏中，问是否需要退出。
        - 如果用户提问的是已经回答过的问题，可以告诉用户答案。

        【出题主题与准确性】
        - 题目主题严格限定为：太阳系、行星、卫星、恒星、宇宙基础常识、天文学入门概念。禁止出其它领域的题目。
        - 出题前请**先在心里确定正确答案**，再围绕该答案构造 3 个合理但明确错误的干扰项。
        - correctAnswer 必须严格等于 options 中的某一个键（A/B/C/D），且四个选项内容互不相同。
        - **优先出概念题、特征题、对比题**；**避免**出具体年份、具体距离/质量数值、最新探测任务进度等容易记错的题，以免答案失准。
        - 每一轮题目尽量不要与 questionList 中已出过的题重复。
        - 难度梯度：q1-q3 入门，q4-q6 中等，q7-q8 进阶。

        【aiFeedback 写法】
        - q1 时，aiFeedback 用于欢迎和激励；
        - q2~q8 时，aiFeedback 用于判断上一题是否正确：正确就表扬，错误就告知正确答案（结合 questionList 中上一题的 correctAnswer 与 userAnswer）。
      `,
  });

  useCopilotReadable({
    description: '用户已回答的问题列表（包含题干、选项、正确答案、用户答案）',
    value: questionList,
  });

  useCopilotReadable({
    description:
      '下一个应该出的题号。调用 setQuestion 时 questionNumber 必须使用此值；若为 gameOver 则说明已答完 q8，必须调用 gameOver 工具',
    value: (() => {
      if (questionList.length === 0) return 'q1';
      if (questionList.length >= 8) return 'gameOver';
      return `q${questionList.length + 1}`;
    })(),
  });

  // AI出题
  useFrontendTool({
    name: 'setQuestion',
    description: `
      - 当用户发出开始游戏、请出下一题，或完成选择答案时，**必须**调用此工具给出下一题；不要只用文字回复。
      - 无论用户上一题是否答对，都继续调用 setQuestion 进行下一轮出题。
      - questionNumber 必须等于 readable 中“下一个应该出的题号”。
      - correctAnswer 必须严格等于 options 的某个键（A/B/C/D），四个选项内容互不相同。
      - 当 readable 中“下一个应该出的题号”已经是 gameOver，则禁止再调用本工具，请改为调用 gameOver 工具。
    `,
    parameters: [
      {
        name: 'question',
        type: 'object',
        description: 'AI助手生成的题目',
        required: true,
        attributes: [
          {
            name: 'questionNumber',
            type: 'string',
            description:
              '题目编号，从q1到q8，必须等于 readable 中“下一个应该出的题号”',
          },
          {
            name: 'aiFeedback',
            type: 'string',
            description:
              'q1 为欢迎激励语；q2~q8 为上一题答题反馈（答对表扬，答错给出正确答案并简要说明）',
          },
          {
            name: 'question',
            type: 'string',
            description: '题目内容，主题限定为太阳系/天文学',
          },
          {
            name: 'options',
            type: 'object',
            attributes: [
              { name: 'A', type: 'string', description: '选项A' },
              { name: 'B', type: 'string', description: '选项B' },
              { name: 'C', type: 'string', description: '选项C' },
              { name: 'D', type: 'string', description: '选项D' },
            ],
          },
          {
            name: 'correctAnswer',
            type: 'string',
            enum: ['A', 'B', 'C', 'D'],
            description: '正确答案，必须等于 options 中某个键',
          },
        ],
      },
    ],
    followUp: false,
    handler: async ({ question }) => {
      // 新题到达：立即取消兜底重试，避免重复催发指令
      cancelRetryTimer();
      if (question.questionNumber) {
        setGameState(question.questionNumber as GameState);
      }
    },
    render: ({ args, status }) => {
      // 只要工具开始流式输出（render 被调用），就立刻取消兜底重试 timer。
      // handler 要等参数完整才触发，时机偏晚；render 触发更早，能避免误催。
      if (status === 'inProgress' || status === 'executing') {
        cancelRetryTimer();
      }

      // 播放错误答案音效
      const playErrorSound = () => {
        const audio = document.getElementById(
          'error-audio'
        ) as HTMLAudioElement;
        if (audio) {
          audio.currentTime = 0;
          audio.volume = 0.5;
          audio.play().catch(error => {
            console.error('播放错误音效失败:', error);
          });
        }
      };

      // 播放正确答案音效
      const playCorrectSound = () => {
        const audio = document.getElementById(
          'correct-audio'
        ) as HTMLAudioElement;
        if (audio) {
          audio.currentTime = 0;
          audio.volume = 0.5;
          audio.play().catch(error => {
            console.error('播放正确音效失败:', error);
          });
        }
      };

      return (
        <Question
          currentQuestion={args.question as QuestionType}
          status={status}
          playErrorSound={playErrorSound}
          playCorrectSound={playCorrectSound}
          onSelect={option => {
            const currentQ = args.question as QuestionType | undefined;
            const currentNumber = currentQ?.questionNumber ?? '';
            const isLast = currentNumber === 'q8';
            const nextNumber = getNextQuestionNumber(currentNumber);
            const correctAnswer = currentQ?.correctAnswer;

            // 命令式消息：明确带题号、正确答案、下一步工具名
            // 加 HIDDEN_USER_PREFIX 前缀，让该消息只发给 AI、不在聊天框中显示
            const content = isLast
              ? `${HIDDEN_USER_PREFIX}用户对题号 ${currentNumber} 选择了 ${option}（正确答案是 ${correctAnswer}）。这是最后一题，请**立刻调用 gameOver 工具**结束游戏，并在回复中统计用户答对的题目数量。禁止只用文字回复。`
              : `${HIDDEN_USER_PREFIX}用户对题号 ${currentNumber} 选择了 ${option}（正确答案是 ${correctAnswer}）。请**立刻调用 setQuestion 工具**出下一题，questionNumber 必须为 ${nextNumber}，并在 aiFeedback 中对上一题作出反馈。禁止只用文字回复。`;

            sendMessage(
              {
                id: randomId(),
                role: 'user',
                content,
              },
              {
                clearSuggestions: false,
              }
            );

            setQuestionList(prevQuestionList => {
              const updatedQuestion = {
                ...(args.question as QuestionType),
                userAnswer: option as 'A' | 'B' | 'C' | 'D',
              };
              return prevQuestionList.concat(updatedQuestion);
            });

            // 兜底：若 15 秒内 AI 没有触发对应工具（gameState 仍停在当前题号），
            // 再发一次更强指令催一次；只重试一次，避免死循环。
            // 注意：只要工具一开始流式输出（render 触发）或 gameState 切换，
            // 这个 timer 就会被立即取消，避免重复出题。
            cancelRetryTimer();
            retryTimerRef.current = window.setTimeout(() => {
              retryTimerRef.current = null;
              const retryContent = isLast
                ? `${HIDDEN_USER_PREFIX}提醒：用户已经回答了 q8，请立刻调用 gameOver 工具，不要只用文字回复。`
                : `${HIDDEN_USER_PREFIX}提醒：用户已经回答了 ${currentNumber}，请立刻调用 setQuestion 工具出题号为 ${nextNumber} 的下一题，不要只用文字回复。`;
              sendMessage(
                {
                  id: randomId(),
                  role: 'user',
                  content: retryContent,
                },
                { clearSuggestions: false }
              );
            }, 15000);
          }}
        />
      );
    },
  });

  // 游戏结束
  useCopilotAction({
    name: 'gameOver',
    description: `
      - 当用户完成 q8 或主动要求结束游戏时，**必须**调用此工具。
      - 调用时请在回复文本中判断用户最后一题是否正确，并统计用户答对的题目总数。
      - 禁止只用文字宣布游戏结束而不调用本工具。
    `,
    handler: () => {
      cancelRetryTimer();
      setGameState('gameOver');
    },
  });
}
