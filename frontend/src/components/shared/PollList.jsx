import React, { useState } from 'react';
import PollResultBar from './PollResultBar';
import { authHelpers } from '../../config/auth';
import apiConfig from '../../config/api';

const PollList = ({ items, resultsMap, onVote, onDelete, choice, setChoice, userVotes = {} }) => {
  const safeSetChoice = typeof setChoice === 'function' ? setChoice : null;
  const [expanded, setExpanded] = useState({});
  const [votersMap, setVotersMap] = useState({});

  const toggleVotes = async (pollId) => {
    const willShow = !expanded[pollId];
    if (willShow && !votersMap[pollId]) {
      try {
        const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
        const res = await fetch(`${base}/poll/${pollId}/votes`);
        const list = await res.json();
        setVotersMap(p => ({ ...p, [pollId]: Array.isArray(list) ? list : [] }));
      } catch {}
    }
    setExpanded(p => ({ ...p, [pollId]: willShow }));
  };

  return (
    <div className="space-y-4">
      {Array.isArray(items) && items.length > 0 ? items.map((poll) => {
        const name = (poll.createdByName && String(poll.createdByName).trim()) || 'User';
        const when = poll.createdAt ? new Date(poll.createdAt).toLocaleString() : '';
        const res = resultsMap?.[poll.id] || { totalVotes: 0, optionCounts: {} };
        const options = Array.isArray(poll.options) ? poll.options : [];
        const currentUser = authHelpers.getUserName() || 'User';
        const canDelete = onDelete && name.toLowerCase() === currentUser.toLowerCase();
        const userVote = userVotes[poll.id];
        const hasVoted = !!userVote;

        return (
          <div key={poll.id} className="p-4 rounded-xl shadow-md bg-white border-l-4 border-emerald-500">
            <div className="flex items-center gap-2">
              <div className="font-bold text-lg text-gray-800">{poll.question}</div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">Received</span>
            </div>
            <span className="text-xs text-gray-400 mt-1 block">By {name} • Target: ALL • {when || ''}</span>

            {options.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                {hasVoted ? (
                  <div className="text-sm text-green-600 font-semibold">
                    ✓ You voted: {userVote}
                  </div>
                ) : (
                  <>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={choice?.[poll.id] || ''}
                      onChange={e => safeSetChoice && safeSetChoice(prev => ({ ...prev, [poll.id]: e.target.value }))}
                      disabled={!safeSetChoice}
                    >
                      <option value="">Select option</option>
                      {options.map((opt, idx) => (<option key={idx} value={opt}>{opt}</option>))}
                    </select>
                    <button onClick={() => onVote && onVote(poll, choice?.[poll.id])} disabled={!safeSetChoice || !choice?.[poll.id]} className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:bg-gray-400">
                      Vote
                    </button>
                  </>
                )}
                {canDelete && (
                  <>
                    <button 
                      onClick={() => onDelete(poll.id)} 
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      🗑️ Delete
                    </button>
                    <button
                      onClick={() => toggleVotes(poll.id)}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      {expanded[poll.id] ? 'Hide votes' : 'View votes'} ({res.totalVotes || 0})
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-1">Total votes: {res.totalVotes || 0}</div>
              {Object.entries(res.optionCounts || {}).map(([opt, count]) => (
                <PollResultBar key={opt} label={opt} count={count} total={res.totalVotes || 0} />
              ))}
            </div>

            {expanded[poll.id] && (
              <div className="mt-3 p-3 bg-gray-50 rounded border text-sm">
                {Array.isArray(votersMap[poll.id]) && votersMap[poll.id].length > 0 ? (
                  <ul className="space-y-1">
                    {votersMap[poll.id].map((v, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="font-medium">{v.voterName || 'User'}</span>
                        <span className="text-gray-600">{v.selectedOption || '-'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No votes yet</div>
                )}
              </div>
            )}
          </div>
        );
      }) : <p className="text-gray-500">No active polls found.</p>}
    </div>
  );
};

export default PollList;
