import axios from 'axios'
import { BASE_URL, SUPABASE_KEY, IS_SUPABASE } from '../config/api'
import { compressImage } from '../utils/image'

// ---------------------------------------------------------------------------
// UploadService — image upload service.
// Supports Supabase Storage (/storage/v1/object/:bucket/:file) and
// standard REST API (/api/v1/upload), with client-side fallback.
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

class UploadService {
  /**
   * Upload a single image file.
   * @param {File} file
   * @returns {Promise<{ success: boolean, data: { url: string } }>}
   */
  async uploadImage(file) {
    if (!file) {
      throw new Error('No file provided.')
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        'Invalid file type. Allowed formats: .jpg, .jpeg, .png, .webp',
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('File size exceeds the 5 MB limit.')
    }

    // --- Supabase Storage flow ---
    if (IS_SUPABASE) {
      // Shrink big photos first (max 1280px, JPEG) — faster upload & loading
      let body = file
      let contentType = file.type
      let ext = file.name.split('.').pop() || 'png'
      try {
        const dataUrl = await compressImage(file, { maxSize: 1280, quality: 0.8 })
        if (dataUrl.startsWith('data:image/jpeg')) {
          body = await (await fetch(dataUrl)).blob()
          contentType = 'image/jpeg'
          ext = 'jpg'
        }
      } catch {
        /* keep the original file */
      }

      const fileName = `gun_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`
      const bucketName = 'guns'

      try {
        const uploadUrl = `${BASE_URL}/storage/v1/object/${bucketName}/${fileName}`
        await axios.post(uploadUrl, body, {
          headers: {
            'Content-Type': contentType,
            // File names are unique, so the photo never changes → let the
            // browser keep it in its disk cache for a year.
            'cache-control': 'max-age=31536000',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          timeout: 30000,
        })

        const publicUrl = `${BASE_URL}/storage/v1/object/public/${bucketName}/${fileName}`
        return {
          success: true,
          data: { url: publicUrl, filename: fileName },
        }
      } catch (err) {
        console.warn('Supabase bucket upload not accessible, creating base64 data URL:', err)
        // Store a small compressed base64 Data URL so the image still persists
        const dataUrl = await compressImage(file, { maxSize: 800, quality: 0.7 })

        return {
          success: true,
          data: { url: dataUrl, filename: file.name },
        }
      }
    }

    // --- University API flow (/api/v1/upload) ---
    const formData = new FormData()
    formData.append('image', file)

    const response = await axios.post(`${BASE_URL}/api/v1/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    })

    return response.data
  }
}

export default new UploadService()
