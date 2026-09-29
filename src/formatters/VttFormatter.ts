import type { Subtitle } from "../subtitle/Subtitle.js";
import type { Cue } from "../models/Cue.js";

export class VttFormatter {
    static format(subtitle: Subtitle): string {
        const blocks = subtitle.getCues().map(cue => this.formatCue(cue));
        return ["WEBVTT", "", ...blocks].join("\n");
    }

    private static formatCue(cue: Cue): string {
        const start = this.formatTimestamp(cue.start);
        const end = this.formatTimestamp(cue.end);
        return `${cue.id}\n${start} --> ${end}\n${cue.text}`;
    }

    private static formatTimestamp(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.round((seconds % 1) * 1000);

        return [
            String(h).padStart(2, "0"),
            String(m).padStart(2, "0"),
            String(s).padStart(2, "0"),
        ].join(":") + "." + String(ms).padStart(3, "0");
    }
}