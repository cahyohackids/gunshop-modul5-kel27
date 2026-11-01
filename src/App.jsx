import { useState, useEffect, lazy, Suspense } from 'react'
import { Loader } from 'lucide-react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Catalog from './pages/Catalog.jsx'
// Lazy load (code-splitting): these screens are only downloaded the first
// time the user opens them, keeping the initial bundle small.
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const GunDetail = lazy(() => import('./components/gun/GunDetail.jsx'))
const GunDetailLoader = lazy(() => import('./components/gun/GunDetailLoader.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const ArchivePage = lazy(() => import('./pages/ArchivePage.jsx'))

const PageFallback = () => (
  <div className="state-box">
    <Loader size={26} className="spin" />
    <p>Memuat halaman…</p>
  </div>
)
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import gunService from './services/gunService.js'
import { getGunIdFromUrl, setGunIdInUrl } from './utils/share.js'
import './App.css'

// Shared link support: /?gun=<id> opens that product directly
const initialGunId = getGunIdFromUrl()

function App() {
  const [showSplash, setShowSplash] = useState(!initialGunId)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState(initialGunId ? 'detail' : 'list') // 'list' | 'create' | 'edit' | 'detail'
  const [selectedGun, setSelectedGun] = useState(initialGunId ? { id: initialGunId } : null)
  const [editingGun, setEditingGun] = useState(null)
  const [resumeDraft, setResumeDraft] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    setResumeDraft(Boolean(payload?.resumeDraft))
    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'EditProfile') {
      setMode('editProfile')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      if (payload?.id && !String(payload.id).startsWith('local-')) setGunIdInUrl(payload.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Tab change
      if (getGunIdFromUrl()) setGunIdInUrl(null, { replace: true })
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Profile → Draft → "Lanjutkan"
  const handleOpenDraft = (draftId) => {
    if (draftId === 'create') handleNavigate('Create', { resumeDraft: true })
    else handleNavigate('Edit', { id: draftId, resumeDraft: true })
  }

  const handleBackToList = () => {
    setResumeDraft(false)
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
    if (getGunIdFromUrl()) setGunIdInUrl(null, { replace: true })
  }

  // Browser back/forward between catalog and a product's link
  useEffect(() => {
    const onPop = () => {
      const id = getGunIdFromUrl()
      if (id) {
        setSelectedGun((prev) => (prev && String(prev.id) === String(id) ? prev : { id }))
        setMode('detail')
      } else {
        setMode('list')
        setSelectedGun(null)
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
      />

      <main className="main">
        <Suspense fallback={<PageFallback />}>
        {/* Sub-page views */}
        {mode === 'create' && (
          <CreateGunPage
            resumeDraft={resumeDraft}
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'edit' && (
          <EditGunPage
            gun={editingGun}
            gunId={editingGun?.id}
            resumeDraft={resumeDraft}
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'editProfile' && (
          <EditProfilePage
            onBack={() => handleNavigate('Profile')}
            onSaved={() => handleNavigate('Profile')}
          />
        )}

        {mode === 'detail' && selectedGun && (
          selectedGun.name ? (
            <GunDetail
              gun={selectedGun}
              onBack={handleBackToList}
              onEdit={(g) => handleNavigate('Edit', g)}
              onDelete={(g) => setDeleteTarget(g)}
            />
          ) : (
            <GunDetailLoader
              gunId={selectedGun.id}
              onBack={handleBackToList}
              onEdit={(g) => handleNavigate('Edit', g)}
              onDelete={(g) => setDeleteTarget(g)}
            />
          )
        )}

        {/* Top-level Tabs */}
        {mode === 'list' && (
          <>
            {tab === 'Catalog' && (
              <Catalog
                onNavigate={(destination, payload) => handleNavigate(destination, payload)}
              />
            )}
            {tab === 'Favorites' && (
              <FavoritesPage
                onSelectGun={(g) => handleNavigate('Detail', g)}
                onNavigateCatalog={() => setTab('Catalog')}
              />
            )}
            {tab === 'Profile' && (
              <ProfilePage
                onReplaySplash={() => setShowSplash(true)}
                onEditProfile={() => handleNavigate('EditProfile')}
                onOpenDraft={handleOpenDraft}
                onOpenArchive={() => handleNavigate('Archive')}
              />
            )}
            {tab === 'Archive' && (
              <ArchivePage onNavigateCatalog={() => handleNavigate('Catalog')} />
            )}
          </>
        )}
        </Suspense>
      </main>

      {/* Global Delete Confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Arsipkan Katalog?"
        message={`"${deleteTarget?.name}" akan disembunyikan dari katalog dan dipindah ke Arsip. Bisa dipulihkan atau dihapus permanen dari halaman Arsip.`}
        confirmLabel="Arsipkan"
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            // Soft delete (archive) — permanent delete lives on the Archive page
            await gunService.archiveGun(deleteTarget.id)
            setDeleteTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Gagal mengarsipkan.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
