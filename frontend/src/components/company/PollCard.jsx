// import React, { useState, useEffect, useCallback } from 'react';
// import SockJS from 'sockjs-client';
// import { Client } from '@stomp/stompjs';
// import apiConfig from '../../config/api';
// import { authHelpers } from '../../config/auth';

// const PollCard = ({ poll }) => {
//   const [selectedOption, setSelectedOption] = useState('');
//   const [voteCounts, setVoteCounts] = useState({});
//   const [totalVotes, setTotalVotes] = useState(0);
//   const [hasVoted, setHasVoted] = useState(false);
//   const [userVote, setUserVote] = useState(null); // Track user's current vote
//   const [showVoters, setShowVoters] = useState(false);
//   const [voters, setVoters] = useState([]);

//   const posterName = poll.createdByName || 'User';
//   const currentUser = authHelpers.getUserName() || 'User';
//   const currentUserEmail = (authHelpers.getUserEmail && authHelpers.getUserEmail()) || '';
//   const currentUserId = (authHelpers.getUserId && authHelpers.getUserId()) || null;
//   const eq = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
//   const isCreator = (
//     (poll.createdById != null && currentUserId != null && String(poll.createdById) === String(currentUserId)) ||
//     eq(poll.createdByName, currentUser) ||
//     eq(poll.createdByName, currentUserEmail) ||
//     eq(poll.createdByEmail, currentUserEmail) ||
//     eq(poll.createdByEmail, currentUser)
//   );

//   const fetchPollResults = useCallback(async () => {
//     try {
//       const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
//       const response = await fetch(`${base}/poll/${poll.id}/results`);
//       const results = await response.json();
//       setVoteCounts(results?.optionCounts || {});
//       setTotalVotes(results?.totalVotes || 0);
//     } catch {}
//   }, [poll.id]);

//   const checkUserVote = useCallback(async () => {
//     try {
//       const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
//       const response = await fetch(`${base}/poll/${poll.id}/votes`);
//       const votes = await response.json();
//       const userVoteData = votes.find(v => v.voterName === currentUser);
//       if (userVoteData) {
//         setUserVote(userVoteData.selectedOption);
//         setHasVoted(true);
//         setSelectedOption(userVoteData.selectedOption);
//       }
//     } catch {}
//   }, [poll.id, currentUser]);

//   useEffect(() => {
//     const socket = new SockJS(apiConfig.websocketUrl);
//     const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 5000 });
//     client.onConnect = () => {
//       client.subscribe(`/topic/poll.${poll.id}.results`, (message) => {
//         try {
//           const results = JSON.parse(message.body || '{}');
//           setVoteCounts(results?.optionCounts || {});
//           setTotalVotes(results?.totalVotes || 0);
//         } catch {}
//       });
//     };
//     client.activate();
//     fetchPollResults();
//     checkUserVote();
//     return () => client.deactivate();
//   }, [poll.id, fetchPollResults, checkUserVote]);

//   const handleVote = async () => {
//     if (!selectedOption) return;
//     try {
//       const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
//       const resp = await fetch(`${base}/poll/vote`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           pollId: poll.id,
//           voterName: authHelpers.getUserName(),
//           selectedOption
//         })
//       });
//       if (resp.ok) {
//         setHasVoted(true);
//         setUserVote(selectedOption);
//       }
//     } catch {}
//   };

//   const pct = (opt) => {
//     if (!totalVotes) return 0;
//     const c = voteCounts?.[opt] || 0;
//     return Math.round((c / totalVotes) * 100);
//   };

//   const loadVoters = useCallback(async () => {
//     try {
//       const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
//       const response = await fetch(`${base}/poll/${poll.id}/votes`);
//       const list = await response.json();
//       setVoters(Array.isArray(list) ? list : []);
//     } catch {}
//   }, [poll.id]);

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6 mb-4">
//       <div className="flex items-center gap-2 mb-2">
//         <h3 className="text-lg font-semibold">{poll.question}</h3>
//         <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">By {posterName}</span>
//       </div>
//       <p className="text-xs text-gray-500 mb-1">{poll.createdAt ? new Date(poll.createdAt).toLocaleString() : ''}</p>

