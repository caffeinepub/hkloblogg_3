import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "@tanstack/react-router";
import { UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import {
  useCategories,
  useFollowUser,
  useFollowers,
  useFollowing,
  usePostsByAuthor,
} from "../hooks/useQueries";

export default function ProfilePage() {
  const { userId } = useParams({ from: "/profile/$userId" });
  const { currentUser } = useAuth();
  const { data: posts, isLoading: postsLoading } = usePostsByAuthor(userId);
  const { data: categories } = useCategories();
  const { data: followers } = useFollowers(userId);
  const { data: following } = useFollowing(userId);
  const followMutation = useFollowUser();

  const isOwnProfile = currentUser?.alias === userId;
  const isFollowing = followers?.includes(currentUser?.alias ?? "") ?? false;

  const handleFollow = () => {
    if (!currentUser) {
      toast.error("Logga in för att följa");
      return;
    }
    followMutation.mutate(
      { targetUserId: userId, isFollowing },
      {
        onSuccess: () =>
          toast.success(isFollowing ? "Slutade följa" : "Följer nu!"),
        onError: () => toast.error("Något gick fel"),
      },
    );
  };

  return (
    <main
      className="container mx-auto px-4 py-8 max-w-4xl"
      data-ocid="profile.section"
    >
      <div className="bg-card rounded-xl border border-border shadow-card p-6 mb-8">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
              {userId.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl text-foreground">{userId}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">
                  {(followers ?? []).length}
                </strong>{" "}
                följare
              </span>
              <span>
                <strong className="text-foreground">
                  {(following ?? []).length}
                </strong>{" "}
                följer
              </span>
              <span>
                <strong className="text-foreground">
                  {(posts ?? []).length}
                </strong>{" "}
                inlägg
              </span>
            </div>
          </div>
          {!isOwnProfile && currentUser && (
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              disabled={followMutation.isPending}
              data-ocid="profile.follow.button"
            >
              {isFollowing ? (
                <>
                  <UserMinus className="h-4 w-4 mr-1" /> Sluta följa
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" /> Följ
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <h2 className="font-display text-2xl text-foreground mb-4">Inlägg</h2>
      {postsLoading ? (
        <div className="grid gap-4" data-ocid="profile.loading_state">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-lg p-5 border border-border"
            >
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : (posts ?? []).length === 0 ? (
        <p
          className="text-muted-foreground text-sm"
          data-ocid="profile.empty_state"
        >
          Inga publicerade inlägg ännu.
        </p>
      ) : (
        <div className="grid gap-4">
          {(posts ?? [])
            .filter((p) => p.isPublished)
            .map((post, i) => (
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
