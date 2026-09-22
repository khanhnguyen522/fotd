import { useState } from "react";
import "./App.css";
import ClosetTab from "./components/ClosetTab";
import EditSheet from "./components/EditSheet";
import Header from "./components/Header";
import LoginScreen from "./components/LoginScreen";
import OutfitsTab from "./components/OutfitsTab";
import TabSwitcher from "./components/TabSwitcher";
import { useAuth } from "./hooks/useAuth";
import { useCloset } from "./hooks/useCloset";
import { useEditSheet } from "./hooks/useEditSheet";
import { useOutfits } from "./hooks/useOutfits";

function App() {
  const { token, setToken, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("closet");

  const closet = useCloset(token);
  const outfits = useOutfits();
  const editSheet = useEditSheet(closet.fetchItems);

  if (!token) {
    return <LoginScreen onLogin={setToken} />;
  }

  return (
    <div className="app-shell">
      <Header onLogout={logout} />
      <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />

      <main className="app-main">
        {activeTab === "closet" && (
          <ClosetTab
            items={closet.items}
            visibleItems={closet.visibleItems}
            colorOptions={closet.colorOptions}
            uploading={closet.uploading}
            categoryFilter={closet.categoryFilter}
            onCategoryFilterChange={closet.setCategoryFilter}
            colorFilter={closet.colorFilter}
            onColorFilterChange={closet.setColorFilter}
            onUpload={closet.uploadItem}
            onSelectItem={editSheet.open}
          />
        )}

        {activeTab === "outfits" && (
          <OutfitsTab
            season={outfits.season}
            onSeasonChange={outfits.setSeason}
            generating={outfits.generating}
            onGenerate={outfits.generateOutfits}
            outfitError={outfits.outfitError}
            hasGenerated={outfits.hasGenerated}
            outfits={outfits.outfits}
          />
        )}
      </main>

      {editSheet.editingItem && (
        <EditSheet
          item={editSheet.editingItem}
          form={editSheet.editForm}
          onFormChange={editSheet.setEditForm}
          dragY={editSheet.dragY}
          isDragging={editSheet.isDraggingSheet}
          onTouchStart={editSheet.handleTouchStart}
          onTouchMove={editSheet.handleTouchMove}
          onTouchEnd={editSheet.handleTouchEnd}
          onClose={editSheet.close}
          onSave={editSheet.save}
          onDelete={editSheet.remove}
          saving={editSheet.savingEdit}
          deletingId={editSheet.deletingId}
        />
      )}
    </div>
  );
}

export default App;
