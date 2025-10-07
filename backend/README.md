# Health Chat Backend API

RESTful API and WebSocket server for the Health Chat application built with Node.js, Express, and MongoDB.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with refresh tokens
- 💬 **Real-time Chat**: WebSocket communication for instant messaging
- 📁 **File Upload**: Support for images, documents, and various file formats
- 👨‍⚕️ **User Management**: Patient and doctor profile management
- 📧 **Email & SMS**: OTP verification via email and SMS
- 🔒 **Security**: Rate limiting, input validation, and CORS protection

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Nodemailer** - Email service
- **Twilio** - SMS service
- **Cloudinary** - File storage

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd health-chat-app/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/health-chat
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "mobile": "+1234567890",
  "password": "password123",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "userType": "patient"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "john@example.com",
  "password": "password123"
}
```

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "identifier": "john@example.com",
  "type": "email",
  "purpose": "email-verification"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "identifier": "john@example.com",
  "otp": "123456",
  "type": "email",
  "purpose": "email-verification"
}
```

### User Endpoints

#### Get User Profile
```http
GET /api/user/profile
Authorization: Bearer <access-token>
```

#### Update Profile
```http
PUT /api/user/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "fullName": "John Smith",
  "specialization": "Cardiology"
}
```

#### Get Doctors List
```http
GET /api/user/doctors?page=1&limit=10&specialization=Cardiology
Authorization: Bearer <access-token>
```

### Chat Endpoints

#### Create Chat
```http
POST /api/chat/create
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "participantId": "doctor-id",
  "chatType": "direct"
}
```

#### Get Chat List
```http
GET /api/chat/list?page=1&limit=20
Authorization: Bearer <access-token>
```

#### Send Message
```http
POST /api/chat/:chatId/message
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "content": "Hello, I need help with my symptoms",
  "messageType": "text"
}
```

#### Upload File
```http
POST /api/chat/:chatId/upload
Authorization: Bearer <access-token>
Content-Type: multipart/form-data

file: <file-data>
```

## WebSocket Events

### Client to Server

#### Join User Room
```javascript
socket.emit('join-user-room', userId);
```

#### Join Chat
```javascript
socket.emit('join-chat', chatId);
```

#### Send Message
```javascript
socket.emit('send-message', {
  chatId: 'chat-id',
  message: {
    content: 'Hello',
    messageType: 'text'
  },
  senderId: 'user-id'
});
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  chatId: 'chat-id',
  userId: 'user-id',
  isTyping: true
});
```

### Server to Client

#### Receive Message
```javascript
socket.on('receive-message', (messageData) => {
  console.log('New message:', messageData);
});
```

#### User Typing
```javascript
socket.on('user-typing', (data) => {
  console.log('User typing:', data);
});
```

#### User Status
```javascript
socket.on('user-status', (data) => {
  console.log('User status:', data);
});
```

## Database Models

### User Model
```javascript
{
  fullName: String,
  email: String (unique),
  mobile: String (unique),
  password: String (hashed),
  userType: String (patient/doctor),
  isEmailVerified: Boolean,
  isMobileVerified: Boolean,
  profilePicture: String,
  dateOfBirth: Date,
  gender: String,
  isActive: Boolean,
  lastLogin: Date,
  refreshTokens: [String],
  // Doctor specific
  specialization: String,
  licenseNumber: String,
  experience: Number,
  consultationFee: Number
}
```

### Chat Model
```javascript
{
  participants: [ObjectId],
  chatType: String (direct/group),
  chatName: String,
  lastMessage: ObjectId,
  lastActivity: Date,
  isActive: Boolean,
  healthContext: {
    consultationId: String,
    symptoms: [String],
    diagnosis: String,
    prescription: String,
    followUpDate: Date
  }
}
```

### Message Model
```javascript
{
  sender: ObjectId,
  content: String,
  messageType: String (text/image/document/file),
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    originalName: String
  }],
  isRead: Boolean,
  readBy: [{
    user: ObjectId,
    readAt: Date
  }],
  isEdited: Boolean,
  editedAt: Date,
  isDeleted: Boolean,
  deletedAt: Date
}
```

## Error Handling

The API uses consistent error response format:

```javascript
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **OTP Endpoints**: 5 requests per 15 minutes per IP
- **File Upload**: 10 requests per 15 minutes per user

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: Joi validation for all inputs
- **Rate Limiting**: Prevent abuse and DDoS
- **CORS Protection**: Configured for specific origins
- **Helmet**: Security headers
- **File Upload Security**: Type and size validation

## Development

### Scripts
```bash
npm run dev      # Start with nodemon
npm start        # Start production server
npm test         # Run tests
```

### Environment Variables
See `env.example` for all required environment variables.

### Database Setup
1. Install MongoDB
2. Create database: `health-chat`
3. Update `MONGODB_URI` in `.env`

## Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Configure MongoDB Atlas
- [ ] Set up Cloudinary for file storage
- [ ] Configure email service
- [ ] Set up Twilio for SMS
- [ ] Enable HTTPS
- [ ] Set up monitoring

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Monitoring

### Health Check
```http
GET /api/health
```

Response:
```json
{
  "status": "success",
  "message": "Health Chat API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
