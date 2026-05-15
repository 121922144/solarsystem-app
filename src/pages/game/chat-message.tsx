import {
  AssistantMessageProps,
  Markdown,
  UserMessageProps,
} from '@copilotkit/react-ui';
import { Message } from '@copilotkit/shared';
import { useEffect } from 'react';
import { UserAvatar, AssistantAvatar } from './avatar';
import { HIDDEN_USER_PREFIX } from './types';
import { useTTS } from './lib/use-tts';

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

/**
 * 把含有 HTML / Markdown 的文本清洗成纯文本，方便 TTS 朗读
 */
function toPlainText(text: string): string {
  return text
    .replace(/<br\s*\/?>(\r?\n)?/gi, '，')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 图片
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // 链接保留文字
    .replace(/[`*_~>#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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
      <div className="relative py-2 px-4 rounded-2xl rounded-tr-sm max-w-[90%] text-sm leading-relaxed bg-black/50 border-t-2 border-l-1 border-black">
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
  const { speak, currentItemId, paused, pauseCurrent, resumeCurrent, restart } =
    useTTS();

  // 当 AI 文本完整到位（不再 loading）时，自动朗读一次。
  // useTTS 内部用 message.id 去重，避免重复入队。
  const messageId =
    (message as unknown as { id?: string } | undefined)?.id || messageText;
  const ttsId = `assistant:${messageId}`;
  const plainText = toPlainText(messageText);

  useEffect(() => {
    if (isLoading) return;
    if (!plainText) return;
    speak(plainText, { id: ttsId });
  }, [isLoading, plainText, ttsId, speak]);

  if (!messageText && !subComponent) return null;

  // 三态：当前正在播这条、当前暂停的是这条、其它（空闲或播过别人）
  const isCurrent = currentItemId === ttsId;
  const status: 'playing' | 'paused' | 'idle' = isCurrent
    ? paused
      ? 'paused'
      : 'playing'
    : 'idle';

  const handleVoiceClick = () => {
    if (status === 'playing') {
      pauseCurrent();
    } else if (status === 'paused') {
      resumeCurrent();
    } else {
      restart(plainText, { id: ttsId });
    }
  };

  const voiceIcon =
    status === 'playing' ? '⏸' : status === 'paused' ? '▶' : '🔊';
  const voiceTitle =
    status === 'playing'
      ? '暂停朗读'
      : status === 'paused'
        ? '继续朗读'
        : '朗读这条消息';

  return (
    <div className="flex items-start gap-4 py-4">
      {/* Avatar */}
      <AssistantAvatar />

      {/* Message */}
      {messageText && (
        <div className="flex items-end gap-2 max-w-[90%]">
          <div className="relative py-2 px-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-black/50 border-t-2 border-l-1 border-black">
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
          {!isLoading && plainText && (
            <button
              type="button"
              onClick={handleVoiceClick}
              title={voiceTitle}
              className="shrink-0 mb-1 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 hover:bg-black/90 border-0 text-white text-sm cursor-pointer select-none"
            >
              {voiceIcon}
            </button>
          )}
        </div>
      )}

      {subComponent}
    </div>
  );
}
