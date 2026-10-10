# ww-subtitle-sdk

A TypeScript SDK for parsing, editing, formatting, and transcribing subtitle files.

It handles the subtitle data layer — reading and writing SRT, VTT, and TXT formats, editing cue timing and text, converting between formats, and transcribing audio files into subtitles via the Groq Whisper API. Rendering subtitles onto a video is the responsibility of the player or encoding tool you already use; this SDK gives it the right data.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Tech Stack](#tech-stack)
3. [Requirements](#requirements)
4. [Installation](#installation)
5. [Entry Points](#entry-points)
6. [Quick Start](#quick-start)
7. [Core Concepts](#core-concepts)
8. [Features](#features)
   - [Parsing](#parsing)
   - [Editing](#editing)
   - [Formatting](#formatting)
   - [Format Conversion](#format-conversion)
   - [Stream Parsing](#stream-parsing)
   - [File Helpers (Node.js)](#file-helpers-nodejs-only)
   - [Async Stream Helpers (Node.js)](#async-stream-helpers-nodejs-only)
   - [Audio Transcription / ASR (Node.js)](#audio-transcription--asr-nodejs-only)
9. [End-to-End Examples](#end-to-end-examples)
10. [TypeScript Usage](#typescript-usage)
11. [Plain JavaScript Usage](#plain-javascript-usage)
12. [API Reference](#api-reference)

---

## How It Works

Everything in this SDK flows through two building blocks:

- **`Cue`** — one subtitle entry: an id, a start time, an end time, and text.
- **`Subtitle`** — a container that holds all the `Cue` objects and exposes methods to edit them.

The pipeline looks like this:

```
Text / File / Audio
        │
        ▼
     Parser          ← turns raw text into a Subtitle
        │
        ▼
     Subtitle         ← edit timing, text, merge, split
        │
        ▼
    Formatter         ← turns Subtitle back into a string
        │
        ▼
  .srt / .vtt file
```

---

## Tech Stack

- **TypeScript** — strict mode, `verbatimModuleSyntax`, `isolatedModules`
- **ESNext** target, **NodeNext** module resolution
- **Zero runtime dependencies** — no third-party packages are installed when you install this SDK
- **Groq Whisper API** — used only for ASR (`transcribeAudio`); requires a Groq API key supplied by the caller

---

## Requirements

- **Node.js** 18 or later (for the Node entry point and ASR)
- **TypeScript** 5+ recommended (types are included; not required for plain JavaScript)

---

## Installation

```bash
npm install ww-subtitle-sdk
```

No extra dependencies are installed. The SDK has zero runtime dependencies.

---

## Entry Points

The package ships two entry points:

| Entry point | Import path | Works in |
|---|---|---|
| **Core** | `ww-subtitle-sdk` | Browser, Node.js, Deno, Bun, Vite, edge runtimes — anywhere that runs modern JS/TS |
| **Node** | `ww-subtitle-sdk/node` | Node.js only (uses `node:fs` and `node:readline` internally) |

**Use the core entry point** when the subtitle text is already available as a string in memory — a browser file input, an API response, a database field, etc.

**Use the Node entry point** when you need to read from or write to actual files on disk, stream large files, or transcribe audio.

---

## Quick Start

### Parse an SRT string (works everywhere)

```ts
import { SrtParser } from "ww-subtitle-sdk";

const srt = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:05,500 --> 00:00:08,000
Welcome to my video`;

const subtitle = SrtParser.parse(srt);
console.log(subtitle.getCues());
// [
//   { id: 1, start: 1, end: 4, text: "Hello world" },
//   { id: 2, start: 5.5, end: 8, text: "Welcome to my video" }
// ]
```

### Read a file, edit it, and save it back (Node.js)

```ts
import { readSrtFile, writeSrtFile } from "ww-subtitle-sdk/node";

const subtitle = await readSrtFile("movie.srt");

subtitle.shift(1.5);                      // push all timings forward by 1.5 seconds
subtitle.replaceText("colour", "color");  // fix a word across all cues

await writeSrtFile("movie-fixed.srt", subtitle);
```

---

## Core Concepts

### `Cue`

The smallest unit. One subtitle entry.

```ts
interface Cue {
    id: number;     // 1-based sequence number
    start: number;  // start time in seconds (e.g. 1.5 = 1500ms)
    end: number;    // end time in seconds
    text: string;   // subtitle text (may contain \n for multi-line cues)
}
```

### `Subtitle`

A container that holds an ordered list of `Cue` objects. Every parser returns one. Every formatter takes one.

```ts
const subtitle = new Subtitle();
subtitle.addCues({ id: 1, start: 1, end: 4, text: "Hello" });
subtitle.getCues(); // [{ id: 1, start: 1, end: 4, text: "Hello" }]
```

---

## Features

### Parsing

Parse a complete subtitle string into a `Subtitle` object. Works in any runtime.

```ts
import { SrtParser, VttParser, TxtParser } from "ww-subtitle-sdk";

const subtitle = SrtParser.parse(srtText);  // .srt content
const subtitle = VttParser.parse(vttText);  // .vtt content
const subtitle = TxtParser.parse(txtText);  // plain text transcript (no timestamps)
```

Each parser also exposes a lower-level single-block method, used internally by stream parsers:

```ts
SrtParser.parseBlock(blockText)   // returns Cue | null
VttParser.parseBlock(blockText)   // returns Cue | null
TxtParser.parseLine(line, id)     // returns Cue | null
```

---

### Editing

Every `Subtitle` exposes methods for reading and mutating cues:

```ts
// Read
subtitle.getCues()                        // all Cue objects
subtitle.getCue(id)                       // one Cue by id, or undefined

// Basic mutations
subtitle.addCues(cue)                     // append a new Cue
subtitle.updateCue(id, { text: "..." })  // update fields on a cue by id
subtitle.removeCue(id)                    // remove a cue by id

// Convenience edits
subtitle.shift(seconds)                   // move all timings forward (+) or backward (-)
subtitle.mergeCues([1, 2])                // join multiple cues into one
subtitle.splitCue(id, splitTime)          // split one cue into two at a given time (seconds)
subtitle.replaceText("old", "new")        // find and replace across all cues
subtitle.sortCues()                       // re-order cues by start time
```

---

### Formatting

Serialize a `Subtitle` back into a string. Works in any runtime.

```ts
import { SrtFormatter, VttFormatter, TxtFormatter } from "ww-subtitle-sdk";

const srtText = SrtFormatter.format(subtitle);  // produces an .srt string
const vttText = VttFormatter.format(subtitle);  // produces a .vtt string with WEBVTT header
const txtText = TxtFormatter.format(subtitle);  // produces a plain text transcript
```

---

### Format Conversion

Convert between SRT and VTT in one line using `SubtitleConverter`:

```ts
import { SubtitleConverter } from "ww-subtitle-sdk";

// Direct string-to-string conversion
const vttText = SubtitleConverter.srtToVtt(srtText);
const srtText = SubtitleConverter.vttToSrt(vttText);

// Or parse first, edit, then convert
const subtitle = SubtitleConverter.fromSrt(srtText);
subtitle.shift(2);
const result = SubtitleConverter.toVtt(subtitle);
```

---

### Stream Parsing

Stream parsers process subtitle content one line at a time and emit a `Cue` via callback as soon as each block is complete. Useful when the file is very large or when content arrives over a network.

```ts
import { SrtStreamParser } from "ww-subtitle-sdk";

const parser = new SrtStreamParser((cue) => {
    console.log(cue); // called once per complete cue
});

parser.push("1");
parser.push("00:00:01,000 --> 00:00:04,000");
parser.push("Hello world");
parser.push("");    // blank line triggers the cue to emit
parser.flush();     // call at end to flush any remaining buffered lines
```

`VttStreamParser` and `TxtStreamParser` follow the same interface.

---

### File Helpers (Node.js only)

Read and write subtitle files directly from disk. The SDK handles the file I/O and parsing for you.

```ts
import { readSrtFile, writeSrtFile } from "ww-subtitle-sdk/node";
import { readVttFile, writeVttFile } from "ww-subtitle-sdk/node";
import { readTxtFile, writeTxtFile } from "ww-subtitle-sdk/node";

const subtitle = await readSrtFile("captions.srt");  // Promise<Subtitle>
await writeSrtFile("captions-new.srt", subtitle);    // Promise<void>
```

---

### Async Stream Helpers (Node.js only)

Read large files without loading them entirely into memory. Each helper is an async generator that yields one `Cue` at a time.

```ts
import { readSrtStream, readVttStream, readTxtStream } from "ww-subtitle-sdk/node";
import type { Cue } from "ww-subtitle-sdk";

for await (const cue of readSrtStream("big-movie.srt")) {
    console.log(cue.text);
}
```

When to use streaming vs file helpers:

| Situation | Recommended |
|---|---|
| Small to medium files | `readSrtFile` / `readVttFile` / `readTxtFile` |
| Very large files | `readSrtStream` / `readVttStream` / `readTxtStream` |

---

### Audio Transcription / ASR (Node.js only)

Transcribe an audio file into a `Subtitle` using the Groq Whisper API. You supply your own Groq API key.

```ts
import { transcribeAudio } from "ww-subtitle-sdk/node";
import { SrtFormatter } from "ww-subtitle-sdk";

const subtitle = await transcribeAudio("audio.mp3", process.env.GROQ_API_KEY);

// Save as SRT
const srt = SrtFormatter.format(subtitle);
```

You can optionally specify a Whisper model:

```ts
const subtitle = await transcribeAudio("audio.mp3", process.env.GROQ_API_KEY, {
    model: "whisper-large-v3"
});
```

To get a Groq API key, sign up at [console.groq.com](https://console.groq.com). Store the key in an environment variable — never hard-code it.

---

## End-to-End Examples

### Fix timing and convert format

```ts
import { readSrtFile } from "ww-subtitle-sdk/node";
import { SubtitleConverter } from "ww-subtitle-sdk";
import { writeFile } from "node:fs/promises";

// 1. Read the SRT file from disk
const subtitle = await readSrtFile("input.srt");

// 2. Fix a sync issue — shift all cues forward by 2.5 seconds
subtitle.shift(2.5);

// 3. Fix a spelling error across all cues
subtitle.replaceText("teh", "the");

// 4. Export as VTT for a web player
const vttText = SubtitleConverter.toVtt(subtitle);
await writeFile("output.vtt", vttText);
```

### Transcribe audio and save as SRT

```ts
import { transcribeAudio } from "ww-subtitle-sdk/node";
import { SrtFormatter } from "ww-subtitle-sdk";
import { writeFile } from "node:fs/promises";

const subtitle = await transcribeAudio("podcast.mp3", process.env.GROQ_API_KEY);
const srt = SrtFormatter.format(subtitle);
await writeFile("podcast.srt", srt);
```

### Convert a plain TXT transcript to VTT (browser)

```ts
import { TxtParser, VttFormatter } from "ww-subtitle-sdk";

// Text already in memory — works in browser, Deno, edge runtimes, anywhere
const subtitle = TxtParser.parse(rawTxtString);
const vttText = VttFormatter.format(subtitle);
```

---

## TypeScript Usage

All types are included. Import `Cue` as a type-only import:

```ts
import { SrtParser, Subtitle } from "ww-subtitle-sdk";
import type { Cue } from "ww-subtitle-sdk";

function printCue(cue: Cue): void {
    console.log(`[${cue.start}s → ${cue.end}s] ${cue.text}`);
}

const subtitle: Subtitle = SrtParser.parse(srtText);
subtitle.getCues().forEach(printCue);
```

---

## Plain JavaScript Usage

The package is ESM (`"type": "module"`). Import normally without TypeScript:

```js
import { SrtParser, SrtFormatter } from "ww-subtitle-sdk";

const subtitle = SrtParser.parse(srtText);
const output = SrtFormatter.format(subtitle);
```

---

## API Reference

### Core (`ww-subtitle-sdk`)

| Export | Type | Description |
|---|---|---|
| `Subtitle` | class | Cue container with editing methods |
| `Cue` | interface | Single subtitle entry (`id`, `start`, `end`, `text`) |
| `SrtParser` | class | Parses SRT text into a `Subtitle` |
| `SrtStreamParser` | class | Push-based SRT parser, emits `Cue` callbacks |
| `SrtFormatter` | class | Serializes a `Subtitle` to SRT string |
| `VttParser` | class | Parses VTT text into a `Subtitle` |
| `VttStreamParser` | class | Push-based VTT parser, emits `Cue` callbacks |
| `VttFormatter` | class | Serializes a `Subtitle` to VTT string |
| `TxtParser` | class | Parses plain text into a `Subtitle` (no timestamps) |
| `TxtStreamParser` | class | Push-based TXT parser, emits `Cue` callbacks |
| `TxtFormatter` | class | Serializes a `Subtitle` to plain text |
| `SubtitleConverter` | class | Converts between SRT and VTT formats |

### Node.js layer (`ww-subtitle-sdk/node`)

| Export | Type | Description |
|---|---|---|
| `readSrtFile(path)` | async function | Reads an `.srt` file → `Promise<Subtitle>` |
| `writeSrtFile(path, subtitle)` | async function | Writes a `Subtitle` to an `.srt` file |
| `readVttFile(path)` | async function | Reads a `.vtt` file → `Promise<Subtitle>` |
| `writeVttFile(path, subtitle)` | async function | Writes a `Subtitle` to a `.vtt` file |
| `readTxtFile(path)` | async function | Reads a `.txt` file → `Promise<Subtitle>` |
| `writeTxtFile(path, subtitle)` | async function | Writes a `Subtitle` to a `.txt` file |
| `readSrtStream(path)` | async generator | Yields `Cue` objects from an `.srt` file one at a time |
| `readVttStream(path)` | async generator | Yields `Cue` objects from a `.vtt` file one at a time |
| `readTxtStream(path)` | async generator | Yields `Cue` objects from a `.txt` file one at a time |
| `transcribeAudio(path, apiKey, options?)` | async function | Transcribes audio to `Subtitle` via Groq Whisper |

---

