import { VttParser, VttStreamParser, VttFormatter } from "../index.js";
import type { Cue } from "../index.js";

// Helpers
function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(`FAIL: ${message}`);
    console.log(`  PASS: ${message}`);
}

function run(label: string, fn: () => void): void {
    console.log(`\n${label}`);
    try {
        fn();
    } catch (e) {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
    }
}

// Fixtures
const basicVtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Hello world

2
00:00:05.500 --> 00:00:08.000
Welcome to my video`;

const multiLineVtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Hello world
This is a second line`;

const withNoteVtt = `WEBVTT

NOTE This is a comment

1
00:00:01.000 --> 00:00:04.000
Hello world`;

const noIdVtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
Hello world`;

const shortTimestampVtt = `WEBVTT

1
00:01.000 --> 00:04.000
Hello world`;

const cueSettingsVtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.000 align:start position:10%
Hello world`;

const singleCueVtt = `WEBVTT

1
00:00:00.000 --> 00:00:02.500
Only one cue`;

// VttParser.parse()
run("VttParser.parse(): basic parsing", () => {
    const subtitle = VttParser.parse(basicVtt);
    const cues = subtitle.getCues();

    assert(cues.length === 2, "parses two cues");
    assert(cues[0].id === 1, "first cue has id 1");
    assert(cues[0].start === 1, "first cue start is 1s");
    assert(cues[0].end === 4, "first cue end is 4s");
    assert(cues[0].text === "Hello world", "first cue text is correct");
    assert(cues[1].id === 2, "second cue has id 2");
    assert(cues[1].start === 5.5, "second cue start is 5.5s");
    assert(cues[1].end === 8, "second cue end is 8s");
    assert(cues[1].text === "Welcome to my video", "second cue text is correct");
});

run("VttParser.parse(): multi-line cue text", () => {
    const subtitle = VttParser.parse(multiLineVtt);
    const cues = subtitle.getCues();

    assert(cues.length === 1, "parses one cue");
    assert(cues[0].text === "Hello world\nThis is a second line", "multi-line text is preserved");
});

run("VttParser.parse(): skips NOTE blocks", () => {
    const subtitle = VttParser.parse(withNoteVtt);
    const cues = subtitle.getCues();

    assert(cues.length === 1, "NOTE block is skipped");
    assert(cues[0].text === "Hello world", "cue text is correct");
});

run("VttParser.parse(): millisecond precision", () => {
    const vtt = `WEBVTT\n\n1\n00:00:01.500 --> 00:00:02.750\nTest`;
    const cues = VttParser.parse(vtt).getCues();

    assert(cues[0].start === 1.5, "start parses milliseconds correctly");
    assert(cues[0].end === 2.75, "end parses milliseconds correctly");
});

run("VttParser.parse(): short MM:SS.mmm timestamp form", () => {
    const subtitle = VttParser.parse(shortTimestampVtt);
    const cues = subtitle.getCues();

    assert(cues.length === 1, "parses one cue");
    assert(cues[0].start === 1, "short timestamp start is 1s");
    assert(cues[0].end === 4, "short timestamp end is 4s");
});

run("VttParser.parse(): cue settings on timestamp line are ignored", () => {
    const subtitle = VttParser.parse(cueSettingsVtt);
    const cues = subtitle.getCues();

    assert(cues.length === 1, "parses one cue despite cue settings");
    assert(cues[0].start === 1, "start is correct");
    assert(cues[0].end === 4, "end is correct");
    assert(cues[0].text === "Hello world", "text is correct");
});

// VttParser.parseBlock()
run("VttParser.parseBlock(): valid block returns Cue", () => {
    const block = `1\n00:00:01.000 --> 00:00:04.000\nHello world`;
    const cue = VttParser.parseBlock(block);

    assert(cue !== null, "returns a cue");
    assert(cue!.id === 1, "cue id is 1");
    assert(cue!.start === 1, "cue start is 1s");
    assert(cue!.end === 4, "cue end is 4s");
    assert(cue!.text === "Hello world", "cue text is correct");
});

run("VttParser.parseBlock(): block without id returns id 0", () => {
    const block = `00:00:01.000 --> 00:00:04.000\nHello world`;
    const cue = VttParser.parseBlock(block);

    assert(cue !== null, "returns a cue");
    assert(cue!.id === 0, "cue id falls back to 0");
    assert(cue!.text === "Hello world", "cue text is correct");
});

