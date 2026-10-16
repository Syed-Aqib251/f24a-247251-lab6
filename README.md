# Lab 06 — The lookup

**Student:** Syed Aqib Hassan Hashmi  
**Roll number:** 247251  
**Course:** Fullstack Web Development Lab, BSCS F24 A  
**Lab title:** A page that waits  
**Project:** 1 — The lookup

The last roll digit is `1`: its remainder after division by three is `1`, so
this submission implements **The lookup**. The assigned place is **Canteen**,
with a CSS `green` header and a white place name.

## Run locally

Install Node.js (version 18 or later is recommended for the built-in tests).
No npm dependencies or installation step is needed.

```sh
node server.js
```

Open **http://localhost:3016/lookup.html** in your browser. Keep the terminal
running. Opening `lookup.html` directly as a file will not connect to the API.
Stop the server with `Ctrl+C`. Restart it with the same command.

Alternatively, run `npm start`.

## Required checks

Start with a fresh page, then perform these steps in order.

| Action | Status and card | Slip and figures |
| --- | --- | --- |
| Open or refresh | The original sentence; empty card | No rows; Found 0; Dearest 0 |
| Find `pen` | `pen: Rs 50`; card pen and 50 | pen, 50, 1; Found 1; Dearest 50 |
| Find `pen` again | Same status and card | One pen row; Times 2; Found 1 |
| Find `copy` | `copy: Rs 80`; card copy and 80 | Two rows; Found 2; Dearest 80 |
| Find `ruler` | `ruler is not in the shop`; blank card | The previous rows and figures stay |
| Find an empty or whitespace name | `undefined`; no request | Card, rows and figures stay |
| Stop the server, then Find `pen` | `The server is not answering.`; blank card | The previous rows and figures stay |
| Restart server, then Find `tea` | `tea: Rs 40`; card tea and 40 | A third distinct row; Dearest stays 80 |
| Refresh | The original sentence returns | Card and slip empty; both figures 0 |

Every nonempty lookup immediately shows `Loading…` and disables Find. A
`finally` block restores the button after a success, unknown item, or failure.
The page stores a listener reference and does not request anything on load.

## Implementation

- `lookup.html` — semantic page with every required ID, original status
  sentence, empty card and table body, and zeroed figures.
- `styles.css` and `favicon.svg` — responsive styling with the assigned green
  header, visible keyboard focus, and reduced-motion support.
- `lookup.js` — `async` / `await`, `fetch`, HTTP status handling, and a `Map`
  that tracks distinct names and repeat counts. Prices come only from replies;
  there is no client-side price catalogue. Text is inserted with `textContent`.
- `server.js` — the instructor's file, copied byte-for-byte without edits.
- `tests/` — dependency-free Node tests for lookup behavior and the initial
  HTML contract. The DOM adapter runs the actual client script; browser QA
  separately checks rendering and real server interactions.

Input is trimmed and normalized to lowercase. Names are URL-encoded. The
server's returned name identifies each slip row. An unsuccessful lookup never
adds a row. The slip exists only for this page visit and resets on refresh.
The input label and Enter submission support keyboard use, and a live status
line announces the result.

## Automated checks

```sh
npm test
```

Or run `node --test tests/lookup.test.cjs`. These tests do not start or modify
the supplied server. Manual browser checks also cover its real responses and
stopping the server while a populated slip remains on screen.

## Submission

Repository: https://github.com/Syed-Aqib251/f24a-247251-lab6

The 16 topic commits use the messages specified by the lab. The working folder
is the existing `Lab06_247251` folder selected by the student in VS Code; the
GitHub repository has the required `f24a-247251-lab6` name.

The Word report is kept outside Git and ignored by `.gitignore`, as instructed.
Review `Syed Aqib Hassan Hashmi-247251.docx` and upload it yourself to the
Classroom assignment **Lab 06 — A page that waits** by **21 October 2026,
16:00**. Do not commit the report.
