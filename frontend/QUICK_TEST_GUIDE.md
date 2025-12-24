# Quick Test Guide - Meeting Notifications

## 🚀 Quick Start Testing

### Test 1: Schedule Meeting (2 minutes)
```
1. Login as User A (any role)
2. Open chat with User B
3. Click "Schedule Call" button
4. Fill in:
   - Title: "Quick Test"
   - Date: Tomorrow
   - Time: 10:00 AM
5. Click "Schedule"

✅ Expected: Both users see popup notification
✅ Expected: Both see notification in bell icon
```

### Test 2: Schedule from Calendar (2 minutes)
```
1. Login as User A (Manager/Admin)
2. Go to Calendar
3. Click on a date
4. Switch to "Meeting" tab
5. Select User B as participant
6. Fill in meeting details
7. Click "Schedule"

✅ Expected: User A sees "Meeting Scheduled" popup
✅ Expected: User B sees "Meeting Invitation" popup
✅ Expected: Both see notifications in bell icon
```

### Test 3: Cancel Meeting (2 minutes)
```
1. Login as User A (organizer)
2. Go to Calendar
3. Find the scheduled meeting
4. Click delete button
5. Confirm deletion

✅ Expected: User A sees "Meeting Deleted" popup
✅ Expected: User B sees "Meeting Cancelled" popup
✅ Expected: Both see notifications in bell icon
```

### Test 4: Non-Organizer Cannot Delete (1 minute)
```
1. Login as User B (participant)
2. Go to Calendar
3. Find meeting scheduled by User A
4. Try to click delete button

✅ Expected: Error message appears
✅ Expected: Message: "Only the meeting organizer can delete this meeting"
✅ Expected: No notification sent
```

## 🔍 Verification Checklist

### Popup Notifications
- [ ] Appears as blue chat bubble on left side
- [ ] Shows sender name (if available)
- [ ] Shows title and message
- [ ] Auto-dismisses after 8 seconds
- [ ] Can manually close with X button
- [ ] Multiple notifications stack vertically

### Bell Icon
- [ ] Shows unread count badge
- [ ] Notifications persist after refresh
- [ ] Can view all notifications in dropdown
- [ ] Can mark as read/unread
- [ ] Can delete individual notifications
- [ ] Can clear all notifications

### Calendar
- [ ] Meeting appears in organizer's calendar
- [ ] Meeting appears in all participants' calendars
- [ ] Meeting removed from all calendars when deleted
- [ ] Only organizer can delete meeting

## 🧪 Debug Commands

Open browser console and run:

```javascript
// Check current user's notifications
checkNotificationState()

// Check specific user's notifications (e.g., user 2)
checkNotificationState(2)

// Send test notification to current user
testNotificationNow()

// Send test notification to specific user
testNotificationNow(2)

// Verify all participants have notifications
verifyParticipantNotifications()

// Run complete system verification
verifyMeetingNotifications()

// Run diagnostics
diagnoseMeetingNotifications()
```

## 📊 Expected Notification Messages

### Meeting Scheduled (Organizer)
```
Title: Meeting Scheduled: [Meeting Title]
Message: You have scheduled a meeting on [Date] at [Time]
Details: [N] participant(s) invited
```

### Meeting Invitation (Participant)
```
Title: Meeting Invitation: [Meeting Title]
Message: You've been invited to a meeting on [Date] at [Time]
Details: Click to view details
```

### Meeting Deleted (Organizer)
```
Title: Meeting Deleted: [Meeting Title]
Message: You have deleted the meeting "[Meeting Title]" scheduled for [Date]
Details: All participants have been notified
```

### Meeting Cancelled (Participant)
```
Title: Meeting Cancelled: [Meeting Title]
Message: The meeting "[Meeting Title]" scheduled for [Date] at [Time] has been cancelled
Details: Check your calendar for updates
```

## 🎯 Success Criteria

✅ Popup notifications appear immediately
✅ Notifications stored in bell icon
✅ Only organizer can delete meetings
✅ All participants receive notifications
✅ Notifications persist after refresh
✅ Auto-dismiss after 8 seconds
✅ No errors in console

## ⏱️ Total Test Time: ~10 minutes

- Test 1: 2 minutes
- Test 2: 2 minutes
- Test 3: 2 minutes
- Test 4: 1 minute
- Verification: 3 minutes

## 🐛 Troubleshooting

### Popup not appearing?
1. Check browser console for errors
2. Run `checkNotificationState()` to verify notification saved
3. Check if NotificationProvider is in App.js
4. Check if GlobalNotificationCenter is rendered

### Notification not in bell icon?
1. Check localStorage: `localStorage.getItem('notifications_1')`
2. Run `checkNotificationState()` to see stored notifications
3. Refresh page to reload from localStorage

### Only organizer can't delete?
1. Verify `eventToDelete.organizerId === currentUserId`
2. Check browser console for error message
3. Verify user is actually the organizer

### WebSocket not connecting?
1. Check browser console for WebSocket errors
2. Verify backend services are running
3. Check CORS configuration
4. Notifications still work via direct broadcast (fallback)

## 📞 Support

If issues occur:
1. Check browser console for errors
2. Run debug commands above
3. Check localStorage for notifications
4. Verify backend services are running
5. Check network tab for API calls
