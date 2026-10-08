import { Subtitle } from "../subtitle/Subtitle.js";
import type { Cue } from "../models/Cue.js";
import { TimestampUtils } from "../utils/TimestampUtils.js";

export class VttParser {
    static parse(vttText: string): Subtitle {
        const blocks = vttText.trim().split(/\r?\n\r?\n/);
        const cues: Cue[] = [];

        for (const block of blocks) {
            const cue = VttParser.parseBlock(block);
            if (cue !== null) {
                cues.push(cue);
            }
        }
        return new Subtitle(cues);
    }

    static parseBlock(blockText: string): Cue | null {
        const lines = blockText.split(/\r?\n/);
        if (lines.length < 2) {
            return null;
        }

        // Skip the WEBVTT header block and NOTE / STYLE / REGION blocks
        const firstLine = lines[0].trim();
        if (firstLine.startsWith("WEBVTT") || firstLine.startsWith("NOTE") || firstLine.startsWith("STYLE") || firstLine.startsWith("REGION")) {
            return null;
        }

        // The cue identifier line is optional, so locate the timestamp arrow
        const timeLineIndex = lines.findIndex(line => line.includes(" --> "));
        if (timeLineIndex === -1 || timeLineIndex > 1) {
            return null;
        }

        const [startTime, endTime] = lines[timeLineIndex].split(" --> ");
        if (!startTime || !endTime) {
            return null;
        }

        // The end timestamp can be followed by cue settings, e.g. "align:start position:10%"
        const start = TimestampUtils.parseVtt(VttParser.normalizeTime(startTime.trim()));
        const end = TimestampUtils.parseVtt(VttParser.normalizeTime(endTime.trim().split(/\s+/)[0]));

        const text = lines.slice(timeLineIndex + 1).join("\n");
        return {
            id: VttParser.parseId(lines, timeLineIndex),
            start,
            end,
            text,
        };
    }

    // Cue identifiers are optional and may be non numeric, fall back to 0
    private static parseId(lines: string[], timeLineIndex: number): number {
        if (timeLineIndex === 0) {
            return 0;
        }

        const id = Number(lines[0]);
        return Number.isNaN(id) ? 0 : id;
    }

    // VTT allows the short timestamp form "MM:SS.mmm"
    private static normalizeTime(timestamp: string): string {
        return timestamp.split(":").length === 2 ? `00:${timestamp}` : timestamp;
    }
}
