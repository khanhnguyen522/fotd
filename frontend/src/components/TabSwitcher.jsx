import HandleIcon from "./HandleIcon";
import "./TabSwitcher.css";

const TABS = [
  { id: "closet", label: "Closet" },
  { id: "outfits", label: "Outfits" },
];

function TabSwitcher({ activeTab, onChange, closetCount }) {
  return (
    <div className="tab-switcher">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {activeTab === tab.id && <HandleIcon />}
          {tab.id === "closet" && closetCount != null
            ? `${tab.label} (${closetCount})`
            : tab.label}
        </button>
      ))}
    </div>
  );
}

export default TabSwitcher;
