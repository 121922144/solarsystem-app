import {
  AssistantMessageProps,
  Markdown,
  UserMessageProps,
} from '@copilotkit/react-ui';
import { Message } from '@copilotkit/shared';
import { UserAvatar, AssistantAvatar } from './avatar';
import { HIDDEN_USER_PREFIX } from './types';

// 提取消息文本内容的辅助函数
function extractMessageText(message: Message | undefined): string {
  if (!message) {
    return '';
  }

  let messageText = '';

  if (typeof message === 'string') {
    messageText = message;
  } else if (Array.isArray(message)) {
    // 如果 message 是内容数组，提取文本内容
    messageText = message
      .map(item => {
        if (typeof item === 'object' && item.type === 'text') {
          return item.text;
        } else if (typeof item === 'object' && item.type === 'binary') {
          // 对于二进制内容，可以显示文件名或相关信息
          return item.filename || `[文件: ${item.mimeType}]`;
        }
        return '';
      })
      .join(' ');
  } else if (typeof message === 'object') {
    // 其他对象类型，尝试提取 content 属性
    const objMessage = message as Record<string, unknown>;
    messageText = (objMessage?.content as string) || '';
  }

  return messageText;
}

export function UserMessage({ message }: UserMessageProps) {
  const messageText = extractMessageText(message);

  // 带 HIDDEN_USER_PREFIX 前缀的消息属于"发给 AI 的内部指令"，不在聊天框中渲染
  if (messageText.startsWith(HIDDEN_USER_PREFIX)) {
    return null;
  }

  return (
    <div className="flex items-start gap-4 py-4 flex-row-reverse">
      {/* Avatar */}
      <UserAvatar />

      {/* Message */}
      <div className="relative py-2 px-4 rounded-2xl rounded-tr-sm max-w-[80%] text-sm leading-relaxed bg-black/50 border-t-2 border-l-1 border-black">
        {messageText}
      </div>
    </div>
  );
}

export function AssistantMessage({
  message,
  isLoading,
}: AssistantMessageProps) {
  const messageText = extractMessageText(message);
  const subComponent = message?.generativeUI?.();

  if (!messageText && !subComponent) return null;

  return (
    <div className="flex items-start gap-4 py-4">
      {/* Avatar */}
      <AssistantAvatar />

      {/* Message */}
      {messageText && (
        <div className="relative py-2 px-4 rounded-2xl rounded-tl-sm max-w-[80%] text-sm leading-relaxed bg-black/50 border-t-2 border-l-1 border-black">
          {isLoading ? (
            <div className="flex items-center gap-2 px-1 py-2">
              <div className="w-2 h-2 bg-[#00cfe6] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-[#00cfe6] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-[#00cfe6] rounded-full animate-bounce"></div>
            </div>
          ) : (
            <>{messageText && <Markdown content={messageText} />}</>
          )}
        </div>
      )}

      {subComponent}
    </div>
  );
}
