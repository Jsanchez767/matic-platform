# Request Hub Enhancement - Quick Start Guide

## 🚀 Getting Started

Visit the demo page: `/demo-request-hub`

The demo includes three mock users you can switch between to test different roles:
- **John Smith** (staff) - Can submit and view own requests
- **Jane Doe** (admin) - Full access to all features
- **Bob Johnson** (supervisor) - Can approve requests and view team data

## 📋 Feature Overview

### 1. Dashboard Tab
**What you'll see:**
- 4 metric cards showing key stats
- Quick action buttons for common tasks
- Requests over time bar chart
- Status distribution donut chart
- Recent activity feed
- Date range filter (Last 7/30/90 days, All time)
- Admin view toggle (admins/supervisors only)

**Try this:**
1. Switch date ranges and watch metrics update
2. Click "Admin View" to see all requests vs just your own
3. Use quick actions to navigate to other sections

### 2. My Requests Tab
**What you'll see:**
- Search bar to find requests by title/ID/status
- Status filter dropdown (All, Draft, Submitted, etc.)
- Request type filter dropdown
- Table showing all your requests
- Summary cards showing count by status

**Try this:**
1. Type in the search bar to filter requests
2. Select a specific status from the dropdown
3. Click a status card to quick-filter to that status
4. Toggle "Show Filters" to hide/show filter controls
5. Click action buttons to View/Edit/Delete requests

### 3. New Request Tab
**What you'll see:**
- Request type selector dropdown
- Description of selected request type
- Progress bar showing completion percentage
- Dynamic form fields based on selected type
- Missing fields indicator
- Save as Draft button
- Submit Request button (enabled only when 100% complete)

**Try this:**
1. Select a request type from dropdown
2. Start filling out fields and watch progress update
3. Try to submit before completing - it won't let you
4. Save as draft with partial data
5. Complete all required fields to enable submit

### 4. Approvals Tab (Admin/Supervisor Only)
**What you'll see:**
- Filter dropdown for status
- Select all checkbox in table header
- Bulk actions bar when items are selected
- Table of pending requests
- Summary cards showing counts

**Try this:**
1. Switch to Jane Doe (admin) to access this tab
2. Select individual requests or use "Select All"
3. Use bulk actions to Approve/Deny multiple at once
4. Click individual action buttons for single requests
5. Watch summary stats update as you process requests

### 5. Settings Tab (Admin Only)
**What you'll see:**
- 4 tabs: Request Types, Workflows, Notifications, Permissions
- Forms to create and manage request types
- Notification preferences
- Permission matrix for all roles

**Try this:**
1. Switch to Jane Doe (admin) to access settings
2. Go to Request Types tab and create a new type
3. Toggle notification preferences in Notifications tab
4. Adjust role permissions in Permissions tab
5. Save changes and see success toast

## 🎨 Visual Guide

### Status Badge Colors
```
Draft          → Gray background
Submitted      → Blue background
Under Review   → Yellow background
Approved       → Green background
Denied         → Red background
Completed      → Purple background
```

### Priority Badge Colors
```
High           → Red border
Medium         → Yellow border
Low            → Gray border
```

### Action Button Patterns
```
View           → Eye icon, ghost style
Edit           → Pencil icon, ghost style (drafts only)
Delete         → Trash icon, red text (drafts/denied only)
Approve        → CheckCircle icon, green style
Deny           → XCircle icon, red style
```

## 🔔 Toast Notifications

You'll see toast notifications (top-right corner) for:
- ✅ Request submitted successfully (green)
- 💾 Request saved as draft (blue)
- ⚙️ Settings saved (green)
- 🗑️ Request deleted (yellow)
- ✅ Bulk approval/denial (green)
- ℹ️ Info messages (blue)

They auto-dismiss after 5 seconds or click × to close.

## 🎯 Common Workflows

