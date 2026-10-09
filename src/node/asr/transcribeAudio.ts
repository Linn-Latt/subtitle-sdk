import { transcribe } from "./transcriber.js";
import { TranscriptionMapper } from "./ResponseMapper.js";
import type { Subtitle } from "../../core/index.js";

export interface TranscribeOptions {
    model?: string; 
}

export async function transcribeAudio(audioPath: string, apiKey: string, options: TranscribeOptions = {}): Promise<Subtitle> {
    const response = await transcribe(audioPath, apiKey, options.model);
    return TranscriptionMapper.toSubtitle(response);
}
