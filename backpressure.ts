(async () => {
  let cnt = 0;
  let timer: NodeJS.Timeout;
  const readStream = new ReadableStream(
    {
      async start(controller) {
        timer = setInterval(() => {
          console.log("reader", controller.desiredSize);
          if (controller.desiredSize !== null && controller.desiredSize <= 0) {
            console.log("backpressure");
            return;
          }
          controller.enqueue("hoge");
          cnt++;
          if (cnt >= 1000) {
            controller.close();
            clearInterval(timer);
          }
        }, 500);
      },
      cancel: () => {
        clearInterval(timer);
      },
    },
    { highWaterMark: 5 },
  );

  const transformed = readStream.pipeThrough(
    new TransformStream<string>(
      {
        transform: async (chunk, controller) => {
          await new Promise((res) => setTimeout(res, 1000));
          console.log("transformer", controller.desiredSize);
          controller.enqueue(chunk.toUpperCase());
        },
      },
      { highWaterMark: 1 },
    ),
  );

  const reader = transformed.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    console.log(value);
  }
})();

// /**
//  * 開始後しばらくするとバックプレッシャーがかかりenqueueが停滞する
//  */
// let count = 0;
// const readStream = new ReadableStream(
//   {
//     // pullはバックプレッシャーでないときのみ呼び出される
//     async pull(controller) {
//       if (count >= 100) {
//         controller.close();
//         return;
//       }
//       console.log("enqueue");
//       controller.enqueue("hoge");
//       console.log(controller.desiredSize);
//       count++;
//       await new Promise((res) => setTimeout(res, 500)); // 500msおき
//     },
//   },
//   {
//     highWaterMark: 3,
//     size: (chunk) => chunk.length,
//   },
// );
//
// const transformed = readStream.pipeThrough(
//   new TransformStream<string>(
//     {
//       transform: async (chunk, controller) => {
//         await new Promise((res) => setTimeout(res, 1000)); // 1000msおき
//         controller.enqueue(chunk.toUpperCase());
//       },
//     },
//     {
//       highWaterMark: 1,
//     },
//   ),
// );
//
// const reader = transformed.getReader();
//
// while (true) {
//   const { done, value } = await reader.read();
//   if (done) {
//     break;
//   }
//   console.log(value);
// }