run("VttParser.parseBlock(): WEBVTT header block returns null", () => {
    const cue = VttParser.parseBlock("WEBVTT");

    assert(cue === null, "returns null for WEBVTT header");
});

run("VttParser.parseBlock(): NOTE block returns null", () => {
    const cue = VttParser.parseBlock("NOTE This is a comment");

    assert(cue === null, "returns null for NOTE block");
});

run("VttParser.parseBlock(): block without timestamp arrow returns null", () => {
    const cue = VttParser.parseBlock("1\nHello world");

    assert(cue === null, "returns null for block without timestamp");
});

run("VttParser.parseBlock(): too few lines returns null", () => {
    const cue = VttParser.parseBlock("1");

    assert(cue === null, "returns null for single-line block");
});

// VttFormatter
run("VttFormatter.format(): starts with WEBVTT header", () => {
    const subtitle = VttParser.parse(basicVtt);
    const output = VttFormatter.format(subtitle);

    assert(output.startsWith("WEBVTT"), "output starts with WEBVTT header");
});

run("VttFormatter.format(): timestamps use dot separator", () => {
    const subtitle = VttParser.parse(basicVtt);
    const output = VttFormatter.format(subtitle);

    assert(output.includes("00:00:01.000 --> 00:00:04.000"), "first timestamp uses dot separator");
    assert(output.includes("00:00:05.500 --> 00:00:08.000"), "second timestamp uses dot separator");
});

run("VttFormatter.format(): includes cue text", () => {
    const subtitle = VttParser.parse(basicVtt);
    const output = VttFormatter.format(subtitle);

    assert(output.includes("Hello world"), "includes first cue text");
    assert(output.includes("Welcome to my video"), "includes second cue text");
});

// VttStreamParser
run("VttStreamParser: emits cues via callback", () => {
    const collected: Cue[] = [];
    const parser = new VttStreamParser(cue => collected.push(cue));

    for (const line of basicVtt.split("\n")) {
        parser.push(line);
    }
    parser.flush();

    assert(collected.length === 2, "emits two cues");
    assert(collected[0].id === 1, "first cue has id 1");
    assert(collected[0].start === 1, "first cue start is 1s");
    assert(collected[0].end === 4, "first cue end is 4s");
    assert(collected[0].text === "Hello world", "first cue text is correct");
    assert(collected[1].id === 2, "second cue has id 2");
});

run("VttStreamParser: skips WEBVTT header and NOTE blocks", () => {
    const collected: Cue[] = [];
    const parser = new VttStreamParser(cue => collected.push(cue));

    for (const line of withNoteVtt.split("\n")) {
        parser.push(line);
    }
    parser.flush();

    assert(collected.length === 1, "header and NOTE block are skipped");
    assert(collected[0].text === "Hello world", "cue text is correct");
});

run("VttStreamParser: push() is chainable", () => {
    const collected: Cue[] = [];
    const parser = new VttStreamParser(cue => collected.push(cue));

    const lines = singleCueVtt.split("\n");
    lines.reduce((p, line) => p.push(line), parser);
    parser.flush();

    assert(collected.length === 1, "chained push emits one cue");
    assert(collected[0].text === "Only one cue", "cue text is correct");
});

run("VttStreamParser: flush() emits last cue without trailing blank line", () => {
    const collected: Cue[] = [];
    const parser = new VttStreamParser(cue => collected.push(cue));

    parser.push("1").push("00:00:01.000 --> 00:00:04.000").push("Hello world");
    parser.flush();

    assert(collected.length === 1, "flush emits buffered cue");
    assert(collected[0].text === "Hello world", "flushed cue text is correct");
});

// Round-trip
run("Round-trip: parse → format → parse produces same cues", () => {
    const original = VttParser.parse(basicVtt);
    const formatted = VttFormatter.format(original);
    const reparsed = VttParser.parse(formatted);

    const a = original.getCues();
    const b = reparsed.getCues();

    assert(a.length === b.length, "same number of cues after round-trip");
    for (let i = 0; i < a.length; i++) {
        assert(a[i].id === b[i].id, `cue ${i + 1} id matches`);
        assert(a[i].start === b[i].start, `cue ${i + 1} start matches`);
        assert(a[i].end === b[i].end, `cue ${i + 1} end matches`);
        assert(a[i].text === b[i].text, `cue ${i + 1} text matches`);
    }
});

console.log("\nAll tests passed.");
