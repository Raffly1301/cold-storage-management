
import React, { useState } from 'react';
import { BoxIcon } from './ui/Icons';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error?: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, error: authError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    
    if (username.trim() === '') {
      setValidationError('Username cannot be empty.');
      return;
    }
    if (password.trim() === '') {
      setValidationError('Password cannot be empty.');
      return;
    }
    
    onLogin(username, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg animate-fade-in-down">
        <div className="flex flex-col items-center">
          <BoxIcon className="w-12 h-12 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Cold Storage Login</h1>
          <p className="text-sm text-gray-500">Enter your credentials</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {(validationError || authError) && (
            <p className="text-red-500 text-xs text-center font-semibold">
              {validationError || authError}
            </p>
          )}
          <div>
            <label htmlFor="username" className="sr-only">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setValidationError('');
              }}
              placeholder="Username"
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 border rounded-md focus:border-red-500 focus:ring-red-500 focus:outline-none focus:ring focus:ring-opacity-40"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationError('');
              }}
              placeholder="Password"
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 border rounded-md focus:border-red-500 focus:ring-red-500 focus:outline-none focus:ring focus:ring-opacity-40"
            />
          </div>
          <button type="submit" className="w-full px-4 py-2 font-semibold text-white transition-colors duration-200 transform bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};