//       <div className="space-y-3">
//         {(poll.options || []).map((option, index) => (
//           <div key={index} className="relative">
//             <label className="flex items-center gap-3 cursor-pointer">
//               <input 
//                 type="radio" 
//                 name={`poll-${poll.id}`} 
//                 value={option} 
//                 checked={selectedOption === option} 
//                 onChange={e => setSelectedOption(e.target.value)} 
//                 disabled={hasVoted} 
//               />
//               <span className="flex-1">{option}</span>
//               {hasVoted && (
//                 <span className="text-sm text-gray-600">
//                   {voteCounts?.[option] || 0} votes ({pct(option)}%)
//                   {userVote === option && <span className="text-blue-600 font-semibold"> ← Your vote</span>}
//                 </span>
//               )}
//             </label>
//             {hasVoted && (
//               <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
//                 <div className={`h-2 rounded-full transition-all ${userVote === option ? 'bg-green-600' : 'bg-blue-600'}`} style={{ width: `${pct(option)}%` }} />
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       <div className="mt-4 flex items-center gap-3">
//         {!hasVoted ? (
//           <button onClick={handleVote} disabled={!selectedOption} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">Vote</button>
//         ) : (
//           <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">Thanks for voting. Live results are updating.</div>
//         )}
//         {isCreator && (
//           <button
//             onClick={async () => { if (!showVoters) { await loadVoters(); } setShowVoters(v => !v); }}
//             className="px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 text-sm"
//           >
//             {showVoters ? 'Hide votes' : 'View votes'} ({totalVotes})
//           </button>
//         )}
//       </div>
//       {showVoters && (
//         <div className="mt-3 p-3 bg-gray-50 rounded border text-sm">
//           {voters.length > 0 ? (
//             <ul className="space-y-1">
//               {voters.map((v, i) => (
//                 <li key={i} className="flex justify-between">
//                   <span className="font-medium">{v.voterName || 'User'}</span>
//                   <span className="text-gray-600">{v.selectedOption || '-'}</span>
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <div className="text-gray-500">No votes yet</div>
//           )}
//         </div>
//       )}
//       <div className="mt-3 text-xs text-gray-500">Live • Target: {poll.targetAudience}</div>
//     </div>
//   );
// };

// export default PollCard;


