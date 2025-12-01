# Testing Group Chat Features

## ✅ Fixes Applied

### 1. **Port Correction**
- Changed API endpoints from `localhost:8080` to `localhost:8085` (correct chat service port)
- Updated in `GroupInfoModal.jsx`:
  - Leave group endpoint
  - Delete group endpoint

### 2. **Backend Improvements**
- Added `createdAt` field to NEW_GROUP notification payload
- Fixed repository method calls (using `findByGroupId` instead of `findById`)
- Fixed delete operation (using `delete(group)` instead of `deleteById`)

### 3. **Frontend Logging**
- Added console logs to track WebSocket connections
- Added logs for subscription to user queue and topic
- Added logs for received messages

## 🧪 Testing Steps

### Test 1: Group Creation Sync
1. **User A** creates a group "TestGroup" with members: User B, User C
2. **Expected**: 
   - Group appears in User A's conversation list immediately
   - User B and User C should see the group in their conversation list
   - Check browser console for: `✅ WebSocket connected for user: [email]`
   - Check for: `📨 WebSocket message received on user queue: {type: "NEW_GROUP", ...}`

### Test 2: Leave Group
1. **User B** opens the group info modal
2. **User B** clicks "Leave Group"
3. **Expected**:
   - Confirmation dialog appears
   - After confirming, group disappears from User B's list
   - User A and User C see notification that User B left
   - Check console for: `✅ Left group successfully`

### Test 3: Delete Group
1. **User A** (creator) opens group info modal
2. **User A** should see "Delete" button (only visible to creator)
3. **User A** clicks "Delete Group"
4. **Expected**:
   - Warning dialog appears
   - After confirming, group disappears from all users' lists
   - All users see notification that group was deleted
   - Check console for: `✅ Group deleted successfully`

### Test 4: Permissions
1. **User B** opens group info modal
2. **Expected**: 
   - "Leave" button visible
   - "Delete" button NOT visible (only creator can delete)

## 🔍 Debugging

### If groups don't sync to other members:
1. Check browser console for WebSocket connection logs
2. Verify both users have WebSocket connected: `✅ WebSocket connected for user:`
3. Check if NEW_GROUP message is received: `📨 WebSocket message received on user queue:`
4. Check backend logs for: `📢 Notifying member: [email] about new group:`

### If Leave/Delete buttons don't work:
1. Check browser console for fetch errors
2. Verify port is 8085: `http://localhost:8085/api/group/...`
3. Check backend logs for the endpoint being called
4. Verify CORS is allowing the request

### If Delete button doesn't appear for creator:
1. Check that `currentUser` prop is passed correctly to GroupInfoModal
2. Verify `createdBy` field is set in group data
3. Check console: `isCreator = currentUser.toLowerCase() === createdBy.toLowerCase()`

## 📊 Expected Console Output

### On Group Creation:
```
✅ Group created: {groupId: "...", name: "TestGroup"}
✅ Group created successfully: [groupId]
```

### On WebSocket Connection:
```
✅ WebSocket connected for user: user@email.com
📡 Subscribing to: /user/user@email.com/queue/notify
📡 Subscribing to topic: /topic/notify.user@email.com
```

### On Receiving Group Notification:
```
📨 WebSocket message received on user queue: {
  type: "NEW_GROUP",
  groupId: "...",
  groupName: "TestGroup",
  createdBy: "creator@email.com",
  members: [...],
  message: "creator@email.com added you to TestGroup"
}
```

## 🚀 Next Steps After Testing

1. If all tests pass, the feature is ready for production
2. If any test fails, check the debugging section above
3. Verify with multiple concurrent users
4. Test with offline scenarios (user goes offline, then comes back online)
