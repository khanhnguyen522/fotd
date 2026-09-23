import { useEffect, useMemo, useState } from "react";
import client from "../api/client";

export function useCloset(token) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");

  const fetchItems = async () => {
    try {
      const res = await client.get("/items");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchItems();
  }, [token]);

  const uploadItem = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      await client.post("/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchItems();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed, please try again");
    } finally {
      setUploading(false);
    }
  };

  const colorOptions = useMemo(
    () => [...new Set(items.map((item) => item.color).filter(Boolean))],
    [items],
  );

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesCategory = categoryFilter
          ? item.category === categoryFilter
          : true;
        const matchesColor = colorFilter ? item.color === colorFilter : true;
        return matchesCategory && matchesColor;
      }),
    [items, categoryFilter, colorFilter],
  );

  return {
    items,
    visibleItems,
    colorOptions,
    loading,
    uploading,
    categoryFilter,
    setCategoryFilter,
    colorFilter,
    setColorFilter,
    uploadItem,
    fetchItems,
  };
}
