function createStream() {
  return new ReadableStream({
    start: async (controller) => {
      console.log("start");
      for (let i = 1; i <= 100; i++) {
        controller.enqueue(i);
      }
      controller.close(); // キューが終わったらstreamはcloseしておく
    },
    pull: (controller) => {
      console.log("pull");
    },
    cancel: (controller) => {
      console.log("cancel");
    },
  });
}

async function readReader(
  reader: ReadableStreamDefaultReader,
  readerName?: string,
) {
  const result = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    result.push(value);
  }
  console.log(`result - ${readerName}`, result);
}

// (async () => {
//   const stream = createStream();
//   const reader = stream.getReader();
//   try {
//     await readReader(reader, "readerA");
//   } catch (e) {
//     console.log("failed to read reader", e);
//   } finally {
//     reader.releaseLock(); // streamへの参照を解除 fdへの参照を必ずcloseするようなもの
//   }
//   // これはダメ。もう一度ReadableStreamから生成し直す必要がある
//   // const reader2 = stream.getReader();
//   // await readReader(reader2);
//
//   const stream2 = createStream();
//   const reader2 = stream2.getReader();
//   try {
//     await readReader(reader2, "readerB");
//   } catch (e) {
//     console.log("failed to read reader", e);
//   } finally {
//     reader.releaseLock();
//   }
// })();

// 並列に読み取る
(async () => {
  const stream = createStream();
  const reader = stream.getReader();

  await Promise.all([
    readReader(reader, "readerX"),
    readReader(reader, "readerY"),
    readReader(reader, "readerZ"),
  ]);
})();
