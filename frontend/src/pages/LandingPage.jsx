// import React from 'react';
// import { motion } from 'framer-motion';
// import { useNavigate } from 'react-router-dom';

// const LandingPage = () => {
//   const navigate = useNavigate();

//   const features = [
//     {
//       icon: '💬',
//       title: 'Real-Time Communication',
//       description: 'Chat, video calls, and voice calls with your team instantly'
//     },
//     {
//       icon: '📊',
//       title: 'Project Management',
//       description: 'Track projects, tasks, and team progress in one place'
//     },
//     {
//       icon: '👥',
//       title: 'Team Collaboration',
//       description: 'Work together seamlessly with groups and channels'
//     },
//     {
//       icon: '📈',
//       title: 'Analytics & Reports',
//       description: 'Monitor performance and get insights on team activities'
//     },
//     {
//       icon: '🔔',
//       title: 'Smart Notifications',
//       description: 'Stay updated with real-time alerts and reminders'
//     },
//     {
//       icon: '🔒',
//       title: 'Secure & Private',
//       description: 'Enterprise-grade security for your data and communications'
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
//       {/* Navigation */}
//       <nav className="glass sticky top-0 z-50 border-b border-white/20">
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex items-center justify-between">
//             <motion.div 
//               className="flex items-center gap-3"
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//             >
//               <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
//                 🏢
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold gradient-text">InteractHub</h1>
//                 <p className="text-xs text-gray-600">Enterprise Communication Platform</p>
//               </div>
//             </motion.div>
            
//             <motion.button
//               onClick={() => navigate('/login')}
//               className="btn-primary"
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//             >
//               Sign In
//             </motion.button>
//           </div>
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="max-w-7xl mx-auto px-6 py-20">
//         <div className="grid md:grid-cols-2 gap-12 items-center">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6 }}
//           >
//             <h2 className="text-6xl font-bold mb-6">
//               <span className="gradient-text">Transform</span> Your
//               <br />
//               Team Communication
//             </h2>
//             <p className="text-xl text-gray-600 mb-8">
//               All-in-one platform for seamless collaboration, project management, 
//               and real-time communication. Built for modern teams.
//             </p>
//             <div className="flex gap-4">
//               <motion.button
//                 onClick={() => navigate('/login')}
//                 className="btn-primary text-lg px-8 py-4"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 Get Started →
//               </motion.button>
//               <motion.button
//                 className="btn-outline text-lg px-8 py-4"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 Learn More
//               </motion.button>
//             </div>
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.6, delay: 0.2 }}
//             className="relative"
//           >
//             <div className="card-gradient p-8 hover-lift">
//               <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-6xl shadow-2xl">
//                 💼
//               </div>
//               <div className="mt-6 space-y-3">
//                 <div className="flex items-center gap-3">
//                   <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
//                   <span className="text-sm text-gray-600">1,234 Active Users</span>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
//                   <span className="text-sm text-gray-600">567 Projects Running</span>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
//                   <span className="text-sm text-gray-600">89% Team Satisfaction</span>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="max-w-7xl mx-auto px-6 py-20">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           className="text-center mb-16"
//         >
//           <h3 className="text-4xl font-bold gradient-text mb-4">
//             Everything You Need
//           </h3>
//           <p className="text-xl text-gray-600">
//             Powerful features to boost your team's productivity
//           </p>
//         </motion.div>

//         <div className="grid md:grid-cols-3 gap-8">
//           {features.map((feature, index) => (
//             <motion.div
//               key={index}
//               initial={{ opacity: 0, y: 30 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ delay: index * 0.1 }}
//               className="card-gradient hover-lift"
//             >
//               <div className="text-5xl mb-4">{feature.icon}</div>
//               <h4 className="text-xl font-bold mb-2 gradient-text">{feature.title}</h4>
//               <p className="text-gray-600">{feature.description}</p>
//             </motion.div>
//           ))}
//         </div>
//       </section>

