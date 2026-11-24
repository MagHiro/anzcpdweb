import { ArrowRight } from "@/components/icon";
import { ActivityDetailIcon, Container, LinkButton, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function BookingSuccessPage() {
  return <Section className="confirmation-page"><Container>
    <div className="payment-return">
      <span className="confirmation-symbol"><ActivityDetailIcon kind="clock" /></span>
      <h1>We’re checking your payment</h1>
      <p>We’ll email your booking confirmation once we verify the payment. If it hasn’t arrived yet, check <strong>My account</strong> before trying again. Don’t pay twice.</p>
      <div className="payment-return-actions"><LinkButton href="/account">My account <ArrowRight className="ml-2" /></LinkButton><LinkButton href="/classes" variant="secondary">All classes</LinkButton></div>
    </div>
  </Container></Section>;
}
