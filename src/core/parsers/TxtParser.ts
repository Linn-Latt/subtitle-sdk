import { Subtitle } from "../subtitle/Subtitle.js";
import type { Cue } from "../models/Cue.js";

export class TxtParser {
    static parse(txtText: string): Subtitle {
        const cues: Cue[] = [];
        let id = 1;

        for (const line of txtText.split(/\r?\n/)) {
            const cue = TxtParser.parseLine(line, id);
            if (cue !== null) {
                cues.push(cue);
                id++;
            }
        }

        return new Subtitle(cues);
    }

    static parseLine(line: string, id: number): Cue | null {
        const text = line.trim();
        if (text === "") {
            return null;
        }

        return { id, start: 0, end: 0, text };
    }
}
