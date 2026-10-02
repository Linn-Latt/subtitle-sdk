import { Subtitle } from "../subtitle/Subtitle.js";
import type { Cue } from "../models/Cue.js";

export class VttParser {
    static parse(vttText: string): Subtitle {
        const blocks = vttText.trim().split(/\r?\n\r?\n/);
        const cues: Cue[] = [];

        for (const block of blocks) {
            const lines = block.split(/\r?\n/);

            // Skip the WEBVTT header block and NOTE blocks
            if (lines[0].startsWith("WEBVTT") || lines[0].startsWith("NOTE")) {
                continue;
            }

            // Skip blocks that don't contain a timestamp arrow
            if (!lines.some(line => line.includes(" --> "))) {
                continue;
            }

            const id = Number(lines[0]);
            const timeLine = lines[1];
            const [startTime, endTime] = timeLine.split(" --> ");
            const start = this.parseTimestamp(startTime);
            const end = this.parseTimestamp(endTime);

            const text = lines.slice(2).join("\n");
            cues.push({ id, start, end, text });
        }

        return new Subtitle(cues);
    }

    private static parseTimestamp(timestamp: string): number {
        const [hours, minutes, secondsMilliseconds] = timestamp.split(":");
        const [seconds, milliseconds] = secondsMilliseconds.split(".");

        return (
            Number(hours) * 3600 +
            Number(minutes) * 60 +
            Number(seconds) +
            Number(milliseconds) / 1000
        );
    }
}
