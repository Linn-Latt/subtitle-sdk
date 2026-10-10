import { Subtitle } from "../../core/index.js";
import type { Cue } from "../../core/index.js";
import type { TranscriptionResponse } from "./transcriber.js";

// Maps the Groq verbose_json response segments into the SDK's Subtitle/Cue model
export class TranscriptionMapper {
    static toSubtitle(response: TranscriptionResponse): Subtitle {
        const cues: Cue[] = response.segments.map((seg, index) => ({
            id: index + 1,
            start: seg.start,
            end: seg.end,
            text: seg.text.trim(),
        }));

        return new Subtitle(cues);
    }
}
