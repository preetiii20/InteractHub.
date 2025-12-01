# Backend Fixes Required ⚠️

## Issue 1: Group Not Visible to Other Members

### Problem
When a group is created, only the creator sees it. Other members don't see the group in their conversation list.

### Root Cause
The backend is not sending group creation notifications to all members.

### Solution Required

#### Backend Endpoint: `/api/group/create`

**Current Issue**:
```java
// Backend is only adding group to creator's list
// Not notifying other members
```

**Required Fix**:
```java
@PostMapping("/create")
public ResponseEntity<?> createGroup(@RequestBody GroupCreateRequest request) {
    // 1. Create group in database
    Group group = new Group();
    group.setName(request.getName());
    group.setCreatedBy(request.getCreatedByName());
    group.setCreatedAt(LocalDateTime.now());
    
    // 2. Add all members to group
    for (String memberEmail : request.getMembers()) {
        GroupMember member = new GroupMember();
        member.setGroup(group);
        member.setUserEmail(memberEmail);
        member.setJoinedAt(LocalDateTime.now());
        group.getMembers().add(member);
    }
    
    Group savedGroup = groupRepository.save(group);
    
    // 3. IMPORTANT: Send notification to ALL members
    for (String memberEmail : request.getMembers()) {
        // Send WebSocket notification to each member
        messagingTemplate.convertAndSendToUser(
            memberEmail,
            "/queue/notify",
            new GroupNotification(
                "NEW_GROUP",
                savedGroup.getId(),
                savedGroup.getName(),
                request.getMembers(),
                request.getCreatedByName()
            )
        );
    }
    
    return ResponseEntity.ok(new GroupResponse(savedGroup.getId(), savedGroup.getName()));
}
```

---

## Issue 2: Notifications Only When Chat is Open

### Problem
Notifications only appear when the user has the chat window open. If the chat is closed, no notification appears.

### Root Cause
Frontend is only showing toast notifications. Browser notifications are not being triggered properly.

### Solution Required

#### Frontend Fix: Enable Browser Notifications

**Current Code** (in `NotificationService.js`):
```javascript
showBrowserNotification(title, options = {}) {
    if (this.notificationPermission !== 'granted' || !('Notification' in window)) {
        return;
    }
    // Shows notification
}
```

**Issue**: Browser notifications only work if permission is granted AND the browser is not focused.

**Required Fix**:

1. **Request Permission on App Load**:
```javascript
// In EnhancedLiveCommunicationHub.jsx
useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log('Notification permission:', permission);
            setNotificationPermission(permission);
        });
    }
}, []);
```

2. **Show Browser Notification for Messages**:
```javascript
// In handleNewMessage callback
if (channelId !== activeConversationId) {
    // Show browser notification even if chat is open
    NotificationService.showBrowserNotification(
        `New message from ${displayName}`,
        {
            body: message.content || 'New message',
            icon: '/logo192.png',
            tag: channelId,
            requireInteraction: false
        }
    );
    
    // Also show toast
    showToastNotification('message', from, message.content, channelId);
}
```

