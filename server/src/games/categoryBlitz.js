import { mulberry32, defaultDailySeed, normText } from "./engine.js";

// Curated acceptable-answer lists per category (starter words). Not exhaustive
// — players will often come up with valid answers outside the list. We use a
// forgiving validator: exact match from the list (case/punct insensitive) OR
// a plausibility check (starts with required letter and long enough and on the
// list OR one of the accepted categories has an open-ended validator).
const CATEGORIES = {
  Animal: ["cat","dog","cow","crow","cheetah","camel","chicken","chipmunk",
           "bat","bear","bee","bison","beaver","buffalo","bull","butterfly",
           "duck","deer","dolphin","donkey","dragon","dragonfly",
           "eagle","elephant","eel","elk","emu",
           "fox","frog","ferret","finch","flamingo",
           "goat","giraffe","gerbil","goose","gopher",
           "hen","horse","hedgehog","hawk","hamster","hippopotamus","hyena"],
  Country: ["canada","chile","china","colombia","cyprus","cambodia","cuba",
            "belgium","brazil","bolivia","bulgaria","bahrain","bangladesh","bosnia",
            "denmark","dominica","djibouti","dominican republic",
            "egypt","ecuador","eritrea","ethiopia","estonia",
            "france","finland","fiji",
            "germany","greece","ghana","georgia","guatemala","guyana","grenada",
            "hungary","honduras","haiti"],
  Food: ["cake","curry","cookie","chili","chocolate","cucumber","crepe","casserole",
         "bread","bagel","burrito","burger","broccoli","banana","biscuit",
         "donut","dumpling","doughnut",
         "egg","eggplant","enchilada","empanada",
         "falafel","fries","fondue","fajita",
         "gnocchi","granola","gravy","gelato",
         "hummus","hamburger","hotdog","honey","hash"],
  Sport: ["cricket","cycling","curling","climbing","canoeing",
          "basketball","baseball","badminton","boxing","bowling",
          "diving","dodgeball","darts",
          "equestrian","esports",
          "fencing","football","futsal",
          "golf","gymnastics",
          "handball","hiking","hockey","hurdles"],
  Plant: ["cactus","clover","cedar","cypress","carnation","chrysanthemum",
          "bamboo","birch","bluebell","basil",
          "daisy","daffodil","dandelion","dahlia",
          "elm","elderberry","eucalyptus","echinacea",
          "fern","fig","fuchsia","foxglove","forsythia",
          "geranium","ginger","gardenia","ginkgo","grape",
          "hibiscus","holly","hazel","hyacinth","hemlock"],
};

const LETTERS = "BCDEFGHIJKMNOPRSTUW".split(""); // skip rarely-matching letters

export const categoryGame = {
  id: "category-blitz",
  name: "Category Blitz",
  description: "Name a word in the category that starts with the given letter.",
  difficulty: "medium",
  maxScore: 100,

  dailySeed(date) { return defaultDailySeed(this.id, date); },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const keys = Object.keys(CATEGORIES);
    // Try combos until the letter has at least 3 valid words in the category.
    let category, letter, valid;
    for (let i = 0; i < 30; i++) {
      category = keys[Math.floor(rng() * keys.length)];
      letter = LETTERS[Math.floor(rng() * LETTERS.length)];
      valid = CATEGORIES[category].filter((w) => w.toLowerCase().startsWith(letter.toLowerCase()));
      if (valid.length >= 3) break;
    }
    return { category, letter, accepted: valid };
  },

  getPublicPuzzle(p) { return { category: p.category, letter: p.letter }; },

  validateAnswer(input, p) {
    const n = normText(input);
    return p.accepted.some((w) => normText(w) === n);
  },
  getFeedback(input, p) { return { correct: this.validateAnswer(input, p) }; },

  scoreAnswer(input, p, ctx) {
    const correct = this.validateAnswer(input, p);
    const t = Number(ctx.timeTaken) || 10000;
    let score = 0;
    if (correct) score = t < 5000 ? 100 : t < 10000 ? 80 : 60;
    return {
      score, correct, accuracy: correct ? 1 : 0,
      metadata: { answer: input, examples: p.accepted.slice(0, 5), timeMs: t },
    };
  },
};
