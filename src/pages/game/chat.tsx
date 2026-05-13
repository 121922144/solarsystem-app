import { CopilotChat, CopilotKitCSSProperties } from '@copilotkit/react-ui';
import { UserMessage, AssistantMessage } from './chat-message';
import { useCopilotChatHeadless_c } from '@copilotkit/react-core';
import { randomId } from '@copilotkit/shared';
import { useCallback, useEffect } from 'react';
import { useGameVisualizer } from './lib/use-game-visualizer';

export default function Chat() {
  const { sendMessage } = useCopilotChatHeadless_c();
  const callSendMessage = useCallback(
    async (message: string) => {
      await sendMessage(
        {
          id: randomId(),
          role: 'assistant',
          content: message,
        },
        {
          followUp: false,
          clearSuggestions: false,
        }
      );
    },
    [sendMessage]
  );

  useGameVisualizer();

  // 首次加载聊天时呈现初始消息
  useEffect(() => {
    callSendMessage(`昊昊小朋友，你好呀！✨<br/>
      我是你的宇宙小助手，专门陪你一起探索神奇的大宇宙！🌌<br/>
      你可以问我关于星星、行星的任何问题。🌟<br/>
      我们还可以玩宇宙问答闯关游戏，像宇航员一样挑战太空知识！🚀<br/>
      准备好开始宇宙冒险了吗？我们一起出发吧！👨🚀
    `);
  }, [callSendMessage]);

  return (
    <div className="flex flex-col h-full max-h-full w-full p-4 rounded-2xl bg-[#747474]/30 backdrop-blur-md border-t-2 border-l-1 border-white/20 color-white chat-box">
      <div
        className="flex-1 w-full overflow-hidden"
        style={
          {
            '--copilot-kit-background-color': 'transparent',
            '--copilot-kit-input-background-color': 'transparent',
            '--copilot-kit-secondary-contrast-color': '#fff',
            '--copilot-kit-separator-color': 'rgba(255,255,255,0.2)',
            '--copilot-kit-muted-color': 'rgba(255,255,255,0.2)',
            '--copilot-kit-primary-color': '#fff',
          } as CopilotKitCSSProperties
        }
      >
        <CopilotChat
          className="h-full w-full"
          instructions={systemPrompt}
          UserMessage={UserMessage}
          AssistantMessage={AssistantMessage}
        />
      </div>
    </div>
  );
}

const systemPrompt = `
背景
你是一个问答机器人，你的目标是提供一系列关于大宇宙的问答服务，包括宇宙问答闯关服务。你的用户是5岁的昊昊小朋友，与用户互动时你的语气尽量有趣些，可以多提及昊昊的名字。
宇宙问答服务目标
- 你提供关于宇宙的问答闯关服务，用户需要根据你的回答逐步完成游戏，题目的难度设置成一般难度。
宇宙问答服务游戏规则
- gameState是gameOver，表示用户不在游戏过程中。
- 需要用户明确告诉你开始游戏。
- 每轮游戏有八道题目，每个题目必须有一个正确答案。
- 题目均是选择题，同时提供四个选项，用大写的ABCD表示。用户需要根据题目提供的选项，选择一个答案，不要提醒用户必须输入大写字母。
- 用户可以输入大写字母或者选项的内容作为答案，但如果用户输入无关的内容且不是在问问题，则提示用户必须输入题目给出的选项。
- 如果用户连续输入无关内容，则询问用户是否需要退出问答游戏。
- 无论用户回答正确与否，都继续下一个问题。
- 如果用户回答错误，则给出正确答案，并且给出下一个问题。
- 游戏结束后，告诉用户答对的题目数量。
- 如果用户答对了所有的题目，恭喜用户！
宇宙问答服务细节
- 你将经历宇宙问答闯关的过程，每轮游戏有五道题目，用户每回答一道题目，你需要记录当前的题号并返回。
- 如果用户中途提出退出或结束游戏，游戏直接进入结束状态，用户可以重新开始游戏。
- 游戏结束后，告诉用户游戏结束。
- 游戏过程中，关于没回答过的问题，永远不要回答用户，提醒用户正在游戏中，问是否需要退出，如果用户选择退出，游戏状态返回gameOver。
- 但如果用户提问的是已经回答过的问题，可以告诉用户答案。
- 每轮游戏的题目尽量不一样，但是题目必须是宇宙相关。
- 重新开始游戏后题目必须和之前不一样。
- 请确保题目的严谨性和答案的准确性，以2025年最新的资料为准。
- 不要在题目中出现题目的答案。
注意事项
- 保持回答的准确性和完整性。
- 始终用中文来互动。
`;
