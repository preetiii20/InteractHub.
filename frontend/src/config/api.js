// API Configuration - Environment-based URLs
const config = {
  development: {
    adminService: 'http://localhost:8081/api/admin',
    managerService: 'http://localhost:8083/api/manager',
    chatService: 'http://localhost:8085/api/chat',
    notificationService: 'http://localhost:8090/api/notify',
    websocketUrl: 'http://localhost:8085/ws',
    adminWebsocketUrl: 'http://localhost:8081/ws'
  },
  production: {
    adminService: process.env.REACT_APP_ADMIN_SERVICE_URL || 'https://api.interacthub.com/admin',
    managerService: process.env.REACT_APP_MANAGER_SERVICE_URL || 'https://api.interacthub.com/manager',
    chatService: process.env.REACT_APP_CHAT_SERVICE_URL || 'https://api.interacthub.com/chat',
    notificationService: process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'https://api.interacthub.com/notify',
    websocketUrl: process.env.REACT_APP_WEBSOCKET_URL || 'wss://api.interacthub.com/ws',
    adminWebsocketUrl: process.env.REACT_APP_ADMIN_WEBSOCKET_URL || 'wss://api.interacthub.com/admin/ws'
  }
};

const environment = process.env.NODE_ENV || 'development';
export default config[environment];






