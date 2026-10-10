import { SrtParser } from "../parsers/SrtParser.js";
import { VttParser } from "../parsers/VttParser.js";
import { SrtFormatter } from "../formatters/SrtFormatter.js";
import { VttFormatter } from "../formatters/VttFormatter.js";
import type { Subtitle } from "../subtitle/Subtitle.js";

/**
 * Utility for converting subtitle text between SRT and VTT formats.
 *
 * @example
 * // SRT → VTT
 * const vttText = SubtitleConverter.srtToVtt(rawSrt);
 *
 * // VTT → SRT
 * const srtText = SubtitleConverter.vttToSrt(rawVtt);
 *
 * // Work with the intermediate Subtitle object
 * const subtitle = SubtitleConverter.fromSrt(rawSrt);
 * subtitle.shift(2); // adjust timing
 * const vttText = SubtitleConverter.toVtt(subtitle);
 */
export class SubtitleConverter {
    // Parse helpers
    // Parse an SRT string into a `Subtitle`
    static fromSrt(srtText: string): Subtitle {
        return SrtParser.parse(srtText);
    }
    // Parse a VTT string into a `Subtitle`
    static fromVtt(vttText: string): Subtitle {
        return VttParser.parse(vttText);
    }

    // Format helpers 
    // Serialize a `Subtitle` to SRT format.
    static toSrt(subtitle: Subtitle): string {
        return SrtFormatter.format(subtitle);
    }
    // Serialize a `Subtitle` to VTT format. 
    static toVtt(subtitle: Subtitle): string {
        return VttFormatter.format(subtitle);
    }

    // Convert an SRT string directly to VTT
    static srtToVtt(srtText: string): string {
        return VttFormatter.format(SrtParser.parse(srtText));
    }
    // Convert a VTT string directly to SRT
    static vttToSrt(vttText: string): string {
        return SrtFormatter.format(VttParser.parse(vttText));
    }
}
