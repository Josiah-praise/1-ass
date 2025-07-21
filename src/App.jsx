import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import abi from "./abi.json"; // Import ABI from JSON file
import "./App.css"; // Import the CSS file

const contractAddress = "0x9D1eb059977D71E1A21BdebD1F700d4A39744A70";

// --- Custom Hooks (remain the same) ---

// Hook to get window size for responsive inline styles
const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
};

// Hook for mouse position
const useMousePosition = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const setFromEvent = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", setFromEvent);
    return () => window.removeEventListener("mousemove", setFromEvent);
  }, []);
  return position;
};

// 3D Tilt Effect Hook for Cards
const useCardTilt = () => {
  const [transform, setTransform] = useState(
    "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
  );
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const onMouseMove = (e) => {
    const card = e.currentTarget;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const rotateX = -((height / 2 - y) / (height / 2)) * 8;
    const rotateY = ((width / 2 - x) / (width / 2)) * 8;
    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`
    );

    const spotlightX = (x / width) * 100;
    const spotlightY = (y / height) * 100;
    setSpotlight({ x: spotlightX, y: spotlightY, opacity: 1 });
  };

  const onMouseLeave = () => {
    setTransform(
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
    );
    setSpotlight({ x: 50, y: 50, opacity: 0 });
  };

  return { transform, spotlight, onMouseMove, onMouseLeave };
};

// --- Main App Component ---

function App() {
  const [text, setText] = useState("");
  const [fetchedMessage, setFetchedMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [getLoading, setGetLoading] = useState(false);

  const [width] = useWindowSize();
  const mousePos = useMousePosition();

  const card1Tilt = useCardTilt();
  const card2Tilt = useCardTilt();

  const title = "MessageVault";
  const [glitchedTitle, setGlitchedTitle] = useState(title);

  const glitchEffect = useCallback(() => {
    let interval = null;
    const chars = "¡@£$€¥§#|/\\<>()[]{}*&^%-_+=?¿";
    interval = setInterval(() => {
      setGlitchedTitle(
        title
          .split("")
          .map((char) =>
            Math.random() > 0.85
              ? chars[Math.floor(Math.random() * chars.length)]
              : char
          )
          .join("")
      );
    }, 80);
    setTimeout(() => {
      clearInterval(interval);
      setGlitchedTitle(title);
    }, 1000);
  }, [title]);

  useEffect(() => {
    if (window.ethereum && !window.ethereum.isMetaMask) {
      setError(
        "Multiple wallets detected or MetaMask is not the primary wallet. Please disable other wallets and refresh."
      );
    }
  }, []);

  async function requestAccount() {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (err) {
      throw new Error(
        "Failed to connect MetaMask. Please approve the connection in your wallet."
      );
    }
  }

  const handleSet = async (e) => {
    e.preventDefault();
    if (!text || loading) return;
    try {
      setError("");
      setSuccess("");
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        setError(
          "MetaMask not found or not supported. Please install and setup MetaMask."
        );
        return;
      }
      await requestAccount();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      setLoading(true);
      const tx = await contract.setMessage(text);
      await tx.wait();
      setText("");
      setSuccess(
        `Message successfully stored! Tx: ${tx.hash.substring(0, 10)}...`
      );
      await handleGet(true); // pass true to avoid clearing success message immediately
    } catch (err) {
      setError(
        err.reason ||
          err.message ||
          "Unexpected error occurred while setting message."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGet = async (isAfterSet = false) => {
    if (getLoading) return;
    try {
      if (!isAfterSet) setSuccess("");
      setError("");
      setGetLoading(true);
      if (!window.ethereum) {
        setError("MetaMask not found. Please install MetaMask.");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const message = await contract.getMessage();
      setFetchedMessage(message);
    } catch (err) {
      setError(err.reason || err.message || "Error fetching message.");
    } finally {
      setGetLoading(false);
    }
  };

  const dynamicBackgroundStyle = {
    background: `
      radial-gradient(circle at ${mousePos.x}px ${
      mousePos.y
    }px, rgba(59, 130, 246, 0.2) 0%, transparent 30%),
      radial-gradient(circle at ${width - mousePos.x}px ${
      window.innerHeight - mousePos.y
    }px, rgba(168, 85, 247, 0.2) 0%, transparent 30%)
    `,
  };

  return (
    <div className="app">
      {/* Backgrounds */}
      <div className="background-aurora" style={dynamicBackgroundStyle}></div>
      <div className="background-morph"></div>
      <div className="grid-overlay"></div>

      <div className="main-container">
        {/* Header */}
        <header className="header">
          <div className="header-box" onMouseEnter={glitchEffect}>
            <div className="header-border-sweep"></div>
            <div className="header-icon">⚡</div>
            <h1 className="glitch-title">{glitchedTitle}</h1>
            <div className="header-icon float">🔮</div>
          </div>
          <p className="header-subtitle">
            Decentralized message storage powered by blockchain magic ✨
          </p>
        </header>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">🚨</div>
            <div className="alert-content">
              <h4 className="alert-title">An Error Occurred</h4>
              <p className="alert-message">{error}</p>
            </div>
            <button className="alert-close-btn" onClick={() => setError("")}>
              ✕
            </button>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <div className="alert-icon">✅</div>
            <p className="alert-message">{success}</p>
            <button className="alert-close-btn" onClick={() => setSuccess("")}>
              Close
            </button>
          </div>
        )}

        {/* Content */}
        <div className="content-grid">
          {/* Set Message Card */}
          <div
            className="card"
            style={{ transform: card1Tilt.transform }}
            onMouseMove={card1Tilt.onMouseMove}
            onMouseLeave={card1Tilt.onMouseLeave}
          >
            <div
              className="card-glow-border"
              style={{
                "--glow-color-start": "#60a5fa",
                "--glow-color-end": "#3b82f6",
              }}
            ></div>
            <div
              className="card-spotlight"
              style={{
                background: `radial-gradient(circle at ${card1Tilt.spotlight.x}% ${card1Tilt.spotlight.y}%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)`,
                opacity: card1Tilt.spotlight.opacity,
              }}
            ></div>

            <header className="card-header">
              <div className="card-icon-wrapper set">
                <span className="card-icon">✍️</span>
              </div>
              <h2 className="card-title">Store Message</h2>
            </header>

            <form className="message-form" onSubmit={handleSet}>
              <input
                type="text"
                className="message-input"
                placeholder="✨ Your message for the cosmos..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="submit-button set"
                disabled={loading || !text.trim()}
              >
                {loading ? (
                  <>
                    {" "}
                    <div className="loader-spin"></div> Storing...{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <span className="icon">🚀</span> Store Message{" "}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Get Message Card */}
          <div
            className="card"
            style={{ transform: card2Tilt.transform }}
            onMouseMove={card2Tilt.onMouseMove}
            onMouseLeave={card2Tilt.onMouseLeave}
          >
            <div
              className="card-glow-border"
              style={{
                "--glow-color-start": "#f59e0b",
                "--glow-color-end": "#d97706",
              }}
            ></div>
            <div
              className="card-spotlight"
              style={{
                background: `radial-gradient(circle at ${card2Tilt.spotlight.x}% ${card2Tilt.spotlight.y}%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)`,
                opacity: card2Tilt.spotlight.opacity,
              }}
            ></div>

            <header className="card-header">
              <div className="card-icon-wrapper get">
                <span className="card-icon">📨</span>
              </div>
              <h2 className="card-title">Retrieved Message</h2>
            </header>

            <div className="message-display-box">
              {fetchedMessage &&
                [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="stargate-ring"
                    style={{
                      width: `calc(100% + ${i * 40}px)`,
                      height: `calc(100% + ${i * 40}px)`,
                      animation: `stargate-rotate ${
                        4 + i * 2
                      }s linear infinite ${i % 2 === 0 ? "reverse" : ""}`,
                      opacity: 0.8 - i * 0.2,
                    }}
                  ></div>
                ))}
              {fetchedMessage ? (
                <p className="fetched-message">"{fetchedMessage}"</p>
              ) : (
                <p className="placeholder-message">
                  Click below to fetch the message...
                </p>
              )}
            </div>

            <button
              className="submit-button get"
              onClick={() => handleGet()}
              disabled={getLoading}
            >
              {getLoading ? (
                <>
                  {" "}
                  <div className="loader-custom"></div> Fetching...{" "}
                </>
              ) : (
                <>
                  {" "}
                  <span className="icon">📡</span> Fetch Message{" "}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
