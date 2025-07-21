import { useState, useEffect } from "react";
import abi from "./abi.json";
import { ethers } from "ethers";

const contractAddress = "0x9D1eb059977D71E1A21BdebD1F700d4A39744A70";

function App() {
  const [text, setText] = useState("");
  const [fetchedMessage, setFetchedMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ensure only MetaMask is used
    if (
      !window.ethereum ||
      window.ethereum.isBraveWallet ||
      window.ethereum.isCoinbaseWallet ||
      window.ethereum.isTrust ||
      !window.ethereum.isMetaMask
    ) {
      setError("Only MetaMask is supported for this application.");
    }
  }, []);

  async function requestAccount() {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (err) {
      throw new Error("Failed to connect MetaMask.");
    }
  }

  const handleSet = async () => {
    try {
      setError("");

      if (!text) {
        setError("Please enter a message before setting.");
        return;
      }

      if (!window.ethereum || !window.ethereum.isMetaMask) {
        setError("MetaMask not found or not supported.");
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
      await handleGet();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(
        err.message || "Unexpected error occurred while setting message."
      );
    }
  };

  const handleGet = async () => {
    try {
      setError("");
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        setError("MetaMask not found or not supported.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);

      const message = await contract.getMessage();
      setFetchedMessage(message);
    } catch (err) {
      setError(err.message || "Error fetching message.");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>📝 Message DApp</h1>

      {error && (
        <div
          style={{
            background: "#ffe0e0",
            color: "#900",
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "5px",
          }}
        >
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Enter your message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ padding: "0.5rem", marginRight: "1rem" }}
      />
      <button
        onClick={handleSet}
        disabled={loading}
        style={{ padding: "0.5rem 1rem" }}
      >
        {loading ? "Setting..." : "Set Message"}
      </button>

      <div style={{ marginTop: "2rem" }}>
        <button onClick={handleGet} style={{ padding: "0.5rem 1rem" }}>
          Get Message
        </button>

        {fetchedMessage && (
          <p style={{ marginTop: "1rem", fontSize: "1.2rem" }}>
            📬 Message from Contract: <strong>{fetchedMessage}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
