import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { useState } from "react";

const EMOJI_CATEGORIES = [
  {
    label: "Leenden",
    emojis: [
      "😀",
      "😁",
      "😂",
      "🤣",
      "😃",
      "😄",
      "😅",
      "😆",
      "😉",
      "😊",
      "😋",
      "😎",
      "😍",
      "🥰",
      "😘",
      "🤩",
      "🙂",
      "🤗",
      "🤔",
      "😐",
      "😑",
      "😶",
      "😏",
      "😒",
      "😞",
      "😔",
      "😟",
      "😕",
      "🙁",
      "☹️",
      "😣",
      "😖",
      "😫",
      "😩",
      "🥺",
      "😢",
      "😭",
      "😤",
      "😠",
      "😡",
    ],
  },
  {
    label: "Djur",
    emojis: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🙈",
      "🙉",
      "🙊",
      "🐔",
      "🐧",
      "🐦",
      "🦆",
      "🦅",
      "🦉",
      "🦇",
      "🐺",
      "🐗",
      "🐴",
      "🦄",
      "🐝",
    ],
  },
  {
    label: "Mat",
    emojis: [
      "🍎",
      "🍊",
      "🍋",
      "🍇",
      "🍓",
      "🫐",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥝",
      "🍅",
      "🥑",
      "🍔",
      "🍕",
      "🌮",
      "🌯",
      "🥗",
      "🍜",
      "🍣",
      "🍰",
      "🎂",
      "🧁",
      "🍩",
      "🍪",
      "☕",
      "🍵",
      "🧃",
      "🥤",
      "🍺",
    ],
  },
  {
    label: "Natur",
    emojis: [
      "🌸",
      "🌺",
      "🌻",
      "🌹",
      "🌷",
      "🌼",
      "💐",
      "🍀",
      "🌿",
      "🍃",
      "🍂",
      "🍁",
      "🌱",
      "🌾",
      "🌲",
      "🌳",
      "🌴",
      "🌵",
      "🎋",
      "☀️",
      "🌤️",
      "⛅",
      "🌧️",
      "⛈️",
      "🌈",
      "❄️",
      "☃️",
      "⚡",
      "🌊",
      "🔥",
    ],
  },
  {
    label: "Symboler",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "✨",
      "⭐",
      "🌟",
      "💫",
      "🎉",
      "🎊",
      "🎈",
      "🏆",
      "🥇",
      "👍",
      "👎",
      "👏",
      "🙌",
    ],
  },
  {
    label: "Resor",
    emojis: [
      "🚗",
      "🚕",
      "🚙",
      "🚌",
      "🚎",
      "🏎️",
      "✈️",
      "🚀",
      "🛸",
      "🚁",
      "⛵",
      "🛳️",
      "🚂",
      "🏠",
      "🏡",
      "🏢",
      "🗼",
      "🗽",
      "⛺",
      "🌍",
    ],
  },
];

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = search.trim()
    ? ALL_EMOJIS.filter((e) => e.includes(search))
    : null;

  const handleSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Lägg till emoji"
          data-ocid="editor.emoji.button"
          className="ql-formats inline-flex items-center justify-center w-7 h-7 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Smile className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3"
        side="top"
        align="start"
        data-ocid="editor.emoji.popover"
      >
        <Input
          placeholder="Sök emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
          data-ocid="editor.emoji.search_input"
        />
        {filtered ? (
          <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
            {filtered.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelect(emoji)}
                className="text-lg w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
              >
                {emoji}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-8 text-xs text-muted-foreground text-center py-2">
                Inga emojis hittades
              </p>
            )}
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto space-y-2">
            {EMOJI_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {cat.label}
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSelect(emoji)}
                      className="text-lg w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
