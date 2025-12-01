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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                🏢
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">InteractHub</h1>
                <p className="text-xs text-gray-600">Enterprise Communication Platform</p>
              </div>
            </motion.div>
            
            <motion.button
              onClick={() => navigate('/login')}
              className="btn-primary"
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
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-6xl font-bold mb-6">
              <span className="gradient-text">Transform</span> Your
              <br />
              Team Communication
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              All-in-one platform for seamless collaboration, project management, 
              and real-time communication. Built for modern teams.
            </p>
            <div className="flex gap-4">
              <motion.button
                onClick={() => navigate('/login')}
                className="btn-primary text-lg px-8 py-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
              <motion.button
                className="btn-outline text-lg px-8 py-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="card-gradient p-8 hover-lift">
              <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-6xl shadow-2xl">
                💼
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h3 className="text-4xl font-bold gradient-text mb-4">
            Everything You Need
          </h3>
          <p className="text-xl text-gray-600">
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
              className="card-gradient hover-lift"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h4 className="text-xl font-bold mb-2 gradient-text">{feature.title}</h4>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="card-gradient p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-5xl font-bold gradient-text mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-gradient p-12 text-center"
        >
          <h3 className="text-4xl font-bold gradient-text mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of teams already using InteractHub
          </p>
          <motion.button
            onClick={() => navigate('/login')}
            className="btn-primary text-lg px-12 py-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Free Trial
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="glass border-t border-white/20 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
                  🏢
                </div>
                <span className="font-bold gradient-text">InteractHub</span>
              </div>
              <p className="text-sm text-gray-600">
                Enterprise communication platform for modern teams.
              </p>
            </div>
            
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-bold mb-4">{category}</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="hover:text-blue-600">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-gray-600">
            © 2024 InteractHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;