# Pipeline Vista Guardian

A comprehensive pipeline monitoring and management system built with React, TypeScript, and Node.js. This application provides real-time monitoring of pipeline networks, device management, catastrophe tracking, and valve operations.

## 🚀 Features

- **Real-time Pipeline Monitoring**: Interactive map-based dashboard for pipeline network visualization
- **Device Management**: Track and manage various pipeline monitoring devices
- **Catastrophe Management**: Report, track, and manage pipeline incidents
- **Valve Operations**: Control and monitor valve operations with detailed logging
- **Survey Management**: Conduct and track pipeline surveys
- **Reports Dashboard**: Comprehensive reporting and analytics
- **Responsive Design**: Mobile-friendly interface with dark/light mode support

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful UI components
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Leaflet** - Interactive maps
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe server development
- **Mock Data** - In-memory data storage for development

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pipeline-vista-guardian
```

### 2. Install Frontend Dependencies

```bash
# Install frontend dependencies
npm install
```

### 3. Install Backend Dependencies

```bash
# Navigate to server directory
cd server

# Install backend dependencies
npm install

# Return to project root
cd ..
```

## 🚀 Running the Application

### Development Mode

You need to run both the frontend and backend servers:

#### Terminal 1 - Backend Server
```bash
cd server
npm run dev
```
The backend server will start on `http://localhost:3001`

#### Terminal 2 - Frontend Development Server
```bash
npm run dev
```
The frontend will start on `http://localhost:5173`

### Production Build

```bash
# Build the frontend
npm run build

# Preview the production build
npm run preview
```

## 📁 Project Structure

```
pipeline-vista-guardian/
├── public/                 # Static assets
├── src/                   # Frontend source code
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components (Shadcn)
│   │   └── ...           # Feature-specific components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries and API client
│   ├── pages/            # Page components
│   ├── types/            # TypeScript type definitions
│   └── main.tsx          # Application entry point
├── server/               # Backend source code
│   ├── routes/           # API route handlers
│   ├── models/           # Type definitions
│   └── index.ts          # Server entry point
├── tailwind.config.ts    # Tailwind CSS configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Project dependencies
```

## 📚 Available Scripts

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Scripts
```bash
cd server
npm run dev          # Start development server with hot reload
npm start            # Start production server
npm run build        # Compile TypeScript to JavaScript
```

## 🔌 API Endpoints

The backend provides RESTful APIs for:

### Devices
- `GET /api/devices` - List all devices with pagination and filtering
- `GET /api/devices/:id` - Get specific device
- `POST /api/devices` - Create new device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Pipelines
- `GET /api/pipelines` - List all pipeline segments
- `GET /api/pipelines/:id` - Get specific pipeline
- `POST /api/pipelines` - Create new pipeline
- `PUT /api/pipelines/:id` - Update pipeline
- `DELETE /api/pipelines/:id` - Delete pipeline

### Valves
- `GET /api/valves` - List all valves
- `GET /api/valves/:id` - Get specific valve
- `POST /api/valves` - Create new valve
- `PUT /api/valves/:id` - Update valve
- `DELETE /api/valves/:id` - Delete valve

### Catastrophes
- `GET /api/catastrophes` - List all catastrophes
- `GET /api/catastrophes/:id` - Get specific catastrophe
- `POST /api/catastrophes` - Create new catastrophe
- `PUT /api/catastrophes/:id` - Update catastrophe
- `DELETE /api/catastrophes/:id` - Delete catastrophe

### Surveys
- `GET /api/surveys` - List all surveys
- `GET /api/surveys/:id` - Get specific survey


### Configuration
- `GET /api/config/catastrophe-types` - Get catastrophe types
- `GET /api/config/device-types` - Get device types
- `GET /api/config/valve-types` - Get valve types
- `GET /api/config/pipeline-materials` - Get pipeline materials
- `GET /api/config/status-options/:type` - Get status options

### API Documentation
When the backend is running, visit `http://localhost:3001/api-docs` for interactive Swagger documentation.

## 🎨 Design System

The project uses a comprehensive design system built with:
- **Tailwind CSS** for utility classes
- **CSS Variables** for theming and dark mode
- **Shadcn/ui** components for consistent UI elements
- **Responsive design** principles for mobile compatibility

## 🔄 Development Workflow

1. **Start both servers** (frontend and backend)
2. **Make changes** to either frontend or backend code
3. **Hot reload** automatically refreshes the application
4. **Use React Query DevTools** for API state debugging
5. **Check browser console** for any errors or warnings

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to fetch" errors**
   - Ensure the backend server is running on port 3001
   - Check if there are any CORS issues

2. **Port conflicts**
   - Frontend default: 5173
   - Backend default: 3001
   - Modify ports in respective configuration files if needed

3. **Dependencies issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

4. **TypeScript errors**
   - Ensure all type definitions are properly imported
   - Check for any missing dependencies

## 🚀 Deployment

### Frontend Deployment
The frontend can be deployed to any static hosting service:
1. Run `npm run build`
2. Deploy the `dist` folder to your hosting provider

### Backend Deployment
Deploy the backend to any Node.js hosting service:
1. Ensure environment variables are configured
2. Run `npm run build` in the server directory
3. Deploy the compiled JavaScript files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the console logs for error details
3. Ensure both frontend and backend servers are running
4. Verify all dependencies are installed correctly

---

**Happy coding! 🚀**

## Lovable Project Info

**URL**: https://lovable.dev/projects/1d4fe78c-5d04-4a24-8e69-cbe0864af985

### How to edit this code in Lovable

Simply visit the [Lovable Project](https://lovable.dev/projects/1d4fe78c-5d04-4a24-8e69-cbe0864af985) and start prompting. Changes made via Lovable will be committed automatically to this repo.

### Custom Domain

You can connect a custom domain by navigating to Project > Settings > Domains and clicking Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
