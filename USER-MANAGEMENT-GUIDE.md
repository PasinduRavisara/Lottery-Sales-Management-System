# User Management Guide

This guide explains how to add users to the DLB SalesHub. There are three methods available for adding users:

## 🔐 Authentication Note

- There is **NO public registration** - users can only be created by admins
- This ensures controlled access to the system

## Method 1: Admin Panel (Web Interface) ⭐ **RECOMMENDED**

### Access:

1. Login as an admin user (username: `admin`, password: `admin123`)
2. Navigate to **"User Management"** from the sidebar menu
3. Click **"Add User"** button

### Features:

- ✅ User-friendly web interface
- ✅ Real-time validation
- ✅ View all existing users
- ✅ Delete users (except your own account)
- ✅ Role assignment (Admin/Dealer)
- ✅ Immediate feedback on success/errors

### Steps:

1. Fill in username (minimum 3 characters)
2. Set password (minimum 6 characters)
3. Select role (Admin or Dealer)
4. Click "Create User"

---

## Method 2: Interactive Command Line Script

### Usage:

```bash
cd server
node add-user.js
```

### Features:

- ✅ Interactive prompts
- ✅ Hidden password input (shows asterisks)
- ✅ Username validation
- ✅ Duplicate checking

### Example:

```
=== Add New User ===

Username: john_dealer
Password: ******
Role (ADMIN/DEALER) [DEALER]: DEALER

✅ User created successfully!
   Username: john_dealer
   Role: DEALER
   ID: cmfkpvg7s0000ua0p1ex1u10g
```

---

## Method 3: Quick Command Line Script

### Usage:

```bash
cd server
node quick-add-user.js <username> <password> [role]
```

### Examples:

```bash
# Create a dealer
node quick-add-user.js sarah_dealer mypassword123 DEALER

# Create an admin
node quick-add-user.js mike_admin adminpass456 ADMIN

# Create a dealer (default role)
node quick-add-user.js tom_sales password789
```

### Features:

- ✅ Fast user creation
- ✅ Command line arguments
- ✅ Perfect for bulk user creation
- ✅ Can be scripted/automated

---

## User Roles

### **DEALER** Role:

- Create and edit their own sales submissions
- View their own submission history
- Access dashboard with personal statistics
- **Cannot** access reports or user management

### **ADMIN** Role:

- All dealer permissions +
- View all submissions from all dealers
- Access comprehensive reporting dashboard
- Manage users (create, view, delete)
- Export data in multiple formats

---

## Security Features

### Password Requirements:

- Minimum 6 characters
- Hashed using bcryptjs with salt rounds
- Not stored in plain text

### Access Control:

- JWT-based authentication
- Role-based authorization
- Protected API endpoints
- Session management

### Admin Protections:

- Admins cannot delete their own accounts
- User management requires admin privileges
- All user operations are logged

---

## Current Demo Users

| Username | Password  | Role   |
| -------- | --------- | ------ |
| admin    | admin123  | ADMIN  |
| dealer   | dealer123 | DEALER |

---

## Best Practices

### For Production Use:

1. **Change default passwords** immediately
2. **Use strong passwords** (8+ characters, mixed case, numbers, symbols)
3. **Create unique usernames** for each person
4. **Assign appropriate roles** based on job function
5. **Regular cleanup** - remove users who no longer need access
6. **Monitor access** through the admin panel

### User Naming Conventions:

- Use clear, identifiable usernames
- Consider format: `firstname_lastname` or `firstname_role`
- Avoid special characters that might cause issues
- Keep usernames professional

---

## Troubleshooting

### Common Issues:

**"Username already exists"**

- Choose a different username
- Check existing users in the admin panel

**"Password must be at least 6 characters"**

- Use a longer password
- Include mix of letters and numbers

**"Access denied: Admin privileges required"**

- Only admin users can manage other users
- Login with an admin account

**"Database connection error"**

- Ensure MySQL is running
- Check database credentials in `.env` file
- Verify Prisma migrations are up to date

### Getting Help:

1. Check the admin panel for existing users
2. Verify server is running on port 5000
3. Check browser console for detailed error messages
4. Review server logs for backend issues

---

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **User Management**: http://localhost:3000/user-management (Admin only)

---

**Created for secure user management in the DLB SalesHub**
