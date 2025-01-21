import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ClientView from "./pages/ClientView";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/client-view" element={<ClientView />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;