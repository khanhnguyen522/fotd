import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [items, setItems] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [outfits, setOutfits] = useState([]);
  const [season, setSeason] = useState("");
  const [generating, setGenerating] = useState(false);
  const [outfitError, setOutfitError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/items`);
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch items:", err);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);

    setUploading(true);
    try {
      await axios.post(`${API_URL}/items`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedFile(null);
      fetchItems();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed, check console for details");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateOutfits = async () => {
    setGenerating(true);
    setOutfitError(null);
    try {
      const params = season ? { season } : {};
      const res = await axios.get(`${API_URL}/outfits`, { params });

      if (res.data.error) {
        setOutfitError(res.data.error);
        setOutfits([]);
      } else {
        setOutfits(res.data);
      }
    } catch (err) {
      console.error("Failed to generate outfits:", err);
      setOutfitError("Something went wrong generating outfits.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1>My Closet</h1>

      {/* Upload section */}
      <div style={{ marginBottom: "2rem" }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Wardrobe grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "1rem",
          marginBottom: "3rem",
        }}
      >
        {items.map((item) => (
          <div key={item.id} style={{ textAlign: "center" }}>
            <img
              src={item.image_url}
              alt="clothing item"
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <div
              style={{ fontSize: "0.8rem", marginTop: "4px", color: "#555" }}
            >
              {item.category && (
                <div>
                  {item.category} · {item.color}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Outfit generator section */}
      <h2>Outfit Suggestions</h2>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <select value={season} onChange={(e) => setSeason(e.target.value)}>
          <option value="">Any season</option>
          <option value="spring">Spring</option>
          <option value="summer">Summer</option>
          <option value="fall">Fall</option>
          <option value="winter">Winter</option>
        </select>
        <button onClick={handleGenerateOutfits} disabled={generating}>
          {generating ? "Generating..." : "Generate Outfits"}
        </button>
      </div>

      {outfitError && <p style={{ color: "#c0392b" }}>{outfitError}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {outfits.map((outfit, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              gap: "0.75rem",
              padding: "1rem",
              border: "1px solid #eee",
              borderRadius: "12px",
            }}
          >
            {["top", "bottom", "shoes", "outerwear"].map((slot) =>
              outfit[slot] ? (
                <div key={slot} style={{ textAlign: "center", flex: 1 }}>
                  <img
                    src={outfit[slot].image_url}
                    alt={slot}
                    style={{
                      width: "100%",
                      height: "140px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#555",
                      marginTop: "4px",
                    }}
                  >
                    {slot} · {outfit[slot].color}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
