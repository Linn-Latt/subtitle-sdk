import { readFile, writeFile } from "node:fs/promises";
import { SrtParser } from "../../core/index.js";
import { SrtFormatter } from "../../core/index.js";
import type { Subtitle } from "../../core/index.js";

export async function readSrtFile(path: string): Promise<Subtitle> {
    const text = await readFile(path, "utf8");
    return SrtParser.parse(text);
}

export async function writeSrtFile(path: string, subtitle: Subtitle): Promise<void> {
    const text = SrtFormatter.format(subtitle);
    await writeFile(path, text, "utf8");
}