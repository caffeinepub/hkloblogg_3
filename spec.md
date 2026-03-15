# HKLOblogg

## Current State
Full-stack blog platform with posts, comments, categories, user roles, and admin panel. Navigation bar exists in Navbar.tsx with links and user menu. Data is fetched via hooks in useQueries.ts using useAppActor. Backend supports getPosts, getCategories, getCommentsForPost, listUsers, getCategoryPermissions.

## Requested Changes (Diff)

### Add
- Search bar in the Navbar (always visible, between center nav and right side)
- SearchPage component at route /search showing results divided into sections: Inlägg, Kategorier, Kommentarer, Alias
- Search filters: free text input, OR/AND toggle, date range (from/to) pickers
- Comment filter: checkbox "Bara mina kommentarer" (only logged-in user's comments)
- Search respects permissions: only shows non-hidden categories (or hidden categories where user has explicit rights), only published posts
- Route /search added to App.tsx

### Modify
- Navbar.tsx: add search input field that navigates to /search?q=... on submit
- App.tsx: add searchRoute for /search

### Remove
- Nothing removed

## Implementation Plan
1. Create SearchPage.tsx with:
   - Text input for search query
   - OR/AND toggle button
   - Date range (from/to) date pickers
   - "Bara mina kommentarer" checkbox (visible when logged in)
   - Results sections: Inlägg, Kategorier, Kommentarer, Alias
   - Client-side filtering of posts, categories, comments (fetched from existing queries), users (listUsers)
   - Permission-aware category filtering using accessible categories logic
2. Update Navbar.tsx: add compact search input that navigates to /search on submit or enter
3. Update App.tsx: add /search route
