import { CATEGORIES, SEASONS } from "../constants";
import "./EditSheet.css";

function EditSheet({
  item,
  form,
  onFormChange,
  dragY,
  isDragging,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClose,
  onSave,
  onDelete,
  saving,
  deletingId,
}) {
  const toggleSeason = (value) => {
    onFormChange((f) => ({
      ...f,
      seasons: f.seasons.includes(value)
        ? f.seasons.filter((v) => v !== value)
        : [...f.seasons, value],
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="edit-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 0.25s ease",
        }}
      >
        <div
          className="edit-sheet-drag-zone"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="edit-sheet-handle" />
        </div>

        <img
          src={item.image_url}
          alt="editing item"
          className="edit-sheet-image"
        />

        <label className="edit-field-label">Category</label>
        <div className="season-pills">
          {CATEGORIES.filter((c) => c.value).map((c) => (
            <button
              key={c.value}
              className={`pill ${form.category === c.value ? "active" : ""}`}
              onClick={() => onFormChange((f) => ({ ...f, category: c.value }))}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className="edit-field-label">
          Seasons (tap to toggle, pick as many as fit)
        </label>
        <div className="season-pills">
          {SEASONS.filter((s) => s.value).map((s) => (
            <button
              key={s.value}
              className={`pill ${form.seasons.includes(s.value) ? "active" : ""}`}
              onClick={() => toggleSeason(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label className="edit-field-label">Color</label>
        <input
          type="text"
          className="edit-color-input"
          value={form.color}
          onChange={(e) =>
            onFormChange((f) => ({ ...f, color: e.target.value }))
          }
          placeholder="e.g. navy, olive, cream"
        />

        <label className="edit-field-label">Note</label>
        <input
          type="text"
          className="edit-color-input"
          value={form.note}
          onChange={(e) =>
            onFormChange((f) => ({ ...f, note: e.target.value }))
          }
          placeholder="e.g. Zara slim fit, bought in Da Nang"
        />

        <div className="edit-sheet-actions">
          <button
            className="edit-delete-btn"
            onClick={onDelete}
            disabled={deletingId === item.id}
          >
            {deletingId === item.id ? "Deleting..." : "Delete"}
          </button>
          <button className="edit-save-btn" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditSheet;
