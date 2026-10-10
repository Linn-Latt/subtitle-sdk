import { TxtParser, TxtStreamParser, TxtFormatter } from "../index.js";
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
const basicTxt = `Hello world
Welcome to my video
This is the third line`;

const withBlankLinesTxt = `Hello world

Welcome to my video`;

const singleLineTxt = `Only one line`;

// TxtParser.parse()
run("TxtParser.parse(): basic parsing", () => {
    const subtitle = TxtParser.parse(basicTxt);
    const cues = subtitle.getCues();

    assert(cues.length === 3, "parses three cues");
    assert(cues[0].id === 1, "first cue has id 1");
    assert(cues[0].text === "Hello world", "first cue text is correct");
    assert(cues[1].id === 2, "second cue has id 2");
    assert(cues[1].text === "Welcome to my video", "second cue text is correct");
    assert(cues[2].id === 3, "third cue has id 3");
    assert(cues[2].text === "This is the third line", "third cue text is correct");
});

run("TxtParser.parse(): all timestamps are zero", () => {
    const subtitle = TxtParser.parse(basicTxt);
    const cues = subtitle.getCues();

    cues.forEach((cue, i) => {
        assert(cue.start === 0, `cue ${i + 1} start is 0`);
        assert(cue.end === 0, `cue ${i + 1} end is 0`);
    });
});

run("TxtParser.parse(): skips blank lines", () => {
    const subtitle = TxtParser.parse(withBlankLinesTxt);
    const cues = subtitle.getCues();

    assert(cues.length === 2, "blank lines are skipped");
    assert(cues[0].text === "Hello world", "first cue text is correct");
    assert(cues[1].text === "Welcome to my video", "second cue text is correct");
});

run("TxtParser.parse(): ids are 1-based and sequential after blank lines", () => {
    const subtitle = TxtParser.parse(withBlankLinesTxt);
    const cues = subtitle.getCues();

    assert(cues[0].id === 1, "first cue id is 1");
    assert(cues[1].id === 2, "second cue id is 2 (blank line does not consume an id)");
});

run("TxtParser.parse(): single line", () => {
    const subtitle = TxtParser.parse(singleLineTxt);
    const cues = subtitle.getCues();

    assert(cues.length === 1, "parses one cue");
    assert(cues[0].id === 1, "cue has id 1");
    assert(cues[0].text === "Only one line", "cue text is correct");
});

// TxtParser.parseLine()
run("TxtParser.parseLine(): valid line returns Cue", () => {
    const cue = TxtParser.parseLine("Hello world", 1);

    assert(cue !== null, "returns a cue");
    assert(cue!.id === 1, "cue id matches supplied id");
    assert(cue!.start === 0, "cue start is 0");
    assert(cue!.end === 0, "cue end is 0");
    assert(cue!.text === "Hello world", "cue text is correct");
});

run("TxtParser.parseLine(): blank line returns null", () => {
    assert(TxtParser.parseLine("", 1) === null, "empty string returns null");
    assert(TxtParser.parseLine("   ", 1) === null, "whitespace-only line returns null");
});

run("TxtParser.parseLine(): trims surrounding whitespace", () => {
    const cue = TxtParser.parseLine("  Hello world  ", 1);

    assert(cue !== null, "returns a cue");
    assert(cue!.text === "Hello world", "text is trimmed");
});

// TxtFormatter
run("TxtFormatter.format(): basic formatting", () => {
    const subtitle = TxtParser.parse(basicTxt);
    const output = TxtFormatter.format(subtitle);

    assert(output.includes("Hello world"), "output includes first line");
    assert(output.includes("Welcome to my video"), "output includes second line");
    assert(output.includes("This is the third line"), "output includes third line");
});

run("TxtFormatter.format(): no timestamps or ids in output", () => {
    const subtitle = TxtParser.parse(basicTxt);
    const output = TxtFormatter.format(subtitle);

    assert(!output.includes("-->"), "output contains no timestamp arrows");
    assert(!/\d{2}:\d{2}:\d{2}/.test(output), "output contains no timestamp patterns");
});

run("TxtFormatter.format(): lines are newline-separated", () => {
    const subtitle = TxtParser.parse(basicTxt);
    const output = TxtFormatter.format(subtitle);
    const lines = output.trimEnd().split("\n");

    assert(lines.length === 3, "output has three lines");
    assert(lines[0] === "Hello world", "first line is correct");
    assert(lines[1] === "Welcome to my video", "second line is correct");
    assert(lines[2] === "This is the third line", "third line is correct");
});

// TxtStreamParser
run("TxtStreamParser: emits one cue per non-blank line", () => {
    const collected: Cue[] = [];
    const parser = new TxtStreamParser(cue => collected.push(cue));

    for (const line of basicTxt.split("\n")) {
        parser.push(line);
    }
    parser.flush();

    assert(collected.length === 3, "emits three cues");
    assert(collected[0].id === 1, "first cue has id 1");
    assert(collected[0].text === "Hello world", "first cue text is correct");
    assert(collected[1].id === 2, "second cue has id 2");
    assert(collected[2].id === 3, "third cue has id 3");
});

run("TxtStreamParser: skips blank lines", () => {
    const collected: Cue[] = [];
    const parser = new TxtStreamParser(cue => collected.push(cue));

    for (const line of withBlankLinesTxt.split("\n")) {
        parser.push(line);
    }
    parser.flush();

    assert(collected.length === 2, "blank lines produce no cues");
    assert(collected[0].id === 1, "first cue id is 1");
    assert(collected[1].id === 2, "second cue id is 2");
});

run("TxtStreamParser: push() is chainable", () => {
    const collected: Cue[] = [];
    const parser = new TxtStreamParser(cue => collected.push(cue));

    parser.push("Line one").push("Line two").push("Line three");
    parser.flush();

    assert(collected.length === 3, "chained push emits three cues");
});

run("TxtStreamParser: flush() is a no-op (no buffering in TXT)", () => {
    const collected: Cue[] = [];
    const parser = new TxtStreamParser(cue => collected.push(cue));

    parser.push("Hello world");
    // cue already emitted on push — flush should not double-emit
    parser.flush();

    assert(collected.length === 1, "flush does not emit duplicate cues");
});

// Round-trip
run("Round-trip: parse → format → parse produces same cues", () => {
    const original = TxtParser.parse(basicTxt);
    const formatted = TxtFormatter.format(original);
    const reparsed = TxtParser.parse(formatted);

    const a = original.getCues();
    const b = reparsed.getCues();

    assert(a.length === b.length, "same number of cues after round-trip");
    for (let i = 0; i < a.length; i++) {
        assert(a[i].id === b[i].id, `cue ${i + 1} id matches`);
        assert(a[i].text === b[i].text, `cue ${i + 1} text matches`);
    }
});

console.log("\nAll tests passed.");
