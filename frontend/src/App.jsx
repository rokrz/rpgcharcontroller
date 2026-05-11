import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { RulesWindowProvider } from "./context/RulesWindowContext.jsx";
import MainLayout from "./components/MainLayout.jsx";
import RulesWindowLayer from "./components/RulesWindow.jsx";
import HomePage from "./pages/HomePage.jsx";
import CreateSheetPage from "./pages/CreateSheetPage.jsx";
import SheetPage from "./pages/SheetPage.jsx";
import PrintPage from "./pages/PrintPage.jsx";

export default function App() {
  return (
    <ThemeProvider>
      <RulesWindowProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/sheet/:id/print" element={<PrintPage />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/new" element={<CreateSheetPage />} />
              <Route path="/sheet/:id" element={<SheetPage />} />
            </Route>
          </Routes>
          <RulesWindowLayer />
        </BrowserRouter>
      </RulesWindowProvider>
    </ThemeProvider>
  );
}
