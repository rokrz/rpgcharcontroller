import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { RulesWindowProvider } from "./context/RulesWindowContext.jsx";
import Header from "./components/Header.jsx";
import RulesWindowLayer from "./components/RulesWindow.jsx";
import HomePage from "./pages/HomePage.jsx";
import CreateSheetPage from "./pages/CreateSheetPage.jsx";
import SheetPage from "./pages/SheetPage.jsx";

export default function App() {
  return (
    <ThemeProvider>
      <RulesWindowProvider>
        <BrowserRouter>
          <div className="min-h-full flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/new" element={<CreateSheetPage />} />
                <Route path="/sheet/:id" element={<SheetPage />} />
              </Routes>
            </main>
          </div>
          <RulesWindowLayer />
        </BrowserRouter>
      </RulesWindowProvider>
    </ThemeProvider>
  );
}
