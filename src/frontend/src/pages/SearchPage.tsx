import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useQueries } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  BookOpen,
  Calendar,
  MessageSquare,
  Search,
  Tag,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { CommentView } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import { useAppActor } from "../hooks/useAppActor";
import {
  useAccessibleCategories,
  useListUsers,
  usePosts,
} from "../hooks/useQueries";

type SearchMode = "OR" | "AND";

function matchesTerms(
  text: string,
  terms: string[],
  mode: SearchMode,
): boolean {
  const lower = text.toLowerCase();
  if (mode === "OR") {
    return terms.some((t) => lower.includes(t));
  }
  return terms.every((t) => lower.includes(t));
}

function nsToMs(ns: bigint): number {
  return Number(ns) / 1_000_000;
}

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-primary">{icon}</span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <Badge variant="secondary" className="text-xs">
        {count}
      </Badge>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      data-ocid="search.empty_state"
      className="text-sm text-muted-foreground py-4 text-center"
    >
      {message}
    </div>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { q?: string };

  const [query, setQuery] = useState((searchParams.q as string) ?? "");
  const [mode, setMode] = useState<SearchMode>("OR");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  const { currentUser } = useAuth();
  const { actor, isFetching: actorLoading } = useAppActor();

  const postsQuery = usePosts();
  const categoriesQuery = useAccessibleCategories();
  const usersQuery = useListUsers();

  const allPosts = postsQuery.data ?? [];
  const publishedPosts = allPosts.filter((p) => p.isPublished);

  // Fetch comments for all published posts in parallel
  const commentsQueries = useQueries({
    queries: publishedPosts.map((post) => ({
      queryKey: ["comments", post.id],
      queryFn: async () => {
        if (!actor) return [] as CommentView[];
        return actor.getCommentsForPost(post.id) as Promise<CommentView[]>;
      },
      enabled: !!actor && !actorLoading,
    })),
  });

  const allComments: CommentView[] = useMemo(
    () => commentsQueries.flatMap((q) => q.data ?? []),
    [commentsQueries],
  );

  const isLoading =
    postsQuery.isLoading || categoriesQuery.isLoading || usersQuery.isLoading;

  const terms = useMemo(
    () =>
      query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 0),
    [query],
  );

  const hasQuery = terms.length > 0 || !!fromDate || !!toDate;

  // ---- Filter results ----
  const filteredPosts = useMemo(() => {
    if (!hasQuery) return [];
    const fMs = fromDate ? new Date(fromDate).getTime() : null;
    const tMs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;
    return publishedPosts.filter((post) => {
      const ms = nsToMs(post.createdAt);
      if (fMs !== null && ms < fMs) return false;
      if (tMs !== null && ms > tMs) return false;
      if (terms.length === 0) return true;
      return (
        matchesTerms(post.title, terms, mode) ||
        matchesTerms(post.body, terms, mode) ||
        matchesTerms(post.authorId, terms, mode)
      );
    });
  }, [publishedPosts, terms, mode, fromDate, toDate, hasQuery]);

  const filteredCategories = useMemo(() => {
    if (!hasQuery || terms.length === 0) return [];
    return (categoriesQuery.data ?? []).filter((cat) =>
      matchesTerms(cat.name, terms, mode),
    );
  }, [categoriesQuery.data, terms, mode, hasQuery]);

  const filteredComments = useMemo(() => {
    if (!hasQuery) return [];
    const fMs = fromDate ? new Date(fromDate).getTime() : null;
    const tMs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;
    return allComments.filter((c) => {
      const ms = nsToMs(c.createdAt);
      if (fMs !== null && ms < fMs) return false;
      if (tMs !== null && ms > tMs) return false;
      if (onlyMine && currentUser) {
        if (
          c.authorId !== currentUser.profile.alias &&
          c.authorId !== currentUser.alias
        )
          return false;
      }
      if (terms.length === 0) return true;
      return matchesTerms(c.text, terms, mode);
    });
  }, [
    allComments,
    terms,
    mode,
    fromDate,
    toDate,
    onlyMine,
    currentUser,
    hasQuery,
  ]);

  const filteredUsers = useMemo(() => {
    if (!hasQuery || terms.length === 0) return [];
    return (usersQuery.data ?? []).filter((u) =>
      matchesTerms(u.alias, terms, mode),
    );
  }, [usersQuery.data, terms, mode, hasQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q: query } });
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Sök
        </h1>
        <p className="text-sm text-muted-foreground">
          Sök bland inlägg, kategorier, kommentarer och användare.
        </p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="bg-card border border-border rounded-xl p-5 mb-8 space-y-4 shadow-xs"
        data-ocid="search.panel"
      >
        {/* Text input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-ocid="search.search_input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Fritext sökning..."
              className="pl-9"
            />
          </div>
          <Button type="submit" data-ocid="search.primary_button">
            Sök
          </Button>
        </div>

        {/* OR/AND toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Söklogik:</span>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => v && setMode(v as SearchMode)}
            data-ocid="search.toggle"
          >
            <ToggleGroupItem
              value="OR"
              className="text-xs px-3 h-8"
              data-ocid="search.or.toggle"
            >
              OR
            </ToggleGroupItem>
            <ToggleGroupItem
              value="AND"
              className="text-xs px-3 h-8"
              data-ocid="search.and.toggle"
            >
              AND
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label
              htmlFor="from-date"
              className="text-xs text-muted-foreground"
            >
              <Calendar className="inline h-3 w-3 mr-1" />
              Från datum
            </Label>
            <Input
              id="from-date"
              data-ocid="search.from.input"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to-date" className="text-xs text-muted-foreground">
              <Calendar className="inline h-3 w-3 mr-1" />
              Till datum
            </Label>
            <Input
              id="to-date"
              data-ocid="search.to.input"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Only my comments */}
        {currentUser && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="only-mine"
              data-ocid="search.only_mine.checkbox"
              checked={onlyMine}
              onCheckedChange={(v) => setOnlyMine(!!v)}
            />
            <Label
              htmlFor="only-mine"
              className="text-sm cursor-pointer select-none"
            >
              Bara mina kommentarer
            </Label>
          </div>
        )}
      </form>

      {/* Loading */}
      {isLoading && (
        <div data-ocid="search.loading_state" className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && hasQuery && (
        <div className="space-y-8">
          {/* Inlägg */}
          <section data-ocid="search.posts.section">
            <SectionHeader
              icon={<BookOpen className="h-4 w-4" />}
              title="Inlägg"
              count={filteredPosts.length}
            />
            {filteredPosts.length === 0 ? (
              <EmptyState message="Inga inlägg hittades." />
            ) : (
              <div className="space-y-2">
                {filteredPosts.map((post, i) => (
                  <button
                    key={post.id}
                    type="button"
                    data-ocid={`search.posts.item.${i + 1}`}
                    onClick={() =>
                      navigate({ to: "/post/$id", params: { id: post.id } })
                    }
                    className="w-full text-left bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/50 hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {post.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {post.body.slice(0, 100)}
                          {post.body.length > 100 ? "..." : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {new Date(nsToMs(post.createdAt)).toLocaleDateString(
                          "sv-SE",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        av {post.authorId}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Kategorier */}
          <section data-ocid="search.categories.section">
            <SectionHeader
              icon={<Tag className="h-4 w-4" />}
              title="Kategorier"
              count={filteredCategories.length}
            />
            {filteredCategories.length === 0 ? (
              <EmptyState message="Inga kategorier hittades." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredCategories.map((cat, i) => (
                  <button
                    key={cat.id}
                    type="button"
                    data-ocid={`search.categories.item.${i + 1}`}
                    onClick={() => navigate({ to: "/" })}
                    className="inline-flex items-center gap-1.5 bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground text-sm px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Tag className="h-3 w-3" />
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Kommentarer */}
          <section data-ocid="search.comments.section">
            <SectionHeader
              icon={<MessageSquare className="h-4 w-4" />}
              title="Kommentarer"
              count={filteredComments.length}
            />
            {filteredComments.length === 0 ? (
              <EmptyState message="Inga kommentarer hittades." />
            ) : (
              <div className="space-y-2">
                {filteredComments.map((comment, i) => (
                  <button
                    key={comment.id}
                    type="button"
                    data-ocid={`search.comments.item.${i + 1}`}
                    onClick={() =>
                      navigate({
                        to: "/post/$id",
                        params: { id: comment.postId },
                      })
                    }
                    className="w-full text-left bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/50 hover:bg-secondary/30 transition-colors group"
                  >
                    <p className="text-sm text-foreground truncate">
                      {comment.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        av {comment.authorId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(nsToMs(comment.createdAt)).toLocaleDateString(
                          "sv-SE",
                        )}
                      </span>
                      <span className="text-xs text-primary group-hover:underline">
                        Visa inlägg →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Alias */}
          <section data-ocid="search.users.section">
            <SectionHeader
              icon={<User className="h-4 w-4" />}
              title="Alias / Användare"
              count={filteredUsers.length}
            />
            {filteredUsers.length === 0 ? (
              <EmptyState message="Inga användare hittades." />
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user, i) => (
                  <button
                    key={user.alias}
                    type="button"
                    data-ocid={`search.users.item.${i + 1}`}
                    onClick={() =>
                      navigate({
                        to: "/profile/$userId",
                        params: { userId: user.alias },
                      })
                    }
                    className="w-full text-left bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/50 hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {user.alias.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {user.alias}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.blogRole}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Prompt before search */}
      {!isLoading && !hasQuery && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Skriv något för att söka</p>
        </div>
      )}
    </main>
  );
}
