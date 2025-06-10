import type { SongData } from '@/lib/types';

interface SongInfoProps {
  title: SongData['title'];
  author: SongData['author'];
}

export function SongInfo({ title, author }: SongInfoProps) {
  let mainTitle = title;
  let subTitlePart: string | null = null;

  // Specifically look for "BandSync Jam" to split
  if (title === "BandSync Jam") {
    mainTitle = "BandSync";
    subTitlePart = "Jam";
  }
  // Fallback for other potential titles starting with "BandSync "
  else if (title.startsWith("BandSync ") && title.length > "BandSync ".length) {
    mainTitle = "BandSync";
    subTitlePart = title.substring("BandSync ".length);
  }


  return (
    <div className="text-center md:text-left">
      <h1 className="text-3xl font-bold font-headline text-primary">{mainTitle}</h1>
      {subTitlePart && (
        <h2 className="text-2xl font-bold font-headline text-primary -mt-2">{subTitlePart}</h2>
      )}
      <p className="text-lg text-muted-foreground mt-1">by {author}</p>
    </div>
  );
}
