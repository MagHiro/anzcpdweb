import { EmailText as Text } from "./_components/layout";
import { EmailLayout } from "./_components/layout";

export default function AccountSetup({ name = "Alex", url = "https://www.anzmigrationacademy.com/account/setup" }: { name?: string; url?: string }) {
  return <EmailLayout title="Set up your account" name={name} href={url} action="Set up your account"><Text>Your booking payment has been received. Create a password to view and manage your bookings online.</Text><Text>If you did not make this booking, please contact us through our website.</Text></EmailLayout>;
}
