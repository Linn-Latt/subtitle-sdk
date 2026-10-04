import { Subtitle } from "../subtitle/Subtitle.js";
import type { Cue } from "../models/Cue.js";

export class TxtParser {
    static parse(txtText: string): Subtitle {
        const cues: Cue[] = txtText
            .split(/\r?\n/)
            .filter(line => line.trim() !== "")
            .map((line, index) => ({
                id: index + 1,
                start: 0,
                end: 0,
                text: line.trim(),
            }));

        return new Subtitle(cues);
    }
}
