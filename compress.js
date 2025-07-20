const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { exec } = require("child_process");

const imageExts = [".jpg", ".jpeg", ".png"];
const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const svgExt = ".svg";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("📁 Enter path to the folder you want to compress: ", function (inputPath) {
  const baseDir = path.resolve(inputPath.replace(/\\/g, "/"));

  if (!fs.existsSync(baseDir)) {
    console.error("❌ Invalid path. Folder does not exist.");
    rl.close();
    return;
  }

  let hasImages = false;
  let hasVideos = false;

  // First pass: Scan recursively to check if there are compressible files
  function scanFolder(currentPath) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanFolder(fullPath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (imageExts.includes(ext) || ext === svgExt) hasImages = true;
        if (videoExts.includes(ext)) hasVideos = true;
        if (hasImages && hasVideos) return; // early exit if both found
      }
    }
  }

  scanFolder(baseDir);

  if (!hasImages && !hasVideos) {
    console.log("❌ This directory doesn't contain any images or videos.");
    rl.close();
    return;
  }

  const compImages = path.join(baseDir, "comp-images");
  const compVideos = path.join(baseDir, "comp-videos");

  if (hasImages && !fs.existsSync(compImages)) fs.mkdirSync(compImages);
  if (hasVideos && !fs.existsSync(compVideos)) fs.mkdirSync(compVideos);

  function processFolder(currentPath) {
    const files = fs.readdirSync(currentPath);

    files.forEach((file) => {
      const fullPath = path.join(currentPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        processFolder(fullPath);
      } else {
        const ext = path.extname(file).toLowerCase();
        const baseName = path.parse(file).name;

        if (imageExts.includes(ext)) {
          const outFile = path.join(compImages, `${baseName}.webp`);
          const cmd = `ffmpeg -i "${fullPath}" -vcodec libwebp -lossless 0 -compression_level 6 -q:v 70 "${outFile}"`;
          exec(cmd, (err) => {
            if (err) console.error(`❌ Failed: ${file}`, err);
            else console.log(`🖼️ Compressed image: ${file} → comp-images/${baseName}.webp`);
          });
        } else if (ext === svgExt) {
          const outFile = path.join(compImages, file);
          fs.copyFileSync(fullPath, outFile);
          console.log(`📄 Copied SVG: ${file} → comp-images/`);
        } else if (videoExts.includes(ext)) {
          const outFile = path.join(compVideos, `${baseName}.mp4`);
          const cmd = `ffmpeg -i "${fullPath}" -vcodec libx264 -crf 28 -preset slow -acodec aac "${outFile}"`;
          exec(cmd, (err) => {
            if (err) console.error(`❌ Failed: ${file}`, err);
            else console.log(`🎥 Compressed video: ${file} → comp-videos/${baseName}.mp4`);
          });
        }
      }
    });
  }

  console.log(`🚀 Starting compression in: ${baseDir}`);
  processFolder(baseDir);
  rl.close();
});
