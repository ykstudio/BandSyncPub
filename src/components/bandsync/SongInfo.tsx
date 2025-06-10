import type { SongData } from '@/lib/types';

interface SongInfoProps {
  title: SongData['title'];
  author: SongData['author'];
}

export function SongInfo({ title, author }: SongInfoProps) {
  return (
    <div className="text-center md:text-left">
      <h1 className="text-3xl font-bold font-headline text-primary">{title}</h1>
      <p className="text-lg text-muted-foreground">by {author}</p>
    </div>
  );
}
