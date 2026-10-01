import { useState } from "react";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
const [quality, setQuality] = useState("720");
const handleDownload = async () => {
  if (!url.trim()) {
    alert("Please paste a video URL first.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
  url: url.trim(),
  quality,
}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      throw new Error(
        errorData?.error || "Video download failed."
      );
    }

    // Get the downloaded video as a file
    const blob = await response.blob();

    // Create a temporary download link
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "VidFetch-video.mp4";

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(downloadUrl);

  } catch (error) {
    console.error("Download error:", error);
    alert(error.message || "Something went wrong while downloading.");
  }
};

  return (
    <div className="app">

      {/* Navbar */}
      <header className="navbar">
        <div className="logo">
          Vid<span>Fetch</span>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#how">How It Works</a>
          <a href="#supported">Supported</a>
        </nav>

        <button className="nav-button">
          Free Tool
        </button>
      </header>


      {/* Hero */}
      <main id="home">

        <section className="hero">

          <div className="badge">
            ⚡ FAST • SIMPLE • FREE
          </div>

          <h1>
            Download Videos
            <br />
            <span>From a Link</span>
          </h1>

          <p className="hero-text">
            Paste a publicly accessible video URL below and
            download your video quickly and easily.
          </p>


          {/* Downloader */}
          <div className="downloader">

            <div className="input-wrapper">

              <span className="link-icon">
                🔗
              </span>

              <input
                type="text"
                placeholder="Paste your video URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleDownload();
                  }
                }}
              />

              {url && (
                <button
                  className="clear-button"
                  onClick={() => setUrl("")}
                >
                  ×
                </button>
              )}

            </div>
<select
  value={quality}
  onChange={(e) => setQuality(e.target.value)}
  className="quality-select"
>
  <option value="360">360p - Fastest</option>
  <option value="480">480p - Fast</option>
  <option value="720">720p - HD</option>
  <option value="1080">1080p - Full HD</option>
</select>
            <button
              className="download-button"
              onClick={handleDownload}
            >
              Download
              <span>↓</span>
            </button>

          </div>


          <div className="privacy">
            🔒 Your URL is processed only to provide the requested download.
          </div>


          {/* Supported platforms */}
          <div id="supported" className="platforms">

            <p>Works with publicly accessible video URLs</p>

            <div className="platform-list">

              <div className="platform">
                <span>▶</span>
                YouTube
              </div>

              <div className="platform">
                <span>◎</span>
                Instagram
              </div>

              <div className="platform">
                <span>𝕏</span>
                X
              </div>

              <div className="platform">
                <span>♪</span>
                TikTok
              </div>

              <div className="platform">
                <span>▶</span>
                Direct Video
              </div>

            </div>

          </div>

        </section>


        {/* Features */}
        <section className="features">

          <div className="section-heading">
            <div className="small-title">
              WHY VIDFETCH
            </div>

            <h2>
              Simple. Fast. No complicated setup.
            </h2>
          </div>


          <div className="feature-grid">

            <div className="feature-card">

              <div className="feature-icon">
                ⚡
              </div>

              <h3>Fast Downloads</h3>

              <p>
                Get your downloadable video without
                unnecessary steps.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                🔗
              </div>

              <h3>Easy to Use</h3>

              <p>
                Simply copy a video URL, paste it here,
                and start the process.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                📱
              </div>

              <h3>Mobile Friendly</h3>

              <p>
                Use VidFetch from your phone, tablet,
                or desktop.
              </p>

            </div>

          </div>

        </section>


        {/* How it works */}
        <section id="how" className="how">

          <div className="section-heading">

            <div className="small-title">
              HOW IT WORKS
            </div>

            <h2>
              Download in three simple steps
            </h2>

          </div>


          <div className="steps">

            <div className="step">

              <div className="step-number">
                01
              </div>

              <h3>Copy the link</h3>

              <p>
                Copy the URL of a publicly accessible
                video you have permission to download.
              </p>

            </div>


            <div className="step">

              <div className="step-number">
                02
              </div>

              <h3>Paste it here</h3>

              <p>
                Paste the video URL into the VidFetch
                downloader above.
              </p>

            </div>


            <div className="step">

              <div className="step-number">
                03
              </div>

              <h3>Download</h3>

              <p>
                Choose the available download option
                and save your video.
              </p>

            </div>

          </div>

        </section>


        {/* Ad placeholder */}
        <section className="ad-area">

          <div className="ad-placeholder">
            Advertisement
          </div>

        </section>


        {/* Disclaimer */}
        <section className="disclaimer">

          <h2>Use VidFetch Responsibly</h2>

          <p>
            VidFetch is intended for downloading content
            that you own or have permission to download.
            Respect the terms of service and copyright
            requirements of the websites and content
            you use.
          </p>

        </section>

      </main>


      {/* Footer */}
      <footer>

        <div className="footer-logo">
          Vid<span>Fetch</span>
        </div>

        <p>
          A simple video download utility.
        </p>

        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#how">How It Works</a>
          <a href="#supported">Supported</a>
        </div>

        <div className="copyright">
          © 2026 VidFetch. All rights reserved.
        </div>

      </footer>

    </div>
  );
}

export default App;