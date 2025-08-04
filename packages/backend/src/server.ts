

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

async function extractTextPDF(pdfPath: string, outputDir: string): Promise<string[]> {
  const textFile = path.join(outputDir, 'raw_text.txt');
  await execAsync(`pdftotext -q -layout -nopgbrk "${pdfPath}" "${textFile}"`);
  const raw = fs.readFileSync(textFile, 'utf-8');
  return raw.split(/\f/).map((p) => p.trim());
}

async function extractImagesPDF(pdfPath: string, outputDir: string): Promise<string[]> {
  await execAsync(
    `pdftoppm -q -png -rx 100 -ry 100 "${pdfPath}" "${path.join(
      outputDir,
      'page'
    )}"`
  );
  return fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith('.png'))
    .map((f) => path.join(outputDir, f))
    .sort();
}

async function extractTextDOCX(docxPath: string): Promise<string> {
  const buffer = fs.readFileSync(docxPath);
  const { value } = await mammoth.extractRawText({ buffer });
  return value.trim();
}

async function extractImagesDOCX(docxPath: string, outputDir: string): Promise<string[]> {
  const archive = await unzipper.Open.file(docxPath);
  const mediaFiles = archive.files.filter((f) =>
    f.path.startsWith('word/media/')
  );
  return Promise.all(
    mediaFiles.map(async (file, i) => {
      const ext = path.extname(file.path);
      const outPath = path.join(outputDir, `doc-img-${i + 1}${ext}`);
      const content = await file.buffer();
      fs.writeFileSync(outPath, content);
      return outPath;
    })
  );
}

async function extractTextSlidesPPTX(
  archive: unzipper.CentralDirectory
): Promise<string[]> {
  const slides = archive.files
    .filter((f) => f.path.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => a.path.localeCompare(b.path));
  return Promise.all(
    slides.map(async (slide) => {
      const content = await slide.buffer();
      const parsed = await parseStringPromise(content.toString());
      const shapes =
        parsed['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0]?.['p:sp'] || [];
      return shapes
        .map((shape: any) => {
          const ps = shape['p:txBody']?.[0]?.['a:p'] || [];
          return ps
            .map((p: any) =>
              (p['a:r'] || []).map((r: any) => r['a:t']?.[0] || '').join('')
            )
            .join('\n');
        })
        .join('\n')
        .trim();
    })
  );
}

async function extractImagesPPTX(
  archive: unzipper.CentralDirectory,
  outputDir: string
): Promise<string[]> {
  const mediaFiles = archive.files.filter((f) =>
    f.path.startsWith('ppt/media/')
  );
  const imagePaths = await Promise.all(
    mediaFiles.map(async (file, i) => {
      const ext = path.extname(file.path);
      const outPath = path.join(outputDir, `slide-${i + 1}${ext}`);
      const content = await file.buffer();
      fs.writeFileSync(outPath, content);
      return outPath;
    })
  );
  return imagePaths.sort();
}

app.post('/upload', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files uploaded.');
  }

  const files = req.files as Express.Multer.File[];
  const results = [];

  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext);
    const outputDir = `uploads/res_${base}`;
    fs.mkdirSync(outputDir, { recursive: true });

    const outputJSON: {
      text: string;
      image: string;
    }[] = [];

    try {
      if (ext === '.pdf') {
        const [texts, images] = await Promise.all([
          extractTextPDF(file.path, outputDir),
          extractImagesPDF(file.path, outputDir),
        ]);
        for (let i = 0; i < Math.max(texts.length, images.length); i++) {
          const imagePath = images[i] || '';
          outputJSON.push({
            text: texts[i] || '',
            image: imagePath,
          });
        }
      } else if (ext === '.docx') {
        const [text, images] = await Promise.all([
          extractTextDOCX(file.path),
          extractImagesDOCX(file.path, outputDir),
        ]);
        if (images.length === 0) {
          outputJSON.push({ text, image: '' });
        } else {
          for (const img of images) {
            outputJSON.push({
              text,
              image: img,
            });
          }
        }
      } else if (ext === '.pptx' || ext === '.ppt') {
        const archive = await unzipper.Open.file(file.path);
        const [texts, images] = await Promise.all([
          extractTextSlidesPPTX(archive),
          extractImagesPPTX(archive, outputDir),
        ]);
        for (let i = 0; i < Math.max(texts.length, images.length); i++) {
          const imagePath = images[i] || '';
          outputJSON.push({
            text: texts[i] || '',
            image: imagePath,
          });
        }
      } else if (ext === '.txt') {
        const text = fs.readFileSync(file.path, 'utf-8');
        outputJSON.push({ text, image: '' });
      }

      results.push({
        filename: file.originalname,
        outputDir,
        data: outputJSON,
      });
    } catch (error) {
      console.error(error);
      results.push({
        filename: file.originalname,
        error: 'Failed to process file.',
      });
    }
  }

  res.json(results);
});

export default app;
