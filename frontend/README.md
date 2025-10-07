# Health Chat Frontend

Modern React application for the Health Chat platform with real-time messaging, file sharing, and healthcare professional connections.

## Features

- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- ⚡ **Real-time Chat**: Instant messaging with WebSocket integration
- 📱 **Mobile Responsive**: Optimized for all device sizes
- 🔄 **State Management**: Redux Toolkit for efficient state handling
- 🎭 **Animations**: Smooth transitions with Framer Motion
- 📁 **File Sharing**: Drag-and-drop file upload with preview
- 🔍 **Search & Filter**: Advanced search for doctors and messages
- 🌙 **Theme Support**: Light/dark theme toggle
- 🔔 **Notifications**: Real-time toast notifications

## Tech Stack

- **React 18** - UI library
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Hook Form** - Form handling
- **Socket.io Client** - Real-time communication
- **React Icons** - Iconography
- **Date-fns** - Date utilities

## Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Auth/           # Authentication components
│   ├── Chat/           # Chat-related components
│   ├── Layout/         # Layout components
│   └── UI/             # Generic UI components
├── pages/              # Page components
│   ├── Auth/           # Login/Register pages
│   ├── Chat/           # Chat interface
│   ├── Dashboard/      # Main dashboard
│   ├── Doctors/        # Doctor listing
│   └── Profile/        # User profile
├── store/              # Redux store
│   └── slices/         # Redux slices
├── services/           # API services
├── utils/              # Utility functions
└── App.js              # Main app component
```

## Components

### Authentication
- **Login**: Multi-method login (email/mobile)
- **Register**: Multi-step registration with OTP
- **ProtectedRoute**: Route protection wrapper

### Chat
- **ChatList**: List of user's conversations
- **ChatWindow**: Main chat interface
- **MessageBubble**: Individual message component
- **FileUpload**: Drag-and-drop file upload
- **TypingIndicator**: Real-time typing status
- **DoctorList**: Available doctors listing

### Layout
- **Layout**: Main app layout wrapper
- **Sidebar**: Navigation sidebar
- **Header**: Top navigation header

### UI
- **LoadingSpinner**: Loading indicator
- **Toast**: Notification system

## Pages

### Authentication Pages
- **Login** (`/login`): User login with email/mobile
- **Register** (`/register`): User registration with OTP verification

### Main Pages
- **Dashboard** (`/dashboard`): Main overview with stats and recent activity
- **Chat** (`/chat`): Chat interface with message list
- **Doctors** (`/doctors`): Browse and search doctors
- **Profile** (`/profile`): User profile management

## State Management

### Redux Slices

#### Auth Slice
```javascript
{
  user: User | null,
  accessToken: string | null,
  refreshToken: string | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null,
  otpSent: boolean,
  otpVerified: boolean,
  registrationStep: number
}
```

#### Chat Slice
```javascript
{
  chats: Chat[],
  currentChat: Chat | null,
  messages: Message[],
  isLoading: boolean,
  isSendingMessage: boolean,
  error: string | null,
  onlineUsers: string[],
  typingUsers: string[],
  unreadCount: number
}
```

#### UI Slice
```javascript
{
  sidebarOpen: boolean,
  mobileMenuOpen: boolean,
  theme: 'light' | 'dark',
  notifications: Notification[],
  modals: {
    profile: boolean,
    settings: boolean,
    fileUpload: boolean
  },
  loading: {
    global: boolean,
    auth: boolean,
    chat: boolean
  }
}
```

## API Integration

### Services
- **authAPI**: Authentication endpoints
- **userAPI**: User management endpoints
- **chatAPI**: Chat and messaging endpoints
- **socketService**: WebSocket communication

### Example Usage
```javascript
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, getCurrentUser } from '../store/slices/authSlice';

const LoginComponent = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(state => state.auth);

  const handleLogin = (credentials) => {
    dispatch(loginUser(credentials));
  };

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  return (
    // Login form JSX
  );
};
```

## Real-time Features

### WebSocket Integration
```javascript
import { socketService } from '../services/api';

// Connect to socket
socketService.connect(token);

// Join user room
socketService.joinUserRoom(userId);

// Send message
socketService.sendMessage(chatId, message, senderId);

// Listen for messages
socketService.onReceiveMessage((message) => {
  // Handle incoming message
});
```

### Socket Events
- **join-user-room**: Join personal room
- **join-chat**: Join specific chat
- **send-message**: Send message to chat
- **typing**: Send typing indicator
- **receive-message**: Receive new message
- **user-typing**: Receive typing indicator
- **user-status**: Receive user online status

## Styling

### Tailwind CSS Classes
```css
/* Custom utility classes */
.btn-primary     /* Primary button style */
.btn-secondary   /* Secondary button style */
.btn-outline     /* Outline button style */
.input-field     /* Form input style */
.card            /* Card container style */
.gradient-bg     /* Gradient background */
.health-gradient /* Health theme gradient */
```

### Custom CSS
- **Chat scrollbar**: Custom scrollbar for chat messages
- **Typing indicator**: Animated typing dots
- **File upload zones**: Drag-and-drop styling
- **Message status**: Read/delivered indicators

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- **Collapsible sidebar**: Hidden by default on mobile
- **Touch-friendly**: Large touch targets
- **Swipe gestures**: For navigation
- **Mobile menu**: Hamburger menu for navigation

## Performance

### Optimization Techniques
- **Code splitting**: Lazy loading of components
- **Memoization**: React.memo for expensive components
- **Virtual scrolling**: For large message lists
- **Image optimization**: Lazy loading and compression
- **Bundle optimization**: Tree shaking and minification

### Loading States
- **Skeleton loaders**: For content loading
- **Progressive loading**: Load content in chunks
- **Error boundaries**: Graceful error handling
- **Retry mechanisms**: Automatic retry for failed requests

## Testing

### Test Setup
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Files
- **Component tests**: `*.test.js`
- **Integration tests**: `*.integration.test.js`
- **E2E tests**: `*.e2e.test.js`

## Build & Deployment

### Development Build
```bash
npm start
```

### Production Build
```bash
npm run build
```

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-preset
```

### Deployment Checklist
- [ ] Set production environment variables
- [ ] Build optimization enabled
- [ ] Service worker configured
- [ ] CDN setup for static assets
- [ ] HTTPS enabled
- [ ] Error monitoring configured

## Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## Accessibility

### Features
- **Keyboard navigation**: Full keyboard support
- **Screen reader**: ARIA labels and roles
- **Color contrast**: WCAG AA compliant
- **Focus management**: Visible focus indicators
- **Semantic HTML**: Proper HTML structure

### ARIA Labels
```jsx
<button
  aria-label="Send message"
  aria-describedby="message-help"
>
  <FiSend />
</button>
```

## Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style
- **ESLint**: Configured for React
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format
- **Component naming**: PascalCase
- **File naming**: camelCase

## Troubleshooting

### Common Issues

#### Socket Connection Failed
```javascript
// Check if token is valid
const token = localStorage.getItem('accessToken');
if (!token) {
  // Redirect to login
}
```

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Styling Issues
```bash
# Rebuild Tailwind CSS
npm run build:css
```

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- **Email**: support@healthchat.com
- **Documentation**: [docs.healthchat.com](https://docs.healthchat.com)
- **Issues**: [GitHub Issues](https://github.com/healthchat/issues)
