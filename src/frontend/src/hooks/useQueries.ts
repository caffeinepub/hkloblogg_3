import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BlogRole,
  Category,
  CategoryPermission,
  CommentView,
  PostView,
  UserProfile,
} from "../backend.d";
import type { ExternalBlob } from "../backend.d";
import { useActor } from "./useActor";

export function usePosts() {
  const { actor, isFetching } = useActor();
  return useQuery<PostView[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePost(postId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PostView | null>({
    queryKey: ["post", postId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPost(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function usePostsByCategory(categoryId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PostView[]>({
    queryKey: ["posts", "category", categoryId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPostsByCategory(categoryId);
    },
    enabled: !!actor && !isFetching && !!categoryId,
  });
}

export function useFollowingFeed() {
  const { actor, isFetching } = useActor();
  return useQuery<PostView[]>({
    queryKey: ["posts", "following"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFollowingFeed();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePostsByAuthor(authorId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PostView[]>({
    queryKey: ["posts", "author", authorId],
    queryFn: async () => {
      if (!actor || !authorId) return [];
      return actor.getPostsByAuthor(authorId);
    },
    enabled: !!actor && !isFetching && !!authorId,
  });
}

export function useCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useComments(postId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<CommentView[]>({
    queryKey: ["comments", postId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommentsForPost(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useUserProfile(userId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getUserProfile(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useListUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFollowers(userId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["followers", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getFollowers(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useFollowing(userId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["following", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getFollowing(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      liked,
    }: { postId: string; liked: boolean }) => {
      if (!actor) throw new Error("No actor");
      if (liked) await actor.unlikePost(postId);
      else await actor.likePost(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["post"] });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      text,
      imageBlob,
    }: {
      postId: string;
      text: string;
      imageBlob: any;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addComment(postId, text, imageBlob);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.postId] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      postId: _postId,
    }: { commentId: string; postId: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteComment(commentId);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.postId] });
    },
  });
}

export function useLikeComment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      postId: _postId,
    }: { commentId: string; postId: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.likeComment(commentId);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.postId] });
    },
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      title: string;
      body: string;
      categoryId: string;
      mediaUrls: any[];
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createPost(
        vars.title,
        vars.body,
        vars.categoryId,
        vars.mediaUrls,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useEditPost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      postId: string;
      title: string;
      body: string;
      categoryId: string;
      mediaUrls: any[];
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.editPost(
        vars.postId,
        vars.title,
        vars.body,
        vars.categoryId,
        vars.mediaUrls,
      );
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["post", vars.postId] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deletePost(postId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function usePublishPost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.publishPost(postId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function usePinPost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.pinPost(postId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetUserId,
      isFollowing,
    }: { targetUserId: string; isFollowing: boolean }) => {
      if (!actor) throw new Error("No actor");
      if (isFollowing) await actor.unfollowUser(targetUserId);
      else await actor.followUser(targetUserId);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["followers", vars.targetUserId] });
      qc.invalidateQueries({ queryKey: ["following"] });
    },
  });
}

export function useAddCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.addCategory(name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCategory(categoryId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateUserRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { userId: string; newRole: BlogRole }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateUserRole(vars.userId, vars.newRole);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      block,
    }: { userId: string; block: boolean }) => {
      if (!actor) throw new Error("No actor");
      if (block) await actor.blockUser(userId);
      else await actor.unblockUser(userId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useCategoryPermissions(categoryId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<CategoryPermission>({
    queryKey: ["categoryPermissions", categoryId],
    queryFn: async () => {
      if (!actor) return { readAllowlist: [], commentAllowlist: [] };
      return (actor as any).getCategoryPermissions(categoryId);
    },
    enabled: !!actor && !isFetching && !!categoryId,
  });
}

export function useSetCategoryPermissions() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      categoryId: string;
      readAllowlist: string[];
      commentAllowlist: string[];
    }) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).setCategoryPermissions(
        vars.categoryId,
        vars.readAllowlist,
        vars.commentAllowlist,
      );
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["categoryPermissions", vars.categoryId],
      });
    },
  });
}
