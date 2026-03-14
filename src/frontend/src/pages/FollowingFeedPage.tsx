import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { useCategories, useFollowingFeed } from "../hooks/useQueries";

export default function FollowingFeedPage() {
  const { currentUser } = useAuth();
  const { data: posts, isLoading } = useFollowingFeed();
  const { data: categories } = useCategories();

  if (!currentUser) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-2xl mb-2">Följer-flöde</h1>
        <p className="text-muted-foreground mb-6">
          Logga in för att se inlägg från användare du följer.
        </p>
        <Button asChild data-ocid="following.login.button">
          <Link to="/login">Logga in</Link>
        </Button>
      </main>
    );
  }

  return (
    <main
      className="container mx-auto px-4 py-8 max-w-4xl"
      data-ocid="following.section"
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl text-foreground mb-2">
          Följer-flöde
        </h1>
        <p className="text-muted-foreground">
          Inlägg från användare du följer.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4" data-ocid="following.loading_state">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card rounded-lg p-5 border border-border"
            >
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (posts ?? []).length === 0 ? (
        <div className="text-center py-16" data-ocid="following.empty_state">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-display mb-2">Inget i ditt flöde ännu</p>
          <p className="text-sm text-muted-foreground mb-4">
            Börja följa andra användare för att se deras inlägg här.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Utforska inlägg</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {(posts ?? []).map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              categories={categories ?? []}
              index={i + 1}
            />
          ))}
        </div>
      )}
    </main>
  );
}
