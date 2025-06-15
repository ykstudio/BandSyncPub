
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
      <h1 className="text-xl md:text-3xl font-bold font-headline text-primary truncate">
        {mainTitle}
      </h1>
      {subTitlePart && (
        <h2 className="text-lg md:text-2xl font-bold font-headline text-primary -mt-1 md:-mt-2 truncate">
          {subTitlePart}
        </h2>
      )}
      <p className="text-base md:text-lg text-muted-foreground mt-1 truncate">
        by {author}
      </p>
      {songKey && (
        <p className="text-xs md:text-sm text-muted-foreground truncate">
          Key: {songKey}
        </p>
      )}
    </div>
  );
}
