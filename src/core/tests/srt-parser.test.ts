import { SrtParser, SrtStreamParser, SrtFormatter } from "../index.js";
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
const basicSrt = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:05,500 --> 00:00:08,000
Welcome to my video`;

const multiLineSrt = `1
00:00:01,000 --> 00:00:04,000
Hello world
This is a second line`;

const singleCueSrt = `1
00:00:00,000 --> 00:00:02,500
Only one cue`;

// SrtParser.parse()
run("SrtParser.parse () : basic parsing", () => {
    const subtitle = SrtParser.parse(basicSrt);
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

run("SrtParser.parse(): multi-line cue text", () => {
    const subtitle = SrtParser.parse(multiLineSrt);
    const cues = subtitle.getCues();

    assert(cues.length === 1, "parses one cue");
    assert(cues[0].text === "Hello world\nThis is a second line", "multi-line text is preserved");
});

run("SrtParser.parse(): millisecond precision", () => {
    const srt = `1\n00:00:01,500 --> 00:00:02,750\nTest`;
    const cues = SrtParser.parse(srt).getCues();

    assert(cues[0].start === 1.5, "start parses milliseconds correctly");
    assert(cues[0].end === 2.75, "end parses milliseconds correctly");
});

// SrtParser.parseBlock()
run("SrtParser.parseBlock(): valid block returns Cue", () => {
    const block = `1\n00:00:01,000 --> 00:00:04,000\nHello world`;
    const cue = SrtParser.parseBlock(block);

    assert(cue !== null, "returns a cue");
    assert(cue!.id === 1, "cue id is 1");
    assert(cue!.start === 1, "cue start is 1s");
    assert(cue!.end === 4, "cue end is 4s");
    assert(cue!.text === "Hello world", "cue text is correct");
});

run("SrtParser.parseBlock(): missing timestamp line returns null", () => {
    const block = `1\nHello world`;
    const cue = SrtParser.parseBlock(block);

    assert(cue === null, "returns null for block without timestamp");
});

run("SrtParser.parseBlock(): non-numeric id returns null", () => {
    const block = `NOTE\n00:00:01,000 --> 00:00:04,000\nHello world`;
    const cue = SrtParser.parseBlock(block);

    assert(cue === null, "returns null for non-numeric id");
});

run("SrtParser.parseBlock(): too few lines returns null", () => {
    const block = `1\n00:00:01,000 --> 00:00:04,000`;
    const cue = SrtParser.parseBlock(block);

    assert(cue === null, "returns null for block with fewer than 3 lines");
});

// SrtFormatter
run("SrtFormatter.format(): basic formatting", () => {
    const subtitle = SrtParser.parse(basicSrt);
    const output = SrtFormatter.format(subtitle);

    assert(output.includes("00:00:01,000 --> 00:00:04,000"), "formats first timestamp correctly");
    assert(output.includes("00:00:05,500 --> 00:00:08,000"), "formats second timestamp correctly");
    assert(output.includes("Hello world"), "includes first cue text");
    assert(output.includes("Welcome to my video"), "includes second cue text");
});

run("SrtFormatter.format(): block structure", () => {
    const subtitle = SrtParser.parse(basicSrt);
    const output = SrtFormatter.format(subtitle);
    const blocks = output.trim().split(/\r?\n\r?\n/);

    assert(blocks.length === 2, "output has two blocks");
    assert(blocks[0].startsWith("1\n"), "first block starts with id 1");
    assert(blocks[1].startsWith("2\n"), "second block starts with id 2");
});

// SrtStreamParser
run("SrtStreamParser: emits cues via callback", () => {
    const collected: Cue[] = [];
    const parser = new SrtStreamParser(cue => collected.push(cue));

    for (const line of basicSrt.split("\n")) {
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

run("SrtStreamParser: push() is chainable", () => {
    const collected: Cue[] = [];
    const parser = new SrtStreamParser(cue => collected.push(cue));

    const lines = singleCueSrt.split("\n");
    lines.reduce((p, line) => p.push(line), parser);
    parser.flush();

    assert(collected.length === 1, "chained push emits one cue");
    assert(collected[0].text === "Only one cue", "cue text is correct");
});

run("SrtStreamParser: flush() emits last cue without trailing blank line", () => {
    const collected: Cue[] = [];
    const parser = new SrtStreamParser(cue => collected.push(cue));

    // Feed a single block with no trailing newline
    parser.push("1").push("00:00:01,000 --> 00:00:04,000").push("Hello world");
    parser.flush();

    assert(collected.length === 1, "flush emits buffered cue");
    assert(collected[0].text === "Hello world", "flushed cue text is correct");
});

run("SrtStreamParser: skips malformed blocks", () => {
    const collected: Cue[] = [];
    const parser = new SrtStreamParser(cue => collected.push(cue));

    parser.push("garbage line").push("").push("1").push("00:00:01,000 --> 00:00:04,000").push("Valid cue");
    parser.flush();

    assert(collected.length === 1, "malformed block is skipped, valid cue is emitted");
    assert(collected[0].text === "Valid cue", "valid cue text is correct");
});

// Round-trip
run("Round-trip: parse → format → parse produces same cues", () => {
    const original = SrtParser.parse(basicSrt);
    const formatted = SrtFormatter.format(original);
    const reparsed = SrtParser.parse(formatted);

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

// Subtitle mutation methods (via SrtParser as the entry point)
run("Subtitle.shift(): moves all cue timings", () => {
    const subtitle = SrtParser.parse(basicSrt);
    subtitle.shift(10);
    const cues = subtitle.getCues();

    assert(cues[0].start === 11, "first cue start shifted by 10s");
    assert(cues[0].end === 14, "first cue end shifted by 10s");
    assert(cues[1].start === 15.5, "second cue start shifted by 10s");
});

run("Subtitle.replaceText(): replaces text across all cues", () => {
    const subtitle = SrtParser.parse(basicSrt);
    subtitle.replaceText("world", "there");
    const cues = subtitle.getCues();

    assert(cues[0].text === "Hello there", "text was replaced");
    assert(cues[1].text === "Welcome to my video", "unmatched cue is unchanged");
});

run("Subtitle.updateCue(): updates a cue by id", () => {
    const subtitle = SrtParser.parse(basicSrt);
    subtitle.updateCue(1, { text: "Updated text" });
    const cue = subtitle.getCue(1);

    assert(cue?.text === "Updated text", "cue text was updated");
});

run("Subtitle.removeCue(): removes a cue by id", () => {
    const subtitle = SrtParser.parse(basicSrt);
    subtitle.removeCue(1);
    const cues = subtitle.getCues();

    assert(cues.length === 1, "one cue remains after removal");
    assert(cues[0].id === 2, "remaining cue has id 2");
});

run("Subtitle.mergeCues(): merges two cues into one", () => {
    const subtitle = SrtParser.parse(basicSrt);
    subtitle.mergeCues([1, 2]);
    const cues = subtitle.getCues();

    assert(cues.length === 1, "two cues merged into one");
    assert(cues[0].start === 1, "merged cue starts at first cue start");
    assert(cues[0].end === 8, "merged cue ends at last cue end");
    assert(cues[0].text === "Hello world Welcome to my video", "merged text is joined");
});

run("Subtitle.splitCue(): splits one cue into two", () => {
    const subtitle = SrtParser.parse(basicSrt);
    subtitle.splitCue(1, 2.5);
    const cues = subtitle.getCues();

    assert(cues.length === 3, "split produces an extra cue");
    const first = cues.find(c => c.id === 1)!;
    assert(first.end === 2.5, "original cue ends at split time");
    assert(first.start === 1, "original cue start is unchanged");
});

console.log("\nAll tests passed.");