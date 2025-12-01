// import React, { useState, useEffect, useRef } from 'react';
// import SockJS from 'sockjs-client';
// import { Client } from '@stomp/stompjs';
// import apiConfig from '../../config/api';

// const AdminMonitoringDashboard = () => {
//   const [managerActivities, setManagerActivities] = useState([]);
//   const [organizationSummary, setOrganizationSummary] = useState({});
//   const [liveInteractions, setLiveInteractions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [connectionStatus, setConnectionStatus] = useState('disconnected');
//   const stompRef = useRef(null);

//   useEffect(() => {
//     fetchDashboardData();
    
//     // Set up WebSocket for real-time updates
//     const chatSocket = new SockJS(apiConfig.websocketUrl);
//     const chatClient = new Client({
//       webSocketFactory: () => chatSocket,
//       onConnect: () => {
//         console.log('Monitoring WebSocket connected');
//         setConnectionStatus('connected');
        
//         // Subscribe to real-time updates
//         chatClient.subscribe('/topic/announcements.reactions', (msg) => {
//           const reaction = JSON.parse(msg.body);
//           console.log('New reaction received:', reaction);
//           // Add to live interactions
//           setLiveInteractions(prev => [{
//             type: reaction.type === 'LIKE' ? 'announcement_like' : 'announcement_comment',
//             announcementId: reaction.announcementId,
//             userName: reaction.userName,
//             content: reaction.type === 'COMMENT' ? reaction.content : '',
//             timestamp: new Date().toISOString()
//           }, ...prev.slice(0, 19)]); // Keep only last 20 interactions
//         });
        
//         chatClient.subscribe('/topic/polls.votes', (msg) => {
//           const vote = JSON.parse(msg.body);
//           console.log('New vote received:', vote);
//           setLiveInteractions(prev => [{
//             type: 'poll_vote',
//             pollId: vote.pollId,
//             userName: vote.voterName,
//             timestamp: new Date().toISOString()
//           }, ...prev.slice(0, 19)]);
//         });
//       },
//       onDisconnect: () => {
//         console.log('Monitoring WebSocket disconnected');
//         setConnectionStatus('disconnected');
//       },
//       onStompError: (error) => {
//         console.error('WebSocket error:', error);
//         setConnectionStatus('error');
//       }
//     });
    
//     chatClient.activate();
//     stompRef.current = chatClient;
    
//     // Set up polling for data updates (less frequent since we have WebSocket)
//     const interval = setInterval(fetchDashboardData, 60000); // Update every 60 seconds
    
//     return () => {
//       clearInterval(interval);
//       if (stompRef.current) {
//         stompRef.current.deactivate();
//       }
//     };
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch all manager activities
//       const activitiesResponse = await fetch('http://localhost:8081/api/admin/monitoring/managers/activities');
//       const activities = await activitiesResponse.json();
//       setManagerActivities(activities);

//       // Fetch organization summary
//       const summaryResponse = await fetch('http://localhost:8081/api/admin/monitoring/summary');
//       const summary = await summaryResponse.json();
//       setOrganizationSummary(summary);

//       // Fetch live interactions
//       const interactionsResponse = await fetch('http://localhost:8081/api/admin/monitoring/interactions/live');
//       const interactions = await interactionsResponse.json();
//       setLiveInteractions(interactions);
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">Admin Monitoring Dashboard</h2>
//         <div className="flex items-center space-x-4">
//           <div className="flex items-center space-x-2">
//             <div className={`w-2 h-2 rounded-full ${
//               connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
//               connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
//             }`}></div>
//             <span className="text-sm text-gray-600">
//               {connectionStatus === 'connected' ? 'Live Monitoring Active' : 
//                connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
//             </span>
//           </div>
//           <button 
//             onClick={fetchDashboardData}
//             className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
//           >
//             Refresh Data
//           </button>
//         </div>
//       </div>

