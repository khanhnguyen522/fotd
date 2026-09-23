import { useEffect } from "react";
import "./ImageLightbox.css";

function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    if (!src) return;

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
  }, [src]);

  if (!src) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <img src={src} alt={alt} className="lightbox-image" />
    </div>
  );
}

export default ImageLightbox;
