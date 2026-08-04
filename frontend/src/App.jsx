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
  const [colorFilter, setColorFilter] = useState("");
  const fileInputRef = useRef(null);

  const [outfits, setOutfits] = useState([]);
  const [season, setSeason] = useState("");
  const [generating, setGenerating] = useState(false);
  const [outfitError, setOutfitError] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // edit/delete sheet state
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    category: "",
    color: "",
    season: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStartY = useRef(0);

  useEffect(() => {
    fetchItems();
  }, []);

  // lock background scroll while the edit sheet is open
  useEffect(() => {
    if (editingItem) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [editingItem]);

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

  const openEditSheet = (item) => {
    setEditingItem(item);
    setEditForm({
      category: item.category || "",
      color: item.color || "",
      season: item.season || "",
    });
    setDragY(0);
  };

  const closeEditSheet = () => {
    setEditingItem(null);
    setDragY(0);
  };

  const handleSheetTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDraggingSheet(true);
  };

  const handleSheetTouchMove = (e) => {
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  };

  const handleSheetTouchEnd = () => {
    setIsDraggingSheet(false);
    if (dragY > 120) {
      closeEditSheet();
    } else {
      setDragY(0);
    }
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      await axios.put(`${API_URL}/items/${editingItem.id}`, editForm);
      await fetchItems();
      setEditingItem(null);
    } catch (err) {
      console.error("Failed to update item:", err);
      alert("Could not save changes, please try again");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!window.confirm("Delete this item from your closet?")) return;
    setDeletingId(editingItem.id);
    try {
      await axios.delete(`${API_URL}/items/${editingItem.id}`);
      await fetchItems();
      setEditingItem(null);
    } catch (err) {
      console.error("Failed to delete item:", err);
      alert("Could not delete item, please try again");
    } finally {
      setDeletingId(null);
    }
  };

  const colorOptions = [
    ...new Set(items.map((item) => item.color).filter(Boolean)),
  ];

  const visibleItems = items.filter((item) => {
    const matchesCategory = categoryFilter
      ? item.category === categoryFilter
      : true;
    const matchesColor = colorFilter ? item.color === colorFilter : true;
    return matchesCategory && matchesColor;
  });

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
                onChange={handleFileChange}
                hidden
              />
              <span className="upload-icon">+</span>
              <span className="upload-label">
                {uploading ? "Uploading..." : "Add a piece"}
              </span>
            </label>

            {items.length > 0 && (
              <>
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

                {colorOptions.length > 0 && (
                  <div className="season-pills">
                    <button
                      className={`pill ${colorFilter === "" ? "active" : ""}`}
                      onClick={() => setColorFilter("")}
                    >
                      All colors
                    </button>
                    {colorOptions.map((c) => (
                      <button
                        key={c}
                        className={`pill ${colorFilter === c ? "active" : ""}`}
                        onClick={() => setColorFilter(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {items.length === 0 ? (
              <p className="empty-state">
                Your closet is empty — add your first piece.
              </p>
            ) : visibleItems.length === 0 ? (
              <p className="empty-state">No pieces match these filters.</p>
            ) : (
              <div className="item-grid">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="item-card"
                    onClick={() => openEditSheet(item)}
                  >
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

      {editingItem && (
        <div className="modal-overlay" onClick={closeEditSheet}>
          <div
            className="edit-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: `translateY(${dragY}px)`,
              transition: isDraggingSheet ? "none" : "transform 0.25s ease",
            }}
          >
            <div
              className="edit-sheet-drag-zone"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              <div className="edit-sheet-handle" />
            </div>

            <img
              src={editingItem.image_url}
              alt="editing item"
              className="edit-sheet-image"
            />

            <label className="edit-field-label">Category</label>
            <div className="season-pills">
              {CATEGORIES.filter((c) => c.value).map((c) => (
                <button
                  key={c.value}
                  className={`pill ${editForm.category === c.value ? "active" : ""}`}
                  onClick={() =>
                    setEditForm((f) => ({ ...f, category: c.value }))
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>

            <label className="edit-field-label">Season</label>
            <div className="season-pills">
              {SEASONS.filter((s) => s.value).map((s) => (
                <button
                  key={s.value}
                  className={`pill ${editForm.season === s.value ? "active" : ""}`}
                  onClick={() =>
                    setEditForm((f) => ({ ...f, season: s.value }))
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>

            <label className="edit-field-label">Color</label>
            <input
              type="text"
              className="edit-color-input"
              value={editForm.color}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, color: e.target.value }))
              }
              placeholder="e.g. navy, olive, cream"
            />

            <div className="edit-sheet-actions">
              <button
                className="edit-delete-btn"
                onClick={handleDeleteItem}
                disabled={deletingId === editingItem.id}
              >
                {deletingId === editingItem.id ? "Deleting..." : "Delete"}
              </button>
              <button
                className="edit-save-btn"
                onClick={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
