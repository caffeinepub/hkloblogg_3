import "react-quill-new/dist/quill.snow.css";
import "./RichTextEditor.css";
import { useCallback, useRef } from "react";
import ReactQuill from "react-quill-new";
import { EmojiPicker } from "./EmojiPicker";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "code-block",
  "link",
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Skriv här...",
  minHeight = 200,
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    editor.insertText(range.index, emoji);
    editor.setSelection(range.index + emoji.length, 0);
  }, []);

  return (
    <div className="rich-editor-wrapper">
      <div className="rich-editor-emoji-row">
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
      </div>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{ minHeight }}
      />
    </div>
  );
}
