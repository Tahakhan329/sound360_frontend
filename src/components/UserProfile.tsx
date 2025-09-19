import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Upload, X, Save, Edit } from 'lucide-react';

interface UserProfileProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    profilePicture?: string;
  };
  onUpdateProfile?: (userData: any) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  user = {
    id: '1',
    name: 'Admin User',
    email: 'admin@inseyab.com',
    role: 'Administrator'
  },
  onUpdateProfile 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(user);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setProfileData(prev => ({ ...prev, profilePicture: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (onUpdateProfile) {
      onUpdateProfile(profileData);
    }
    setIsEditing(false);
    setPreviewImage(null);
  };

  const handleCancel = () => {
    setProfileData(user);
    setPreviewImage(null);
    setIsEditing(false);
  };

  const removeProfilePicture = () => {
    setProfileData(prev => ({ ...prev, profilePicture: undefined }));
    setPreviewImage(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-100">User Profile</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-600 bg-gray-700">
              {previewImage || profileData.profilePicture ? (
                <img
                  src={previewImage || profileData.profilePicture}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors border-2 border-gray-800"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {isEditing && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photo</span>
              </button>
              
              {(previewImage || profileData.profilePicture) && (
                <button
                  onClick={removeProfilePicture}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Profile Information */}
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-100 text-lg font-medium">{profileData.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-300">{profileData.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            {isEditing ? (
              <select
                value={profileData.role}
                onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Administrator">Administrator</option>
                <option value="Manager">Manager</option>
                <option value="User">User</option>
                <option value="Viewer">Viewer</option>
              </select>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-blue-100">
                {profileData.role}
              </span>
            )}
          </div>

          {!isEditing && (
            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Photo Guidelines</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Supported formats: JPG, PNG, GIF</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Recommended dimensions: 400x400 pixels</li>
            <li>• Square images work best for profile pictures</li>
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default UserProfile;