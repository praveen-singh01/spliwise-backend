# Splitwise Backend

A production-grade expense-sharing application backend built with Node.js, Express, and MongoDB.

## 🚀 Features

### Level 1 - Core Expense Tracker (Completed)
- ✅ User authentication with JWT
- ✅ Password hashing with bcrypt
- ✅ Input validation with Zod
- ✅ Centralized error handling
- ✅ Clean architecture (routes → controllers → services → models)

### Level 2 - Subscription Model (Pending)
- ⏳ Razorpay payment integration
- ⏳ Feature-gating middleware
- ⏳ Webhook handling

### Level 3 - Groups & Real-Time (Pending)
- ⏳ Group management
- ⏳ Socket.IO for real-time updates
- ⏳ Redis caching
- ⏳ Background job queues

---

## 📦 Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your configuration
```

---

## ⚙️ Environment Variables

```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/splitwise
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRY=7d
```

---

## 🏃 Running the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

---

## 📚 API Endpoints

### Authentication

#### Signup
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile (Protected)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth, validation, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── server.js        # Express app setup
├── .env.example
├── .gitignore
└── package.json
```

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT-based authentication with expiry
- ✅ Input validation with Zod
- ✅ Password excluded from API responses
- ✅ Environment variables for secrets

---

## 🧪 Testing

```bash
# Health check
curl http://localhost:5000/health
```

---

## 📝 Design Decisions

### Clean Architecture
- **Routes**: Define endpoints and apply middleware
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain all business logic
- **Models**: Define data schemas and validation

### Error Handling
- Centralized error handler for consistent responses
- Specific handlers for Mongoose, JWT, and validation errors
- Development mode includes stack traces

### Validation
- Zod schemas for type-safe validation
- Middleware factory pattern for reusability
- Detailed error messages for client debugging

---

## 🎯 Completed Levels

- ✅ **Level 1**: Authentication system with clean architecture
- ⏳ **Level 2**: Subscription & payments (pending)
- ⏳ **Level 3**: Groups, real-time, caching (pending)

---

## 🚧 Limitations

- Expense management endpoints not yet implemented
- Settlement algorithm pending
- No group functionality yet
- No real-time features yet

---

## 👨‍💻 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Dev Tools**: Nodemon

---

## 📄 License

ISC
