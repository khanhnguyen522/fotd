function TagChip({ category, color, note }) {
  if (!category) return null;
  return (
    <div className="tag-chip">
      <span className="tag-chip-hole" />
      <span className="tag-chip-text">
        {category}
        {color ? ` · ${color}` : ""}
        {note ? ` · ${note}` : ""}
      </span>
    </div>
  );
}

export default TagChip;
