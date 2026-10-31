import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail } from "@/components/icon";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Contact ANZ Migration Academy about CPD activities, bookings, presenting or private learning programmes.",
};

export default function ContactPage() {
  return <>
    <section className="contact-introduction"><Container>
      <h1>Contact us</h1>
      <p>For activity enquiries, booking help, presenting and private learning programmes.</p>
    </Container></section>
    <Section className="contact-body"><Container>
      <div className="contact-layout">
        <section className="contact-email-card">
          <span className="contact-mail-icon" aria-hidden="true"><Mail size={24} /></span>
          <h2>Email the academy</h2>
          <a className="contact-email-link focus-ring" href="mailto:info@anzmigrationacademy.com">info@anzmigrationacademy.com <ArrowUpRight size={20} className="shrink-0" /></a>
          <p>For an existing booking, include your booking reference and activity title.</p>
          <div className="contact-company"><p>AU &amp; NZ Migration Academy Pty Ltd</p><p>Trading as ANZ Migration Academy</p><p>ABN: 19700088526</p></div>
        </section>
        <div className="contact-options">
          <Link href="/account/support" className="contact-option focus-ring"><div><h2>Booking &amp; account support</h2><p>Get help with a booking, payment or your account.</p></div><ArrowUpRight size={20} className="shrink-0" /></Link>
          <Link href="/complaints/lodge" className="contact-option focus-ring"><div><h2>Make a complaint</h2><p>Find out how to submit a written complaint.</p></div><ArrowUpRight size={20} className="shrink-0" /></Link>
        </div>
      </div>
    </Container></Section>
  </>;
}
