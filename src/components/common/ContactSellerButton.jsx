import { MessageCircle } from 'lucide-react'
import { normalizePhone } from '../../services/userService'
import { buildWhatsAppLink } from '../../utils/whatsapp'

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