//       {/* Stats Section */}
//       <section className="max-w-7xl mx-auto px-6 py-20">
//         <div className="card-gradient p-12">
//           <div className="grid md:grid-cols-4 gap-8 text-center">
//             {[
//               { number: '10K+', label: 'Active Users' },
//               { number: '50K+', label: 'Messages Daily' },
//               { number: '99.9%', label: 'Uptime' },
//               { number: '24/7', label: 'Support' }
//             ].map((stat, index) => (
//               <motion.div
//                 key={index}
//                 initial={{ opacity: 0, scale: 0.5 }}
//                 whileInView={{ opacity: 1, scale: 1 }}
//                 viewport={{ once: true }}
//                 transition={{ delay: index * 0.1 }}
//               >
//                 <div className="text-5xl font-bold gradient-text mb-2">{stat.number}</div>
//                 <div className="text-gray-600">{stat.label}</div>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="max-w-7xl mx-auto px-6 py-20">
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           className="card-gradient p-12 text-center"
//         >
//           <h3 className="text-4xl font-bold gradient-text mb-4">
//             Ready to Get Started?
//           </h3>
//           <p className="text-xl text-gray-600 mb-8">
//             Join thousands of teams already using InteractHub
//           </p>
//           <motion.button
//             onClick={() => navigate('/login')}
//             className="btn-primary text-lg px-12 py-4"
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//           >
//             Start Free Trial →
//           </motion.button>
//         </motion.div>
//       </section>

//       {/* Footer */}
//       <footer className="glass border-t border-white/20 mt-20">
//         <div className="max-w-7xl mx-auto px-6 py-12">
//           <div className="grid md:grid-cols-4 gap-8">
//             <div>
//               <div className="flex items-center gap-2 mb-4">
//                 <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
//                   🏢
//                 </div>
//                 <span className="font-bold gradient-text">InteractHub</span>
//               </div>
//               <p className="text-sm text-gray-600">
//                 Enterprise communication platform for modern teams.
//               </p>
//             </div>
            
//             <div>
//               <h4 className="font-bold mb-4">Product</h4>
//               <ul className="space-y-2 text-sm text-gray-600">
//                 <li><a href="#" className="hover:text-blue-600">Features</a></li>
//                 <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
//                 <li><a href="#" className="hover:text-blue-600">Security</a></li>
//               </ul>
//             </div>
            
//             <div>
//               <h4 className="font-bold mb-4">Company</h4>
//               <ul className="space-y-2 text-sm text-gray-600">
//                 <li><a href="#" className="hover:text-blue-600">About</a></li>
//                 <li><a href="#" className="hover:text-blue-600">Blog</a></li>
//                 <li><a href="#" className="hover:text-blue-600">Careers</a></li>
//               </ul>
//             </div>
            
//             <div>
//               <h4 className="font-bold mb-4">Support</h4>
//               <ul className="space-y-2 text-sm text-gray-600">
//                 <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
//                 <li><a href="#" className="hover:text-blue-600">Contact</a></li>
//                 <li><a href="#" className="hover:text-blue-600">Status</a></li>
//               </ul>
//             </div>
//           </div>
          
