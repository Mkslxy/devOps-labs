import { ProfilePageShell } from "@/components/profile/ProfilePageShell";

export default function StudentProfilePage() {
  return (
    <ProfilePageShell
      description="Особисті дані студента і підключення Telegram для сповіщень."
      showRoles={false}
    />
  );
}
