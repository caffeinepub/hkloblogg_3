import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Heart, Image, Pencil, Send, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { BlogRole } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import {
  useAddComment,
  useAuthorAlias,
  useCategories,
  useComments,
  useDeleteComment,
  useDeletePost,
  useLikePost,
  usePost,
} from "../hooks/useQueries";
import { compressImage } from "../utils/imageCompression";

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(ms));
}

function CommentAuthor({ authorId }: { authorId: string }) {
  const { data: alias } = useAuthorAlias(authorId);
  const displayName = alias ?? authorId;
  return (
    <Link
      to="/profile/$userId"
      params={{ userId: authorId }}
      className="text-sm font-semibold hover:text-primary transition-colors"
    >
      {displayName}
    </Link>
  );
}

export default function PostDetailPage() {
  const { id } = useParams({ from: "/post/$id" });
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { data: post, isLoading: postLoading } = usePost(id);
  const { data: comments, isLoading: commentsLoading } = useComments(id);
  const { data: categories } = useCategories();
  const { data: authorAlias } = useAuthorAlias(post?.authorId ?? "");
  const likeMutation = useLikePost();
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const deletePostMutation = useDeletePost();

  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [uploadingComment, setUploadingComment] = useState(false);
  const commentImageRef = useRef<HTMLInputElement>(null);

  if (postLoading) {
    return (
      <main
        className="container mx-auto px-4 py-8 max-w-3xl"
        data-ocid="post.loading_state"
      >
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </main>
    );
  }

  if (!post) {
    return (
      <main
        className="container mx-auto px-4 py-16 text-center"
        data-ocid="post.error_state"
      >
        <p className="text-lg text-muted-foreground">Inlägg hittades inte.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: "/" })}
        >
          Tillbaka till flödet
        </Button>
      </main>
    );
  }

  const category = (categories ?? []).find((c) => c.id === post.categoryId);
  const isLiked = currentUser ? post.likes.includes(currentUser.alias) : false;
  const canEdit =
    currentUser?.alias === post.authorId ||
    currentUser?.alias === authorAlias ||
    currentUser?.profile.blogRole === BlogRole.superadmin ||
    currentUser?.profile.blogRole === BlogRole.moderator;

  const handleLike = () => {
    if (!currentUser) {
      toast.error("Logga in för att gilla");
      return;
    }
    likeMutation.mutate({ postId: post.id, liked: isLiked });
  };

  const handleDeletePost = async () => {
    if (!confirm("Är du säker på att du vill ta bort detta inlägg?")) return;
    try {
      await deletePostMutation.mutateAsync(post.id);
      toast.success("Inlägg borttaget");
      navigate({ to: "/" });
    } catch {
      toast.error("Kunde inte ta bort inlägget");
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUser) {
      toast.error("Logga in för att kommentera");
      return;
    }
    if (!commentText.trim()) return;
    setUploadingComment(true);
    try {
      let imageBlob: ExternalBlob | null = null;
      if (commentImage) {
        const compressed = await compressImage(commentImage);
        imageBlob = ExternalBlob.fromBytes(
          compressed as Uint8Array<ArrayBuffer>,
        );
      }
      await addCommentMutation.mutateAsync({
        postId: post.id,
        text: commentText,
        imageBlob,
      });
      setCommentText("");
      setCommentImage(null);
      toast.success("Kommentar tillagd");
    } catch {
      toast.error("Kunde inte lägga till kommentar");
    } finally {
      setUploadingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Ta bort kommentar?")) return;
    try {
      await deleteCommentMutation.mutateAsync({ commentId, postId: post.id });
      toast.success("Kommentar borttagen");
    } catch {
      toast.error("Kunde inte ta bort kommentaren");
    }
  };

  const displayAuthor = authorAlias ?? post.authorId;

  return (
    <main
      className="container mx-auto px-4 py-8 max-w-3xl animate-fade-in"
      data-ocid="post.section"
    >
      <Link
        to="/"
        data-ocid="post.back.link"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Tillbaka
      </Link>

      <article className="bg-card rounded-xl shadow-card-md border border-border p-6 md:p-8 mb-8">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {category && (
            <Badge
              variant="secondary"
              className="bg-accent/60 text-accent-foreground"
            >
              {category.name}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {formatDate(post.createdAt)}
          </span>
        </div>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">
          {post.title}
        </h1>

        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <Link
            to="/profile/$userId"
            params={{ userId: post.authorId }}
            data-ocid="post.author.link"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {displayAuthor.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{displayAuthor}</span>
          </Link>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                data-ocid="post.edit.button"
              >
                <Link to="/post/$id/edit" params={{ id: post.id }}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Redigera
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeletePost}
                data-ocid="post.delete.button"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Ta bort
              </Button>
            </div>
          )}
        </div>

        <div className="prose-blog text-foreground/90 leading-relaxed whitespace-pre-wrap mb-6">
          {post.body}
        </div>

        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="grid gap-3 mb-6">
            {post.mediaUrls.map((media, i) => {
              const url = media.getDirectURL();
              const isVideo =
                url.includes(".mp4") ||
                url.includes(".webm") ||
                url.includes("video");
              return isVideo ? (
                // biome-ignore lint/a11y/useMediaCaption: user-uploaded content
                <video
                  key={url || i}
                  src={url}
                  controls
                  className="w-full rounded-lg max-h-96 object-cover"
                />
              ) : (
                <img
                  key={url || i}
                  src={url}
                  alt=""
                  className="w-full rounded-lg max-h-96 object-cover"
                  loading="lazy"
                />
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleLike}
            data-ocid="post.like.toggle"
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isLiked
                ? "text-rose-500"
                : "text-muted-foreground hover:text-rose-400"
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            {post.likes.length} gilla-markeringar
          </button>
        </div>
      </article>

      <section data-ocid="post.comments.section">
        <h2 className="font-display text-2xl text-foreground mb-4">
          Kommentarer
          {!commentsLoading && (
            <span className="text-base font-sans font-normal text-muted-foreground ml-2">
              ({(comments ?? []).length})
            </span>
          )}
        </h2>

        {currentUser ? (
          <div
            className="bg-card rounded-lg border border-border p-4 mb-6"
            data-ocid="post.comment.panel"
          >
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Skriv en kommentar..."
              className="mb-3 resize-none"
              rows={3}
              data-ocid="post.comment.textarea"
            />
            {commentImage && (
              <p className="text-xs text-muted-foreground mb-2">
                Bild: {commentImage.name}
              </p>
            )}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => commentImageRef.current?.click()}
                data-ocid="post.comment.upload_button"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Image className="h-4 w-4" />
                Bifoga bild
              </button>
              <input
                type="file"
                ref={commentImageRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => setCommentImage(e.target.files?.[0] ?? null)}
              />
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || uploadingComment}
                data-ocid="post.comment.submit_button"
              >
                <Send className="h-4 w-4 mr-1" />
                {uploadingComment ? "Skickar..." : "Kommentera"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-6">
            <Link to="/login" className="text-primary hover:underline">
              Logga in
            </Link>{" "}
            för att kommentera.
          </p>
        )}

        {commentsLoading ? (
          <div data-ocid="post.comments.loading_state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 mb-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (comments ?? []).length === 0 ? (
          <p
            className="text-sm text-muted-foreground text-center py-8"
            data-ocid="post.comments.empty_state"
          >
            Inga kommentarer ännu. Var den första!
          </p>
        ) : (
          <div className="space-y-4">
            {(comments ?? []).map((comment, i) => (
              <div
                key={comment.id}
                data-ocid={`post.comment.item.${i + 1}`}
                className="bg-card rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                        {comment.authorId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CommentAuthor authorId={comment.authorId} />
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                  {(currentUser?.alias === comment.authorId ||
                    currentUser?.profile.blogRole === BlogRole.superadmin ||
                    currentUser?.profile.blogRole === BlogRole.moderator) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      data-ocid={`post.comment.delete_button.${i + 1}`}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/90 mt-2 ml-9">
                  {comment.text}
                </p>
                {comment.imageUrl && (
                  <img
                    src={comment.imageUrl.getDirectURL()}
                    alt=""
                    className="mt-2 ml-9 rounded-lg max-h-48 object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
