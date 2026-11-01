import { useState } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Play,
  Pencil,
  MessageCircle,
  Archive,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { getAllDraftIds } from '../utils/draftStorage'
import DraftList from '../components/profile/DraftList'
import About from './About'
import Contact from './Contact'

/**
 * ProfilePage — read-only operator profile.
 *
 * Sections:
 *   - Identity card + stats + "Edit Profile" button (opens EditProfilePage)
 *   - Draft Katalog — list of saved drafts (continue / delete)
 *   - About   (moved here from the header tabs)
 *   - Contact (moved here from the header tabs)
 */
export default function ProfilePage({ onReplaySplash, onEditProfile, onOpenDraft, onOpenArchive }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)

  const { favorites } = useFavorites()
  const [draftCount] = useState(() => getAllDraftIds().length)

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard?.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="profile-page">
      <section className="masthead profile-masthead">
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">
            Operator credentials, procurement statistics, and armorer details.
          </p>
        </div>
        {onReplaySplash && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onReplaySplash}
            title="Replay introductory splash animation"
          >
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
          </div>

          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID to clipboard"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {onEditProfile && (
            <button
              type="button"
              className="btn btn--primary btn--sm profile-edit-btn"
              onClick={onEditProfile}
            >
              <Pencil size={14} /> Edit Profile
            </button>
          )}
        </div>

        <div className="profile-details">
          <p className="profile-bio">
            {profile.bio || <span className="muted">Belum ada bio. Tambahkan lewat Edit Profile.</span>}
          </p>
          <p className="profile-phone">
            <MessageCircle size={15} />
            {profile.phone ? (
              <span>+{profile.phone}</span>
            ) : (
              <span className="muted">Nomor WhatsApp belum diisi</span>
            )}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <a className="stat-item stat-item--link" href="#drafts">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{draftCount}</div>
            <div className="stat-label">Saved Offline Drafts</div>
          </a>
        </div>

        {onOpenArchive && (
          <button type="button" className="btn btn--outline btn--sm" onClick={onOpenArchive}>
            <Archive size={14} /> Lihat Arsip Katalog
          </button>
        )}
      </div>

      <DraftList onOpenDraft={onOpenDraft} />
      <About />
      <Contact />
    </div>
  )
}
