import { useEffect } from "react";
import "./ImageLightbox.css";

function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    if (!src) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [src]);

  if (!src) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <img src={src} alt={alt} className="lightbox-image" />
    </div>
  );
}

export default ImageLightbox;
