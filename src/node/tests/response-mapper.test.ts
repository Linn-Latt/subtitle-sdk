import { TranscriptionMapper } from "../asr/ResponseMapper.js";
import type { TranscriptionResponse } from "../asr/transcriber.js";

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
const basicResponse: TranscriptionResponse = {
    task: "transcribe",
    language: "english",
    duration: 8,
    text: "Hello world. Welcome to my video.",
    segments: [
        { id: 0, start: 1.0, end: 4.0, text: "Hello world." },
        { id: 1, start: 5.5, end: 8.0, text: "Welcome to my video." },
    ],
};

const singleSegmentResponse: TranscriptionResponse = {
    task: "transcribe",
    language: "english",
    duration: 3,
    text: "Only one segment.",
    segments: [
        { id: 0, start: 0.0, end: 3.0, text: "Only one segment." },
    ],
};

const emptyResponse: TranscriptionResponse = {
    task: "transcribe",
    language: "english",
    duration: 0,
    text: "",
    segments: [],
};

const whitespaceResponse: TranscriptionResponse = {
    task: "transcribe",
    language: "english",
    duration: 4,
    text: "Hello world.",
    segments: [
        { id: 0, start: 1.0, end: 4.0, text: "  Hello world.  " },
    ],
};

const multiSegmentResponse: TranscriptionResponse = {
    task: "transcribe",
    language: "english",
    duration: 15,
    text: "One. Two. Three.",
    segments: [
        { id: 0, start: 0.0,  end: 4.0,  text: "One." },
        { id: 1, start: 5.0,  end: 9.0,  text: "Two." },
        { id: 2, start: 10.0, end: 14.0, text: "Three." },
    ],
};

// TranscriptionMapper.toSubtitle()
run("TranscriptionMapper.toSubtitle(): basic mapping", () => {
    const subtitle = TranscriptionMapper.toSubtitle(basicResponse);
    const cues = subtitle.getCues();

    assert(cues.length === 2, "produces two cues from two segments");
    assert(cues[0].id === 1, "first cue id is 1 (1-based)");
    assert(cues[0].start === 1.0, "first cue start matches segment start");
    assert(cues[0].end === 4.0, "first cue end matches segment end");
    assert(cues[0].text === "Hello world.", "first cue text matches segment text");
    assert(cues[1].id === 2, "second cue id is 2");
    assert(cues[1].start === 5.5, "second cue start matches segment start");
    assert(cues[1].end === 8.0, "second cue end matches segment end");
    assert(cues[1].text === "Welcome to my video.", "second cue text matches segment text");
});

run("TranscriptionMapper.toSubtitle(): ids are 1-based regardless of segment id", () => {
    const subtitle = TranscriptionMapper.toSubtitle(multiSegmentResponse);
    const cues = subtitle.getCues();

    // Groq segment ids are 0-based; SDK cue ids must be 1-based
    assert(cues[0].id === 1, "first cue id is 1");
    assert(cues[1].id === 2, "second cue id is 2");
    assert(cues[2].id === 3, "third cue id is 3");
});

run("TranscriptionMapper.toSubtitle(): trims whitespace from segment text", () => {
    const subtitle = TranscriptionMapper.toSubtitle(whitespaceResponse);
    const cues = subtitle.getCues();

    assert(cues[0].text === "Hello world.", "leading and trailing whitespace is trimmed");
});

run("TranscriptionMapper.toSubtitle(): empty segments produce empty Subtitle", () => {
    const subtitle = TranscriptionMapper.toSubtitle(emptyResponse);
    const cues = subtitle.getCues();

    assert(cues.length === 0, "no cues produced from empty segments");
});

run("TranscriptionMapper.toSubtitle(): single segment", () => {
    const subtitle = TranscriptionMapper.toSubtitle(singleSegmentResponse);
    const cues = subtitle.getCues();

    assert(cues.length === 1, "one cue produced from one segment");
    assert(cues[0].id === 1, "cue id is 1");
    assert(cues[0].start === 0.0, "cue start is 0s");
    assert(cues[0].end === 3.0, "cue end is 3s");
    assert(cues[0].text === "Only one segment.", "cue text is correct");
});

run("TranscriptionMapper.toSubtitle(): millisecond precision is preserved", () => {
    const response: TranscriptionResponse = {
        task: "transcribe",
        language: "english",
        duration: 3,
        text: "Test.",
        segments: [{ id: 0, start: 1.5, end: 2.75, text: "Test." }],
    };

    const cues = TranscriptionMapper.toSubtitle(response).getCues();

    assert(cues[0].start === 1.5, "start preserves millisecond precision");
    assert(cues[0].end === 2.75, "end preserves millisecond precision");
});

run("TranscriptionMapper.toSubtitle(): returns a mutable Subtitle", () => {
    const subtitle = TranscriptionMapper.toSubtitle(basicResponse);

    // Verify the returned Subtitle supports standard editing methods
    subtitle.shift(5);
    const cues = subtitle.getCues();

    assert(cues[0].start === 6.0, "shift() works on mapped Subtitle — start updated");
    assert(cues[0].end === 9.0, "shift() works on mapped Subtitle — end updated");
});

run("TranscriptionMapper.toSubtitle(): multiple segments preserve order", () => {
    const subtitle = TranscriptionMapper.toSubtitle(multiSegmentResponse);
    const cues = subtitle.getCues();

    assert(cues.length === 3, "all three segments mapped");
    assert(cues[0].text === "One.", "first cue text correct");
    assert(cues[1].text === "Two.", "second cue text correct");
    assert(cues[2].text === "Three.", "third cue text correct");
    assert(cues[0].start < cues[1].start, "cues are in chronological order");
    assert(cues[1].start < cues[2].start, "cues are in chronological order");
});

console.log("\nAll tests passed.");
