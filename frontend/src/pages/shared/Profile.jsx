import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { updateUserProfile } from '../../store/slices/authSlice.js';
import api from '../../api/api.js';
import { User, Key, Save, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '../../components/layout/Toast.jsx';

const Profile = () => {
  const dispatch = useDispatch();
  const showToast = useToast();
  const { user } = useSelector((state) => state.auth);

  // Profile fields
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [serviceNumber, setServiceNumber] = useState(user?.serviceNumber || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const response = await api.put('/users/profile', {
        firstName,
        lastName,
        phone,
        designation,
        serviceNumber,
      });

      if (response.data.success) {
        dispatch(updateUserProfile(response.data.data.user));

        showToast({
          title: 'Profile Updated!',
          sub: 'Your military officer profile details have been saved.',
          variant: 'success',
          duration: 3000,
        });
      }
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Update Failed',
        sub: err.response?.data?.message || 'Failed to update profile details',
        variant: 'error',
        duration: 3000,
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast({
        title: 'Validation Error',
        sub: 'New passwords do not match.',
        variant: 'error',
        duration: 3000,
      });
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        showToast({
          title: 'Password Changed!',
          sub: 'Your account security credentials have been updated.',
          variant: 'success',
          duration: 3000,
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Credentials Error',
        sub: err.response?.data?.message || 'Failed to change password.',
        variant: 'error',
        duration: 3000,
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="container-fluid py-3"
    >
      <div className="mb-4">
        <h1 className="page-title gradient-text mb-1">Account & Security Panel</h1>
        <p className="page-subtitle mb-0">Manage your military officer profile credentials and system access passwords</p>
      </div>

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-lg-6">
          <form onSubmit={handleUpdateProfile} className="card-farm glass-panel p-4 h-100 d-flex flex-column gap-3">
            <h5 className="fw-bold text-success mb-2 d-flex align-items-center gap-2" style={{ fontSize: 'var(--fs-h3)' }}>
              <User size={20} /> Officer Profile Information
            </h5>

            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>First Name</label>
                <input type="text" className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Last Name</label>
                <input type="text" className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Service Number</label>
                <input type="text" className="form-control font-mono" placeholder="e.g. IC-51004D" value={serviceNumber} onChange={(e) => setServiceNumber(e.target.value)} />
              </div>
              <div className="col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Designation / Rank</label>
                <input type="text" className="form-control" placeholder="e.g. OIC Stores" value={designation} onChange={(e) => setDesignation(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Contact Phone</label>
              <input type="tel" className="form-control" placeholder="Optional phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div>
              <label className="form-label fw-semibold text-muted" style={{ fontSize: 'var(--fs-sm)' }}>System Account Role</label>
              <div className="form-control text-capitalize opacity-75" style={{ cursor: 'not-allowed', background: 'var(--primary-green-subtle)' }}>
                {user?.role === 'master' ? 'HQ Master (HQ BEG & Centre)' : `${user?.establishmentName} Officer`}
              </div>
            </div>

            <button type="submit" className="btn btn-primary-farm d-flex align-items-center gap-2 mt-auto w-fit press-scale" disabled={profileLoading}>
              {profileLoading ? 'Saving Info...' : <><Save size={16} /> Save Officer Profile</>}
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div className="col-lg-6">
          <form onSubmit={handleChangePassword} className="card-farm glass-panel p-4 h-100 d-flex flex-column gap-3">
            <h5 className="fw-bold text-success mb-2 d-flex align-items-center gap-2" style={{ fontSize: 'var(--fs-h3)' }}>
              <Key size={20} /> Update Access Password
            </h5>

            <div>
              <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Current Password</label>
              <input 
                type="password" 
                className="form-control" 
                required 
                placeholder="Enter current password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
              />
            </div>

            <div>
              <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>New Access Password</label>
              <input 
                type="password" 
                className="form-control" 
                required 
                placeholder="Minimum 8 characters with symbols" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
            </div>

            <div>
              <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Confirm New Password</label>
              <input 
                type="password" 
                className="form-control" 
                required 
                placeholder="Confirm new password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>

            <div className="alert alert-info py-2 px-3 rounded-3" style={{ fontSize: 'var(--fs-xs)', marginTop: '8px' }}>
              <Shield size={14} className="me-1 align-text-top" />
              Ensure your password follows strict military information systems security rules.
            </div>

            <button type="submit" className="btn btn-primary-farm d-flex align-items-center gap-2 mt-auto w-fit press-scale" style={{ background: 'var(--primary-green-hover)' }} disabled={passwordLoading}>
              {passwordLoading ? 'Changing Credentials...' : <><Save size={16} /> Update Password</>}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
