import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Image, Loader2, Upload, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { RichTextEditor } from "../components/RichTextEditor";
import { useAuth } from "../context/AuthContext";
import {
  useAccessibleCategories,
  useCreatePost,
  useEditPost,
  usePost,
  usePublishPost,
} from "../hooks/useQueries";
import { compressImage, readVideoFile } from "../utils/imageCompression";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

export default function CreatePostPage() {
  const params = useParams({ strict: false });
  const id = (params as Record<string, string>).id;
  const isEditing = !!id;
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { data: existingPost } = usePost(id ?? "");
  const { data: categories } = useAccessibleCategories();
  const createMutation = useCreatePost();
  const editMutation = useEditPost();
  const publishMutation = usePublishPost();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate({ to: "/login" });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (isEditing && existingPost) {
      setTitle(existingPost.title);
      setBody(existingPost.body);
      setCategoryId(existingPost.categoryId);
    }
  }, [isEditing, existingPost]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => {
      if (f.type.startsWith("video/") && f.size > MAX_VIDEO_SIZE) {
        toast.error(`${f.name} är för stor (max 50 MB för video)`);
        return false;
      }
      return true;
    });
    setMediaFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Titel krävs.");
      return;
    }
    if (!body.replace(/<[^>]*>/g, "").trim()) {
      setError("Innehåll krävs.");
      return;
    }
    if (!categoryId) {
      setError("Välj en kategori.");
      return;
    }
    setUploading(true);
    try {
      const mediaBlobs = await Promise.all(
        mediaFiles.map(async (file) => {
          if (file.type.startsWith("video/")) {
            const bytes = await readVideoFile(file);
            return ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
          }
          const compressed = await compressImage(file);
          return ExternalBlob.fromBytes(compressed as Uint8Array<ArrayBuffer>);
        }),
      );
      if (isEditing && id) {
        await editMutation.mutateAsync({
          postId: id,
          title,
          body,
          categoryId,
          mediaUrls: mediaBlobs,
        });
        toast.success("Inlägg uppdaterat!");
        navigate({ to: "/post/$id", params: { id } });
      } else {
        const newId = await createMutation.mutateAsync({
          title,
          body,
          categoryId,
          mediaUrls: mediaBlobs,
        });
        await publishMutation.mutateAsync(newId);
        toast.success("Inlägg publicerat!");
        navigate({ to: "/post/$id", params: { id: newId } });
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Något gick fel. Försök igen.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <main
      className="container mx-auto px-4 py-8 max-w-2xl"
      data-ocid="create_post.section"
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl text-foreground mb-1">
          {isEditing ? "Redigera inlägg" : "Nytt inlägg"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? "Uppdatera ditt inlägg."
            : "Dela dina tankar med communityn."}
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-card-md p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Inläggets titel"
              data-ocid="create_post.title.input"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Kategori</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger data-ocid="create_post.category.select">
                <SelectValue placeholder="Välj kategori" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Innehåll</Label>
            <div data-ocid="create_post.body.editor">
              <RichTextEditor
                value={body}
                onChange={setBody}
                placeholder="Skriv ditt inlägg här..."
                minHeight={200}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Media (valfritt)</Label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={handleKeyDown}
              data-ocid="create_post.media.dropzone"
              className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Klicka för att ladda upp bilder (max 10 MB) eller video (max 50
                MB)
              </p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              data-ocid="create_post.media.upload_button"
            />
            {mediaFiles.length > 0 && (
              <div className="space-y-2">
                {mediaFiles.map((file, i) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2"
                  >
                    {file.type.startsWith("video/") ? (
                      <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Image className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && (
            <p
              className="text-sm text-destructive"
              data-ocid="create_post.error_state"
            >
              {error}
            </p>
          )}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={uploading}
              data-ocid="create_post.submit_button"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {uploading
                ? "Publicerar..."
                : isEditing
                  ? "Spara ändringar"
                  : "Publicera inlägg"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/" })}
              data-ocid="create_post.cancel_button"
            >
              Avbryt
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