//           <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-gray-600">
//             © 2024 InteractHub. All rights reserved.
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default LandingPage;
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: '💬',
      title: 'Real-Time Communication',
      description: 'Chat, video calls, and voice calls with your team instantly'
    },
    {
      icon: '📊',
      title: 'Project Management',
      description: 'Track projects, tasks, and team progress in one place'
    },
    {
      icon: '👥',
      title: 'Team Collaboration',
      description: 'Work together seamlessly with groups and channels'
    },
    {
      icon: '📈',
      title: 'Analytics & Reports',
      description: 'Monitor performance and get insights on team activities'
    },
    {
      icon: '🔔',
      title: 'Smart Notifications',
      description: 'Stay updated with real-time alerts and reminders'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Enterprise-grade security for your data and communications'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Active Users' },
    { number: '50K+', label: 'Messages Daily' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ];

  const footerLinks = {
    Product: ['Features', 'Pricing', 'Security'],
    Company: ['About', 'Blog', 'Careers'],
    Support: ['Help Center', 'Contact', 'Status']
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 sticky top-0 z-50 border-b-2 border-blue-500/50 shadow-xl relative">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                ⚡
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">InteractHub</h1>
                <p className="text-xs text-blue-200">Enterprise Communication Platform</p>
              </div>
            </motion.div>
            
            <motion.button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign In
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-6xl font-bold mb-6 text-white">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Transform</span> Your
              <br />
              Team Communication
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              All-in-one platform for seamless collaboration, project management, 
              and real-time communication. Built for modern teams.
            </p>
            <div className="flex gap-4">
              <motion.button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
              <motion.button
                className="px-8 py-4 border-2 border-blue-400 text-blue-400 font-semibold rounded-lg hover:bg-blue-400/10 transition-all text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-96 flex items-center justify-center"
          >
            {/* Animated team collaboration illustration */}
            <div className="relative w-full h-full">
              {/* Glow background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-3xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              {/* Central person - Main focus */}
              <motion.div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
                animate={{ 
                  y: [0, -15, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-28 h-28 bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center text-5xl shadow-2xl border-4 border-white/30 backdrop-blur-sm">
                  👩‍💼
                </div>
              </motion.div>

              {/* Top right person */}
              <motion.div
                className="absolute right-12 top-8 z-10"
                animate={{ 
                  y: [0, 20, 0],
                  x: [0, 10, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-4xl shadow-xl border-3 border-white/20">
                  👨‍💻
                </div>
              </motion.div>

              {/* Bottom left person */}
              <motion.div
                className="absolute left-8 bottom-12 z-10"
                animate={{ 
                  y: [0, -20, 0],
                  x: [0, -10, 0]
                }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-4xl shadow-xl border-3 border-white/20">
                  👨‍💼
                </div>
              </motion.div>

              {/* Bottom right person */}
              <motion.div
                className="absolute right-8 bottom-8 z-10"
                animate={{ 
                  y: [0, 18, 0],
                  x: [0, -8, 0]
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-4xl shadow-xl border-3 border-white/20">
                  👩‍💻
                </div>
              </motion.div>

              {/* Floating chat bubble - Great work */}
              <motion.div
                className="absolute top-8 left-12 bg-white/15 backdrop-blur-md border border-white/40 rounded-2xl p-4 w-40 shadow-lg"
                animate={{ 
                  y: [0, -12, 0],
                  rotate: [0, 2, 0]
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="text-sm text-white font-bold">💬 Great work!</div>
                <div className="text-xs text-white/70 mt-1">Keep it up team</div>
              </motion.div>

              {/* Floating chat bubble - Meeting at 3pm */}
              <motion.div
                className="absolute -bottom-20 left-1/4 bg-white/15 backdrop-blur-md border border-white/40 rounded-2xl p-4 w-40 shadow-lg z-20"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, -2, 0]
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
              >
                <div className="text-sm text-white font-bold">📅 Meeting at 3pm</div>
                <div className="text-xs text-white/70 mt-1">Conference room B</div>
              </motion.div>

              {/* Floating decorative elements with enhanced animations */}
              <motion.div
                className="absolute top-16 right-8 text-4xl"
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              >
                ⚡
              </motion.div>

              <motion.div
                className="absolute bottom-12 left-1/4 text-4xl"
                animate={{ 
                  scale: [1, 1.3, 1],
                  y: [0, -8, 0]
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                🎯
              </motion.div>

              <motion.div
                className="absolute top-1/3 right-1/4 text-3xl"
                animate={{ 
                  rotate: [-10, 10, -10],
                  y: [0, 10, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              >
                💡
              </motion.div>

              {/* Connection lines between people */}
              <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <motion.line
                  x1="50%" y1="50%"
                  x2="75%" y2="20%"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                  animate={{ strokeDashoffset: [0, 10] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  strokeDasharray="5,5"
                />
                <motion.line
                  x1="50%" y1="50%"
                  x2="20%" y2="75%"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                  animate={{ strokeDashoffset: [0, 10] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  strokeDasharray="5,5"
                />
                <motion.line
                  x1="50%" y1="50%"
                  x2="75%" y2="75%"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                  animate={{ strokeDashoffset: [0, 10] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  strokeDasharray="5,5"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h3 className="text-4xl font-bold text-white mb-4">
            Everything You Need
          </h3>
          <p className="text-xl text-gray-300">
            Powerful features to boost your team's productivity
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 hover:border-blue-500/50 transition-all"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h4 className="text-xl font-bold mb-2 text-white">{feature.title}</h4>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">{stat.number}</div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white">
                  ⚡
                </div>
                <span className="font-bold text-white">InteractHub</span>
              </div>
              <p className="text-sm text-gray-300">
                Enterprise communication platform for modern teams.
              </p>
            </div>
            
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-bold mb-4 text-white">{category}</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="hover:text-blue-400 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2024 InteractHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;