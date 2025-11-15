# DataVault Nigeria - Frontend

A beautiful, modern React frontend for the DataVault Nigeria secure data storage platform.

## Features

- 🔐 Secure authentication (Login/Signup)
- 📄 Document upload and management
- 🔒 Personal data storage with encryption
- 📊 Access logs and tracking
- 🛡️ Active access management
- 🎨 Beautiful, modern UI with animations
- 📱 Fully responsive design
- 🌙 Dark mode support

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion (animations)
- React Router
- Axios
- React Hook Form
- React Hot Toast

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional):
```env
VITE_API_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── context/        # React context providers
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
└── package.json        # Dependencies
```

## API Integration

The frontend connects to the backend API running on `http://localhost:3000` by default. Make sure your backend server is running before starting the frontend.

## License

ISC






