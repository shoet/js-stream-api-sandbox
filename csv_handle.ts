import * as fs from "node:fs";
import { Readable } from "node:stream";
import { TransformStream } from "node:stream/web";

function createCSVParse() {
  let headers: string[] = [];
  let buffer = "";
  let obj: any = {};

  const transformer = new TransformStream({
    transform: (chunk, controller) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      for (const line of lines) {
        if (line.trim() === "") {
          continue;
        }
        if (headers.length === 0) {
          headers = line.split(",");
        } else {
          const row = line.split(",");
          for (let i = 0; i < headers.length; i++) {
            const k = headers[i];
            const v = row[i];
            if (!k || !v) {
              controller.error(`unmatch header: ${row}`);
              return;
            }
            obj[k] = v;
          }
          controller.enqueue(obj);
          obj = {};
        }
        buffer = lines[1] as string;
      }
    },
  });
  return transformer;
}

const nodeStream = fs.createReadStream("input.csv", {
  encoding: "utf-8",
  highWaterMark: 1024,
});
const parser = createCSVParse();
const reader = Readable.toWeb(nodeStream).pipeThrough(parser).getReader();

try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    console.log(value);
  }
} catch (e) {
  console.log("error", e);
  reader.releaseLock();
}
