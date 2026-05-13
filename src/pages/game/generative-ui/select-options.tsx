import { useCopilotChatHeadless_c } from '@copilotkit/react-core';
import { randomId } from '@copilotkit/shared';
import { useCallback } from 'react';

export default function SelectBox() {
  const { sendMessage } = useCopilotChatHeadless_c();
  const callSendMessage = useCallback(
    async (message: string) => {
      await sendMessage(
        {
          id: randomId(),
          role: 'user',
          content: message,
        },
        {
          clearSuggestions: false,
        }
      );
    },
    [sendMessage]
  );

  return (
    <div className="flex gap-4 py-4">
      {['A', 'B', 'C', 'D'].map(item => (
        <button
          key={item}
          className="w-10 h-10 rounded-full cursor-pointer border-2 border-white/50 text-lg hover:text-[#00cfe6] hover:border-[#00cfe6] active:text-[#00cfe6] active:border-[#00cfe6]"
          onClick={() => {
            callSendMessage(item);
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
