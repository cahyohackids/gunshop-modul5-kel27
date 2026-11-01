import { MessageCircle } from 'lucide-react'
import { formatPrice } from '../../utils/helpers'
import { getGunShareUrl } from '../../utils/share'
import { normalizePhone } from '../../services/userService'

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

/**
 * "Hubungi Penjual" — opens WhatsApp with a pre-filled message.
 *
 * @param {Object} props.gun
 * @param {'card'|'button'} [props.variant='button']
 */
export default function ContactSellerButton({ gun, variant = 'button' }) {
  const hasNumber = Boolean(normalizePhone(gun.seller_wa))

  return (
    <a
      className={`wa-btn${variant === 'card' ? ' wa-btn--card' : ''}`}
      href={buildWhatsAppLink(gun)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={hasNumber ? `Chat penjual: +${normalizePhone(gun.seller_wa)}` : 'Pilih kontak WhatsApp'}
    >
      <MessageCircle size={variant === 'card' ? 15 : 17} />
      Hubungi Penjual
    </a>
  )
}
