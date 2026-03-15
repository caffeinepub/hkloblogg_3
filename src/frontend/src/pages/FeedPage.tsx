import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { PenSquare, Sparkles } from "lucide-react";
import { useState } from "react";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { useCategories, usePosts } from "../hooks/useQueries";

export default function FeedPage() {
  const { data: posts, isLoading: postsLoading } = usePosts();
  const { data: categories, isLoading: catsLoading } = useCategories();
  const { currentUser } = useAuth();
  const [activeCat, setActiveCat] = useState<string>("all");

  const isLoading = postsLoading || catsLoading;
  const visibleCategories = (categories ?? []).filter((c) => !c.isHidden);
  const publishedPosts = (posts ?? []).filter((p) => p.isPublished);
  const filtered =
    activeCat === "all"
      ? publishedPosts
      : publishedPosts.filter((p) => p.categoryId === activeCat);
  const pinned = filtered.filter((p) => p.isPinned);
  const regular = filtered.filter((p) => !p.isPinned);
  const sorted = [...pinned, ...regular];

  return (
    <main
      className="container mx-auto px-4 py-8 max-w-4xl"
      data-ocid="feed.section"
    >
      <section className="mb-10 text-center py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-transparent rounded-2xl -z-10" />
        <div className="absolute top-4 right-8 w-24 h-24 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute bottom-4 left-8 w-32 h-32 rounded-full bg-accent/10 blur-3xl" />
        <h1 className="font-display text-4xl md:text-5xl text-foreground mb-3">
          HKLO<span className="text-primary">blogg</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Tankar, historier och perspektiv från vår community.
        </p>
        {currentUser && (
          <Button asChild className="mt-6" data-ocid="feed.create_post.button">
            <Link to="/post/new">
              <PenSquare className="h-4 w-4 mr-2" />
              Skriv ett inlägg
            </Link>
          </Button>
        )}
      </section>

      {!isLoading && (
        <div
          className="flex items-center gap-2 flex-wrap mb-8"
          data-ocid="feed.category.tab"
        >
          <button
            type="button"
            onClick={() => setActiveCat("all")}
            className={`category-pill transition-colors ${
              activeCat === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-primary/10"
            }`}
            data-ocid="feed.all.tab"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Alla
          </button>
          {visibleCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(cat.id)}
              className={`category-pill transition-colors ${
                activeCat === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
              data-ocid="feed.cat.tab"
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4" data-ocid="feed.loading_state">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card rounded-lg p-5 border border-border"
            >
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="feed.empty_state"
        >
          <p className="text-lg font-display mb-2">Inga inlägg hittades</p>
          <p className="text-sm">
            {activeCat !== "all"
              ? "Det finns inga inlägg i denna kategori ännu."
              : "Var den första att skriva ett inlägg!"}
          </p>
          {currentUser && (
            <Button asChild variant="outline" className="mt-4">
              <Link to="/post/new">Skapa inlägg</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {sorted.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              categories={visibleCategories}
              index={i + 1}
            />
          ))}
        </div>
      )}
    </main>
  );
}
