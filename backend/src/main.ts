// import fs from "fs";
// import path from "path";
// import { execSync } from "child_process";
// import mammoth from "mammoth";
// import unzipper from "unzipper";
// import { parseStringPromise } from "xml2js";
//
// const inputFile = process.argv[2];
// if (!inputFile) {
//   console.error("Usage: ts-node src/main.ts <filename>");
//   process.exit(1);
// }
//
// const ext = path.extname(inputFile).toLowerCase();
// const base = path.basename(inputFile, ext);
// const outputDir = `res_${base}`;
// fs.mkdirSync(outputDir, { recursive: true });
//
// function extractTextPDF(pdfPath: string): string[] {
//   const textFile = path.join(outputDir, "raw_text.txt");
//   execSync(`pdftotext -layout -nopgbrk "${pdfPath}" "${textFile}"`);
//   const raw = fs.readFileSync(textFile, "utf-8");
//   return raw.split(/\f/).map((p) => p.trim());
// }
//
// function extractImagesPDF(pdfPath: string): string[] {
//   execSync(`pdftoppm -png "${pdfPath}" "${path.join(outputDir, "page")}"`);
//   return fs
//     .readdirSync(outputDir)
//     .filter((f) => f.endsWith(".png"))
//     .map((f) => path.join(outputDir, f))
//     .sort();
// }
//
// async function extractTextDOCX(docxPath: string): Promise<string> {
//   const buffer = fs.readFileSync(docxPath);
//   const { value } = await mammoth.extractRawText({ buffer });
//   return value.trim();
// }
//
// async function extractImagesDOCX(docxPath: string): Promise<string[]> {
//   const archive = await unzipper.Open.file(docxPath);
//   const mediaFiles = archive.files.filter((f) =>
//     f.path.startsWith("word/media/"),
//   );
//   const imagePaths: string[] = [];
//   let count = 0;
//   for (const file of mediaFiles) {
//     const ext = path.extname(file.path);
//     const outPath = path.join(outputDir, `doc-img-${++count}${ext}`);
//     const content = await file.buffer();
//     fs.writeFileSync(outPath, content);
//     imagePaths.push(outPath);
//   }
//   return imagePaths;
// }
//
// async function extractTextSlidesPPTX(
//   archive: unzipper.CentralDirectory,
// ): Promise<string[]> {
//   const slides = archive.files
//     .filter((f) => f.path.match(/^ppt\/slides\/slide\d+\.xml$/))
//     .sort((a, b) => a.path.localeCompare(b.path));
//   const texts: string[] = [];
//   for (const slide of slides) {
//     const content = await slide.buffer();
//     const parsed = await parseStringPromise(content.toString());
//     const shapes =
//       parsed["p:sld"]?.["p:cSld"]?.[0]?.["p:spTree"]?.[0]?.["p:sp"] || [];
//     const text = shapes
//       .map((shape: any) => {
//         const ps = shape["p:txBody"]?.[0]?.["a:p"] || [];
//         return ps
//           .map((p: any) =>
//             (p["a:r"] || []).map((r: any) => r["a:t"]?.[0] || "").join(""),
//           )
//           .join("\n");
//       })
//       .join("\n")
//       .trim();
//     texts.push(text);
//   }
//   return texts;
// }
//
// async function extractImagesPPTX(
//   archive: unzipper.CentralDirectory,
// ): Promise<string[]> {
//   const mediaFiles = archive.files.filter((f) =>
//     f.path.startsWith("ppt/media/"),
//   );
//   const imagePaths: string[] = [];
//   let count = 0;
//   for (const file of mediaFiles) {
//     const ext = path.extname(file.path);
//     const outPath = path.join(outputDir, `slide-${++count}${ext}`);
//     const content = await file.buffer();
//     fs.writeFileSync(outPath, content);
//     imagePaths.push(outPath);
//   }
//   return imagePaths.sort();
// }
//
// async function extract(inputFile: string, ext: string): Promise<void> {
//   const outputJSON: { text: string; image: string }[] = [];
//
//   if (ext === ".pdf") {
//     const texts = extractTextPDF(inputFile);
//     const images = extractImagesPDF(inputFile);
//     for (let i = 0; i < Math.max(texts.length, images.length); i++) {
//       outputJSON.push({ text: texts[i] || "", image: images[i] || "" });
//     }
//   } else if (ext === ".docx") {
//     const text = await extractTextDOCX(inputFile);
//     const images = await extractImagesDOCX(inputFile);
//     if (images.length === 0) {
//       outputJSON.push({ text, image: "" });
//     } else {
//       for (const img of images) {
//         outputJSON.push({ text, image: img });
//       }
//     }
//   } else if (ext === ".pptx") {
//     const archive = await unzipper.Open.file(inputFile);
//     const texts = await extractTextSlidesPPTX(archive);
//     const images = await extractImagesPPTX(archive);
//     for (let i = 0; i < Math.max(texts.length, images.length); i++) {
//       outputJSON.push({ text: texts[i] || "", image: images[i] || "" });
//     }
//   }
//
//   fs.writeFileSync(
//     path.join(outputDir, "output.json"),
//     JSON.stringify(outputJSON, null, 2),
//   );
// }
//
// extract(inputFile, ext).catch(console.error);

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import mammoth from "mammoth";
import unzipper from "unzipper";
import { parseStringPromise } from "xml2js";

