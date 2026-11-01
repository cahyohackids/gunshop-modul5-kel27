import { formatPrice } from './helpers'
import { getGunShareUrl } from './share'
import { normalizePhone } from '../services/userService'

/**
 * Build the wa.me link for a product. With a seller number it opens that
 * chat directly; without one, WhatsApp asks which contact to send it to.
 */
export const buildWhatsAppLink = (gun) => {
  const number = normalizePhone(gun.seller_wa)
  const hasLink = gun.id && !String(gun.id).startsWith('local-')
  const lines = [
    `Halo, saya tertarik dengan *${gun.name}* (${formatPrice(gun.price ?? 0)}).`,
    'Apakah masih tersedia?',
  ]
  if (hasLink) lines.push('', getGunShareUrl(gun))
  const text = encodeURIComponent(lines.join('\n'))
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`
}
