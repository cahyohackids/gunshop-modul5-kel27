import { useState } from 'react'
import { ArrowLeft, Shield, Camera, Save, AlertCircle, Trash2 } from 'lucide-react'
import userService, { normalizePhone } from '../services/userService'
import { compressImage } from '../utils/image'

/**
 * EditProfilePage — separate page opened from the "Edit Profile" button.
 * Edits callsign, bio, WhatsApp number and avatar (all stored in localStorage).
 */
export default function EditProfilePage({ onBack, onSaved }) {
  const [initial] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(initial.username || 'Shooter')
  const [bio, setBio] = useState(initial.bio || '')
  const [phone, setPhone] = useState(initial.phone || '')
  const [avatar, setAvatar] = useState(initial.avatar || null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('File avatar harus berupa gambar.')
      return
    }
    try {
      setError('')
      // Shrink before storing so localStorage doesn't overflow
      setAvatar(await compressImage(file, { maxSize: 320, quality: 0.8 }))
    } catch {
      setError('Gagal membaca gambar.')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const cleanPhone = normalizePhone(phone)
    if (phone.trim() && (cleanPhone.length < 10 || cleanPhone.length > 15)) {
      setError('Nomor WhatsApp tidak valid. Contoh: 081234567890')
      return
    }

    setSaving(true)
    const result = userService.saveUserProfile({
      ...initial,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      phone: cleanPhone,
      avatar,
    })
    setSaving(false)

    if (result.success) {
      if (onSaved) onSaved(result.data)
      else if (onBack) onBack()
    } else {
      setError('Gagal menyimpan profil (penyimpanan browser penuh?).')
    }
  }

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Profile
        </button>
      </div>

      <div className="form-title-group">
        <h1 className="display">Edit Profile</h1>
        <p className="lede">Perbarui identitas operator. Data disimpan di perangkat ini.</p>
      </div>

      {error && (
        <div className="toast toast--error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="edit-avatar-row">
          <div className="avatar-wrap">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
            <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
              <Camera size={14} />
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>
          {avatar && (
            <button type="button" className="btn btn--danger-ghost btn--sm" onClick={() => setAvatar(null)}>
              <Trash2 size={14} /> Hapus foto
            </button>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="prof-name" className="form-label">
            Callsign / Operator Alias
          </label>
          <input
            id="prof-name"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Operator Delta, Master Gunsmith"
            className="form-input"
            maxLength={40}
          />
        </div>

        <div className="form-group">
          <label htmlFor="prof-phone" className="form-label">
            Nomor WhatsApp (untuk tombol Hubungi Penjual)
          </label>
          <input
            id="prof-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="081234567890"
            className="form-input"
          />
          <span className="form-hint">Dipakai otomatis sebagai nomor penjual saat kamu menambah katalog.</span>
        </div>

        <div className="form-group">
          <label htmlFor="prof-bio" className="form-label">
            Armory Notes / Station Bio
          </label>
          <textarea
            id="prof-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Qualifications, preferred calibers, unit assignment..."
            rows={3}
            className="form-textarea"
            maxLength={300}
          />
        </div>

        <div className="form-actions-bar">
          <button type="button" className="btn btn--outline" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            <Save size={16} /> Simpan Profil
          </button>
        </div>
      </form>
    </div>
  )
}