//       {/* Organization Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <div className="flex items-center">
//             <div className="p-2 bg-blue-100 rounded-lg">
//               <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//               </svg>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">Total Managers</p>
//               <p className="text-2xl font-semibold text-gray-900">{organizationSummary.totalManagers || 0}</p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <div className="flex items-center">
//             <div className="p-2 bg-green-100 rounded-lg">
//               <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//               </svg>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">Total Projects</p>
//               <p className="text-2xl font-semibold text-gray-900">{organizationSummary.totalProjects || 0}</p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <div className="flex items-center">
//             <div className="p-2 bg-purple-100 rounded-lg">
//               <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
//               </svg>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">Total Employees</p>
//               <p className="text-2xl font-semibold text-gray-900">{organizationSummary.totalEmployees || 0}</p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <div className="flex items-center">
//             <div className="p-2 bg-orange-100 rounded-lg">
//               <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
//               </svg>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">Active Tasks</p>
//               <p className="text-2xl font-semibold text-gray-900">{organizationSummary.totalTasksInProgress || 0}</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Live Interactions */}
//       <div className="bg-white rounded-lg shadow-md p-6">
//         <h3 className="text-lg font-semibold mb-4 flex items-center">
//           <div className={`w-2 h-2 rounded-full mr-2 ${
//             connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
//           }`}></div>
//           Live Interactions ({liveInteractions.length})
//         </h3>
//         <div className="space-y-3 max-h-96 overflow-y-auto">
//           {liveInteractions.length > 0 ? liveInteractions.map((interaction, index) => (
//             <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
//               <div className="flex items-center space-x-3">
//                 <div className={`w-2 h-2 rounded-full ${
//                   interaction.type === 'poll_vote' ? 'bg-blue-500' : 
//                   interaction.type === 'announcement_like' ? 'bg-green-500' : 'bg-purple-500'
//                 }`}></div>
//                 <div>
//                   <span className="text-sm font-medium capitalize">
//                     {interaction.type.replace('_', ' ')}
//                   </span>
//                   {interaction.userName && (
//                     <span className="text-xs text-gray-500 ml-2">by {interaction.userName}</span>
//                   )}
//                 </div>
//               </div>
//               <div className="text-right">
//                 {interaction.content && (
//                   <div className="text-sm text-gray-600 max-w-xs truncate">
//                     "{interaction.content}"
//                   </div>
//                 )}
//                 <div className="text-xs text-gray-500">
//                   {new Date(interaction.timestamp).toLocaleTimeString()}
//                 </div>
//               </div>
//             </div>
//           )) : (
//             <div className="text-center py-8 text-gray-500">
//               <div className="text-4xl mb-2">📊</div>
//               <p>No live interactions yet</p>
//               <p className="text-sm">Interactions will appear here in real-time</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Manager Activities */}
//       <div className="bg-white rounded-lg shadow-md p-6">
//         <h3 className="text-lg font-semibold mb-4">Manager Activities</h3>
//         <div className="space-y-4">
//           {managerActivities.map((activity, index) => (
//             <div key={index} className="border border-gray-200 rounded-lg p-4">
//               <div className="flex justify-between items-start mb-3">
//                 <h4 className="text-md font-medium">Manager {activity.managerId}</h4>
//                 <span className="text-sm text-gray-500">
//                   Last updated: {new Date().toLocaleTimeString()}
//                 </span>
//               </div>
              
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-blue-600">{activity.projectCount || 0}</div>
//                   <div className="text-sm text-gray-600">Projects</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-green-600">{activity.employeeCount || 0}</div>
//                   <div className="text-sm text-gray-600">Employees</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-purple-600">{activity.groupCount || 0}</div>
//                   <div className="text-sm text-gray-600">Groups</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-orange-600">{activity.taskCount || 0}</div>
//                   <div className="text-sm text-gray-600">Tasks</div>
//                 </div>
//               </div>

