import { NewsItem } from '../hooks/useGameState';

interface NewsTickerProps {
  news: NewsItem[];
}

export default function NewsTicker({ news }: NewsTickerProps) {
  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header flex items-center gap-2">
        <span>News Feed</span>
        <span className="text-dim text-[9px] ml-auto">{news.length} events</span>
      </div>
      <div className="flex-1 scrollable p-2 space-y-1">
        {news.length === 0 ? (
          <div className="text-muted text-[10px] text-center py-4">No events yet</div>
        ) : (
          news.map((item, idx) => (
            <div key={idx} className={`news-item ${item.type}`}>
              <span className="text-gray-400 font-mono mr-2">D{item.day}</span>
              <span className="text-gray-200">{item.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
