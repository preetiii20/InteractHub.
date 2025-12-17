# Announcements & Polls UI Layout Specification

## Overview
Improve the visual separation and layout of Announcements and Polls sections to provide clear distinction between "Sent by Me" and "Received" items.

## Current State
- AnnouncementList and PollList components separate items into two sections
- Sections are displayed vertically (one below the other)
- Each section has a gradient background and header with count
- All items within each section are stacked vertically

## Requirements

### User Stories
1. **As a user**, I want to see "Sent by Me" and "Received" announcements side-by-side so I can quickly compare what I've sent vs what I've received
2. **As a user**, I want the same layout for polls as announcements for consistency
3. **As a user**, I want the layout to be responsive and work well on mobile devices
4. **As a user**, I want the sidebar to optionally collapse when viewing announcements/polls for better focus

### Layout Options (To Be Confirmed)

#### Option A: Two-Column Layout
- Left column: "Sent by Me" section
- Right column: "Received" section
- Both columns visible simultaneously
- Responsive: Stacks vertically on mobile

#### Option B: Tabbed Interface
- Single tab for "Sent by Me"
- Single tab for "Received"
- User clicks to switch between sections
- More compact, better for mobile

#### Option C: Collapsible Sections
- Keep vertical layout
- Add collapse/expand buttons to each section
- User can collapse sections they don't need to see
- Maintains current structure with better control

### Sidebar Behavior Options (To Be Confirmed)

#### Option 1: Auto-Collapse
- Sidebar automatically collapses to icons only when viewing Announcements/Polls
- Provides more space for content
- Requires route-based logic

#### Option 2: Manual Toggle
- Add toggle button to manually hide/show sidebar
- User has full control
- Requires state management

#### Option 3: No Changes
- Keep sidebar full size
- No changes to current behavior

## Acceptance Criteria
- [x] User confirms preferred layout option (A, B, or C) - **Option B: Tabbed Interface**
- [x] User confirms preferred sidebar behavior (1, 2, or 3) - **Option 1: Auto-Collapse**
- [x] Layout is implemented without breaking existing features
- [x] All interactions (like, comment, vote, delete) continue to work
- [x] Responsive design works on mobile devices
- [x] Gradient backgrounds and styling are preserved

## Implementation Details

### Layout Option B: Tabbed Interface
- Added tab navigation with "Sent by Me" and "Received" buttons
- Tabs use emoji icons (📤 and 📥) for visual distinction
- Active tab shows colored underline and background
- Content switches when user clicks tabs
- Empty state messages for each tab

### Sidebar Option 1: Auto-Collapse
- Created `SidebarContext` in AdminLayout to manage sidebar state globally
- Sidebar collapses to icon-only view (w-20) when viewing Announcements/Polls
- Sidebar expands back to full width (w-64) when navigating away
- Smooth transition animation (300ms) for collapse/expand
- Menu labels and logout text hidden when collapsed
- Icons remain visible for navigation

### Files Modified
1. **frontend/src/components/shared/AnnouncementList.jsx**
   - Added `activeTab` state for tab switching
   - Added tab navigation UI with styling
   - Replaced vertical sections with tab content
   - Added `onSidebarToggle` callback to trigger sidebar collapse on mount

2. **frontend/src/components/shared/PollList.jsx**
   - Added `activeTab` state for tab switching
   - Added tab navigation UI with styling
   - Replaced vertical sections with tab content
   - Added `onSidebarToggle` callback to trigger sidebar collapse on mount

3. **frontend/src/components/admin/AdminLayout.jsx**
   - Created `SidebarContext` and `useSidebar` hook
   - Added `sidebarCollapsed` state
   - Updated sidebar width based on collapsed state
   - Conditionally render labels and text when not collapsed
   - Wrapped Outlet with SidebarContext.Provider

4. **frontend/src/components/admin/GlobalCommunications.jsx**
   - Imported `useSidebar` hook
   - Updated to use context instead of local state
   - Passes `onSidebarToggle` callback to AnnouncementList and PollList

## Files to Modify
- `frontend/src/components/shared/AnnouncementList.jsx`
- `frontend/src/components/shared/PollList.jsx`
- `frontend/src/components/admin/GlobalCommunications.jsx` (parent component)
- Potentially: Layout components if sidebar behavior changes are needed

## Notes
- No breaking changes to existing features
- All current functionality must be preserved
- Design should maintain professional appearance with softer color schemes
