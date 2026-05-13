import { QuestionType } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import planetBg from '@/assets/images/bg.jpg';
import { useParams } from 'react-router';

interface QuestionProps {
  currentQuestion: QuestionType;
  status: string;
  onSelect: (option: string) => void;
  playErrorSound?: () => void; // 播放错误音效函数
  playCorrectSound?: () => void; // 添加播放正确音效函数
}

const colorMap: { [key: number]: string } = {
  0: 'text-[#f572b3]',
  1: 'text-[#ec9b28]',
  2: 'text-[#baec28]',
  3: 'text-[#00c951]',
};

const hoverColorMap: { [key: number]: string } = {
  0: 'group-hover:text-[#f572b3]',
  1: 'group-hover:text-[#ec9b28]',
  2: 'group-hover:text-[#baec28]',
  3: 'group-hover:text-[#00c951]',
};

export default function Question({
  currentQuestion,
  status,
  onSelect,
  playErrorSound,
  playCorrectSound,
}: QuestionProps) {
  const [currentSelect, setCurrentSelect] = useState('');
  const [clickIndex, setClickIndex] = useState(-1);

  const { mode } = useParams();

  if (!currentQuestion) return null;
  if (status === 'inProgress') {
    return (
      <div className="relative py-2 px-4 rounded-2xl rounded-tl-sm max-w-[80%] text-sm leading-relaxed bg-black/50 border-t-2 border-l-1 border-black">
        <div className="flex items-center gap-2 px-1 py-2">
          <div className="w-2 h-2 bg-[#00cfe6] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-[#00cfe6] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-[#00cfe6] rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }
  const { questionNumber, aiFeedback, question, options, correctAnswer } =
    currentQuestion;

  const handleClick = (option: string, index: number) => {
    // 防止重复点击
    if (clickIndex !== -1) return;

    setCurrentSelect(option);
    setClickIndex(index);

    // 如果选择的答案是错误的，播放错误音效
    if (option !== currentQuestion.correctAnswer && playErrorSound) {
      playErrorSound();
    }

    // 如果选择的答案是正确的，播放正确音效
    if (option === currentQuestion.correctAnswer && playCorrectSound) {
      playCorrectSound();
    }

    // 调用 onSelect 回调
    onSelect(option);
  };

  return (
    <div
      className={`relative p-4 rounded-2xl rounded-tl-sm w-[80%] text-sm leading-relaxed bg-[#053566]/50 border-t-2 border-l-1 border-black font-bebasNeue`}
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(5, 53, 102, 0.95) 20%, rgba(5, 53, 102, 0) 100%), url(${planetBg})`,
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <div className="ml-7 mb-4">{aiFeedback}</div>
      <div className="flex items-start mb-2 pl-4">
        <span className="text-2xl font-bold mr-2 mt--1 relative shrink-0 font-bold text-#ecde52">
          {questionNumber?.replace('q', '')}.
        </span>
        <div>
          {question}{' '}
          {mode && mode === 'debug' && <span>({correctAnswer})</span>}
        </div>
      </div>
      <div>
        {Object.entries(options).map(([option, value], index) => (
          <div
            key={option}
            className={`flex items-center px-4 py-2 not-last:mb-2 rounded-sm rounded-bl-2xl relative group ${
              clickIndex !== -1 ? 'pointer-events-none' : 'cursor-pointer'
            }`}
            style={{
              background:
                'linear-gradient(90deg, rgba(5, 53, 102, 0.5), rgba(5, 53, 102, 0.1))',
            }}
            onClick={() => handleClick(option, index)}
          >
            <span className={`text-2xl font-bold mr-2 ${colorMap[index]}`}>
              {option}
            </span>
            <span
              className={`text-base ${
                currentSelect === option ? colorMap[index] : ''
              } ${hoverColorMap[index]}`}
            >
              {value}
            </span>
            {currentSelect &&
              clickIndex === index &&
              (currentSelect === correctAnswer ? (
                <FontAwesomeIcon
                  icon={faCheck}
                  size="lg"
                  className="ml-auto text-green-500"
                />
              ) : (
                <FontAwesomeIcon
                  icon={faXmark}
                  size="lg"
                  className="ml-auto text-red-500"
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
