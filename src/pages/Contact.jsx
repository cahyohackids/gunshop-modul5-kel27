import { MapPin, Clock, Phone } from 'lucide-react'

/**
 * Contact section — moved from its own tab into the Profile page.
 */
function Contact() {
  return (
    <section className="profile-section" id="contact">
      <h3 className="section-title">
        <Phone size={18} /> Contact
      </h3>
      <p className="profile-section__lede">
        <strong>Come by the shop.</strong>
      </p>
      <ul className="contact-list">
        <li>
          <MapPin size={16} /> 123 Range Road
        </li>
        <li>
          <Clock size={16} /> Open Tuesday to Saturday, 10 to 6
        </li>
        <li>
          <Phone size={16} /> (555) 010-0100
        </li>
      </ul>
    </section>
  )
}

export default Contact
