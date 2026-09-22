import { useState } from "react";
import client from "../api/client";

export function useOutfits() {
  const [outfits, setOutfits] = useState([]);
  const [season, setSeason] = useState("");
  const [generating, setGenerating] = useState(false);
  const [outfitError, setOutfitError] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateOutfits = async () => {
    setGenerating(true);
    setOutfitError(null);
    setHasGenerated(true);
    try {
      const params = season ? { season } : {};
      const res = await client.get("/outfits", { params });

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

  return {
    outfits,
    season,
    setSeason,
    generating,
    outfitError,
    hasGenerated,
    generateOutfits,
  };
}
