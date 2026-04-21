import EmojiPlayer from "./EmojiPlayer.jsx";
import HigherLowerPlayer from "./HigherLowerPlayer.jsx";
import WordlePlayer from "./WordlePlayer.jsx";
import ConnectionsPlayer from "./ConnectionsPlayer.jsx";
import SonglessPlayer from "./SonglessPlayer.jsx";
import FlagsPlayer from "./FlagsPlayer.jsx";
import FakeFactPlayer from "./FakeFactPlayer.jsx";
import SetPlayer from "./SetPlayer.jsx";
import PrecisionDrawPlayer from "./PrecisionDrawPlayer.jsx";
import WhichFirstPlayer from "./WhichFirstPlayer.jsx";
import SoundPlayer from "./SoundPlayer.jsx";
import AnagramPlayer from "./AnagramPlayer.jsx";
import CapitalPlayer from "./CapitalPlayer.jsx";
import OddOneOutPlayer from "./OddOneOutPlayer.jsx";
import MemoryGridPlayer from "./MemoryGridPlayer.jsx";
import NumberSequencePlayer from "./NumberSequencePlayer.jsx";
import TrueFalsePlayer from "./TrueFalsePlayer.jsx";
import CategoryBlitzPlayer from "./CategoryBlitzPlayer.jsx";
import PixelGuessPlayer from "./PixelGuessPlayer.jsx";
import ReactionPlayer from "./ReactionPlayer.jsx";

export const PLAYERS = {
  emoji: EmojiPlayer,
  "higher-lower": HigherLowerPlayer,
  wordle: WordlePlayer,
  connections: ConnectionsPlayer,
  songless: SonglessPlayer,
  "flag-fragments": FlagsPlayer,
  "fake-fact": FakeFactPlayer,
  set: SetPlayer,
  "precision-draw": PrecisionDrawPlayer,
  "which-first": WhichFirstPlayer,
  "sound-guess": SoundPlayer,
  anagram: AnagramPlayer,
  capital: CapitalPlayer,
  "odd-one-out": OddOneOutPlayer,
  "memory-grid": MemoryGridPlayer,
  "number-sequence": NumberSequencePlayer,
  "true-false": TrueFalsePlayer,
  "category-blitz": CategoryBlitzPlayer,
  "pixel-guess": PixelGuessPlayer,
  reaction: ReactionPlayer,
};

export const GAME_ICONS = {
  emoji: "🔤",
  "higher-lower": "📈",
  wordle: "🟩",
  connections: "🧩",
  songless: "🎵",
  "flag-fragments": "🏳️",
  "fake-fact": "🤥",
  set: "🃏",
  "precision-draw": "✏️",
  "which-first": "⏳",
  "sound-guess": "🔔",
  anagram: "🔀",
  capital: "🏛️",
  "odd-one-out": "🎭",
  "memory-grid": "🧠",
  "number-sequence": "🔢",
  "true-false": "✅",
  "category-blitz": "⚡",
  "pixel-guess": "👾",
  reaction: "⏱️",
};

export function getPlayer(gameId) { return PLAYERS[gameId] || null; }
export function getGameIcon(gameId) { return GAME_ICONS[gameId] || "🎯"; }
