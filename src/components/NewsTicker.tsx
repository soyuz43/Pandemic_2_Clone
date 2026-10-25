import { NewsItem } from '../hooks/useGameState';

interface NewsTickerProps {
  news: NewsItem[];
}

export default function NewsTicker({ news }: NewsTickerProps) {
  const typeColors = {
    info: 'text-blue-300 border-blue-900/50',
    warning: 'text-yellow-300 border-yellow-900/50',
    danger: 'text-red-300 border-red-900/50',
    success: 'text-green-300 border-green-900/50',
  };

  const typeIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    danger: '☠️',
    success: '✅',
  };

  return (
    <div className="bg-black/60 rounded-lg border border-green-900/50 overflow-hidden">
      <div className="p-2 bg-gradient-to-r from-red-900/30 to-transparent border-b border-green-900/50">
        <h2 className="text-red-400 font-bold text-xs flex items-center gap-2">
          <span className="animate-pulse">📰</span> NEWS FEED
        </h2>
      </div>
      <div className="h-32 overflow-y-auto p-1 space-y-0.5 scrollbar-thin">
        {news.length === 0 ? (
          <div className="text-gray-600 text-[10px] text-center py-4">No news yet...</div>
        ) : (
          news.map((item, idx) => (
            <div
              key={idx}
              className={`text-[10px] px-2 py-1 rounded border-l-2 ${typeColors[item.type]} bg-black/30 ${
                idx === 0 ? 'animate-pulse' : ''
              }`}
            >
              <span className="mr-1">{typeIcons[item.type]}</span>
              <span className="text-gray-500 font-mono mr-1">Day {item.day}:</span>
              <span>{item.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
