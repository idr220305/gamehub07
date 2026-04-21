import { registerGame } from "./engine.js";

import { emojiGame } from "./emoji.js";
import { higherLowerGame } from "./higherLower.js";
import { wordleGame } from "./wordle.js";
import { connectionsGame } from "./connections.js";
import { songlessGame } from "./songless.js";
import { flagsGame } from "./flags.js";
import { fakeFactGame } from "./fakeFact.js";
import { setGame } from "./set.js";
import { drawGame } from "./precisionDraw.js";
import { whichFirstGame } from "./whichFirst.js";
import { soundGame } from "./sound.js";
import { anagramGame } from "./anagram.js";
import { capitalGame } from "./capital.js";
import { oddOneOutGame } from "./oddOneOut.js";
import { memoryGame } from "./memoryGrid.js";
import { sequenceGame } from "./numberSequence.js";
import { tfGame } from "./trueFalse.js";
import { categoryGame } from "./categoryBlitz.js";
import { pixelGame } from "./pixelGuess.js";
import { reactionGame } from "./reaction.js";

for (const g of [
  wordleGame, connectionsGame, emojiGame, higherLowerGame,
  flagsGame, whichFirstGame, fakeFactGame, songlessGame, soundGame, setGame, drawGame,
  anagramGame, capitalGame, oddOneOutGame, memoryGame, sequenceGame, tfGame,
  categoryGame, pixelGame, reactionGame,
]) registerGame(g);

export { registerGame };
export * from "./engine.js";
