import { useState } from "react";
import { OUTFIT_SLOTS, SEASONS } from "../constants";
import ImageLightbox from "./ImageLightbox";
import "./OutfitsTab.css";

function OutfitsTab({
  season,
  onSeasonChange,
  useWeather,
  onToggleWeather,
  weatherInfo,
  generating,
  onGenerate,
  outfitError,
  hasGenerated,
  outfits,
}) {
  const [lightboxSrc, setLightboxSrc] = useState(null);

  return (
    <section>
      <div className="season-pills">
        <button
          className={`pill ${useWeather ? "active" : ""}`}
          onClick={() => onToggleWeather(!useWeather)}
        >
          Auto (weather)
        </button>
        {!useWeather &&
          SEASONS.map((s) => (
            <button
              key={s.value}
              className={`pill ${season === s.value ? "active" : ""}`}
              onClick={() => onSeasonChange(s.value)}
            >
              {s.label}
            </button>
          ))}
      </div>

      {weatherInfo && (
        <p className="weather-note">
          {Math.round(weatherInfo.temperatureF)}°F
          {weatherInfo.isRainy ? ", rainy" : ""}
          {weatherInfo.isWindy ? ", windy" : ""} outside — showing{" "}
          {weatherInfo.seasons.join("/")} picks
        </p>
      )}

      <button
        className="generate-btn"
        onClick={onGenerate}
        disabled={generating}
      >
        {generating ? "Styling..." : "Generate Outfits"}
      </button>

      {outfitError && <p className="error-text">{outfitError}</p>}

      {!hasGenerated && !outfitError && (
        <p className="empty-state">Tap the button to see outfit suggestions.</p>
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
              {OUTFIT_SLOTS.map((slot) =>
                outfit[slot] ? (
                  <div key={slot} className="outfit-piece">
                    <img
                      src={outfit[slot].image_url}
                      alt={slot}
                      onClick={() => setLightboxSrc(outfit[slot].image_url)}
                    />
                    <span className="piece-label">{outfit[slot].color}</span>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>

      <ImageLightbox
        src={lightboxSrc}
        alt="clothing item"
        onClose={() => setLightboxSrc(null)}
      />
    </section>
  );
}

export default OutfitsTab;
