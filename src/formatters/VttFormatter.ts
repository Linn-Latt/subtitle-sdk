import type { Subtitle } from "../subtitle/Subtitle.js";
import type { Cue } from "../models/Cue.js";
import { TimestampUtils } from "../utils/TimestampUtils.js";

export class VttFormatter {
    static format(subtitle: Subtitle): string {
        const blocks = subtitle.getCues().map(cue => this.formatCue(cue));
        return ["WEBVTT", "", ...blocks].join("\n");
    }

    private static formatCue(cue: Cue): string {
        const start = TimestampUtils.formatVtt(cue.start);
        const end = TimestampUtils.formatVtt(cue.end);
        return `${cue.id}\n${start} --> ${end}\n${cue.text}`;
    }
}
