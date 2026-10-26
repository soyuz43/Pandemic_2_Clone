import { useEffect, useRef } from 'react';
import { Newspaper } from 'lucide-react';
import { NewsItem } from '../hooks/useGameState';

interface NewsTickerProps {
  news: NewsItem[];
}

export default function NewsTicker({ news }: NewsTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const newestNews = news[0];
  const prevNewestNewsRef = useRef(newestNews);

  // Keep the ticker pinned to the newest headline whenever one arrives.
  useEffect(() => {
    if (newestNews !== prevNewestNewsRef.current) {
      prevNewestNewsRef.current = newestNews;
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [newestNews]);

  const latestDay = news.length > 0 ? news[0].day : null;

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header flex items-center gap-2">
        <Newspaper size={11} className="text-dim" aria-hidden="true" />
        <span>News Feed</span>
        <span className="text-dim text-[9px] ml-auto normal-case tracking-normal">
          {news.length > 0 ? `Day ${latestDay} · ${news.length} events` : 'No events yet'}
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 scrollable p-2 space-y-1">
        {news.length === 0 ? (
          <div className="text-muted text-[10px] text-center py-4">
            Nothing to report yet. Your pathogen is waiting.
          </div>
        ) : (
          news.map((item, idx) => (
            <div key={`${item.day}-${idx}`} className={`news-item ${item.type} ${idx === 0 ? 'animate-news-in' : ''}`}>
              <span className="text-gray-400 font-mono mr-2">D{item.day}</span>
              <span className="text-gray-200">{item.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
