import type { Cue } from "../models/Cue.js";
import { SrtParser } from "./SrtParser.js";

export class SrtStreamParser {
    private buffer: string[] = [];
    private onCue: (cue: Cue) => void;

    constructor(onCue: (cue: Cue) => void) {
        this.onCue = onCue;
    }

    // Push one line from the SRT stream.
    push(line: string): this {
        if (line.trim() === "") {
            this.flushBuffer();
        } else {
            this.buffer.push(line);
        }

        return this;
    }

    // Flush the remaining buffered subtitle block
    flush(): void {
        this.flushBuffer();
    }

    // Convert the buffered lines into one SRT block and let SrtParser parse it.
    private flushBuffer(): void {
        if (this.buffer.length === 0) {
            return;
        }

        const blockText = this.buffer.join("\n");
        const cue = SrtParser.parseBlock(blockText);
        if (cue !== null) {
            this.onCue(cue);
        }

        this.buffer = [];
    }
}