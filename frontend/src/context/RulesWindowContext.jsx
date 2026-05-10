import { createContext, useCallback, useContext, useState } from "react";

const RulesWindowContext = createContext(null);

export function RulesWindowProvider({ children }) {
  const [windows, setWindows] = useState([]);

  const openWindow = useCallback((entry) => {
    const id = Date.now();
    setWindows((prev) => [...prev, { id, ...entry, position: { x: 60 + (prev.length % 5) * 24, y: 60 + (prev.length % 5) * 24 } }]);
  }, []);

  const closeWindow = useCallback((id) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return (
    <RulesWindowContext.Provider value={{ windows, openWindow, closeWindow }}>
      {children}
    </RulesWindowContext.Provider>
  );
}

export function useRulesWindow() {
  return useContext(RulesWindowContext);
}
