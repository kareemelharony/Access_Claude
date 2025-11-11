import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';
import './styles/index.css';

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="spinner h-12 w-12 mb-4 mx-auto"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<Loading />}>
      <App />
    </Suspense>
  </React.StrictMode>
);
