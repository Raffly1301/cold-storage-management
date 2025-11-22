
import React, { useState } from 'react';
import { PlusIcon, CloseIcon } from './ui/Icons';
import { User } from '../types';

interface ItemCodeManagerProps {
  itemCodes: string[];
  onAddItemCode: (code: string) => Promise<void>;
  onDeleteItemCode: (code: string) => Promise<void>;
  users: User[];
  onAddUser: (user: User) => Promise<void>;
  onDeleteUser: (username: string) => Promise<void>;
  currentUser: string;
}

export const ItemCodeManager: React.FC<ItemCodeManagerProps> = ({ 
  itemCodes, 
  onAddItemCode, 
  onDeleteItemCode, 
  users, 
  onAddUser, 
  onDeleteUser, 
  currentUser 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [error, setError] = useState('');
  const [addError, setAddError] = useState('');
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'USERS'>('ITEMS');
  const [loading, setLoading] = useState(false);

  // User Management State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'USER' | 'VIEWER'>('USER');
  const [userError, setUserError] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Check for the specific master password requested by the user
    if (passwordInput === 'bountypwk123') { 
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect Settings Password.');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    const codeToAdd = newItemCode.trim().toUpperCase();

    if (!codeToAdd) {
        setAddError('Item code cannot be empty.');
        return;
    }
    if (itemCodes.includes(codeToAdd)) {
        setAddError('This item code already exists.');
        return;
    }

    try {
        setLoading(true);
        await onAddItemCode(codeToAdd);
        setNewItemCode('');
    } catch (err) {
        console.error(err);
        setAddError('Failed to add item code.');
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteItem = async (codeToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete "${codeToDelete}"?`)) {
        try {
            setLoading(true);
            await onDeleteItemCode(codeToDelete);
        } catch (err) {
            console.error(err);
            alert('Failed to delete item code.');
        } finally {
            setLoading(false);
        }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setUserError('');

      if (!newUsername.trim() || !newPassword.trim()) {
          setUserError('Username and Password are required.');
          return;
      }
      if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
          setUserError('Username already exists.');
          return;
      }

      const newUser: User = {
          username: newUsername.trim(),
          password: newPassword.trim(),
          role: newRole
      };

      try {
          setLoading(true);
          await onAddUser(newUser);
          setNewUsername('');
          setNewPassword('');
          setNewRole('USER');
      } catch (err) {
          console.error(err);
          setUserError('Failed to add user.');
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteUser = async (usernameToDelete: string) => {
      if (usernameToDelete === currentUser) {
          alert("You cannot delete yourself.");
          return;
      }
      // Prevent deleting the last admin
      const admins = users.filter(u => u.role === 'ADMIN');
      const userToDelete = users.find(u => u.username === usernameToDelete);
      
      if (userToDelete?.role === 'ADMIN' && admins.length <= 1) {
          alert("Cannot delete the last Administrator.");
          return;
      }

      if (window.confirm(`Delete user "${usernameToDelete}"?`)) {
          try {
              setLoading(true);
              await onDeleteUser(usernameToDelete);
          } catch (err) {
              console.error(err);
              alert('Failed to delete user.');
          } finally {
              setLoading(false);
          }
      }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Settings Access Required</h2>
          <p className="text-center text-gray-600 mb-6">Enter the master password to access settings.</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
             {error && <p className="text-red-500 text-sm font-semibold text-center">{error}</p>}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setError('');
                }}
                placeholder="Enter Settings password"
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 border rounded-md focus:border-red-500 focus:ring-red-500 focus:outline-none focus:ring focus:ring-opacity-40"
                autoFocus
              />
            </div>
            <button type="submit" className="w-full px-4 py-2 font-semibold text-white transition-colors duration-200 transform bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">System Settings</h2>
        {loading && <div className="mb-4 text-sm text-blue-600 font-medium">Processing...</div>}
        
        <div className="flex border-b border-gray-200 mb-6">
            <button 
                className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'ITEMS' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('ITEMS')}
            >
                Item Codes
            </button>
            <button 
                className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'USERS' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('USERS')}
            >
                User Management
            </button>
        </div>

        {activeTab === 'ITEMS' && (
            <div className="space-y-6 animate-fade-in-up">
                 <form onSubmit={handleAddItem} className="flex gap-2 pb-6 border-b">
                    <input
                        type="text"
                        value={newItemCode}
                        onChange={e => {
                            setNewItemCode(e.target.value)
                            setAddError('');
                        }}
                        placeholder="Enter new item code (e.g., NEW-ITEM-001)"
                        className="flex-grow w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading} className="flex-shrink-0 inline-flex items-center justify-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                        <PlusIcon className="w-5 h-5" />
                        Add Code
                    </button>
                </form>
                {addError && <p className="text-red-500 text-sm -mt-4 mb-4">{addError}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pr-2">
                    {itemCodes.length > 0 ? itemCodes.map(code => (
                        <div key={code} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-100">
                            <span className="font-mono text-gray-800 text-sm">{code}</span>
                            <button onClick={() => handleDeleteItem(code)} disabled={loading} className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-4 col-span-3">No item codes defined.</p>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'USERS' && (
             <div className="space-y-6 animate-fade-in-up">
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                     <h3 className="text-lg font-medium text-gray-800 mb-4">Add New User</h3>
                     {userError && <p className="text-red-500 text-sm mb-2">{userError}</p>}
                     <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Username</label>
                             <input 
                                type="text" 
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                disabled={loading}
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Password</label>
                             <input 
                                type="text" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                disabled={loading}
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Role</label>
                             <select 
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'USER' | 'VIEWER')}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                disabled={loading}
                             >
                                 <option value="USER">Staff (User)</option>
                                 <option value="ADMIN">Administrator</option>
                                 <option value="VIEWER">Viewer (Read Only)</option>
                             </select>
                         </div>
                         <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                            <PlusIcon className="w-5 h-5" />
                            Add User
                        </button>
                     </form>
                 </div>

                 <div>
                     <h3 className="text-lg font-medium text-gray-800 mb-4">Existing Users</h3>
                     <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.username}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.username}
                                            {user.username === currentUser && <span className="ml-2 text-xs text-green-600">(You)</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                                                user.role === 'VIEWER' ? 'bg-blue-100 text-blue-800' : 
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                                            {user.password}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => handleDeleteUser(user.username)}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={user.username === currentUser || loading}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
};
