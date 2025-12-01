# Known Issues and Solutions

## Issue 1: Group Created on One Side Only ❌

### Problem
When User A creates a group with User B and User C:
- ✅ Group appears in User A's conversation list
- ❌ Group does NOT appear in User B's conversation list
- ❌ Group does NOT appear in User C's conversation list

### Root Cause
**Backend Issue**: The backend is not sending group creation notifications to all members.

### Solution
The backend needs to:
1. Create the group in the database
2. Add all members to the group
3. **Send WebSocket notification to EACH member** (currently missing)

### Backend Code Required
```java
// After creating group, send notification to all members
for (String memberEmail : request.getMembers()) {
    messagingTemplate.convertAndSendToUser(
        memberEmail,
        "/queue/notify",
        new GroupNotification(
            "NEW_GROUP",
            groupId,
            groupName,
            members,
            createdBy
        )
    );
}
```

### Frontend Status
✅ Frontend is ready to receive notifications
✅ Frontend will add group to conversation list
✅ Frontend will show toast notification
✅ Frontend will save to localStorage

---

## Issue 2: Notifications Only When Chat is Open ❌

### Problem
When User A sends a message to User B:
- ✅ Toast notification appears (if chat is open)
- ❌ Browser notification does NOT appear (if chat is closed)
- ❌ OS-level notification does NOT appear

### Root Cause
**Backend Issue**: Backend is not sending notifications to all members
**Frontend Issue**: Browser notifications need to be explicitly triggered

### Solution

#### Backend Fix
Send notifications to all group members, not just active ones:
```java
// Send to all members
for (String memberEmail : groupMembers) {
    messagingTemplate.convertAndSendToUser(
        memberEmail,
        "/queue/notify",
        messageNotification
    );
}
```

#### Frontend Fix
Ensure browser notifications are shown:
```javascript
// Show browser notification
NotificationService.showBrowserNotification(
    `New message from ${displayName}`,
    {
        body: message.content,
        icon: '/logo192.png',
        tag: channelId,
        requireInteraction: false
    }
);
```

### Frontend Status
✅ Browser notification code is implemented
✅ Permission request is implemented
✅ Just needs backend to send notifications

---

## What's Working ✅

### Frontend Features
- ✅ Chat list with proper alignment
- ✅ Chat messages with proper alignment
- ✅ Unread message indicators (5 visual indicators)
- ✅ Toast notifications (when chat is open)
- ✅ Browser notification permission request
- ✅ Group creation UI
- ✅ Group info modal
- ✅ Incoming call modal
- ✅ Connection status indicator
- ✅ Auto-generated avatars
- ✅ Relative timestamps
- ✅ File uploads
- ✅ Typing indicators
- ✅ Message status icons
- ✅ Proper layout (no page scrolling)

### Backend Features (Assumed)
- ✅ User authentication
- ✅ Message sending
- ✅ File storage
- ✅ WebSocket connection
- ❌ Group creation notifications (MISSING)
- ❌ Broadcast notifications to all members (MISSING)

---

## What Needs Backend Fixes ⚠️

### 1. Group Creation Notifications
**What**: When a group is created, notify all members
**Where**: `/api/group/create` endpoint
**How**: Send WebSocket message to each member

### 2. Message Notifications to All Members
**What**: When a message is sent, notify all members (not just active ones)
**Where**: `/app/group.send` endpoint
**How**: Send WebSocket message to each member

### 3. Verify WebSocket Configuration
**What**: Ensure user-specific queues work correctly
**Where**: WebSocket configuration
**How**: Test with multiple users

---

## Testing Checklist

### Test 1: Group Creation
- [ ] User A creates group with User B and User C
- [ ] Group appears in User A's list
- [ ] Group appears in User B's list (requires backend fix)
- [ ] Group appears in User C's list (requires backend fix)
- [ ] Toast notification shows for B and C (requires backend fix)
- [ ] Browser notification shows for B and C (requires backend fix)

### Test 2: Group Messages
- [ ] User A sends message in group
- [ ] Message appears in User A's chat
- [ ] Message appears in User B's chat
- [ ] Message appears in User C's chat
- [ ] Toast notification shows for B and C (if chat open)
- [ ] Browser notification shows for B and C (if chat closed) (requires backend fix)

### Test 3: Direct Messages
- [ ] User A sends message to User B
- [ ] Message appears in User A's chat
- [ ] Message appears in User B's chat
- [ ] Toast notification shows for B (if chat open)
- [ ] Browser notification shows for B (if chat closed) (requires backend fix)

---

## How to Fix

### Step 1: Backend Group Creation
Modify `/api/group/create` to send notifications:
```java
// Send notification to all members
for (String memberEmail : request.getMembers()) {
    messagingTemplate.convertAndSendToUser(
        memberEmail,
        "/queue/notify",
        groupNotification
    );
}
```

### Step 2: Backend Message Notifications
Modify `/app/group.send` to send to all members:
```java
// Send notification to all members
for (GroupMember member : group.getMembers()) {
    messagingTemplate.convertAndSendToUser(
        member.getUserEmail(),
        "/queue/notify",
        messageNotification
    );
}
```

### Step 3: Test
1. Create group with multiple users
2. Send message in group
3. Verify all users receive notifications

---

## Summary

### Issues
1. ❌ Group not visible to other members (Backend)
2. ❌ Notifications only when chat is open (Backend)

### Frontend Status
✅ All frontend code is ready
✅ Just waiting for backend notifications

### Next Steps
1. Contact backend team
2. Implement group creation notifications
3. Implement message notifications to all members
4. Test with multiple users

---

**Last Updated**: December 1, 2025
**Status**: ⚠️ AWAITING BACKEND FIXES

