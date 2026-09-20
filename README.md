# T&D — Truth or Dare wheel

A single-page spinning wheel for truth or dare. No build step, no dependencies,
no server: double-click `index.html` (or drag it into a browser) and it runs.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app — markup, styles, questions and logic in one file |

## Using it

- **Truth / Dare** toggle at the top picks which deck the wheel shows
  (truth = green, dare = red).
- **Go!** in the hub spins it; the landing question appears in the white card above.
- **+** adds a question: pick the category, type the text, hit Add.
- The list icon opens the question list. The inbox icon beside the "Questions"
  heading switches to the archived view (and back). Archiving hides a question
  from the wheel; **Restore** puts it back. The trash icon permanently deletes
  an archived question after confirmation.

## Where the questions live

Everything is stored in the browser's `localStorage` under the key
`td-questions-v1`, as an array of:

```json
{ "id": "s0", "cat": "truth", "text": "...", "archived": false }
```

The default deck has 40 built-in questions (25 truth, 15 dare). Existing saved
decks receive the 14 added prompts once, then their saved copy wins. Clearing
site data resets the deck. The store is per-browser, so two devices keep
separate lists.

## Self-check

Load `index.html?test` and open the console: it asserts the wheel's
"which segment is under the pointer" maths and logs `self-check done`.
