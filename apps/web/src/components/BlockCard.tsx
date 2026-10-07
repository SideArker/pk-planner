import {
  type BlockCollisionInfo,
  type ScheduleBlock,
  formatActivityName,
  minutesToTime,
  roomLabel,
  teacherDisplay,
} from "@pk-planner/core";
import { AlertTriangle, Clock3, Globe2, MapPin } from "lucide-react";

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
  const startTime = minutesToTime(block.start);
  const endTime = minutesToTime((block.start ?? 0) + (block.duration || 90));
  const teacher = teacherDisplay(block);
  const room = roomLabel(block.room);
  const isOnline = String(block.room || "").trim().toUpperCase() === "ONLINE" || block.modality === "online";
  const hasCollision = collisionInfo.length > 0;

  const currentMinutes = currentTime
    ? currentTime.getHours() * 60 + currentTime.getMinutes()
    : null;
  const duration = block.duration || 90;
  const elapsed = currentMinutes != null ? currentMinutes - (block.start ?? 0) : null;
  const remainingMinutes = elapsed != null ? Math.max(0, duration - elapsed) : null;
  const progressPercent = elapsed != null && duration > 0
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
      className={`group relative w-full rounded-md border border-zinc-200/90 bg-white text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 ${
        isCurrent ? "border-l-[3px] border-l-emerald-500 dark:border-l-emerald-400" : ""
      } ${isCompact ? "overflow-x-hidden overflow-y-auto p-1.5 [&>*]:shrink-0" : "overflow-hidden p-3"} ${isOtherWeek ? "opacity-55" : ""} ${className}`}
    >
      <h3 className={`font-semibold text-zinc-900 dark:text-zinc-100 ${isCompact ? "break-words text-[10px] leading-tight" : "line-clamp-2 text-sm leading-snug"}`}>
        {block.subject}
      </h3>

      <div className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-zinc-500 dark:text-zinc-400 ${isCompact ? "mt-0.5 text-[9px] leading-tight" : "mt-1 text-[11px]"}`}>
        <span className="inline-flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-zinc-400 dark:bg-zinc-500" aria-hidden="true" />
          {formatActivityName(block.activity)}
        </span>
        {isCurrent && (
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
            <span aria-hidden="true">·</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Trwa teraz
          </span>
        )}
        {(block.isCustom || block.id.startsWith("custom-")) && <span>· Własne</span>}
        {parityLabel && <span>· {parityLabel}{isCurrentParity ? " (bieżący)" : ""}</span>}
        {hasCollision && (
          <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Kolizja
          </span>
        )}
      </div>

      <div className={`flex flex-wrap items-center gap-x-1.5 text-zinc-700 dark:text-zinc-300 ${isCompact ? "mt-1 gap-y-0.5 text-[9px] leading-tight" : "mt-2 gap-y-1 text-xs"}`}>
        <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums">
          <Clock3 className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
          {startTime}–{endTime}
        </span>
        <span className="text-zinc-300 dark:text-zinc-600" aria-hidden="true">·</span>
        {isOnline ? (
          <span className="inline-flex items-center gap-1 rounded-sm bg-zinc-100 px-1.5 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <Globe2 className="h-3 w-3 shrink-0" aria-hidden="true" />
            Online
          </span>
        ) : (
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
            <span className="truncate">{room ? `Sala ${room}` : "Bez sali"}</span>
          </span>
        )}
      </div>

      {teacher && (
        <div className={`text-zinc-400 dark:text-zinc-500 ${isCompact ? "mt-1 break-words text-[9px] leading-tight" : "mt-2 truncate text-xs"}`}>
          {teacher}
        </div>
      )}

      {block.notes && !isCompact && (
        <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          {block.notes}
        </p>
      )}

      {hasCollision && !isCompact && (
        <p className="mt-2 line-clamp-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          Nakłada się z: {collisionInfo.map(c => `${c.conflictingSubject} (${c.conflictingTime})`).join(", ")}
        </p>
      )}

      {isCurrent && progressPercent != null && (
        <div className="mt-2">
          {!isCompact && (
            <div className="mb-1 text-right text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">
              {remainingMinutes} min do końca
            </div>
          )}
          <div className="h-0.5 w-full bg-zinc-200 dark:bg-zinc-700" role="progressbar" aria-label="Postęp zajęć" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-emerald-500 dark:bg-emerald-400" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}
    </button>
  );
}
