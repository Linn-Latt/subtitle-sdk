import { SrtParser } from "../src/index.js";

const srt = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:05,500 --> 00:00:08,000
Welcome to my video`;

const subtitle = SrtParser.parse(srt);
console.log(subtitle.getCues());