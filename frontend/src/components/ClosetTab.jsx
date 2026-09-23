import { useRef } from "react";
import { CATEGORIES } from "../constants";
import "./ClosetTab.css";
import TagChip from "./TagChip";

function ClosetTab({
  items,
  visibleItems,
  colorOptions,
  loading,
  uploading,
  categoryFilter,
  onCategoryFilterChange,
  colorFilter,
  onColorFilterChange,
  onUpload,
  onSelectItem,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await onUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
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
                onClick={() => onCategoryFilterChange(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {colorOptions.length > 0 && (
            <div className="season-pills">
              <button
                className={`pill ${colorFilter === "" ? "active" : ""}`}
                onClick={() => onColorFilterChange("")}
              >
                All colors
              </button>
              {colorOptions.map((c) => (
                <button
                  key={c}
                  className={`pill ${colorFilter === c ? "active" : ""}`}
                  onClick={() => onColorFilterChange(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {loading ? (
        <div className="item-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="item-card skeleton-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
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
              onClick={() => onSelectItem(item)}
            >
              <img src={item.image_url} alt="clothing item" />
              <TagChip
                category={item.category}
                color={item.color}
                note={item.note}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ClosetTab;
