let cnt = 0;
const randomErrorStream = new ReadableStream({
  async pull(controller) {
    if (cnt >= 3) {
      controller.close();
      return;
    }
    if (Math.random() < 0.1) {
      controller.error(new Error("occured error"));
    } else {
      controller.enqueue("hoge");
    }
    cnt++;
    await new Promise((res) => setTimeout(res, 1000));
  },
  cancel: () => {
    console.log("cancel");
  },
});

const pipe = randomErrorStream.pipeThrough(
  new TransformStream<string>({
    transform: (chunk, controller) => {
      controller.enqueue(chunk.toUpperCase());
    },
  }),
);

const reader = pipe.getReader();

try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    console.log(value);
  }
} catch (e) {
  console.error("error", e);
} finally {
  reader.releaseLock();
}
