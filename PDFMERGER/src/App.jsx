import React, { useState, useRef } from "react";
import { SocialIcon } from "react-social-icons";
import "./App.css";

function App() {
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [mergeProgress, setMergeProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  const MAX_FILE_COUNT = 100;

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (files.length + selectedFiles.length > MAX_FILE_COUNT) {
      setErrorMessage(
        `Maximum file count exceeded. You can upload up to ${MAX_FILE_COUNT} files at once.`
      );
      setUploadStatus("error");
      return;
    }

    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > 100 * 1024 * 1024
    );

    if (oversizedFiles.length > 0) {
      setErrorMessage(
        `File '${oversizedFiles[0].name}' exceeds the maximum size of 100MB`
      );
      setUploadStatus("error");
      return;
    }

    const totalSize = [...files, ...selectedFiles].reduce(
      (total, file) => total + file.size,
      0
    );
    if (totalSize > 250 * 1024 * 1024) {
      setErrorMessage(
        "Total size of all files exceeds the maximum allowed size of 250MB"
      );
      setUploadStatus("error");
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    setErrorMessage("");
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploadStatus("uploading");
    setMergeProgress(0);
    setErrorMessage("");

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const interval = setInterval(() => {
        setMergeProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch("https://pdf-backend-4neb.onrender.com/api/merge", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setMergeProgress(100);

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setUploadStatus("completed");

        setFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        try {
          const errorData = await response.json();

          if (
            errorData.error === "UPLOAD_SIZE_EXCEEDED" ||
            errorData.error === "FILE_COUNT_EXCEEDED"
          ) {
            setErrorMessage(
              "Too many files uploaded. Please reduce the number of files and try again."
            );
          } else {
            setErrorMessage(
              errorData.message || "Error occurred during merging"
            );
          }

          setUploadStatus("error");
        } catch (e) {
          setErrorMessage("Error occurred during merging. Please try again.");
          setUploadStatus("error");
        }
      }
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
      console.error("Upload error:", error);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setErrorMessage("");
  };

  const resetForm = () => {
    setFiles([]);
    setUploadStatus("idle");
    setDownloadUrl(null);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    const sizes = ["KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (
      Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i - 1]
    );
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Galaxy Merger</h1>
        <div className="social-icons">
          <SocialIcon
            url="https://github.com/A4anas3"
            network="github"
            style={{ height: 28, width: 28 }}
            target="_blank"
            rel="noopener noreferrer"
            bgColor="#333"
          />
          <SocialIcon
            url="https://www.linkedin.com/in/mohd-anas-a60612276/"
            style={{ height: 28, width: 28 }}
            target="_blank"
            rel="noopener noreferrer"
          />
          <SocialIcon
            url="https://www.instagram.com/anas_saifi__13?igsh=OHl6aTVhaWlmZGtx"
            style={{ height: 28, width: 28 }}
            target="_blank"
            rel="noopener noreferrer"
          />
        </div>
      </header>

      <main className="main-content">
        <div className="upload-container">
          <div
            className="upload-box"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">+</div>
            <p>Click to upload PDF files</p>
            <p className="upload-subtext">
              Max {MAX_FILE_COUNT} files • 100MB per file • 250MB total
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

        {files.length > 0 && (
          <div className="file-list">
            <div className="file-list-header">
              <h3>
                Selected Files ({files.length}/{MAX_FILE_COUNT})
              </h3>
              <button onClick={resetForm} className="clear-all-btn">
                Clear All
              </button>
            </div>
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="remove-btn"
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}

            <div className="total-size">
              Total:{" "}
              {formatFileSize(
                files.reduce((total, file) => total + file.size, 0)
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploadStatus === "uploading"}
              className="merge-btn"
            >
              {uploadStatus === "uploading" ? "Merging..." : "Merge PDFs"}
            </button>
          </div>
        )}

        {uploadStatus === "uploading" && (
          <div className="progress-container">
            <div className="bike-animation">
              <div className="bike">
                <div className="bike-wheel"></div>
                <div className="bike-frame"></div>
                <div className="bike-wheel"></div>
              </div>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${mergeProgress}%` }}
              ></div>
            </div>
            <p className="progress-text">Merging... {mergeProgress}%</p>
          </div>
        )}

        {uploadStatus === "completed" && downloadUrl && (
          <div className="download-container">
            <div className="success-message">
              <span className="success-icon">✓</span>
              <h3>Merge Completed Successfully!</h3>
            </div>
            <a
              href={downloadUrl}
              download="merged-document.pdf"
              className="download-btn"
            >
              Download Merged PDF
            </a>
            <button onClick={resetForm} className="new-merge-btn">
              Start New Merge
            </button>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{errorMessage}</p>
            <button onClick={resetForm} className="retry-btn">
              Try Again
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p className="support-text">Support Us</p>
          <div className="footer-social-icons">
            <SocialIcon
              url="https://github.com/A4anas3"
              network="github"
              style={{ height: 32, width: 32 }}
              target="_blank"
              rel="noopener noreferrer"
              bgColor="#333"
            />
            <SocialIcon
              url="https://www.linkedin.com/in/mohd-anas-a60612276/"
              style={{ height: 32, width: 32 }}
              target="_blank"
              rel="noopener noreferrer"
            />
            <SocialIcon
              url="https://www.instagram.com/anas_saifi__13?igsh=OHl6aTVhaWlmZGtx"
              style={{ height: 32, width: 32 }}
              target="_blank"
              rel="noopener noreferrer"
            />
          </div>
          <p className="copyright">
            © {new Date().getFullYear()} Galaxy Merger. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
