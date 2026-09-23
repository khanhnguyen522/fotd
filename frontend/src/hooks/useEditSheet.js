import { useEffect, useRef, useState } from "react";
import client from "../api/client";

const EMPTY_FORM = { category: "", color: "", seasons: [], note: "" };
const CLOSE_DRAG_THRESHOLD = 120;

export function useEditSheet(onItemsChanged) {
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStartY = useRef(0);

  useEffect(() => {
    if (!editingItem) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editingItem]);

  const open = (item) => {
    setEditingItem(item);
    setEditForm({
      category: item.category || "",
      color: item.color || "",
      seasons: item.seasons && item.seasons.length ? item.seasons : [],
      note: item.note || "",
    });
    setDragY(0);
  };

  const close = () => {
    setEditingItem(null);
    setDragY(0);
  };

  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDraggingSheet(true);
  };

  const handleTouchMove = (e) => {
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  };

  const handleTouchEnd = () => {
    setIsDraggingSheet(false);
    if (dragY > CLOSE_DRAG_THRESHOLD) {
      close();
    } else {
      setDragY(0);
    }
  };

  const save = async () => {
    setSavingEdit(true);
    try {
      await client.put(`/items/${editingItem.id}`, editForm);
      await onItemsChanged();
      close();
    } catch (err) {
      console.error("Failed to update item:", err);
      alert("Could not save changes, please try again");
    } finally {
      setSavingEdit(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this item from your closet?")) return;
    setDeletingId(editingItem.id);
    try {
      await client.delete(`/items/${editingItem.id}`);
      await onItemsChanged();
      close();
    } catch (err) {
      console.error("Failed to delete item:", err);
      alert("Could not delete item, please try again");
    } finally {
      setDeletingId(null);
    }
  };

  return {
    editingItem,
    editForm,
    setEditForm,
    savingEdit,
    deletingId,
    dragY,
    isDraggingSheet,
    open,
    close,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    save,
    remove,
  };
}
