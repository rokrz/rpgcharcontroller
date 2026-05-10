import { X } from "lucide-react";
import { Rnd } from "react-rnd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRulesWindow } from "../context/RulesWindowContext.jsx";

function SingleWindow({ win, onClose }) {
  return (
    <Rnd
      default={{ x: win.position.x, y: win.position.y, width: 340, height: 400 }}
      minWidth={260}
      minHeight={200}
      bounds="window"
      cancel=".rnd-no-drag"
      resizeHandleClasses={{
        bottomRight: "rnd-handle-corner",
        bottomLeft: "rnd-handle-corner",
        topRight: "rnd-handle-corner",
        topLeft: "rnd-handle-corner",
        bottom: "rnd-handle-edge-h",
        top: "rnd-handle-edge-h",
        left: "rnd-handle-edge-v",
        right: "rnd-handle-edge-v",
      }}
      style={{ zIndex: 1000 }}
    >
      <div className="h-full flex flex-col bg-parchment-deep border border-parchment-edge rounded-sheet shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-parchment border-b border-parchment-edge cursor-move shrink-0">
          <span className="font-display text-xs uppercase tracking-widest text-ink-muted truncate">{win.title}</span>
          <button
            className="rnd-no-drag text-ink-muted hover:text-burgundy transition"
            onClick={() => onClose(win.id)}
          >
            <X size={14} />
          </button>
        </div>
        <div className="rnd-no-drag flex-1 overflow-y-auto px-3 py-2 text-sm text-ink font-serif leading-relaxed prose prose-sm max-w-none">
          {win.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{win.content}</ReactMarkdown>
          ) : (
            <p className="text-ink-muted italic">Sem descrição disponível.</p>
          )}
        </div>
        {win.source && (
          <div className="rnd-no-drag px-3 py-1.5 border-t border-parchment-edge shrink-0">
            <span className="text-[10px] text-ink-muted font-display uppercase tracking-widest">{win.source}</span>
          </div>
        )}
      </div>
    </Rnd>
  );
}

export default function RulesWindowLayer() {
  const { windows, closeWindow } = useRulesWindow();

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 999 }}>
      {windows.map((win) => (
        <div key={win.id} className="pointer-events-auto">
          <SingleWindow win={win} onClose={closeWindow} />
        </div>
      ))}
    </div>
  );
}