### Submit a New Request
1. Click "New Request" tab or quick action button
2. Select request type from dropdown
3. Fill out all required fields (marked with *)
4. Watch progress bar reach 100%
5. Click "Submit Request"
6. See success toast
7. View in "My Requests" tab

### Save Work in Progress
1. Start filling out a new request
2. Don't complete all required fields
3. Click "Save as Draft"
4. See success toast
5. Find it in "My Requests" with Draft status
6. Edit later to complete and submit

### Filter Your Requests
1. Go to "My Requests" tab
2. Use search bar for quick text search
3. Select status from dropdown to narrow down
4. Click status cards for one-click filtering
5. Clear filters by selecting "All"

### Approve Multiple Requests (Admin)
1. Switch to admin user (Jane Doe)
2. Go to "Approvals" tab
3. Check boxes next to requests to approve
4. Or click "Select All" to get everything
5. Click "Approve Selected" in bulk actions bar
6. See confirmation toast
7. Watch summary stats update

### Configure System Settings (Admin)
1. Switch to admin user (Jane Doe)
2. Go to "Settings" tab
3. Navigate between tabs to configure:
   - Add new request types in Request Types
   - Set up workflows in Workflows
   - Configure emails in Notifications
   - Adjust permissions in Permissions
4. Click "Save Changes"
5. See success toast

## 🔄 State Management

The demo uses local state to simulate a real application:
- Creating requests adds them to the list
- Approving/denying updates request status
- Deleting removes from the list
- All changes persist during your session
- Refresh page to reset to initial state

## 🎭 Role-Based Features

### All Users Can:
- View Dashboard
- See My Requests
- Submit New Requests
- Edit/Delete own drafts

### Supervisors Can Also:
- Access Approvals tab
- Toggle admin view in dashboard
- Approve/deny requests

### Admins Can Also:
- Access Settings tab
- Configure request types
- Manage workflows
- Set permissions
- View all system data

## 📱 Mobile Experience

All features work on mobile:
- Tables scroll horizontally
- Filters stack vertically
- Touch-friendly buttons
- Responsive grids
- Adaptive text sizes

## 💡 Tips & Tricks

1. **Quick Status Filter**: Click the status summary cards in My Requests for instant filtering

2. **Keyboard Navigation**: Use Tab key to navigate through all controls

3. **Bulk Operations**: Select multiple requests in Approvals for faster processing

4. **Progress Tracking**: The green progress bar in new requests shows exactly what's missing

5. **Admin View**: Toggle between personal and system-wide data without switching tabs

6. **Date Ranges**: Use dashboard date filters to analyze specific time periods

7. **Toast History**: Toasts stack so you can see multiple notifications

8. **Empty States**: Helpful messages guide you when no data is available

## 🐛 Known Demo Limitations

This is a demo with mock data:
- No real API calls (simulated with delays)
- Data resets on page refresh
- File uploads are simulated
- No email notifications sent
- No real user authentication

In production, these would be replaced with:
- Real API endpoints
- Database persistence
- Actual file storage
- Email service integration
- Supabase authentication

## 🎓 Learn More

- Check `REQUEST_HUB_ENHANCEMENTS.md` for technical details
- Review individual component files for implementation
- See `src/types/request.ts` for data structures
- Examine `src/lib/toast.tsx` for notification system

## 🤝 Need Help?

Common questions:

**Q: Why can't I submit my request?**  
A: Make sure all required fields (marked with *) are filled out. Check the progress bar is at 100%.

**Q: Where did my draft go?**  
A: Check "My Requests" and filter by "Draft" status.

**Q: Why don't I see the Approvals tab?**  
A: Switch to Jane Doe (admin) or Bob Johnson (supervisor) - only these roles can approve.

**Q: How do I create a new request type?**  
A: Switch to admin user, go to Settings tab, Request Types section, fill out the form and click Add.

**Q: Can I approve my own requests?**  
A: No - admins see all requests but typically can't approve their own (workflow logic).

---

Enjoy exploring the enhanced Request Management System! 🎉
