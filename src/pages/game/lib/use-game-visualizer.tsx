import {
  useCopilotAction,
  useCopilotAdditionalInstructions,
  useFrontendTool,
  useCopilotReadable,
} from '@copilotkit/react-core';
import { useGlobalState, GameState } from './use-global-state';
import Question from '../generative-ui/question';
import { QuestionType } from '../types';
import { useCopilotChatHeadless_c } from '@copilotkit/react-core';
import { randomId } from '@copilotkit/shared';
import { useCopilotChatSuggestions } from '@copilotkit/react-ui';

export function useGameVisualizer() {
  const { gameState, setGameState, questionList, setQuestionList } =
    useGlobalState();
  const { sendMessage } = useCopilotChatHeadless_c();

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
        - 用户每回答完一题，gameState状态自动切换到下一题，从q1到q8，然后进入游戏结束阶段。
        - 无论用户的答案是否正确，都继续调用setQuestion进行下一轮出题，同时判断用户上一题的答案是否正确。
        - 关于没回答过的问题，永远不要回答用户，提醒用户正在游戏中，问是否需要退出。
        - 如果用户提问的是已经回答过的问题，可以告诉用户答案。
        - 每轮题目尽量不一样。
        - 请确保答案的准确性，以2025年最新的资料为准。
      `,
  });

  useCopilotReadable({
    description: '用户已回答的问题列表',
    value: questionList,
  });

  // AI出题
  useFrontendTool({
    name: 'setQuestion',
    description: `
      - 用户发出开始游戏或者请出下一题的指令，AI助手出题。
      - 无论用户的答案是否正确，都继续调用setQuestion进行下一轮出题。
      - 如果是第一题，aiFeedBack用于给出欢迎和激励的话语，否者用于判断上一题回答是否正确，如果正确则给出表扬，否则给出正确答案。
      - 当出到题号为q8的题目之后，后续不再出题。
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
            description: '题目编号，从q1到q8',
          },
          {
            name: 'aiFeedback',
            type: 'string',
            description:
              'AI助手对上一题答案的反馈信息，如果正确则给出表扬，否则给出正确答案',
          },
          {
            name: 'question',
            type: 'string',
            description: '题目内容',
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
            description: '正确答案',
          },
        ],
      },
    ],
    followUp: false,
    handler: async ({ question }) => {
      if (question.questionNumber) {
        setGameState(question.questionNumber as GameState);
      }
    },
    render: ({ args, status }) => {
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
            sendMessage(
              {
                id: randomId(),
                role: 'user',
                content: `我选择了答案 ${option}，${
                  args.question?.questionNumber !== 'q8'
                    ? '请出下一题'
                    : '游戏结束'
                }`,
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
          }}
        />
      );
    },
  });

  // 游戏结束
  useCopilotAction({
    name: 'gameOver',
    description: `
      - 当用户发出游戏结束的指令，或者中途退出，游戏结束。
      - 判断用户回答的最后一题是否正确，如果正确则给出表扬，否则给出正确答案。
      - 告诉用户回答正确的题目数量。
    `,
    handler: () => {
      setGameState('gameOver');
    },
  });
}
