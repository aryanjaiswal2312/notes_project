import { X } from "lucide-react";
import { useEffect } from "react";
import { randomQuote } from "../data/quotes";

export default function WelcomeModal({ user, onClose }) {
  const quote = randomQuote();

  useEffect(() => {
    const timer = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  if (!user) return null;

  return (
    <div className="modal-backdrop welcome-backdrop" role="dialog" aria-modal="true">
      <div className="welcome-modal">
        <button className="icon-button close-button" type="button" onClick={onClose} aria-label="Close welcome popup" title="Close">
          <X size={18} />
        </button>
        <p className="eyebrow">Welcome, {user.fullName}</p>
        <h2>{quote}</h2>
      </div>
    </div>
  );
}
