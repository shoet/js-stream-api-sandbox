let cnt = 0;
const producer = new ReadableStream({
  async pull(controller) {
    if (cnt >= 100) {
      controller.close();
      return;
    }
    controller.enqueue("hoge");
    await new Promise((res) => setTimeout(res, 1000));
  },
});

const [streamA, streamB] = producer.tee();

const readerA = streamA
  .pipeThrough(
    new TransformStream<string>({
      transform: (chunk, controller) => {
        controller.enqueue(chunk.toUpperCase());
      },
    }),
  )
  .getReader();
const readerB = streamB
  .pipeThrough(
    new TransformStream<string, number>({
      transform: (chunk, controller) => {
        controller.enqueue(chunk.length);
      },
    }),
  )
  .getReader();

while (true) {
  const [resultA, resultB] = await Promise.all([
    readerA.read(),
    readerB.read(),
  ]);

  if (resultA.done || resultB.done) {
    break;
  }

  console.log("Upper", resultA.value);
  console.log("Length", resultB.value);
}
