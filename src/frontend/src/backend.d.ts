import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
  __kind__: "Some";
  value: T;
}
export interface None {
  __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
  getBytes(): Promise<Uint8Array<ArrayBuffer>>;
  getDirectURL(): string;
  static fromURL(url: string): ExternalBlob;
  static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
  withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Category {
  id: string;
  name: string;
  isHidden: boolean;
}
export interface CategoryPermission {
  readAllowlist: Array<string>;
  commentAllowlist: Array<string>;
}
export type Time = bigint;
export interface PostView {
  id: string;
  categoryId: string;
  title: string;
  isPublished: boolean;
  authorId: string;
  body: string;
  createdAt: Time;
  likes: Array<string>;
  updatedAt: Time;
  mediaUrls: Array<ExternalBlob>;
  isPinned: boolean;
}
export interface CommentView {
  id: string;
  authorId: string;
  createdAt: Time;
  text: string;
  likes: Array<string>;
  imageUrl?: ExternalBlob;
  postId: string;
}
export interface UserProfile {
  userId: string;
  alias: string;
  isBlocked: boolean;
  blogRole: BlogRole;
}
export enum BlogRole {
  moderator = "moderator",
  user = "user",
  superadmin = "superadmin",
}
export enum UserRole {
  admin = "admin",
  user = "user",
  guest = "guest",
}
export interface backendInterface {
  addCategory(name: string, isHidden: boolean): Promise<void>;
  addComment(
    postId: string,
    text: string,
    imageUrl: ExternalBlob | null,
  ): Promise<string>;
  adminDeleteUser(targetUserId: string): Promise<void>;
  assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
  blockUser(userId: string): Promise<void>;
  createPost(
    title: string,
    body: string,
    categoryId: string,
    mediaUrls: Array<ExternalBlob>,
  ): Promise<string>;
  deleteAccount(): Promise<void>;
  deleteCategory(categoryId: string): Promise<void>;
  deleteComment(commentId: string): Promise<void>;
  deletePost(postId: string): Promise<void>;
  editPost(
    postId: string,
    title: string,
    body: string,
    categoryId: string,
    mediaUrls: Array<ExternalBlob>,
  ): Promise<void>;
  followUser(targetUserId: string): Promise<void>;
  getCallerUserProfile(): Promise<UserProfile | null>;
  getCallerUserRole(): Promise<UserRole>;
  getCategories(): Promise<Array<Category>>;
  getCategoryPermissions(categoryId: string): Promise<CategoryPermission>;
  getCommentsForPost(postId: string): Promise<Array<CommentView>>;
  getFollowers(userId: string): Promise<Array<string>>;
  getFollowing(userId: string): Promise<Array<string>>;
  getFollowingFeed(): Promise<Array<PostView>>;
  getPost(postId: string): Promise<PostView | null>;
  getPosts(): Promise<Array<PostView>>;
  getPostsByAuthor(userId: string): Promise<Array<PostView>>;
  getPostsByCategory(categoryId: string): Promise<Array<PostView>>;
  getProfile(): Promise<UserProfile | null>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  isCallerAdmin(): Promise<boolean>;
  likeComment(commentId: string): Promise<void>;
  likePost(postId: string): Promise<void>;
  listUsers(): Promise<Array<UserProfile>>;
  login(passwordHash: Uint8Array): Promise<string>;
  pinPost(postId: string): Promise<void>;
  publishPost(postId: string): Promise<void>;
  register(
    alias: string,
    passwordHash: Uint8Array,
    salt: Uint8Array,
  ): Promise<string>;
  saveCallerUserProfile(profile: UserProfile): Promise<void>;
  setCategoryPermissions(
    categoryId: string,
    readAllowlist: Array<string>,
    commentAllowlist: Array<string>,
  ): Promise<void>;
  setCategoryVisibility(categoryId: string, isHidden: boolean): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  unfollowUser(targetUserId: string): Promise<void>;
  unlikePost(postId: string): Promise<void>;
  updateUserRole(userId: string, newRole: BlogRole): Promise<void>;
}
