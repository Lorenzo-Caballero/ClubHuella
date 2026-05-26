import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Redirect from "./Redirect"; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Redirect />} />
        
      </Routes>
    </Router>
  );
}

export default App;