import assistantAvatar from '@/assets/images/assistant-avatar.jpg';
import userAvatar from '@/assets/images/user-avatar.jpg';

export function AssistantAvatar() {
  return (
    <div className="shrink-0 w-10 h-10 rounded-xl overflow-hidden border-2 border-black bg-black/50">
      <div className="w-full h-full p-1 flex items-center justify-center">
        <img
          src={assistantAvatar}
          className="w-full h-full rounded-lg object-cover"
        />
      </div>
    </div>
  );
}

export function UserAvatar() {
  return (
    <div className="shrink-0 w-10 h-10 rounded-xl overflow-hidden border-2 border-black bg-black/50">
      <div className="w-full h-full p-1 flex items-center justify-center">
        <img
          src={userAvatar}
          className="w-full h-full rounded-lg object-cover"
        />
      </div>
    </div>
  );
}
