import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { TxtStreamParser } from "../../core/index.js";
import type { Cue } from "../../core/index.js";

export async function* readTxtStream(path: string): AsyncGenerator<Cue> {
    const rl = createInterface({
        input: createReadStream(path, { encoding: "utf8" }),
        crlfDelay: Infinity,
    });

    const pending: Cue[] = [];
    const parser = new TxtStreamParser(cue => pending.push(cue));

    for await (const line of rl) {
        parser.push(line);
        while (pending.length > 0) yield pending.shift()!;
    }

    parser.flush();
    while (pending.length > 0) yield pending.shift()!;
}
