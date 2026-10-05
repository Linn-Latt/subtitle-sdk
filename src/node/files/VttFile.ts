import { readFile, writeFile } from "node:fs/promises";
import { VttParser } from "../../core/index.js";
import { VttFormatter } from "../../core/index.js";
import type { Subtitle } from "../../core/index.js";

export async function readVttFile(path: string): Promise<Subtitle> {
    const text = await readFile(path, "utf8");
    return VttParser.parse(text);
}

export async function writeVttFile(path: string, subtitle: Subtitle): Promise<void> {
    const text = VttFormatter.format(subtitle);
    await writeFile(path, text, "utf8");
}