3. **Show Browser Notification for Groups**:
```javascript
// When added to group
NotificationService.showBrowserNotification(
    `Added to group: ${groupName}`,
    {
        body: `You've been added to ${groupName}`,
        icon: '/logo192.png',
        tag: `group-${groupId}`,
        requireInteraction: true
    }
);
```

---

## Implementation Checklist

### Backend Changes Required

- [ ] **Group Creation Endpoint**
  - [ ] Create group in database
  - [ ] Add all members to group
  - [ ] Send WebSocket notification to EACH member
  - [ ] Include group ID, name, and members in notification

- [ ] **Message Sending Endpoint**
  - [ ] Send message to all group members
  - [ ] Send notification to all members (not just active ones)
  - [ ] Include sender name and message content

- [ ] **WebSocket Configuration**
  - [ ] Ensure `/user/{email}/queue/notify` is properly configured
  - [ ] Ensure `/topic/notify.{email}` is properly configured
  - [ ] Test with multiple users

### Frontend Changes (Already Done)

- [x] Listen for `NEW_GROUP` notifications
- [x] Listen for `group_created` notifications
- [x] Add group to conversation list
- [x] Save group to localStorage
- [x] Show toast notification
- [x] Show browser notification

---

## Testing Steps

### Test 1: Group Creation
1. User A creates group with User B and User C
2. **Expected**: 
   - Group appears in User A's list ✅
   - Group appears in User B's list ❌ (Currently not working)
   - Group appears in User C's list ❌ (Currently not working)
   - Browser notification shows for B and C ❌ (Currently not working)

### Test 2: Group Messages
1. User A sends message in group
2. **Expected**:
   - Message appears in User A's chat ✅
   - Message appears in User B's chat ✅
   - Message appears in User C's chat ✅
   - Browser notification shows for B and C (even if chat is closed) ❌ (Currently only shows if chat is open)

### Test 3: Browser Notifications
1. User A sends message to User B
2. User B's browser is not focused
3. **Expected**:
   - OS-level notification appears ❌ (Currently not working)
   - Notification shows sender name and message preview ❌
   - Clicking notification focuses browser ❌

---

## Code Examples

### Backend: Send Group Notification

```java
// GroupController.java
@PostMapping("/create")
public ResponseEntity<?> createGroup(@RequestBody GroupCreateRequest request) {
    try {
        // Create group
        Group group = new Group();
        group.setName(request.getName());
        group.setCreatedBy(request.getCreatedByName());
        group.setCreatedAt(LocalDateTime.now());
        
        // Add members
        for (String memberEmail : request.getMembers()) {
            GroupMember member = new GroupMember();
            member.setGroup(group);
            member.setUserEmail(memberEmail);
            member.setJoinedAt(LocalDateTime.now());
            group.getMembers().add(member);
        }
        
        Group savedGroup = groupRepository.save(group);
        
        // Send notification to all members
        for (String memberEmail : request.getMembers()) {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "NEW_GROUP");
            notification.put("groupId", savedGroup.getId());
            notification.put("groupName", savedGroup.getName());
            notification.put("members", request.getMembers());
            notification.put("createdBy", request.getCreatedByName());
            
            messagingTemplate.convertAndSendToUser(
                memberEmail,
                "/queue/notify",
                notification
            );
        }
        
        return ResponseEntity.ok(new GroupResponse(
            savedGroup.getId(),
            savedGroup.getName()
        ));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Error: " + e.getMessage());
    }
}
```

### Frontend: Show Browser Notification

```javascript
// In handleNewMessage callback
const handleNewMessage = useCallback((message) => {
    const channelId = message.channelId || message.roomId || message.groupId;
    if (!channelId) return;
    
    // Update conversation
    setConversations(prev => {
        const newConvs = new Map(prev);
        const conv = newConvs.get(channelId);
        if (conv) {
            conv.lastMessage = message.content || '';
            conv.lastMessageTime = new Date(message.sentAt || Date.now());
            newConvs.set(channelId, conv);
        }
        return newConvs;
    });
    
    // Increment unread if not active
    if (channelId !== activeConversationId) {
        setUnreadCounts(prev => {
            const newCounts = new Map(prev);
            newCounts.set(channelId, (newCounts.get(channelId) || 0) + 1);
            return newCounts;
        });
        
        // Show notifications
        const from = message.senderName || message.fromUser || 'Someone';
        const displayName = nameMap[from] || from;
        
        // IMPORTANT: Show browser notification
        NotificationService.showBrowserNotification(
            `New message from ${displayName}`,
            {
                body: message.content?.substring(0, 100) || 'New message',
                icon: '/logo192.png',
                tag: channelId,
                requireInteraction: false
            }
        );
        
        // Also show toast
        showToastNotification('message', from, message.content || 'New message', channelId);
    }
}, [activeConversationId, nameMap]);
```

---

## Summary

### Issue 1: Group Not Visible to Other Members
**Status**: ⚠️ Backend Issue
**Fix**: Backend must send WebSocket notification to all members when group is created

### Issue 2: Notifications Only When Chat is Open
**Status**: ⚠️ Backend + Frontend Issue
**Fix**: 
- Backend: Send notifications to all members
- Frontend: Show browser notifications (already implemented, just needs to be triggered)

---

## Next Steps

1. **Contact Backend Team** to implement group creation notifications
2. **Verify WebSocket Configuration** for user-specific queues
3. **Test with Multiple Users** to ensure notifications work
4. **Enable Browser Notifications** in browser settings
5. **Test Browser Notifications** when browser is not focused

---

**Last Updated**: December 1, 2025
**Status**: ⚠️ REQUIRES BACKEND FIXES

