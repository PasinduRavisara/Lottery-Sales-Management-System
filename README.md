# 🎲 DLB SalesHub

A comprehensive web application for tracking daily lottery sales across different brands and locations. Built with modern technologies and designed to match the exact form layout from the provided image.

## ✨ Features

### 🔐 Authentication System

- Secure login with JWT tokens
- Role-based access (Admin & Dealer)
- Session management and auto-logout
- Demo credentials for testing

### 📝 Sales Form (Exact Layout Match)

- **Header Fields**: District, City, Dealer Name, Dealer Number, Assistant Name, Sales Method, Sales Location
- **Daily Sales Table**: 8 lottery brands × 7 days of the week
- **Lottery Brands**: Super Diana Sampatha, Asa Kothmal, Lagna Wisnawa, Super Ball, Shamida, Kapruka, Jayoda, Sasiri
- **Signature Sections**: Sales Promotion Assistant and Territory Manager

### 🚀 Advanced Features

- **Auto-save drafts** - Saves form data every 30 seconds
- **Data persistence** - All submissions stored in MySQL database
- **Form validation** - Required fields and input validation
- **Responsive design** - Works on mobile and desktop
- **Modern UI** - Professional gradients and animations
- **Data reporting** - View, filter, and export sales data
- **Clear form** functionality with confirmation
- **Real-time status** indicators

### 📊 Reporting Dashboard (Admin Only)

- Sales summary with statistics
- Filter by date range, district, city, status
- Export data as CSV or JSON
- Pagination for large datasets
- Individual submission details view

## 🛠 Tech Stack

### Frontend

- **React** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Hook Form** for form management
- **Axios** for API calls
- **React Hot Toast** for notifications

### Backend

- **Node.js** with Express.js
- **MySQL** database with Prisma ORM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **CORS** and **Helmet** for security

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Lottery-Sales-Management-System
   ```

2. **Install dependencies**

   ```bash
   npm run install-all
   ```

3. **Database Setup**

   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE lottery_sales_db;
   ```

4. **Environment Configuration**

   ```bash
   # Copy environment files
   cp server/env.example server/.env

   # Edit server/.env with your database credentials
   DATABASE_URL="mysql://username:password@localhost:3306/lottery_sales_db"
   JWT_SECRET="your-super-secret-jwt-key-here"
   PORT=5000
   CLIENT_URL="http://localhost:3000"
   ```

5. **Database Migration**

   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Start the application**

   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start individually
   npm run server  # Backend on port 5000
   npm run client  # Frontend on port 3000
   ```

7. **Setup Demo Users**
   - Visit `http://localhost:3000/login`
   - Click "Setup Demo Users" button
   - Use demo credentials:
     - **Admin**: admin / admin123
     - **Dealer**: dealer / dealer123

## 📱 Usage

### For Dealers

1. **Login** with dealer credentials
2. **Fill Sales Form** with daily lottery sales data
3. **Auto-save** drafts automatically every 30 seconds
4. **Submit** completed forms for final processing
5. **View** submission history and status

### For Admins

1. **Login** with admin credentials
2. **View Dashboard** with sales statistics
3. **Access Reports** to analyze sales data
4. **Filter & Export** data by various criteria
5. **Manage Submissions** (view, delete)

## 🗄 Database Schema

### Users Table

```sql
- id (String, Primary Key)
- username (String, Unique)
- passwordHash (String)
- role (ADMIN | DEALER)
- createdAt, updatedAt (DateTime)
```

### Sales Submissions Table

```sql
- id (String, Primary Key)
- userId (String, Foreign Key)
- district, city, dealerName, dealerNumber (String)
- assistantName, salesMethod, salesLocation (String)
- isDraft (Boolean)
- createdAt, updatedAt (DateTime)
```

### Daily Sales Table

```sql
- id (String, Primary Key)
- submissionId (String, Foreign Key)
- brandName (String)
- monday, tuesday, wednesday, thursday, friday, saturday, sunday (Int)
- createdAt, updatedAt (DateTime)
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/setup-demo` - Create demo users

### Submissions

- `GET /api/submissions` - Get all submissions (with pagination)
- `GET /api/submissions/:id` - Get single submission
- `POST /api/submissions` - Create/update submission
- `DELETE /api/submissions/:id` - Delete submission

### Reports

- `GET /api/reports/summary` - Get sales summary
- `GET /api/reports/dashboard` - Get dashboard statistics
- `GET /api/reports/export` - Export data (CSV/JSON)

## 🎨 Design Features

### Visual Design

- **Color Scheme**: Professional blue gradients (#3498db, #2c3e50)
- **Typography**: Clean, readable fonts (Inter)
- **Layout**: Card-based design with proper spacing
- **Animations**: Smooth transitions and hover effects
- **Icons**: Lucide React icons throughout

### Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Collapsible sidebar on mobile

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- SQL injection prevention (Prisma ORM)
- XSS protection (Helmet)

## 📦 Deployment

### Environment Variables

```bash
# Database
DATABASE_URL="mysql://username:password@host:port/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Server
PORT=5000
NODE_ENV="production"
CLIENT_URL="https://your-frontend-domain.com"
```

### Production Build

```bash
# Build frontend
cd client
npm run build

# Start production server
cd server
npm start
```

## 🧪 Testing

### Manual Testing

1. **Authentication Flow**

   - Login with valid/invalid credentials
   - Role-based access control
   - Session persistence

2. **Form Functionality**

   - Auto-save drafts
   - Form validation
   - Clear form confirmation
   - Submit completed forms

3. **Reporting Features**
   - Data filtering
   - Export functionality
   - Pagination
   - Responsive design

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Check MySQL service is running
   - Verify DATABASE_URL in .env
   - Run `npx prisma migrate dev`

2. **Authentication Issues**

   - Clear browser localStorage
   - Check JWT_SECRET is set
   - Verify token expiration

3. **CORS Errors**
   - Check CLIENT_URL in server .env
   - Ensure frontend and backend ports match

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ for efficient sales management**
