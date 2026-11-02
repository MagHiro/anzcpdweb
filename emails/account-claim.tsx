import { EmailText as Text } from "./_components/layout";
import { EmailLayout } from "./_components/layout";

export default function AccountClaim({ name = "Alex", url = "https://www.anzmigrationacademy.com/account/claim" }: { name?: string; url?: string }) {
  return <EmailLayout title="Connect your booking records" name={name} href={url} action="Connect booking records"><Text>You requested to connect previous bookings to your account. Use the link below to sign in and continue.</Text><Text>If you did not request this, you can ignore this email.</Text></EmailLayout>;
}
