import React from 'react';

interface Candidate {
  id: number;
  name: string;
}

interface ResultsChartProps {
  candidates: Candidate[];
  results: number[];
}

const ResultsChart: React.FC<ResultsChartProps> = ({ candidates, results }) => {
  if (!results || results.length === 0) {
    return <p className="text-gray-400">No results yet.</p>;
  }

  const totalVotes = results.reduce((acc, count) => acc + count, 0);
  const maxVotes = Math.max(...results, 1); // Avoid division by zero for width calculation

  return (
    <div className="space-y-4 p-6 bg-gray-800 rounded-lg">
      <h3 className="text-2xl font-bold text-teal-300">Live Results</h3>
      {candidates.map((candidate, index) => {
        const voteCount = results[index] || 0;
        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
        const widthPercentage = totalVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

        return (
          <div key={candidate.id}>
            <div className="flex justify-between items-center mb-1 text-lg">
              <span className="font-semibold text-white">{candidate.name}</span>
              <span className="text-sm text-gray-300">{voteCount} Votes ({percentage}%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-5 shadow-inner">
              <div
                className="bg-teal-500 h-5 rounded-full"
                style={{ width: `${widthPercentage}%`, transition: 'width 0.5s ease-in-out' }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResultsChart;
