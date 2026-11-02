import { EmailText as Text } from "./_components/layout";
import { EmailLayout } from "./_components/layout";

export default function PasswordReset({ name = "Alex", url = "https://www.anzmigrationacademy.com/reset-password" }: { name?: string; url?: string }) {
  return <EmailLayout title="Reset your password" name={name} href={url} action="Reset password"><Text>We received a request to reset your account password. Use the link below to choose a new password.</Text><Text>If you did not request this, you can ignore this email. Your password will not change unless you complete the reset.</Text></EmailLayout>;
}
