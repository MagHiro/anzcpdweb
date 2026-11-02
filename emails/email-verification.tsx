import { EmailText as Text } from "./_components/layout";
import { EmailLayout } from "./_components/layout";

export default function EmailVerification({ name = "Alex", url = "https://www.anzmigrationacademy.com/verify-email" }: { name?: string; url?: string }) {
  return <EmailLayout title="Verify your email address" name={name} href={url} action="Verify email address"><Text>Please confirm this email address to finish creating your ANZ Migration Academy account.</Text><Text>If you did not create an account, you can ignore this email.</Text></EmailLayout>;
}
