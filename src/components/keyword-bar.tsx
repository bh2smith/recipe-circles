import Link from "next/link";
import { Badge } from "@/components/ui/badge";

/** Browse bar of the most-used recipe keywords; the active tag clears on click. */
export function KeywordBar({
  keywords,
  active,
}: {
  keywords: { keyword: string; count: number }[];
  active?: string;
}) {
  if (keywords.length === 0) return null;

  return (
    <nav
      aria-label="Browse recipes by keyword"
      className="mb-8 flex flex-wrap gap-2"
    >
      {keywords.map(({ keyword, count }) => {
        const isActive = keyword === active;
        return (
          <Badge
            key={keyword}
            variant={isActive ? "default" : "secondary"}
            className="cursor-pointer font-normal"
            aria-current={isActive ? "true" : undefined}
            render={
              <Link
                href={isActive ? "/" : `/?keyword=${encodeURIComponent(keyword)}`}
              />
            }
          >
            {keyword}
            <span className="opacity-60">{count}</span>
          </Badge>
        );
      })}
    </nav>
  );
}
