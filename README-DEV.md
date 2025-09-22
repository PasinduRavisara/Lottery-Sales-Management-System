# DLB SalesHub - Development Guide

## Quick Start

### 1. Install Dependencies

**Backend (Server):**

```bash
cd server
npm install
```

**Frontend (Client):**

```bash
cd client
npm install
```

### 2. Set up Environment Variables

Create a `.env` file in the `server` directory:

```env
DATABASE_URL="mysql://root:@localhost:3306/lottery_sales_db"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=5000
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"
```

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Set up Database

```bash
cd server
npx prisma generate
npx prisma migrate dev
```

### 4. Run Development Servers

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

### 5. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

### 6. Demo Users

After starting the servers, click "Setup Demo Users" on the login page to create:

- **Admin:** username: `admin`, password: `admin123`
- **Dealer:** username: `dealer`, password: `dealer123`

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + Prisma + MySQL
- **Authentication:** JWT
- **UI:** Framer Motion + Lucide React + React Hot Toast

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   └── Layout.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── constants.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── SalesForm.tsx
│   │   ├── Reports.tsx
│   │   └── Submission.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.ts

server/
├── routes/
├── middleware/
├── prisma/
├── index.js
└── package.json
```

## Available Scripts

**Client:**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Server:**

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run generate` - Generate Prisma client

## Troubleshooting

1. **Port conflicts:** Make sure ports 3000 and 5000 are available
2. **Database connection:** Ensure MySQL is running and connection string is correct
3. **CORS errors:** Check that backend is running on port 5000
4. **Module not found:** Run `npm install` in both client and server directories
