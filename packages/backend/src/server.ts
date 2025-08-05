

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import mammoth from 'mammoth';
import unzipper from 'unzipper';
import { parseStringPromise } from 'xml2js';

const execAsync = promisify(exec);

const app = express();
app.use(cors());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
      'text/plain',
      'application/vnd.ms-powerpoint'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type.'));
    }
  }
});



import { fileProcessingQueue } from './queue';

app.get('/jobs', async (req, res) => {
  const jobs = await fileProcessingQueue.getJobs(['completed', 'failed', 'active', 'waiting']);
  res.json(jobs);
});

app.get('/job/:id', async (req, res) => {
  const job = await fileProcessingQueue.getJob(req.params.id);
  if (job) {
    res.json({
      id: job.id,
      progress: job.progress,
      result: job.returnvalue,
      failedReason: job.failedReason
    });
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

app.post('/upload', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files uploaded.');
  }

  const files = req.files as Express.Multer.File[];
  const jobIds = [];

  for (const file of files) {
    const job = await fileProcessingQueue.add('process-file', {
      filename: file.filename,
      path: file.path,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
    jobIds.push(job.id);
  }

  res.json({ message: 'Files uploaded and queued for processing.', jobIds });
});

export default app;
