export class TimestampUtils {
    static parseSrt(timestamp: string): number {
        return this.parse(timestamp, ",");
    }

    static parseVtt(timestamp: string): number {
        return this.parse(timestamp, ".");
    }

    static formatSrt(seconds: number): string {
        return this.format(seconds, ",");
    }

    static formatVtt(seconds: number): string {
        return this.format(seconds, ".");
    }

    private static parse(timestamp: string, separator: string): number {
        const [hours, minutes, secondsMilliseconds] = timestamp.split(":");
        const [seconds, milliseconds] = secondsMilliseconds.split(separator);

        return (
            Number(hours) * 3600 +
            Number(minutes) * 60 +
            Number(seconds) +
            Number(milliseconds) / 1000
        );
    }

    private static format(seconds: number, separator: string): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.round((seconds % 1) * 1000);

        return [
            String(h).padStart(2, "0"),
            String(m).padStart(2, "0"),
            String(s).padStart(2, "0"),
        ].join(":") + separator + String(ms).padStart(3, "0");
    }
}