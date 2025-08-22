import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Define the type for an election object from our API
interface Election {
  id: string;
  name: string;
}

const ElectionListPage: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        // This request will be proxied by Vite to the backend server
        // to avoid CORS issues during development. I will configure this next.
        const response = await axios.get('/api/v1/elections');
        setElections(response.data.elections);
      } catch (err) {
        setError('Failed to fetch elections. Make sure the backend server is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return <div className="text-center text-2xl text-gray-400">Loading elections...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400 text-2xl p-8 bg-red-900/50 rounded-lg">{error}</div>;
  }

  return (
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
      <h1 className="text-4xl font-bold mb-8 text-teal-300 border-b-2 border-teal-500 pb-4">
        Available Elections
      </h1>
      <div className="space-y-4">
        {elections.length > 0 ? (
          elections.map(election => (
            <Link
              key={election.id}
              to={`/elections/${election.id}`}
              className="block p-6 bg-gray-700 rounded-lg shadow-md hover:bg-gray-600 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              <h2 className="text-2xl font-semibold text-white">{election.name}</h2>
            </Link>
          ))
        ) : (
          <p className="text-gray-400 text-lg">No elections are currently available.</p>
        )}
      </div>
    </div>
  );
};

export default ElectionListPage;
