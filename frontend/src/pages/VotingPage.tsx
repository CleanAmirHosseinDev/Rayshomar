import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ResultsChart from '../components/ResultsChart';

// Define the types for our detailed election data
interface Candidate {
  id: number;
  name: string;
}

interface ElectionDetails {
  id: string;
  name: string;
  candidates: Candidate[];
  results: number[];
}

const VotingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<ElectionDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [voteTx, setVoteTx] = useState<string | null>(null);

  useEffect(() => {
    const fetchElectionDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/v1/elections/${id}`);
        setElection(response.data.election);
      } catch (err) {
        setError('Failed to fetch election details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchElectionDetails();
  }, [id]);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCandidate === null) {
      alert('Please select a candidate to vote for.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setVoteTx(null);

    try {
      // The backend expects a weighted array. For a single-choice vote,
      // we create an array of zeros and put a 1 at the selected index.
      const votes = election!.candidates.map(c => (c.id === selectedCandidate ? 1 : 0));

      const response = await axios.post(`/api/v1/elections/${id}/vote`, { votes });

      setVoteTx(response.data.txHash);
      // NOTE: In a real app, we would poll for updated results after a successful vote.
      // For this demo, the mocked results are static.
    } catch (err) {
      setError('Failed to submit vote. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center text-2xl text-gray-400">Loading Election Details...</div>;
  }

  if (error && !election) {
    return <div className="text-center text-red-400 text-2xl p-8 bg-red-900/50 rounded-lg">{error}</div>;
  }

  if (!election) {
    return <div className="text-center text-2xl text-gray-400">Election not found.</div>
  }

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
        <h1 className="text-4xl font-bold mb-2 text-teal-300">{election.name}</h1>
        <Link to="/" className="text-teal-500 hover:text-teal-400">&larr; Back to all elections</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Voting Form */}
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-bold mb-6 text-teal-300">Cast Your Vote</h2>
          {voteTx ? (
             <div className="text-center p-4 bg-green-900/50 rounded-lg">
                <p className="text-green-300 font-bold text-xl">Vote Submitted Successfully!</p>
                <p className="text-xs text-gray-400 mt-2">Mock Tx Hash: <span className="break-all">{voteTx}</span></p>
                <button onClick={() => setVoteTx(null)} className="mt-4 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded">
                  Cast Another Vote
                </button>
             </div>
          ) : (
            <form onSubmit={handleVoteSubmit} className="space-y-6">
              <div className="space-y-4">
                {election.candidates.map(candidate => (
                  <label key={candidate.id} className="flex items-center p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                    <input
                      type="radio"
                      name="candidate"
                      value={candidate.id}
                      checked={selectedCandidate === candidate.id}
                      onChange={() => setSelectedCandidate(candidate.id)}
                      className="h-6 w-6 bg-gray-900 border-gray-600 text-teal-500 focus:ring-teal-500"
                    />
                    <span className="ml-4 text-xl text-white">{candidate.name}</span>
                  </label>
                ))}
              </div>
              <button type="submit" disabled={isSubmitting || selectedCandidate === null} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg text-xl transition-all duration-300">
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </button>
              {error && <p className="text-red-400 text-center">{error}</p>}
            </form>
          )}
        </div>

        {/* Results Chart */}
        <ResultsChart candidates={election.candidates} results={election.results} />
      </div>
    </div>
  );
};

export default VotingPage;
