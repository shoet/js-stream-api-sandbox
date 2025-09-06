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
  const input = JSON.stringify({
    a: "1",
    b: "2",
    c: "3",
    d: "4",
  });
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(input);
      controller.close();
    },
  });

  const transformer = createTransoformStream(["a", "c", "d"]);
  const transformed = readable.pipeThrough(transformer);

  const reader = transformed.getReader();

  const { done, value } = await reader.read();
  console.log(value);
})();
