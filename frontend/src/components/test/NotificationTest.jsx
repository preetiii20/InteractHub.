import { useState } from 'react';
import notificationService from '../../services/NotificationService';

const NotificationTest = () => {
  const [testUserId, setTestUserId] = useState('2');
  const [result, setResult] = useState('');

  const testNotification = () => {
    try {
      const success = notificationService.sendMeetingInvitation(Number(testUserId), {
        id: Date.now(),
        title: 'Test Meeting',
        date: '2025-12-22',
        time: '14:00',
        jitsiLink: 'https://meet.jit.si/test'
      });
      
      if (success) {
        setResult(`✅ Test notification sent to user ${testUserId}`);
      } else {
        setResult(`❌ Failed to send notification to user ${testUserId}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
  };

  const checkNotifications = () => {
    try {
      const notifications = notificationService.getNotifications(Number(testUserId));
      setResult(`📬 User ${testUserId} has ${notifications.length} notifications`);
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px',
      minWidth: '200px'
    }}>
      <h4>Notification Test</h4>
      <div style={{ marginBottom: '10px' }}>
        <label>User ID: </label>
        <input
          type="number"
          value={testUserId}
          onChange={(e) => setTestUserId(e.target.value)}
          style={{ width: '50px', marginLeft: '5px' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={testNotification} style={{ marginRight: '5px', fontSize: '11px' }}>
          Send Test
        </button>
        <button onClick={checkNotifications} style={{ fontSize: '11px' }}>
          Check
        </button>
      </div>
      {result && (
        <div style={{ 
          padding: '5px', 
          background: result.includes('✅') ? '#d4edda' : result.includes('❌') ? '#f8d7da' : '#d1ecf1',
          borderRadius: '3px',
          fontSize: '11px'
        }}>
          {result}
        </div>
      )}
    </div>
  );
};

export default NotificationTest;