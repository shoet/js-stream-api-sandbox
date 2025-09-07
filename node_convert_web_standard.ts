import { Readable } from "stream";

const nodeToWeb = (nodeStream: Readable) => {
  return Readable.toWeb(nodeStream);
};

const webToNode = (webStream: ReadableStream) => {
  return Readable.fromWeb(webStream as any);
};
