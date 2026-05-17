import { useState } from "react";

interface Crumb {
  label: string;
  href?: string;
}

interface TopBarProps {
  breadcrumbs?: Crumb[];
}

export default function TopBar({ breadcrumbs }: TopBarProps) {
  const [query, setQuery] = useState("");

  return (
    <header
      className="fixed top-0 right-0 z-40 flex justify-between items-center h-16 px-6"
      style={{
        left: "220px",
        width: "calc(100% - 220px)",
        background: "rgba(17,20,18,0.7)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #424a33",
      }}
    >
      {/* Breadcrumbs or Search */}
      {breadcrumbs ? (
        <div className="flex items-center gap-2" style={{ fontSize: "14px" }}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && (
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#c2caad" }}>
                  chevron_right
                </span>
              )}
              <span style={{ color: i === breadcrumbs.length - 1 ? "#e1e3de" : "#c2caad", fontWeight: i === breadcrumbs.length - 1 ? 600 : 400 }}>
                {crumb.label}
              </span>
            </span>
          ))}
        </div>
      ) : (
        <div className="relative" style={{ width: "360px" }}>
          <span
            className="material-symbols-outlined absolute top-1/2 -translate-y-1/2"
            style={{ left: "12px", fontSize: "20px", color: "#c2caad" }}
          >
            search
          </span>
          <input
            data-testid="input-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full py-2 pl-10 pr-12 rounded-full transition-all"
            style={{
              background: "#111613",
              border: "1px solid #424a33",
              color: "#e1e3de",
              fontSize: "14px",
              outline: "none",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#B6FF00"; }}
            onBlur={(e) => { e.target.style.borderColor = "#424a33"; }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5"
            style={{ right: "12px", color: "#c2caad", fontSize: "11px", fontFamily: "monospace" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>keyboard_command_key</span>
            K
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          data-testid="button-notifications"
          className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{ border: "1px solid #424a33", color: "#c2caad" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>notifications</span>
          <span
            className="absolute rounded-full"
            style={{ top: "8px", right: "8px", width: "7px", height: "7px", background: "#B6FF00" }}
          />
        </button>
        <button
          data-testid="button-settings-top"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{ border: "1px solid #424a33", color: "#c2caad" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>settings</span>
        </button>

        <div style={{ width: "1px", height: "24px", background: "#424a33" }} />

        <button
          data-testid="button-profile"
          className="flex items-center gap-2 p-1 pr-3 rounded-full transition-all"
          style={{ border: "1px solid transparent" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "#B6FF00", color: "#050706" }}
          >
            C
          </div>
          <span style={{ fontSize: "14px", color: "#e1e3de", fontWeight: 500 }}>Perfil</span>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#c2caad" }}>expand_more</span>
        </button>
      </div>
    </header>
  );
}
