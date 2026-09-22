import "./Header.css";
import Wordmark from "./Wordmark";

function Header({ onLogout }) {
  return (
    <header className="app-header">
      <button className="logout-btn" onClick={onLogout}>
        Log out
      </button>
      <Wordmark />
      <p className="tagline">Fit of the Day</p>
    </header>
  );
}

export default Header;
