# Design Document: Group Chat Synchronization and Management

## Overview

This design addresses group chat synchronization issues and adds group management features. The solution involves:
- Broadcasting group creation to all members via WebSocket
- Decoupling notification delivery from sender chat state
- Adding leave/delete group functionality with proper state management

## Architecture

**Backend Flow:**
1. Group creation → Broadcast to all added members
2. Message sent → Notify all members independently
3. Leave/Delete group → Broadcast state change to all members

**Frontend Flow:**
1. Listen for group creation events
2. Listen for notification events independently
3. Display leave/delete options in group info modal

## Components and Interfaces

### Backend Changes Required
- Group creation endpoint: Broadcast to all members
- Message service: Send notifications independently of sender state
- Group management endpoints: Leave group, delete group with broadcast

### Frontend Components
- **GroupInfoModal**: Add leave/delete buttons with confirmation dialogs
- **EnhancedLiveCommunicationHub**: Listen for group events and manage state
- **NotificationService**: Decouple notifications from sender chat state

## Data Models

```
Group {
  id: string
  name: string
  members: User[]
  creator: User
  createdAt: timestamp
  isActive: boolean
}

GroupEvent {
  type: 'created' | 'member_joined' | 'member_left' | 'deleted'
  groupId: string
  userId: string
  timestamp: timestamp
}

Notification {
  id: string
  type: 'message' | 'group_event'
  recipientId: string
  senderId: string
  groupId: string
  content: string
  read: boolean
  createdAt: timestamp
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

Property 1: Group Broadcast Consistency
*For any* group creation event, all added members should receive the group in their conversation list within 1 second
**Validates: Requirements 1.1, 1.2, 1.3**

Property 2: Notification Independence
*For any* message sent to a group, all members should receive notifications regardless of the sender's chat state
**Validates: Requirements 2.1, 2.2**

Property 3: Leave Group State Consistency
*For any* member leaving a group, the member should be removed from the group's participant list and the group should be removed from their conversation list
**Validates: Requirements 3.1, 3.3**

Property 4: Delete Group Broadcast
*For any* group deletion, all members should have the group removed from their conversation list and receive a deletion notification
**Validates: Requirements 4.1, 4.2**

Property 5: Group Info Modal Permissions
*For any* group, the group creator should see a delete button while all members should see a leave button
**Validates: Requirements 5.1, 5.2**

## Error Handling

- Handle offline members: Queue events and deliver on reconnection
- Handle concurrent operations: Use timestamps and version control
- Handle failed broadcasts: Retry with exponential backoff
- Handle invalid permissions: Validate creator status before delete

## Testing Strategy

**Unit Tests:**
- Test group creation logic
- Test notification queuing
- Test leave/delete state transitions
- Test permission validation

**Property-Based Tests:**
- Property 1: Verify all members receive group creation
- Property 2: Verify notifications sent independently
- Property 3: Verify leave group removes member
- Property 4: Verify delete group removes for all
- Property 5: Verify correct buttons shown based on role
