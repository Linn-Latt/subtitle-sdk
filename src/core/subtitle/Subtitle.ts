import type { Cue } from "../models/Cue.js";

export class Subtitle {
    private cues: Cue[] = [];

    constructor(cues: Cue[] = []) {
        this.cues = cues;
    }

    getCues(): Cue[] {
        return this.cues;
    }

    addCues(...cues: Cue[]): void {
        this.cues.push(...cues);
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

    // Convenience Editing Methods
    // Move subtitle timings forward or backward
    shift(seconds: number): void {
        this.cues.forEach(cue => {
            cue.start += seconds;
            cue.end += seconds;
        });
    }

    // Combine two or more subtitle cues into one
    mergeCues(ids: number[]): void {
        if (ids.length < 2) {
            throw new Error("At least two cues are required to merge.");
        }

        const selectedCues = this.cues.filter(cue => ids.includes(cue.id));
        if (selectedCues.length !== ids.length) {
            throw new Error("One or more cues were not found.");
        }

        // Sort selected cues by start time
        selectedCues.sort((a, b) => a.start - b.start);
        const firstCue = selectedCues[0];
        const lastCue = selectedCues[selectedCues.length - 1];

        const mergedCue: Cue = {
            id: firstCue.id,
            start: firstCue.start,
            end: lastCue.end,
            text: selectedCues.map(cue => cue.text).join(" ")
        };

        // Remove original cues
        this.cues = this.cues.filter(cue => !ids.includes(cue.id));
        // Add merged cue
        this.cues.push(mergedCue);
        // Keep chronological order
        this.sortCues();
    }

    // Split one subtitle into multiple cues
    splitCue(id: number, splitTime: number): void {
        const cue = this.getCue(id);
        if (!cue) {
            throw new Error(`Cue with id ${id} not found`);
        }

        if (splitTime <= cue.start || splitTime >= cue.end) {
            throw new Error("Split time must be between cue start and end.");
        }

        const words = cue.text.trim().split(/\s+/);
        if (words.length < 2) {
            throw new Error("Cue text is too short to split.");
        }

        const middle = Math.ceil(words.length / 2);
        const firstText = words.slice(0, middle).join(" ");
        const secondText = words.slice(middle).join(" ");     
        
        const secondCue: Cue = {
            id: this.getNextId(),
            start: splitTime,
            end: cue.end,
            text: secondText
        };

        // Modify original cue
        cue.end = splitTime;
        cue.text = firstText;
        this.cues.push(secondCue);
        this.sortCues();
    }

    // Order cues by their start time
    sortCues(): void {
        this.cues.sort((a, b) => a.start - b.start);
    }

    // Find and replace text inside subtitles
    replaceText(search: string, replacement: string): void {
        this.cues.forEach(cue => {
            cue.text = cue.text.replaceAll(search, replacement);
        })
    }

    private getNextId(): number {
        if (this.cues.length === 0) {
            return 1;
        }
        return Math.max(...this.cues.map(cue => cue.id)) + 1;
    }
}