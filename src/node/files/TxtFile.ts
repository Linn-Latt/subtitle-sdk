import { readFile, writeFile } from "node:fs/promises";
import { TxtParser } from "../../core/index.js";
import { TxtFormatter } from "../../core/index.js";
import type { Subtitle } from "../../core/index.js";

export async function readTxtFile(path: string): Promise<Subtitle> {
    const text = await readFile(path, "utf8");
    return TxtParser.parse(text);
}

export async function writeTxtFile(path: string, subtitle: Subtitle): Promise<void> {
    const text = TxtFormatter.format(subtitle);
    await writeFile(path, text, "utf8");
}