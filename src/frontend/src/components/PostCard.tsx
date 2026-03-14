import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { Calendar, Heart, MessageCircle, Pin } from "lucide-react";
import type { Category, PostView } from "../backend.d";

interface PostCardProps {
  post: PostView;
  categories: Category[];
  index?: number;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(ms));
}

export default function PostCard({
  post,
  categories,
  index = 1,
}: PostCardProps) {
  const category = categories.find((c) => c.id === post.categoryId);

  return (
    <article
      data-ocid={`posts.item.${index}`}
      className="bg-card rounded-lg shadow-card card-hover border border-border overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold">
                <Pin className="h-3 w-3" />
                Nålat
              </span>
            )}
            {category && (
              <Badge
                variant="secondary"
                className="text-xs category-pill bg-accent/60 text-accent-foreground"
              >
                {category.name}
              </Badge>
            )}
            {!post.isPublished && (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                Utkast
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <Calendar className="h-3 w-3" />
            {formatDate(post.createdAt)}
          </span>
        </div>

        <Link
          to="/post/$id"
          params={{ id: post.id }}
          data-ocid={`posts.item.${index}.link`}
        >
          <h2 className="font-display text-xl text-foreground mb-2 hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>

        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
          {post.body}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Link
            to="/profile/$userId"
            params={{ userId: post.authorId }}
            data-ocid={`posts.item.${index}.author.link`}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
              {post.authorId.slice(0, 1).toUpperCase()}
            </span>
            {post.authorId}
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {post.likes.length}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              Kommentarer
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
