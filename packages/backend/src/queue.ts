
import { Queue } from 'bullmq';

export const fileProcessingQueue = new Queue('file-processing', {
  connection: {
    host: 'localhost',
    port: 6379
  }
});
