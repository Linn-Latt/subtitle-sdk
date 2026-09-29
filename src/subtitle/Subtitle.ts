import type { Cue } from "../models/Cue.js";

export class Subtitle {
    private cues: Cue[] = [];

    constructor(cues: Cue[] = []) {
        this.cues = cues;
    }

    getCues(): Cue[] {
        return this.cues;
    }

    addCues(cue: Cue): void {
        this.cues.push(cue);
    }

    getCue(id: number): Cue | undefined {
        return this.cues.find(cue => cue.id === id);
    }

    updateCue(id: number, updates: Partial<Cue>): void {
        const cue = this.getCue(id);
        if (!cue) {
            throw new Error(`Cue with id ${id} not found`);
        }
        Object.assign(cue, updates);
    }

    removeCue(id: number): void {
        this.cues = this.cues.filter(cue => cue.id !== id);
    }
}