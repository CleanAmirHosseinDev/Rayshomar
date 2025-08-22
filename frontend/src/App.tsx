import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ElectionListPage from './pages/ElectionListPage';
import VotingPage from './pages/VotingPage';

function App() {
  return (
    <BrowserRouter>
      <div className="bg-gray-900 text-white min-h-screen font-sans">
        <header className="bg-gray-800 shadow-md">
          <nav className="container mx-auto px-6 py-4">
            <Link to="/" className="text-2xl font-bold text-teal-400 hover:text-teal-300">
              Rayshomar - Blockchain Voting
            </Link>
          </nav>
        </header>

        <main className="container mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<ElectionListPage />} />
            <Route path="/elections/:id" element={<VotingPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
