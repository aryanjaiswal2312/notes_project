import { Minus, Pause, Play, Plus, RotateCcw, Timer, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function TimerWidget() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || minimized) return undefined;
    const interval = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running, minimized]);

  const label = useMemo(() => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }, [seconds]);

  if (!visible) {
    return (
      <>
        <button className="timer-toggle" type="button" onClick={() => setConfirmOpen(true)} title="Timer">
          <Timer size={22} />
        </button>
        {confirmOpen && (
          <div className="modal-backdrop small-backdrop" role="dialog" aria-modal="true">
            <div className="confirm-modal">
              <h2>Do you want to use the timer?</h2>
              <div className="button-row">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => {
                    setVisible(true);
                    setConfirmOpen(false);
                  }}
                >
                  Yes
                </button>
                <button className="secondary-button" type="button" onClick={() => setConfirmOpen(false)}>
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`timer-widget ${minimized ? "minimized" : ""}`}>
      {minimized ? (
        <button className="timer-minimized" type="button" onClick={() => setMinimized(false)}>
          <Timer size={18} />
          <span>{label}</span>
        </button>
      ) : (
        <>
          <div className="timer-head">
            <span>Focus Timer</span>
            <div>
              <button className="icon-button" type="button" onClick={() => setMinimized(true)} title="Minimize">
                <Minus size={16} />
              </button>
              <button className="icon-button close-button" type="button" onClick={() => setVisible(false)} title="Close timer">
                <X size={16} />
              </button>
            </div>
          </div>
          <strong className="timer-face">{label}</strong>
          <input
            type="number"
            min="1"
            max="240"
            value={Math.max(1, Math.round(seconds / 60))}
            onChange={(event) => setSeconds(Math.max(1, Number(event.target.value || 1)) * 60)}
            aria-label="Timer minutes"
          />
          <div className="timer-actions">
            <button className="icon-button" type="button" onClick={() => setRunning(!running)} title={running ? "Pause" : "Start"}>
              {running ? <Pause size={17} /> : <Play size={17} />}
            </button>
            <button className="icon-button" type="button" onClick={() => setSeconds((value) => value + 5)} title="Add 5 seconds">
              <Plus size={17} />
            </button>
            <button className="icon-button" type="button" onClick={() => setSeconds((value) => Math.max(0, value - 5))} title="Remove 5 seconds">
              <Minus size={17} />
            </button>
            <button className="icon-button" type="button" onClick={() => setSeconds(25 * 60)} title="Reset">
              <RotateCcw size={17} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
