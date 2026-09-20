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

const fresh = boot();
assert.equal(fresh.length, 50, "fresh deck receives the ten approved truths");
assert.equal(fresh.filter(i => i.cat === "truth").length, 35);
assert.equal(fresh.filter(i => i.cat === "dare").length, 15);
assert.deepEqual(fresh.filter(i => Number(i.id.slice(1)) >= 40).map(i => i.text), approved);
assert.equal(new Set(fresh.map(i => i.id)).size, 50);
assert.equal(new Set(fresh.map(i => i.text)).size, 50);
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
assert.deepEqual(upgraded.slice(previous.length).map(i => i.text), approved);
assert.deepEqual(upgraded.filter(i => i.cat === "dare"), previous.filter(i => i.cat === "dare"));
assert.equal(store.get(versionKey), "3");
assert.deepEqual(boot(), upgraded, "migration runs only once");
const deleted = upgraded.filter(i => i.id !== "s40");
store.set(key, JSON.stringify(deleted));
assert.deepEqual(boot(), deleted, "deleted additions stay deleted after reload");
store.set(key, "[]");
assert.deepEqual(boot(), [], "an empty saved deck stays empty");
store.set(versionKey, "2");
assert.deepEqual(boot().map(i => i.text), approved, "empty older decks receive only new truths");

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
