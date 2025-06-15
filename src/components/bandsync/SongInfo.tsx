
interface SongInfoProps {
  title: string;
  author: string;
  songKey?: string;
}

export function SongInfo({ title, author, songKey }: SongInfoProps) {
  let mainTitle = title;
  let subTitlePart: string | null = null;

  if (title && title.startsWith("BandSync ") && title.length > "BandSync ".length) {
    mainTitle = "BandSync";
    subTitlePart = title.substring("BandSync ".length);
  } else if (title === "BandSync Jam") { // Specific case
     mainTitle = "BandSync";
     subTitlePart = "Jam";
  }


  return (
    <div className="text-left">
      <h1 className="text-3xl font-bold font-headline text-primary">{mainTitle}</h1>
      {subTitlePart && (
        <h2 className="text-2xl font-bold font-headline text-primary -mt-2">{subTitlePart}</h2>
      )}
      <p className="text-lg text-muted-foreground mt-1">by {author}</p>
      {songKey && (
        <p className="text-sm text-muted-foreground">Key: {songKey}</p>
      )}
    </div>
  );
}
