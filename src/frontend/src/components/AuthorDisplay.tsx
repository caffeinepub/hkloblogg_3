import { Link } from "@tanstack/react-router";
import { useAuthorAlias } from "../hooks/useQueries";

interface AuthorDisplayProps {
  authorId: string;
  showAvatar?: boolean;
  className?: string;
  linkClassName?: string;
  ocid?: string;
}

export function AuthorDisplay({
  authorId,
  showAvatar = true,
  className = "",
  linkClassName = "",
  ocid,
}: AuthorDisplayProps) {
  const { data: alias } = useAuthorAlias(authorId);
  const displayName = alias ?? authorId;
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <Link
      to="/profile/$userId"
      params={{ userId: authorId }}
      data-ocid={ocid}
      className={`flex items-center gap-1.5 hover:text-primary transition-colors ${linkClassName} ${className}`}
    >
      {showAvatar && (
        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold shrink-0">
          {initial}
        </span>
      )}
      <span>{displayName}</span>
    </Link>
  );
}
