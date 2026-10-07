import {
  type BlockCollisionInfo,
  type ScheduleBlock,
  formatActivityName,
  minutesToTime,
  roomLabel,
  teacherDisplay,
} from "@pk-planner/core";
import { AlertTriangle, Clock, Globe, MapPin, MoreVertical, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BlockCardProps {
  block: ScheduleBlock;
  onClick: (block: ScheduleBlock) => void;
  isCompact?: boolean;
  collisionInfo?: BlockCollisionInfo[];
  currentParity?: "A" | "B";
  dimWhenNotCurrentWeek?: boolean;
  isCurrent?: boolean;
  currentTime?: Date;
  className?: string;
  style?: React.CSSProperties;
}

const ACTIVITY_STYLES: Record<
  string,
  { badge: string; border: string; bg: string }
> = {
  w: {
    badge:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
    border: "border-l-blue-500",
    bg: "hover:bg-blue-50/40 dark:hover:bg-blue-950/20",
  },
  c: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
    border: "border-l-emerald-500",
    bg: "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20",
  },
  cw: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
    border: "border-l-emerald-500",
    bg: "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20",
  },
  l: {
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    border: "border-l-amber-500",
    bg: "hover:bg-amber-50/40 dark:hover:bg-amber-950/20",
  },
  lab: {
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    border: "border-l-amber-500",
    bg: "hover:bg-amber-50/40 dark:hover:bg-amber-950/20",
  },
  p: {
    badge:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800/60",
    border: "border-l-purple-500",
    bg: "hover:bg-purple-50/40 dark:hover:bg-purple-950/20",
  },
  s: {
    badge:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
    border: "border-l-rose-500",
    bg: "hover:bg-rose-50/40 dark:hover:bg-rose-950/20",
  },
  lektorat: {
    badge:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60",
    border: "border-l-cyan-500",
    bg: "hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20",
  },
  lek: {
    badge:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60",
    border: "border-l-cyan-500",
    bg: "hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20",
  },
  wf: {
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800/60",
    border: "border-l-orange-500",
    bg: "hover:bg-orange-50/40 dark:hover:bg-orange-950/20",
  },
};

const DEFAULT_STYLE = {
  badge:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  border: "border-l-zinc-500",
  bg: "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30",
};

