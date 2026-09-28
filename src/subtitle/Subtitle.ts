import type { Cue } from "../models/Cue.js";

export class Subtitle {
    private cues: Cue[] = [];

    constructor(cues: Cue[] = []) {
        this.cues = cues;
    }

    getCues(): Cue[] {
        return this.cues;
    }
}