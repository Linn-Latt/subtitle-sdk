import { Subtitle } from "../../core/index.js";
import type { Cue } from "../../core/index.js";
import type { TranscriptionResponse } from "./transcriber.js";

// Maps the Groq verbose_json response segments into the SDK's Subtitle/Cue model
export class TranscriptionMapper {
    static toSubtitle(response: TranscriptionResponse): Subtitle {
        const subtitle = new Subtitle();

        response.segments.forEach((seg, index) => {
            const cue: Cue = {
                id: index + 1,       // 1-based, matches SRT/VTT convention
                start: seg.start,    // already in seconds - no conversion needed
                end: seg.end,
                text: seg.text.trim(),
            };
            subtitle.addCues(cue);
        });

        return subtitle;
    }
}