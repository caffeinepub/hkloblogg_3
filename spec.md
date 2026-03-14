# HKLOblogg

## Current State
Backend state variables (`users`, `posts`, `comments`, `categories`, `follows`, `categoryPermissions`, etc.) are declared with `let` (non-stable mutable maps). This causes all data to be wiped on every canister upgrade/deployment.

## Requested Changes (Diff)

### Add
- Stable backing arrays for all persistent data (users, posts, comments, categories, follows, categoryPermissions, counters)
- `system func preupgrade()` that serializes all runtime state into stable arrays before upgrade
- `system func postupgrade()` that restores runtime state from stable arrays after upgrade
- Stable record types (`StablePost`, `StableComment`, `StableFollows`) that use `[Text]` arrays instead of `Set.Set<Text>` for likes/follows (since Sets are not directly stable)

### Modify
- All Map/Set runtime variables remain mutable (for performance) but are backed by stable arrays
- `initCategories()` only runs if categories are empty (avoids re-initializing on upgrade)

### Remove
- Nothing removed from functionality

## Implementation Plan
1. Define stable record types for Post, Comment, and Follows serialization
2. Declare `stable var` arrays for all data: stableUsers, stablePosts, stableComments, stableCategories, stableFollows, stableCategoryPermissions, stableNextPostId, stableNextCommentId
3. Initialize runtime maps from stable arrays on startup (postupgrade logic inline)
4. Implement `preupgrade` to flush runtime maps to stable arrays
5. Implement `postupgrade` to restore runtime maps from stable arrays and clear temp storage
6. Ensure `initCategories()` is guarded to only run when categories map is empty
