# HKLOblogg

## Current State
- CreatePostPage uses a plain `<Textarea>` for the post body
- PostDetailPage uses a plain `<Textarea>` for comment input
- Post body is rendered as plain text with `whitespace-pre-wrap`
- `react-quill-new` (v3.4.6) is already installed in package.json
- No rich text editor exists anywhere in the app

## Requested Changes (Diff)

### Add
- `RichTextEditor` component wrapping react-quill-new with a full toolbar:
  - Formatting: bold, italic, underline, strikethrough
  - Headings: H1, H2, H3
  - Lists: bullet, ordered
  - Blockquote, code block
  - Link insertion
  - Emoji picker (with search, using a custom emoji picker UI)
  - Undo/redo
  - Clear formatting
- `EmojiPicker` sub-component that opens a popover with emoji grid + search
- CSS for Quill editor styled to match the app's light blue/gray palette
- Rendered HTML display for post body and comment text (using `dangerouslySetInnerHTML` with sanitization)

### Modify
- `CreatePostPage.tsx`: replace `<Textarea>` body field with `<RichTextEditor>`, update `body` state to hold HTML string
- `PostDetailPage.tsx`:
  - Replace comment `<Textarea>` with `<RichTextEditor>`
  - Render `post.body` as HTML instead of plain text
  - Render `comment.text` as HTML instead of plain text

### Remove
- `whitespace-pre-wrap` plain text rendering of post body

## Implementation Plan
1. Install no new packages (react-quill-new already present)
2. Create `src/frontend/src/components/RichTextEditor.tsx` with Quill editor + custom toolbar including emoji picker
3. Create `src/frontend/src/components/EmojiPicker.tsx` with a popover grid of common emojis with search
4. Add Quill CSS import (react-quill-new/dist/quill.snow.css) and override styles to match design system
5. Update `CreatePostPage.tsx` to use `<RichTextEditor>` for body
6. Update `PostDetailPage.tsx` to use `<RichTextEditor>` for comment input and render HTML for post body and comments
7. Validate and fix any lint/type errors
