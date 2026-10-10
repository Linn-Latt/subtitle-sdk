import { SubtitleConverter, SrtParser, VttParser } from "../index.js";

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

const basicVtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Hello world

2
00:00:05.500 --> 00:00:08.000
Welcome to my video`;

// SubtitleConverter.fromSrt()
run("SubtitleConverter.fromSrt(): parses SRT into a Subtitle", () => {
    const subtitle = SubtitleConverter.fromSrt(basicSrt);
    const cues = subtitle.getCues();

    assert(cues.length === 2, "parses two cues");
    assert(cues[0].id === 1, "first cue id is 1");
    assert(cues[0].start === 1, "first cue start is 1s");
    assert(cues[0].end === 4, "first cue end is 4s");
    assert(cues[0].text === "Hello world", "first cue text is correct");
});

// SubtitleConverter.fromVtt()
run("SubtitleConverter.fromVtt(): parses VTT into a Subtitle", () => {
    const subtitle = SubtitleConverter.fromVtt(basicVtt);
    const cues = subtitle.getCues();

    assert(cues.length === 2, "parses two cues");
    assert(cues[0].id === 1, "first cue id is 1");
    assert(cues[0].start === 1, "first cue start is 1s");
    assert(cues[0].end === 4, "first cue end is 4s");
    assert(cues[0].text === "Hello world", "first cue text is correct");
});

// SubtitleConverter.toSrt()
run("SubtitleConverter.toSrt(): serializes a Subtitle to SRT", () => {
    const subtitle = VttParser.parse(basicVtt);
    const output = SubtitleConverter.toSrt(subtitle);

    assert(output.includes("00:00:01,000 --> 00:00:04,000"), "timestamp uses comma separator");
    assert(output.includes("Hello world"), "includes first cue text");
    assert(output.includes("Welcome to my video"), "includes second cue text");
    assert(!output.includes("WEBVTT"), "output does not contain VTT header");
});

// SubtitleConverter.toVtt()
run("SubtitleConverter.toVtt(): serializes a Subtitle to VTT", () => {
    const subtitle = SrtParser.parse(basicSrt);
    const output = SubtitleConverter.toVtt(subtitle);

    assert(output.startsWith("WEBVTT"), "output starts with WEBVTT header");
    assert(output.includes("00:00:01.000 --> 00:00:04.000"), "timestamp uses dot separator");
    assert(output.includes("Hello world"), "includes first cue text");
    assert(output.includes("Welcome to my video"), "includes second cue text");
});

// SubtitleConverter.srtToVtt()
run("SubtitleConverter.srtToVtt(): converts SRT string directly to VTT string", () => {
    const output = SubtitleConverter.srtToVtt(basicSrt);

    assert(output.startsWith("WEBVTT"), "output starts with WEBVTT header");
    assert(output.includes("00:00:01.000 --> 00:00:04.000"), "first timestamp uses dot separator");
    assert(output.includes("00:00:05.500 --> 00:00:08.000"), "second timestamp uses dot separator");
    assert(output.includes("Hello world"), "includes first cue text");
    assert(output.includes("Welcome to my video"), "includes second cue text");
    assert(!output.includes(","), "no comma separators in output");
});

// SubtitleConverter.vttToSrt()
run("SubtitleConverter.vttToSrt(): converts VTT string directly to SRT string", () => {
    const output = SubtitleConverter.vttToSrt(basicVtt);

    assert(!output.includes("WEBVTT"), "output does not contain VTT header");
    assert(output.includes("00:00:01,000 --> 00:00:04,000"), "first timestamp uses comma separator");
    assert(output.includes("00:00:05,500 --> 00:00:08,000"), "second timestamp uses comma separator");
    assert(output.includes("Hello world"), "includes first cue text");
    assert(output.includes("Welcome to my video"), "includes second cue text");
    assert(!output.includes(".000 -->"), "no dot separators in output");
});

// Round-trips
run("Round-trip: SRT → VTT → SRT preserves cues", () => {
    const vtt = SubtitleConverter.srtToVtt(basicSrt);
    const backToSrt = SubtitleConverter.vttToSrt(vtt);
    const original = SrtParser.parse(basicSrt).getCues();
    const result = SrtParser.parse(backToSrt).getCues();

    assert(original.length === result.length, "same number of cues");
    for (let i = 0; i < original.length; i++) {
        assert(original[i].start === result[i].start, `cue ${i + 1} start matches`);
        assert(original[i].end === result[i].end, `cue ${i + 1} end matches`);
        assert(original[i].text === result[i].text, `cue ${i + 1} text matches`);
    }
});

run("Round-trip: VTT → SRT → VTT preserves cues", () => {
    const srt = SubtitleConverter.vttToSrt(basicVtt);
    const backToVtt = SubtitleConverter.srtToVtt(srt);
    const original = VttParser.parse(basicVtt).getCues();
    const result = VttParser.parse(backToVtt).getCues();

    assert(original.length === result.length, "same number of cues");
    for (let i = 0; i < original.length; i++) {
        assert(original[i].start === result[i].start, `cue ${i + 1} start matches`);
        assert(original[i].end === result[i].end, `cue ${i + 1} end matches`);
        assert(original[i].text === result[i].text, `cue ${i + 1} text matches`);
    }
});

// Parse → edit → convert workflow
run("Workflow: fromSrt() → shift() → toVtt() applies edits before converting", () => {
    const subtitle = SubtitleConverter.fromSrt(basicSrt);
    subtitle.shift(10);
    const output = SubtitleConverter.toVtt(subtitle);

    assert(output.includes("00:00:11.000 --> 00:00:14.000"), "first cue shifted by 10s in VTT output");
    assert(output.includes("00:00:15.500 --> 00:00:18.000"), "second cue shifted by 10s in VTT output");
});

run("Workflow: fromVtt() → replaceText() → toSrt() applies edits before converting", () => {
    const subtitle = SubtitleConverter.fromVtt(basicVtt);
    subtitle.replaceText("world", "there");
    const output = SubtitleConverter.toSrt(subtitle);

    assert(output.includes("Hello there"), "replaced text appears in SRT output");
    assert(!output.includes("Hello world"), "original text is gone");
});

console.log("\nAll tests passed.");
