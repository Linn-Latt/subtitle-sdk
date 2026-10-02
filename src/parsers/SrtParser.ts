import { Subtitle } from "../subtitle/Subtitle.js";
import type { Cue } from "../models/Cue.js";
import { TimestampUtils } from "../utils/TimestampUtils.js";

export class SrtParser {
    static parse(srtText: string): Subtitle {
        const blocks = srtText.trim().split(/\r?\n\r?\n/);
        const cues: Cue[] = [];

        for (const block of blocks) {
            const lines = block.split(/\r?\n/);
            const id = Number(lines[0]);
            const timeLine = lines[1];
            const [startTime, endTime] = timeLine.split(" --> ");
            const start = TimestampUtils.parseSrt(startTime);
            const end = TimestampUtils.parseSrt(endTime);

            const text = lines.slice(2).join("\n");
            cues.push({id, start, end, text});
        }
        return new Subtitle(cues);
    }
}