export function BlockCard({
  block,
  onClick,
  isCompact = false,
  collisionInfo = [],
  currentParity,
  dimWhenNotCurrentWeek = false,
  isCurrent = false,
  currentTime,
  className = "",
  style: styleProp,
}: BlockCardProps) {
  const actKey = (block.activity || "").toLowerCase().trim();
  const style = ACTIVITY_STYLES[actKey] || DEFAULT_STYLE;

  const startTime = minutesToTime(block.start);
  const endTime = minutesToTime((block.start ?? 0) + (block.duration || 90));
  const teacher = teacherDisplay(block);
  const room = roomLabel(block.room);
  const isOnline = String(block.room || "").trim().toUpperCase() === "ONLINE" || block.modality === "online";
  const hasCollision = Boolean(collisionInfo && collisionInfo.length > 0);

  const currentMinutes = currentTime
    ? currentTime.getHours() * 60 + currentTime.getMinutes()
    : null;
  const blockStart = block.start ?? 0;
  const duration = block.duration || 90;
  const elapsed = currentMinutes != null ? currentMinutes - blockStart : null;
  const remainingMinutes =
    elapsed != null ? Math.max(0, duration - elapsed) : null;
  const progressPercent =
    elapsed != null && duration > 0
      ? Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)))
      : null;

  const isCurrentParity =
    currentParity != null &&
    block.teachingWeekParity != null &&
    ((block.teachingWeekParity === 1 && currentParity === "B") ||
      (block.teachingWeekParity === 0 && currentParity === "A"));
  const isOtherWeek =
    dimWhenNotCurrentWeek &&
    block.teachingWeekParity != null &&
    currentParity != null &&
    !isCurrentParity;

  const parityLabel =
    block.frequency === "co_2_tygodnie" || block.teachingWeekParity != null
      ? block.teachingWeekParity === 0
        ? "Tydzień A"
        : block.teachingWeekParity === 1
          ? "Tydzień B"
          : "Co 2 tyg."
      : null;

  return (
    <button
      onClick={() => onClick(block)}
      style={styleProp}
      className={`group relative w-full text-left rounded-xl border ${
        hasCollision
          ? "border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/50 bg-amber-50/15 dark:bg-amber-950/20"
          : isCurrent
            ? "border-emerald-500/80 dark:border-emerald-400/80 ring-2 ring-emerald-500/80 dark:ring-emerald-400/80 bg-emerald-50/30 dark:bg-emerald-950/25 shadow-md shadow-emerald-500/10"
            : "border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/90"
      } ${isCompact ? "p-2" : "p-3"} transition-all duration-150 hover:shadow-md border-l-4 ${isCurrent ? "border-l-emerald-500 dark:border-l-emerald-400" : style.border} ${style.bg} cursor-pointer ${isOtherWeek ? 'opacity-60 grayscale-[35%]' : ''} ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isCurrent && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white dark:bg-emerald-500 shadow-xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                </span>
                <span>{isCompact ? "Teraz" : "Trwa teraz"}</span>
              </span>
            )}
            <Badge
              variant="outline"
              className={`text-[11px] font-semibold px-1.5 py-0.5 ${style.badge}`}
            >
              {formatActivityName(block.activity)}
            </Badge>
            {(block.isCustom || block.id.startsWith("custom-")) && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
                Własne
              </span>
            )}
            {parityLabel && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                  isCurrentParity
                    ? "font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80"
                    : "font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {isCurrentParity && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
                <span>
                  {parityLabel}
                  {isCurrentParity ? " (bieżący)" : ""}
                </span>
              </span>
            )}
            {hasCollision && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                <AlertTriangle className="h-2.5 w-2.5" />
                <span>Kolizja</span>
              </span>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <MoreVertical className="h-3.5 w-3.5" />
          </div>
        </div>

        <h3 className={`font-semibold ${isCompact ? "text-xs" : "text-sm"} text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-zinc-700 dark:group-hover:text-zinc-200`}>
          {block.subject}
        </h3>

        <div className={`mt-2 flex flex-wrap gap-1.5 ${isCompact ? "text-[10px]" : "text-xs"}`}>
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-semibold tabular-nums ${isCurrent ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200" : "border-zinc-200 bg-slate-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"}`}>
            <Clock className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            {startTime} – {endTime}
          </span>
          <span className={`inline-flex min-w-0 items-center gap-1 rounded-md border px-2 py-1 font-semibold ${isOnline ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200" : "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"}`}>
            {isOnline ? <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
            <span className="truncate">{isOnline ? "Zdalnie (online)" : room ? `Sala ${room}` : "Bez sali"}</span>
          </span>
        </div>

        {isCurrent && !isCompact && progressPercent != null && (
          <div className="mt-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
              <span className="flex items-center gap-1 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Zajęcia trwają
              </span>
              <span>pozostało {remainingMinutes} min</span>
            </div>
            <div className="h-1 w-full bg-emerald-100 dark:bg-emerald-950/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {hasCollision && !isCompact && (
          <div className="mt-2 rounded-lg bg-amber-100/70 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 p-1.5 px-2 flex items-start gap-1.5 text-[11px] text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="line-clamp-2">
              <span className="font-semibold">Nakłada się z:</span>{" "}
              {collisionInfo
                .map((c) => `${c.conflictingSubject} (${c.conflictingTime})`)
                .join(", ")}
            </div>
          </div>
        )}
      </div>

      {teacher && (
        <div className="mt-auto pt-1.5 flex items-center text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1 truncate">
            <User className="h-3 w-3 shrink-0 text-zinc-400" />
            <span className="truncate">{teacher}</span>
          </div>
        </div>
      )}

      {block.notes && !isCompact && (
        <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-1 italic">
          {block.notes}
        </p>
      )}
    </button>
  );
}
