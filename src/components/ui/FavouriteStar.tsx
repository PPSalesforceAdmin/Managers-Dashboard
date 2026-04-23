import { toggleFavourite } from "@/lib/favourites-actions";

interface Props {
  reportId: string;
  isFavourite: boolean;
  size?: "sm" | "md";
}

export function FavouriteStar({ reportId, isFavourite, size = "sm" }: Props) {
  const dim = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const label = isFavourite ? "Remove from favourites" : "Add to favourites";

  return (
    <form action={toggleFavourite} className="inline-flex">
      <input type="hidden" name="reportId" value={reportId} />
      <button
        type="submit"
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center rounded-full p-1 transition ${
          isFavourite
            ? "text-pp-orange hover:text-pp-orange-hover"
            : "text-pp-body/30 hover:text-pp-orange"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isFavourite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={dim}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    </form>
  );
}
