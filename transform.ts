const createTransoformStream = (allowdFields: string[]) => {
  return new TransformStream({
    start: (controller) => {
      console.log("start");
    },
    transform: (chunk, controller) => {
      const json = JSON.parse(chunk);

      const fields: any = {};
      for (const f of allowdFields) {
        if (f in json) {
          fields[f] = json[f];
        }
      }
      controller.enqueue(JSON.stringify(fields));
    },
  });
};

(async () => {
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(
        JSON.stringify({
          a: "1",
          b: "2",
          c: "3",
          d: "4",
        }),
      );
      controller.enqueue(
        JSON.stringify({
          c: "6",
          d: "4",
        }),
      );
      controller.close();
    },
  });

  const transformed = readable.pipeThrough(
    new TransformStream<string, string>({
      transform: (chunk, controller) => {
        const allowedFields = ["a", "c", "d"];
        const data: any = {};
        const json = JSON.parse(chunk);
        for (const f of allowedFields) {
          data[f] = json[f];
        }
        controller.enqueue(JSON.stringify(data));
      },
    }),
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
