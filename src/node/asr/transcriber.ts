import { readFile } from "node:fs/promises";

// Speech-to-text is powered by Groq's Whisper API 
// Endpoint: POST https://api.groq.com/openai/v1/audio/transcriptions

export interface TranscriptionSegment {
    id: number;
    start: number;  
    end: number;    
    text: string;
}

export interface TranscriptionResponse {
    task: string;
    language: string;
    duration: number;
    text: string;
    segments: TranscriptionSegment[];
}

export async function transcribe (audioPath: string, apiKey: string, model = "whisper-large-v3"): Promise<TranscriptionResponse> {
    const audioBuffer = await readFile(audioPath);
    const rawName = audioPath.split(/[\\/]/).pop() ?? "audio.mp3";
    const ext = rawName.split(".").pop()?.toLowerCase() ?? "mp3";
    const fileName = `audio.${ext}`;

    const form = new FormData();
    form.append("file", new Blob([audioBuffer]), fileName);
    form.append("model", model);
    form.append("response_format", "verbose_json"); // includes per-segment timestamps

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription API error ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<TranscriptionResponse>;
}