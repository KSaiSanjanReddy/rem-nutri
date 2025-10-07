# Health Chat Application

A comprehensive health chat application that connects patients with doctors and health professionals for real-time communication, file sharing, and health consultations.

## Features

### 🔐 Authentication & Security
- **Multi-method Registration**: Email and mobile number registration
- **OTP Verification**: Secure email and SMS verification
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Separate interfaces for patients and doctors
- **Password Security**: Bcrypt hashing with strength validation

### 💬 Real-time Chat
- **Instant Messaging**: Real-time chat using WebSockets
- **File Sharing**: Support for images, documents, PDFs, and various file formats
- **Message Status**: Sent, delivered, and read indicators
- **Typing Indicators**: Real-time typing status
- **Message History**: Persistent chat history
- **Online Status**: User availability indicators

### 👨‍⚕️ Doctor Features
- **Doctor Profiles**: Specialization, experience, and consultation fees
- **Patient Management**: View and manage patient conversations
- **Health Context**: Track symptoms, diagnosis, and prescriptions
- **Consultation Records**: Maintain detailed consultation history

### 👤 Patient Features
- **Doctor Discovery**: Search and find doctors by specialty
- **Health Tracking**: Monitor health journey and progress
- **File Management**: Securely share medical reports and documents
- **Consultation History**: Access past conversations and advice

### 🎨 User Experience
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Smooth Animations**: Framer Motion for delightful interactions
- **Mobile Responsive**: Optimized for all device sizes
- **Dark/Light Theme**: Customizable interface themes
- **Real-time Updates**: Live notifications and status updates

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Nodemailer** for email services
- **Twilio** for SMS services
- **Cloudinary** for file storage

### Frontend
- **React 18** with functional components
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Hook Form** for form handling
- **Socket.io Client** for real-time features
- **React Icons** for iconography

## Project Structure

```
health-chat-app/
├── backend/
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Redux store and slices
│   │   ├── services/     # API services
│   │   └── App.js        # Main app component
│   └── public/           # Static assets
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
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
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/change-password` - Change password
- `GET /api/user/doctors` - Get doctors list
- `GET /api/user/doctors/:id` - Get doctor details

### Chat
- `POST /api/chat/create` - Create new chat
- `GET /api/chat/list` - Get user's chats
- `GET /api/chat/:id` - Get chat details
- `POST /api/chat/:id/message` - Send message
- `POST /api/chat/:id/upload` - Upload file
- `PUT /api/chat/:id/message/:messageId` - Edit message
- `DELETE /api/chat/:id/message/:messageId` - Delete message
- `PUT /api/chat/:id/read` - Mark as read

## Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/health-chat

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

## Features in Detail

### Real-time Communication
- WebSocket-based instant messaging
- Typing indicators and online status
- Message delivery and read receipts
- Real-time notifications

### File Sharing
- Support for multiple file formats
- Secure file upload and storage
- Image preview and document download
- File size and type validation

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting for API endpoints
- Input validation and sanitization
- CORS configuration

### User Experience
- Responsive design for all devices
- Smooth animations and transitions
- Intuitive navigation
- Loading states and error handling
- Toast notifications

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@healthchat.com or join our Slack channel.

## Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Framer Motion for smooth animations
- Socket.io for real-time communication
- All the open-source contributors
