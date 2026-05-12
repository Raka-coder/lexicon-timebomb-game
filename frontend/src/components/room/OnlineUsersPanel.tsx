import { useAuthStore } from "@/stores/authStore";
import type { OnlineUser } from "@/stores/authStore";
import { Users, Circle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  idle: { label: "Idle", color: "bg-yellow-500", textColor: "text-yellow-400" },
  lobby: { label: "Lobby", color: "bg-blue-500", textColor: "text-blue-400" },
  playing: { label: "Playing", color: "bg-green-500", textColor: "text-green-400" },
};

function StatusBadge({ status }: { status: OnlineUser["status"] }) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[8px] uppercase tracking-widest border-0 px-2 py-0.5",
        config.textColor,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", config.color)} />
      {config.label}
    </Badge>
  );
}

function OnlineUserRow({ user }: { user: OnlineUser }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-colors">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
        <User className="h-4 w-4 text-white/60" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black uppercase tracking-wider truncate">{user.username}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <StatusBadge status={user.status} />
          {user.roomCode && (
            <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">
              Room: {user.roomCode}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <Users className="h-8 w-8 text-white/20" />
      <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest text-center">
        Belum ada player online
      </p>
    </div>
  );
}

interface Props {
  className?: string;
}

export function OnlineUsersPanel({ className }: Props) {
  const { onlineUsers } = useAuthStore();

  return (
    <div className={cn("glass rounded-2xl p-4 border-white/5", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Circle className="h-2.5 w-2.5 text-green-400 fill-green-400 animate-pulse" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">
          Online Players
        </h3>
        <span className="ml-auto text-[10px] font-mono text-white/30">
          {onlineUsers.length} online
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        {onlineUsers.length === 0 ? (
          <EmptyState />
        ) : (
          onlineUsers.map((user) => (
            <OnlineUserRow key={user.odispatchId} user={user} />
          ))
        )}
      </div>
    </div>
  );
}