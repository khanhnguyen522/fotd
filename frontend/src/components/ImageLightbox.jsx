import "./ImageLightbox.css";

function ImageLightbox({ src, alt, onClose }) {
  if (!src) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <img src={src} alt={alt} className="lightbox-image" />
    </div>
  );
}

export default ImageLightbox;