const inputFile = process.argv[2];
if (!inputFile) {
  console.error("Usage: ts-node src/main.ts <filename>");
  process.exit(1);
}

const ext = path.extname(inputFile).toLowerCase();
const base = path.basename(inputFile, ext);
const outputDir = `res_${base}`;
fs.mkdirSync(outputDir, { recursive: true });

function extractTextPDF(pdfPath: string): string[] {
  const textFile = path.join(outputDir, "raw_text.txt");
  execSync(`pdftotext -layout -nopgbrk "${pdfPath}" "${textFile}"`);
  const raw = fs.readFileSync(textFile, "utf-8");
  return raw.split(/\f/).map((p) => p.trim());
}

function extractImagesPDF(pdfPath: string): string[] {
  execSync(
    `pdftoppm -png -rx 100 -ry 100 "${pdfPath}" "${path.join(
      outputDir,
      "page"
    )}"`
  );
  return fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".png"))
    .map((f) => path.join(outputDir, f))
    .sort();
}

async function extractTextDOCX(docxPath: string): Promise<string> {
  const buffer = fs.readFileSync(docxPath);
  const { value } = await mammoth.extractRawText({ buffer });
  return value.trim();
}

async function extractImagesDOCX(docxPath: string): Promise<string[]> {
  const archive = await unzipper.Open.file(docxPath);
  const mediaFiles = archive.files.filter((f) =>
    f.path.startsWith("word/media/")
  );
  const imagePaths: string[] = [];
  let count = 0;
  for (const file of mediaFiles) {
    const ext = path.extname(file.path);
    const outPath = path.join(outputDir, `doc-img-${++count}${ext}`);
    const content = await file.buffer();
    fs.writeFileSync(outPath, content);
    imagePaths.push(outPath);
  }
  return imagePaths;
}

async function extractTextSlidesPPTX(
  archive: unzipper.CentralDirectory
): Promise<string[]> {
  const slides = archive.files
    .filter((f) => f.path.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => a.path.localeCompare(b.path));
  const texts: string[] = [];
  for (const slide of slides) {
    const content = await slide.buffer();
    const parsed = await parseStringPromise(content.toString());
    const shapes =
      parsed["p:sld"]?.["p:cSld"]?.[0]?.["p:spTree"]?.[0]?.["p:sp"] || [];
    const text = shapes
      .map((shape: any) => {
        const ps = shape["p:txBody"]?.[0]?.["a:p"] || [];
        return ps
          .map((p: any) =>
            (p["a:r"] || []).map((r: any) => r["a:t"]?.[0] || "").join("")
          )
          .join("\n");
      })
      .join("\n")
      .trim();
    texts.push(text);
  }
  return texts;
}

async function extractImagesPPTX(
  archive: unzipper.CentralDirectory
): Promise<string[]> {
  const mediaFiles = archive.files.filter((f) =>
    f.path.startsWith("ppt/media/")
  );
  const imagePaths: string[] = [];
  let count = 0;
  for (const file of mediaFiles) {
    const ext = path.extname(file.path);
    const outPath = path.join(outputDir, `slide-${++count}${ext}`);
    const content = await file.buffer();
    fs.writeFileSync(outPath, content);
    imagePaths.push(outPath);
  }
  return imagePaths.sort();
}

function encodeBase64(filePath: string): string {
  if (!filePath || !fs.existsSync(filePath)) return "";
  const data = fs.readFileSync(filePath);
  return data.toString("base64");
}

async function extract(inputFile: string, ext: string): Promise<void> {
  const outputJSON: {
    text: string;
    image: string;
    image_base64_content: string;
  }[] = [];

  if (ext === ".pdf") {
    const texts = extractTextPDF(inputFile);
    const images = extractImagesPDF(inputFile);
    for (let i = 0; i < Math.max(texts.length, images.length); i++) {
      const imagePath = images[i] || "";
      outputJSON.push({
        text: texts[i] || "",
        image: imagePath,
        image_base64_content: encodeBase64(imagePath),
      });
    }
  } else if (ext === ".docx") {
    const text = await extractTextDOCX(inputFile);
    const images = await extractImagesDOCX(inputFile);
    if (images.length === 0) {
      outputJSON.push({ text, image: "", image_base64_content: "" });
    } else {
      for (const img of images) {
        outputJSON.push({
          text,
          image: img,
          image_base64_content: encodeBase64(img),
        });
      }
    }
  } else if (ext === ".pptx") {
    const archive = await unzipper.Open.file(inputFile);
    const texts = await extractTextSlidesPPTX(archive);
    const images = await extractImagesPPTX(archive);
    for (let i = 0; i < Math.max(texts.length, images.length); i++) {
      const imagePath = images[i] || "";
      outputJSON.push({
        text: texts[i] || "",
        image: imagePath,
        image_base64_content: encodeBase64(imagePath),
      });
    }
  }

  fs.writeFileSync(
    path.join(outputDir, "output.json"),
    JSON.stringify(outputJSON, null, 2)
  );
}

extract(inputFile, ext).catch(console.error);
