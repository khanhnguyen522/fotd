import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

const SEASONS = [
  { value: "", label: "Any" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "winter", label: "Winter" },
];

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "top", label: "Tops" },
  { value: "bottom", label: "Bottoms" },
  { value: "shoes", label: "Shoes" },
  { value: "outerwear", label: "Outerwear" },
  { value: "accessory", label: "Accessories" },
];

function TagChip({ category, color }) {
  if (!category) return null;
  return (
    <div className="tag-chip">
      <span className="tag-chip-hole" />
      <span className="tag-chip-text">
        {category}
        {color ? ` · ${color}` : ""}
      </span>
    </div>
  );
}

function HandleIcon() {
  return (
    <span className="handle-icon" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("closet");

  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const fileInputRef = useRef(null);

  const [outfits, setOutfits] = useState([]);
  const [season, setSeason] = useState("");
  const [generating, setGenerating] = useState(false);
  const [outfitError, setOutfitError] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handleUpload(file);
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      await axios.post(`${API_URL}/items`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchItems();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed, please try again");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerateOutfits = async () => {
    setGenerating(true);
    setOutfitError(null);
    setHasGenerated(true);
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
      setOutfitError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const visibleItems = categoryFilter
    ? items.filter((item) => item.category === categoryFilter)
    : items;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="wordmark">
          <span className="wordmark-hole" />
          <span className="wordmark-text">FOTD</span>
        </div>
        <p className="tagline">Fit of the Day</p>
      </header>

      <div className="tab-switcher">
        <button
          className={`tab-btn ${activeTab === "closet" ? "active" : ""}`}
          onClick={() => setActiveTab("closet")}
        >
          {activeTab === "closet" && <HandleIcon />}
          Closet
        </button>
        <button
          className={`tab-btn ${activeTab === "outfits" ? "active" : ""}`}
          onClick={() => setActiveTab("outfits")}
        >
          {activeTab === "outfits" && <HandleIcon />}
          Outfits
        </button>
      </div>

      <main className="app-main">
        {activeTab === "closet" && (
          <section>
            <label className="upload-card">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                hidden
              />
              <span className="upload-icon">+</span>
              <span className="upload-label">
                {uploading ? "Uploading..." : "Add a piece"}
              </span>
            </label>

            {items.length > 0 && (
              <div className="season-pills">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    className={`pill ${categoryFilter === c.value ? "active" : ""}`}
                    onClick={() => setCategoryFilter(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {items.length === 0 ? (
              <p className="empty-state">
                Your closet is empty — add your first piece.
              </p>
            ) : visibleItems.length === 0 ? (
              <p className="empty-state">No pieces in this category yet.</p>
            ) : (
              <div className="item-grid">
                {visibleItems.map((item) => (
                  <div key={item.id} className="item-card">
                    <img src={item.image_url} alt="clothing item" />
                    <TagChip category={item.category} color={item.color} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "outfits" && (
          <section>
            <div className="season-pills">
              {SEASONS.map((s) => (
                <button
                  key={s.value}
                  className={`pill ${season === s.value ? "active" : ""}`}
                  onClick={() => setSeason(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              className="generate-btn"
              onClick={handleGenerateOutfits}
              disabled={generating}
            >
              {generating ? "Styling..." : "Generate Outfits"}
            </button>

            {outfitError && <p className="error-text">{outfitError}</p>}

            {!hasGenerated && !outfitError && (
              <p className="empty-state">
                Tap the button to see outfit suggestions.
              </p>
            )}

            <div className="outfit-list">
              {outfits.map((outfit, idx) => (
                <div key={idx} className="outfit-card">
                  <div className="outfit-card-header">
                    <span className="outfit-number">
                      Look {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="outfit-pieces">
                    {["top", "bottom", "shoes", "outerwear"].map((slot) =>
                      outfit[slot] ? (
                        <div key={slot} className="outfit-piece">
                          <img src={outfit[slot].image_url} alt={slot} />
                          <span className="piece-label">
                            {outfit[slot].color}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