//               {/* Recent Projects */}
//               {activity.projects && activity.projects.length > 0 && (
//                 <div className="mt-4">
//                   <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Projects:</h5>
//                   <div className="flex flex-wrap gap-2">
//                     {activity.projects.slice(0, 3).map((project, pIndex) => (
//                       <span key={pIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
//                         {project.title}
//                       </span>
//                     ))}
//                     {activity.projects.length > 3 && (
//                       <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
//                         +{activity.projects.length - 3} more
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminMonitoringDashboard;





import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from '../../config/api';

const AdminMonitoringDashboard = () => {
  const [managerActivities, setManagerActivities] = useState([]);
  const [organizationSummary, setOrganizationSummary] = useState({});
  const [liveInteractions, setLiveInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const stompRef = useRef(null);

  // --- FUNCTIONALITY: API and WebSocket Setup (UNCHANGED) ---
  useEffect(() => {
    fetchDashboardData();
    
    const chatSocket = new SockJS(apiConfig.websocketUrl);
    const chatClient = new Client({
      webSocketFactory: () => chatSocket,
      onConnect: () => {
        console.log('Monitoring WebSocket connected');
        setConnectionStatus('connected');
        
        chatClient.subscribe('/topic/announcements.reactions', (msg) => {
          const reaction = JSON.parse(msg.body);
          setLiveInteractions(prev => [{
            type: reaction.type === 'LIKE' ? 'announcement_like' : 'announcement_comment',
            announcementId: reaction.announcementId,
            userName: reaction.userName,
            content: reaction.type === 'COMMENT' ? reaction.content : '',
            timestamp: new Date().toISOString()
          }, ...prev.slice(0, 19)]);
        });
        
        chatClient.subscribe('/topic/polls.votes', (msg) => {
          const vote = JSON.parse(msg.body);
          setLiveInteractions(prev => [{
            type: 'poll_vote',
            pollId: vote.pollId,
            userName: vote.voterName,
            timestamp: new Date().toISOString()
          }, ...prev.slice(0, 19)]);
        });
      },
      onDisconnect: () => { setConnectionStatus('disconnected'); },
      onStompError: (error) => { setConnectionStatus('error'); }
    });
    
    chatClient.activate();
    stompRef.current = chatClient;
    
    const interval = setInterval(fetchDashboardData, 60000); 
    
    return () => {
      clearInterval(interval);
      if (stompRef.current) {
        stompRef.current.deactivate();
      }
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const activitiesResponse = await fetch('http://localhost:8081/api/admin/monitoring/managers/activities');
      const activities = await activitiesResponse.json();
      setManagerActivities(activities);

      const summaryResponse = await fetch('http://localhost:8081/api/admin/monitoring/summary');
      const summary = await summaryResponse.json();
      setOrganizationSummary(summary);

      const interactionsResponse = await fetch('http://localhost:8081/api/admin/monitoring/interactions/live');
      const interactions = await interactionsResponse.json();
      setLiveInteractions(interactions);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  // -------------------------------------------------------------------

  // Helper for status dot
  const StatusDot = ({ status }) => {
    let color;
    if (status === 'connected') color = 'bg-green-500 animate-pulse';
    else if (status === 'error') color = 'bg-red-500';
    else color = 'bg-yellow-500';
    return <div className={`w-3 h-3 rounded-full ${color}`}></div>;
  };
  
  // Helper for Interaction type icon
  const InteractionIcon = ({ type }) => {
      let icon, color;
      if (type === 'poll_vote') { icon = '🗳️'; color = 'text-blue-500'; }
      else if (type === 'announcement_like') { icon = '👍'; color = 'text-green-500'; }
      else { icon = '📝'; color = 'text-purple-500'; }
      return <span className={`text-xl ${color}`}>{icon}</span>;
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-500"></div>
        <p className="text-lg text-teal-600 ml-4">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <h2 className="text-3xl font-extrabold text-teal-600">📊 Admin Monitoring Dashboard</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-white shadow-sm border border-gray-200">
            <StatusDot status={connectionStatus} />
            <span className="text-sm font-medium text-gray-700">
              {connectionStatus === 'connected' ? 'Live Monitoring Active' : 
               connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
            </span>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 shadow-md transition-colors"
          >
            Refresh Data
          </button>
        </div>
        
      </div>

      {/* Real-Time Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Announcements Count */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl shadow-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Recent Announcements</p>
              <p className="text-4xl font-bold text-blue-900 mt-2">
                {liveInteractions.filter(i => i.type === 'announcement_created').length}
              </p>
              <p className="text-xs text-blue-600 mt-1">In the last hour</p>
            </div>
            <div className="text-5xl">📢</div>
          </div>
        </div>

        {/* Recent Polls Count */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-lg border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700">Recent Polls</p>
              <p className="text-4xl font-bold text-purple-900 mt-2">
                {liveInteractions.filter(i => i.type === 'poll_created').length}
              </p>
              <p className="text-xs text-purple-600 mt-1">In the last hour</p>
            </div>
            <div className="text-5xl">📊</div>
          </div>
        </div>

        {/* Total Activity */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700">Total Activity</p>
              <p className="text-4xl font-bold text-green-900 mt-2">{liveInteractions.length}</p>
              <p className="text-xs text-green-600 mt-1">Content items created</p>
            </div>
            <div className="text-5xl">⚡</div>
          </div>
        </div>
      </div>

      {/* Live Interactions - Full Width */}
      <div>
        {/* Live Content Activity Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span>⚡</span> Live Content Activity
              </h3>
              <p className="text-sm text-gray-500 mt-1">Recent announcements and polls • Auto-refresh every 60s</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <StatusDot status={connectionStatus} />
                <span className="ml-1">Live</span>
              </span>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveInteractions.length > 0 ? (
              liveInteractions.map((interaction, index) => (
                <div 
                  key={index} 
                  className={`rounded-xl shadow-sm p-5 border-l-4 hover:shadow-lg transition-all cursor-pointer ${
                    interaction.type === 'announcement_created' 
                      ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-l-blue-500' 
                      : 'bg-gradient-to-br from-purple-50 to-pink-50 border-l-purple-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{interaction.icon || (interaction.type === 'announcement_created' ? '📢' : '📊')}</div>
                    <div className="flex-1">
                      {interaction.type === 'announcement_created' ? (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-base font-bold text-gray-800 line-clamp-2">{interaction.title}</p>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold whitespace-nowrap ml-2">
                              {interaction.announcementType}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                            <span>👤</span> 
                            <span className="font-medium">{interaction.createdBy}</span>
                          </p>
                          {interaction.likesCount > 0 && (
                            <p className="text-sm text-blue-600 flex items-center gap-1 mt-2">
                              <span>👍</span> {interaction.likesCount} likes
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-base font-bold text-gray-800 line-clamp-2">{interaction.question}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                              interaction.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {interaction.isActive ? '✓ Active' : '✕ Closed'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                            <span>👤</span> 
                            <span className="font-medium">{interaction.createdBy}</span>
                          </p>
                        </>
                      )}
                      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                        <span>🕐</span> {new Date(interaction.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-gray-400 text-6xl mb-4">📭</div>
                <p className="text-gray-600 font-semibold text-lg">No recent content activity</p>
                <p className="text-sm text-gray-400 mt-2">Announcements and polls will appear here as they're created</p>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

// Helper component for activity stat display
const ActivityStat = ({ count, label, color }) => {
    const colorClasses = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        purple: 'text-purple-600',
        orange: 'text-orange-600',
    }[color];

    return (
        <div className="text-center p-2 rounded-md bg-gray-50">
            <div className={`text-2xl font-extrabold ${colorClasses}`}>{count}</div>
            <div className="text-sm text-gray-600">{label}</div>
        </div>
    );
}

export default AdminMonitoringDashboard;