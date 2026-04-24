import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Intro } from "@/pages/Intro";
import { Dashboard } from "@/pages/Dashboard";
import { Recommendations } from "@/pages/Recommendations";
import { StockAnalysis } from "@/pages/StockAnalysis";
import { SectorAnalysis } from "@/pages/SectorAnalysis";
import { StockScreener } from "@/pages/StockScreener";
import { MarketDepth } from "@/pages/MarketDepth";
import { Floorsheet } from "@/pages/Floorsheet";
import { DataManager } from "@/pages/DataManager";
import { CalendarPage } from "@/pages/Calendar";
import { QuantLab } from "@/pages/QuantLab";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Landing / introduction page (default) */}
          <Route index element={<Intro />} />
          <Route path="intro" element={<Navigate to="/" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="stock-analysis" element={<StockAnalysis />} />
          <Route path="sectors" element={<SectorAnalysis />} />
          <Route path="screener" element={<StockScreener />} />
          <Route path="market-depth" element={<MarketDepth />} />
          <Route path="floorsheet" element={<Floorsheet />} />
          <Route path="data-manager" element={<DataManager />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="quant" element={<QuantLab />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
