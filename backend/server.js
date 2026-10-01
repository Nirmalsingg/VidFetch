const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// CORS
// ===============================
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  })
);

// ===============================
// BODY PARSER
// ===============================
app.use(express.json({ limit: "10kb" }));

// ===============================
// LOG REQUESTS
// ===============================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ===============================
// DOWNLOAD FOLDER
// ===============================
const downloadsFolder = path.join(__dirname, "downloads");

if (!fs.existsSync(downloadsFolder)) {
  fs.mkdirSync(downloadsFolder, { recursive: true });
}

// ===============================
// CORS PREFLIGHT
// ===============================
// CORS PREFLIGHT
app.options("/api/download", cors());

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.json({
    message: "VidFetch backend is running!",
  });
});

// ===============================
// DOWNLOAD API
// ===============================
app.post("/api/download", async (req, res) => {
  console.log("=================================");
  console.log("DOWNLOAD REQUEST RECEIVED");
  console.log("Body:", req.body);
  console.log("=================================");

  try {
    const { url, quality } = req.body;

    // -------------------------------
    // Validate URL
    // -------------------------------
    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({
        error: "Please enter a valid video URL.",
      });
    }

    const cleanUrl = url.trim();

    console.log("Download requested:");
    console.log(cleanUrl);

    // -------------------------------
    // Validate quality
    // -------------------------------
    const allowedQualities = ["360", "480", "720", "1080"];

    const selectedQuality = allowedQualities.includes(String(quality))
      ? String(quality)
      : "720";

    console.log("Selected quality:", selectedQuality);

    // -------------------------------
    // Output filename
    // -------------------------------
    const baseName = `video-${Date.now()}`;

    const outputTemplate = path.join(
      downloadsFolder,
      `${baseName}.%(ext)s`
    );

    // -------------------------------
    // yt-dlp format
    // -------------------------------
    const format = `bv*[height<=${selectedQuality}]+ba/b[height<=${selectedQuality}]`;

    console.log("Format:", format);
    console.log("Starting yt-dlp...");

    // -------------------------------
    // Start yt-dlp
    // -------------------------------
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
      cleanUrl,
    ]);

    let errorOutput = "";

    // -------------------------------
    // stdout
    // -------------------------------
    ytDlp.stdout.on("data", (data) => {
      const message = data.toString();
      console.log("[yt-dlp]", message);
    });

    // -------------------------------
    // stderr
    // -------------------------------
    ytDlp.stderr.on("data", (data) => {
      const message = data.toString();

      errorOutput += message;

      console.log("[yt-dlp error]", message);
    });

    // -------------------------------
    // Spawn error
    // -------------------------------
    ytDlp.on("error", (error) => {
      console.error("Failed to start yt-dlp:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          error: "Failed to start video downloader.",
          details: error.message,
        });
      }
    });

    // -------------------------------
    // Process finished
    // -------------------------------
    ytDlp.on("close", (code) => {
      console.log("yt-dlp finished with code:", code);

      // -----------------------------
      // Download failed
      // -----------------------------
      if (code !== 0) {
        console.log("YT-DLP FAILED");

        if (!res.headersSent) {
          return res.status(500).json({
            error: "Video download failed.",
            details: errorOutput,
          });
        }

        return;
      }

      // -----------------------------
      // Find downloaded file
      // -----------------------------
      let files;

      try {
        files = fs.readdirSync(downloadsFolder);
      } catch (error) {
        console.error("Unable to read downloads folder:", error);

        if (!res.headersSent) {
          return res.status(500).json({
            error: "Unable to access downloaded file.",
            details: error.message,
          });
        }

        return;
      }

      const matchingFiles = files
        .filter((file) => file.startsWith(baseName))
        .map((file) => path.join(downloadsFolder, file))
        .filter((file) => {
          try {
            return fs.statSync(file).isFile();
          } catch {
            return false;
          }
        });

      // -----------------------------
      // File not found
      // -----------------------------
      if (matchingFiles.length === 0) {
        console.log("DOWNLOAD FAILED: File not found.");

        if (!res.headersSent) {
          return res.status(500).json({
            error: "Download completed but the video file was not found.",
            details: errorOutput,
          });
        }

        return;
      }

      // -----------------------------
      // Prefer MP4
      // -----------------------------
      const mp4File = matchingFiles.find((file) =>
        file.toLowerCase().endsWith(".mp4")
      );

      const actualFile = mp4File || matchingFiles[0];

      console.log("DOWNLOAD SUCCESSFUL");
      console.log("Actual file:", actualFile);

      // -----------------------------
      // Send file
      // -----------------------------
      res.download(actualFile, "VidFetch-video.mp4", (err) => {
        if (err) {
          console.error("Sending error:", err);
        } else {
          console.log("File sent successfully.");
        }

        // ---------------------------
        // Delete temporary file
        // ---------------------------
        setTimeout(() => {
          try {
            if (fs.existsSync(actualFile)) {
              fs.unlinkSync(actualFile);
              console.log("Temporary file deleted.");
            }
          } catch (error) {
            console.error(
              "Could not delete temporary file:",
              error.message
            );
          }
        }, 5000);
      });
    });
  } catch (error) {
    // IMPORTANT:
    // This catch fixes the previous
    // "Missing catch or finally after try" error.

    console.error("DOWNLOAD ROUTE ERROR:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Server error",
        details: error.message,
      });
    }
  }
});

// ===============================
// GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (!res.headersSent) {
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`VidFetch backend running on http://localhost:${PORT}`);
});