const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Supported formats
const imageExts = [".jpg", ".jpeg", ".png"];
const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const svgExt = ".svg";

// Set your base directory here:
const baseDir = "give your actual path hear";

// Create output folders
const compImages = path.join(baseDir, "comp-images");
const compVideos = path.join(baseDir, "comp-videos");
if (!fs.existsSync(compImages)) fs.mkdirSync(compImages);
if (!fs.existsSync(compVideos)) fs.mkdirSync(compVideos);

// Recursive function
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

      // 👉 Image compression
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

      // 👉 Video compression
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

// Start
processFolder(baseDir);
