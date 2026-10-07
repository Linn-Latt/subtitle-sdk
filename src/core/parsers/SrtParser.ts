import { Subtitle } from "../subtitle/Subtitle.js";
import type { Cue } from "../models/Cue.js";
import { TimestampUtils } from "../utils/TimestampUtils.js";

export class SrtParser {
    static parse(srtText: string): Subtitle {
        const blocks = srtText.trim().split(/\r?\n\r?\n/);
        const cues: Cue[] = [];

        for (const block of blocks) {
            const cue = SrtParser.parseBlock(block);
            if (cue !== null) {
                cues.push(cue);
            }
        }
        return new Subtitle(cues);
    }

    static parseBlock(blockText: string): Cue | null {
        const lines = blockText.split(/\r?\n/);
        if (lines.length < 3) {
            return null;
        }

        const id = Number(lines[0]);
        if (Number.isNaN(id)) {
            return null;
        }

        const timeLine = lines[1];
        if (!timeLine.includes(" --> ")) {
            return null;
        }

        const [startTime, endTime] = timeLine.split(" --> ");
        if (!startTime || !endTime) {
            return null;
        }

        const start = TimestampUtils.parseSrt(startTime.trim());
        const end = TimestampUtils.parseSrt(endTime.trim());
        const text = lines.slice(2).join("\n");
        return {
            id,
            start,
            end,
            text,
        };
    }
}
