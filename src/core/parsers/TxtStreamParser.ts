import type { Cue } from "../models/Cue.js";
import { TxtParser } from "./TxtParser.js";

export class TxtStreamParser {
    private id: number = 1;
    private onCue: (cue: Cue) => void;

    constructor(onCue: (cue: Cue) => void) {
        this.onCue = onCue;
    }

    // Push one line from the TXT stream.
    push(line: string): this {
        const cue = TxtParser.parseLine(line, this.id);
        if (cue !== null) {
            this.id++;
            this.onCue(cue);
        }

        return this;
    }

    // TXT has no blocks — every line is its own cue, nothing to flush.
    flush(): void {}
}