import React, { useState, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const PollCard = ({ poll }) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [voteCounts, setVoteCounts] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null); // Track user's current vote
  const [showVoters, setShowVoters] = useState(false);
  const [voters, setVoters] = useState([]);

  const posterName = poll.createdByName || 'User';
  const currentUser = authHelpers.getUserName() || 'User';
  const currentUserEmail = (authHelpers.getUserEmail && authHelpers.getUserEmail()) || '';
  const currentUserId = (authHelpers.getUserId && authHelpers.getUserId()) || null;
  const eq = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  const isCreator = (
    (poll.createdById != null && currentUserId != null && String(poll.createdById) === String(currentUserId)) ||
    eq(poll.createdByName, currentUser) ||
    eq(poll.createdByName, currentUserEmail) ||
    eq(poll.createdByEmail, currentUserEmail) ||
    eq(poll.createdByEmail, currentUser)
  );

  const fetchPollResults = useCallback(async () => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const response = await fetch(`${base}/poll/${poll.id}/results`);
      const results = await response.json();
      setVoteCounts(results?.optionCounts || {});
      setTotalVotes(results?.totalVotes || 0);
    } catch {}
  }, [poll.id]);

  const checkUserVote = useCallback(async () => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const response = await fetch(`${base}/poll/${poll.id}/votes`);
      const votes = await response.json();
      const userVoteData = votes.find(v => v.voterName === currentUser);
      if (userVoteData) {
        setUserVote(userVoteData.selectedOption);
        setHasVoted(true);
        setSelectedOption(userVoteData.selectedOption);
      }
    } catch {}
  }, [poll.id, currentUser]);

  useEffect(() => {
    const socket = new SockJS(apiConfig.websocketUrl);
    const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 5000 });
    client.onConnect = () => {
      client.subscribe(`/topic/poll.${poll.id}.results`, (message) => {
        try {
          const results = JSON.parse(message.body || '{}');
          setVoteCounts(results?.optionCounts || {});
          setTotalVotes(results?.totalVotes || 0);
        } catch {}
      });
    };
    client.activate();
    fetchPollResults();
    checkUserVote();
    return () => client.deactivate();
  }, [poll.id, fetchPollResults, checkUserVote]);

  const handleVote = async () => {
    if (!selectedOption) return;
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const resp = await fetch(`${base}/poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll.id,
          voterName: authHelpers.getUserName(),
          selectedOption
        })
      });
      if (resp.ok) {
        setHasVoted(true);
        setUserVote(selectedOption);
      }
    } catch {}
  };

  const pct = (opt) => {
    if (!totalVotes) return 0;
    const c = voteCounts?.[opt] || 0;
    return Math.round((c / totalVotes) * 100);
  };

  const loadVoters = useCallback(async () => {
    try {
      const base = apiConfig.chatService.replace('/api/chat','/api/interactions');
      const response = await fetch(`${base}/poll/${poll.id}/votes`);
      const list = await response.json();
      setVoters(Array.isArray(list) ? list : []);
    } catch {}
  }, [poll.id]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-4 animate-in fade-in duration-300 slide-in-from-bottom-2">
      {/* Header Section */}
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{poll.question}</h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium animate-in zoom-in duration-300">
          By {posterName}
        </span>
      </div>
      
      <p className="text-xs text-gray-500 mb-3 transition-all duration-300 hover:text-gray-700">
        {poll.createdAt ? new Date(poll.createdAt).toLocaleString() : ''}
      </p>

      {/* Options Section */}
      <div className="space-y-3 mb-4">
        {(poll.options || []).map((option, index) => (
          <div key={index} className="relative animate-in fade-in duration-300" style={{ animationDelay: `${index * 100}ms` }}>
            <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all duration-300 ${
              hasVoted 
                ? selectedOption === option 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-gray-50'
                : 'hover:bg-gray-100 border-transparent hover:border-gray-200 border'
            }`}>
              <input 
                type="radio" 
                name={`poll-${poll.id}`} 
                value={option} 
                checked={selectedOption === option} 
                onChange={e => setSelectedOption(e.target.value)} 
                disabled={hasVoted} 
                className="w-4 h-4 text-blue-600"
              />
              <span className="flex-1 font-medium text-gray-700">{option}</span>
              {hasVoted && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">
                    {voteCounts?.[option] || 0} votes ({pct(option)}%)
                  </span>
                  {userVote === option && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold animate-in zoom-in duration-300">
                      Your vote
                    </span>
                  )}
                </div>
              )}
            </label>
            
            {/* Progress Bar */}
            {hasVoted && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden animate-in slide-in-from-left duration-500">
                <div 
                  className={`h-2 rounded-full transition-all duration-700 ${
                    userVote === option ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`} 
                  style={{ width: `${pct(option)}%` }} 
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions Section */}
      <div className="mt-4 flex items-center gap-3">
        {!hasVoted ? (
          <button 
            onClick={handleVote} 
            disabled={!selectedOption} 
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 active:scale-95 font-medium"
          >
            Vote Now
          </button>
        ) : (
          <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium animate-in zoom-in duration-300 flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>Thanks for voting. Live results are updating.</span>
          </div>
        )}
        
        {isCreator && (
          <button
            onClick={async () => { if (!showVoters) { await loadVoters(); } setShowVoters(v => !v); }}
            className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            {showVoters ? 'Hide Votes' : 'View Votes'} ({totalVotes})
          </button>
        )}
      </div>

      {/* Voters List */}
      {showVoters && (
        <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 text-sm animate-in fade-in duration-300 slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium text-gray-700">Voters ({voters.length})</span>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-300 to-transparent"></div>
          </div>
          
          {voters.length > 0 ? (
            <ul className="space-y-2">
              {voters.map((v, i) => (
                <li 
                  key={i} 
                  className="flex justify-between items-center p-2 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-300 animate-in fade-in duration-300"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {v.voterName?.charAt(0) || 'U'}
                    </div>
                    <span className="font-medium text-gray-800">{v.voterName || 'User'}</span>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {v.selectedOption || '-'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No votes yet. Be the first to vote!
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-gray-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="font-medium">Live Poll</span>
        </div>
        <span className="text-gray-600 font-medium">Target: {poll.targetAudience}</span>
      </div>
    </div>
  );
};

export default PollCard;