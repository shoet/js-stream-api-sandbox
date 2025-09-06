import * as fs from "fs";
import { WritableStream } from "stream/web";

const createUpperFileWriter = () => {
  const fileWriter = fs.createWriteStream("output.txt");
  return new WritableStream<string>({
    start: (controller) => {
      console.log("start");
    },
    write: async (chunk, controller) => {
      fileWriter.write(chunk.toUpperCase());
      // return new Promise((res, rej) => {
      //   fileWriter.write(chunk.toUpperCase(), (error) => {
      //     if (error) {
      //       rej(error);
      //     } else {
      //       res();
      //     }
      //   });
      // });
    },
    close: () => {
      fileWriter.close();
    },
    abort: () => {
      fileWriter.close();
    },
  });
};

(async () => {
  const stream = createUpperFileWriter();

  const writer = stream.getWriter();
  await writer.write(
    "hogeaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );
  await writer.write("fuga");
  await writer.write("abc");

  writer.close();
  writer.releaseLock();
})();
