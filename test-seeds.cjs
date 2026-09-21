const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {join} = require("node:path");
const {runInNewContext, Script} = require("node:vm");

const html = readFileSync(join(__dirname, "index.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Script(script);
const loading = script.slice(0, script.indexOf("// flat poster palette"));
const key = "td-questions-v1", versionKey = "td-questions-seed-version";
const store = new Map();
const storage = {
  getItem: key => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value))
};
const boot = (localStorage = storage) => JSON.parse(runInNewContext(
  loading + "\nJSON.stringify(items)", {localStorage}
));
const approved = [
  "What was your first not-so-innocent thought about me?",
  "Have you ever deliberately tried to make me jealous? What did you do?",
  "What's something I wear that makes it hard for you to pay attention?",
  "Have you ever acted uninterested when you actually wanted me to make a move?",
  "What's the boldest message you've typed to me and then deleted?",
  "What's something you pretend not to like when I do it, but secretly enjoy?",
  "When have you wanted to kiss me but held yourself back?",
  "What's one question you're relieved I haven't asked tonight?",
  "What do you miss about being single that you wouldn't normally admit?",
  "What's something you want to ask me but are afraid of my answer?"
];
const deepTalk = [
  "Do you think love can last a lifetime?",
  "What were your expectations or fantasies about relationships in the past? In your current relationship, which aspects have exceeded your expectations, and which have shattered them?",
  "Which of your parents' relationship patterns do you hope to avoid repeating?",
  "What are you most afraid of losing?",
  "What small things easily make you feel happy?",
  "Are you afraid of getting old? What does getting old mean to you?",
  "Have you ever been deeply hurt by someone?",
  "If you could switch bodies with me for a day, what would you do?",
  "Which past experiences have shaped who you are today?",
  "Has there ever been a moment when you suddenly thought, \"This person is the one\"?",
  "When did you realize you'd fallen for the other person?",
  "If you could know one thing about the future in advance, what would you want to know?",
  "Which of my little habits do you find especially cute?",
  "On a scale of 1 to 10, how satisfied are you with yourself right now?",
  "Loving only one person for a lifetime vs. having countless wonderful encounters",
  "Free meals forever vs. free clothes forever",
  "Willing to change habits for each other vs. accepting each other just as we are",
  "Living together in one place vs. living apart and seeing each other regularly",
  "Never getting sick vs. never feeling tired",
  "Seeking a stable life vs. constantly trying new things",
  "Candlelit dinner vs. street food stalls",
  "Bringing each other to friend gatherings vs. socializing separately",
  "A \"cat-type\" partner vs. a \"dog-type\" partner"
];
const newest = approved.concat(deepTalk);

const fresh = boot();
assert.equal(fresh.length, 73, "fresh deck receives the approved and deep-talk truths");
assert.equal(fresh.filter(i => i.cat === "truth").length, 58);
assert.equal(fresh.filter(i => i.cat === "dare").length, 15);
assert.deepEqual(fresh.filter(i => Number(i.id.slice(1)) >= 40).map(i => i.text), newest);
assert.equal(new Set(fresh.map(i => i.id)).size, 73);
assert.equal(new Set(fresh.map(i => i.text)).size, 73);
assert.deepEqual(boot(), fresh, "fresh deck persists without duplicate additions");

// Model a version-2 deck with deleted, archived, and custom questions.
const previous = fresh.filter(i => Number(i.id.slice(1)) < 40 && i.id !== "s26").map(i => ({...i}));
previous.find(i => i.id === "s27").archived = true;
previous.find(i => i.id === "s36").archived = true;
previous.push({id:"u123", cat:"truth", text:"My custom question", archived:false});
store.set(key, JSON.stringify(previous));
store.set(versionKey, "2");
const upgraded = boot();
assert.deepEqual(upgraded.slice(0, previous.length), previous, "saved questions stay untouched");
assert.deepEqual(upgraded.slice(previous.length).map(i => i.text), newest);
assert.deepEqual(upgraded.filter(i => i.cat === "dare"), previous.filter(i => i.cat === "dare"));
assert.equal(store.get(versionKey), "4");
assert.deepEqual(boot(), upgraded, "migration runs only once");
const deleted = upgraded.filter(i => i.id !== "s40");
store.set(key, JSON.stringify(deleted));
assert.deepEqual(boot(), deleted, "deleted additions stay deleted after reload");
store.set(key, "[]");
assert.deepEqual(boot(), [], "an empty saved deck stays empty");
store.set(versionKey, "2");
assert.deepEqual(boot().map(i => i.text), newest, "empty older decks receive only unseen batches");
store.set(key, "[]");
store.set(versionKey, "3");
assert.deepEqual(boot().map(i => i.text), deepTalk, "version-3 decks receive only the deep-talk batch");

store.clear();
store.set(key, JSON.stringify(fresh.filter(i => Number(i.id.slice(1)) < 26)));
assert.deepEqual(boot(), fresh, "legacy decks receive both batches exactly once");
store.clear();
store.set(key, "{invalid");
assert.deepEqual(boot(), fresh, "invalid storage falls back to defaults");
assert.deepEqual(boot({
  getItem() { throw new Error("Storage blocked"); },
  setItem() { throw new Error("Storage blocked"); }
}), fresh, "blocked storage does not prevent startup");
store.set(key, JSON.stringify(previous));
store.set(versionKey, "2");
assert.deepEqual(boot({...storage, setItem() { throw new Error("Storage full"); }}), upgraded);
assert.equal(store.get(versionKey), "2", "failed writes do not mark the migration complete");
console.log("Seed checks passed: approved truths, unchanged dares, migration, persistence, storage fallback.");
