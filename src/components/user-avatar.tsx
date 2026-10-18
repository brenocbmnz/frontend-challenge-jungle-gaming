import { UserRound } from "lucide-react";

export function UserAvatar({
  src,
  label = "Seu avatar",
}: {
  src?: string;
  label?: string;
}) {
  return (
    <div
      className="user-avatar"
      role={src ? undefined : "img"}
      aria-label={src ? undefined : label}
    >
      {src ? (
        <img src={src} alt={label} />
      ) : (
        <UserRound size={22} aria-hidden="true" />
      )}
    </div>
  );
}
