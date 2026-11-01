import { Info } from 'lucide-react'

/**
 * About section — moved from its own tab into the Profile page.
 */
function About() {
  return (
    <section className="profile-section" id="about">
      <h3 className="section-title">
        <Info size={18} /> About
      </h3>
      <p className="profile-section__lede">
        <strong>A one-room armory.</strong> Bore &amp; Barrel sells a short, honest list of
        firearms. Each piece is priced from the bench — no markup theatre, no filler.
      </p>
    </section>
  )
}

export default About
