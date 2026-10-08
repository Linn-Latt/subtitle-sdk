import type { Cue } from "../models/Cue.js";
import { VttParser } from "./VttParser.js";

export class VttStreamParser {
    private buffer: string[] = [];
    private onCue: (cue: Cue) => void;

    constructor(onCue: (cue: Cue) => void) {
        this.onCue = onCue;
    }

    // Push one line from the VTT stream.
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

    // Convert the buffered lines into one VTT block and let VttParser parse it.
    private flushBuffer(): void {
        if (this.buffer.length === 0) {
            return;
        }

        const blockText = this.buffer.join("\n");
        const cue = VttParser.parseBlock(blockText);
        if (cue !== null) {
            this.onCue(cue);
        }

        this.buffer = [];
    }
}
