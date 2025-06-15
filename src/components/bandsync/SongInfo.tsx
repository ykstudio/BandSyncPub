
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
  } else if (title === "BandSync Jam") { 
     mainTitle = "BandSync";
     subTitlePart = "Jam";
  }


  return (
    <div className="text-left"> {/* Ensures children are left-aligned by default */}
      <h1 className="text-xl md:text-3xl font-bold font-headline text-primary truncate">
        {mainTitle}
      </h1>
      {subTitlePart && (
        <h2 className="text-lg md:text-2xl font-bold font-headline text-primary -mt-1 md:-mt-2 truncate">
          {subTitlePart}
        </h2>
      )}

      {/* Container for artist and key info */}
      {/* Mobile: flex row, space between. Desktop: default block stacking. */}
      <div className="flex flex-row items-baseline justify-between md:block mt-1 md:mt-0">
        <p className="text-base md:text-lg text-muted-foreground truncate md:mt-1">
          by {author}
        </p>
        {songKey && (
          <p className="text-xs md:text-sm text-muted-foreground truncate">
            Key: {songKey}
          </p>
        )}
      </div>
    </div>
  );
}
