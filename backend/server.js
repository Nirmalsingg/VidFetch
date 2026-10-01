const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://vidfetch-us51.onrender.com"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "10kb" }));

const downloadsFolder = path.join(__dirname, "downloads");

if (!fs.existsSync(downloadsFolder)) {
  fs.mkdirSync(downloadsFolder, { recursive: true });
}

app.get("/", (req, res) => {
  res.json({
    message: "VidFetch backend is running!"
  });
});

app.post("/api/download", (req, res) => {
 const { url, quality } = req.body;

  console.log("=================================");
  console.log("Download requested:");
  console.log(url);
  console.log("=================================");

  if (!url || !url.trim()) {
    return res.status(400).json({
      error: "Please enter a valid video URL."
    });
  }

  const baseName = `video-${Date.now()}`;
  const outputTemplate = path.join(
    downloadsFolder,
    `${baseName}.%(ext)s`
  );

  console.log("Starting yt-dlp...");

 const allowedQualities = ["360", "480", "720", "1080"];
const selectedQuality = allowedQualities.includes(String(quality))
  ? String(quality)
  : "720";

const format = `bv*[height<=${selectedQuality}]+ba/b[height<=${selectedQuality}]`;

const ytDlp = spawn("python", [
  "-m",
  "yt_dlp",
  "--js-runtimes",
"deno",
  "-f",
  format,
  "--merge-output-format",
  "mp4",
  "-o",
  outputTemplate,
  url.trim()
]);
  let errorOutput = "";

  ytDlp.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  ytDlp.stderr.on("data", (data) => {
    const message = data.toString();
    errorOutput += message;
    console.log(message);
  });

  ytDlp.on("close", (code) => {
    console.log("yt-dlp finished with code:", code);

    if (code !== 0) {
      console.log("YT-DLP FAILED");

      return res.status(500).json({
        error: "Video download failed.",
        details: errorOutput
      });
    }

    // Find the actual downloaded file
    const files = fs.readdirSync(downloadsFolder);

    const matchingFiles = files
      .filter((file) => file.startsWith(baseName))
      .map((file) => path.join(downloadsFolder, file))
      .filter((file) => fs.statSync(file).isFile());

    if (matchingFiles.length === 0) {
      console.log("DOWNLOAD FAILED: File not found.");

      return res.status(500).json({
        error: "Download completed but the video file was not found.",
        details: errorOutput
      });
    }

    // Prefer MP4
    const mp4File = matchingFiles.find((file) =>
      file.toLowerCase().endsWith(".mp4")
    );

    const actualFile = mp4File || matchingFiles[0];

    console.log("DOWNLOAD SUCCESSFUL");
    console.log("Actual file:", actualFile);

    res.download(actualFile, "VidFetch-video.mp4", (err) => {
      if (err) {
        console.error("Sending error:", err);
      } else {
        console.log("File sent successfully.");
      }

      setTimeout(() => {
        if (fs.existsSync(actualFile)) {
          fs.unlinkSync(actualFile);
          console.log("Temporary file deleted.");
        }
      }, 5000);
    });
  });
});
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (!res.headersSent) {
    res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
});
app.listen(PORT, () => {
  console.log(`VidFetch backend running on http://localhost:${PORT}`);
});