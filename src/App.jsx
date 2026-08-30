import { BrowserRouter, Routes, Route } from "react-router-dom";
import MatchCV from "./MatchCV.jsx";
import DiagnosticoRRHH from "./DiagnosticoRRHH/DiagnosticoRRHH.jsx";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MatchCV />} />
        <Route path="/diagnostico" element={<DiagnosticoRRHH />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
