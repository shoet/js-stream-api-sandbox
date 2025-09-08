export function createJSONParser<T>() {
  let buffer = "";

  const tryParse = (str: string): T | undefined => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return undefined;
    }
  };

  const transformer = new TransformStream<string, T>({
    transform: (chunk, controller) => {
      buffer += chunk.toString();
      const parsed = tryParse(buffer);
      if (!parsed) {
        return;
      }
      buffer = "";
      controller.enqueue(parsed);
    },
    flush: (controller) => {
      if (buffer.trim()) {
        const parsed = tryParse(buffer);
        if (parsed) {
          controller.enqueue(parsed);
        }
      }
    },
  });
  return transformer;
}

function createSensorAggregator() {
  let nextTerm = 0;
  let buffer: SensorData[] = [];
  const termSec = 3;
  const transformer = new TransformStream<SensorData, SensorData>({
    transform: (chunk, controller) => {
      if (nextTerm === 0) {
        nextTerm = Date.now() + termSec * 1000;
      }
      if (chunk.timestamp * 1000 > nextTerm) {
        const agg = buffer.reduce(
          (prev, curr) => {
            return {
              temperature: prev.temperature + curr.temperature,
              humidity: prev.humidity + curr.humidity,
            };
          },
          { temperature: 0, humidity: 0 },
        );
        controller.enqueue({
          timestamp: Math.floor(nextTerm / 1000),
          temperature: Math.floor(agg.temperature / buffer.length),
          humidity: Math.floor(agg.humidity / buffer.length),
        });
        buffer = [];
        nextTerm = Date.now() + termSec * 1000;
        return;
      }
      buffer.push(chunk);
    },
  });
  return transformer;
}

type SensorData = {
  timestamp: number;
  temperature: number;
  humidity: number;
};
const parser = createJSONParser<SensorData>();

const writer = parser.writable.getWriter();

// aggregatorをpipe
const aggregator = createSensorAggregator();
const pipeline = parser.readable.pipeThrough(aggregator);

const reader = pipeline.getReader();

const startWrite = async () => {
  for (let i = 0; i < 100; i++) {
    const temperature = Math.floor(18 + Math.random() * (40 - 18 + 1));
    const humidity = Math.floor(30 + Math.random() * (100 - 30 + 1));
    const timestamp = Math.floor(Date.now() / 1000);
    writer.write(JSON.stringify({ timestamp, temperature, humidity }));
    await new Promise((res) => setTimeout(res, 1000));
  }
  writer.close();
};

const startRead = async () => {
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    console.log(value);
  }
};

await Promise.all([startWrite(), startRead()]);
