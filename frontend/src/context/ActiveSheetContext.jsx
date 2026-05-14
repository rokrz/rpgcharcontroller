import { createContext, useContext, useState } from "react";

const ActiveSheetContext = createContext(null);

export function ActiveSheetProvider({ children }) {
  const [exportHandlers, setExportHandlers] = useState(null);

  return (
    <ActiveSheetContext.Provider value={{ exportHandlers, setExportHandlers }}>
      {children}
    </ActiveSheetContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActiveSheet() {
  return useContext(ActiveSheetContext);
}
