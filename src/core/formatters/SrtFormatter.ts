import type { Subtitle } from "../subtitle/Subtitle.js";
import type { Cue } from "../models/Cue.js";
import { TimestampUtils } from "../utils/TimestampUtils.js";

export class SrtFormatter {
    static format(subtitle: Subtitle): string {
        return subtitle.getCues().map(cue => this.formatCue(cue)).join("\n\n") + "\n";
    }

    private static formatCue(cue: Cue): string {
        const start = TimestampUtils.formatSrt(cue.start);
        const end = TimestampUtils.formatSrt(cue.end);
        return `${cue.id}\n${start} --> ${end}\n${cue.text}`;
    }
}
