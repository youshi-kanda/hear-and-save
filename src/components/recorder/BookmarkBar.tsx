import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Bookmark } from '@/pages/Recorder';

interface BookmarkBarProps {
  bookmarks: Bookmark[];
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const BookmarkBar = ({ bookmarks }: BookmarkBarProps) => {
  if (bookmarks.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-warning" />
        <span className="text-sm font-medium">ブックマーク</span>
      </div>
      <div className="space-y-2">
        {bookmarks.map((bookmark, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50"
          >
            <span className="text-warning font-mono font-medium">
              {formatTime(bookmark.time)}
            </span>
            {bookmark.note && (
              <span className="text-muted-foreground">{bookmark.note}</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default BookmarkBar;
