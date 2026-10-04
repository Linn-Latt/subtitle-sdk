import type { Subtitle } from "../subtitle/Subtitle.js";

export class TxtFormatter {
    static format(subtitle: Subtitle): string {
        return subtitle.getCues().map(cue => cue.text).join("\n") + "\n";
    }
}
