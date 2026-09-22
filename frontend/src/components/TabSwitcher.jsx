import HandleIcon from "./HandleIcon";
import "./TabSwitcher.css";

const TABS = [
  { id: "closet", label: "Closet" },
  { id: "outfits", label: "Outfits" },
];

function TabSwitcher({ activeTab, onChange }) {
  return (
    <div className="tab-switcher">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {activeTab === tab.id && <HandleIcon />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default TabSwitcher;
