import type {
  PlanType,
  ScheduleBlock,
  ScheduleState,
  SubjectActivity,
  SubjectActivityOption,
  SubjectCatalogItem,
  UserScheduleConfig,
} from "./types.ts";
import {
  blockCohorts,
  cohortParts,
  exerciseGroupForLab,
  minutesToTime,
  roomCampus,
  teacherDisplay,
} from "./utils.ts";

export const NOT_APPLICABLE_VALUE = "__not_applicable";
export const NOT_APPLICABLE_LABEL = "<NIE DOTYCZY>";

export const ACTIVITY_LABELS: Record<string, string> = {
  w: "Wykład",
  c: "Ćwiczenia",
  cw: "Ćwiczenia",
  cwiczenia: "Ćwiczenia",
  l: "Laboratoria",
  lab: "Laboratoria",
  p: "Projekt",
  proj: "Projekt",
  s: "Seminarium",
  sem: "Seminarium",
  wf: "Wychowanie fizyczne",
};

export function formatActivityName(activity?: string): string {
  if (!activity) return "Zajęcia";
  const key = activity.toLowerCase().trim();
  return ACTIVITY_LABELS[key] || activity.toUpperCase();
}

function activityGroupKey(block: ScheduleBlock): string {
  return `${block.cohort || ""}|${block.groupNo ?? ""}`;
}

export type FieldOfStudy = "Informatyka" | "Cyberpsychologia";
export type Degree = "I stopień" | "II stopień";

export interface CohortHierarchyNode {
  value: string;
  cohortBase?: string;
  groupNumber?: number;
  groupLabel?: string;
  label: string;
  sublabel?: string;
  field: FieldOfStudy;
  degree: Degree;
  year: number;
  semester: number;
  planType: PlanType;
}

export function parseCohortMetadata(
  cohortString: string,
  planType: PlanType = "stacjonarne",
): CohortHierarchyNode {
  const norm = cohortString.toLowerCase();
  const isCyber = norm.includes("cyberpsychologia");
  const field: FieldOfStudy = isCyber ? "Cyberpsychologia" : "Informatyka";

  const isSecond = norm.includes("ii stopien") || norm.includes("ii stopień");
  const degree: Degree = isSecond ? "II stopień" : "I stopień";

  const semMatch = norm.match(/sem\.?\s*(\d+)/i);
  const semester = semMatch ? Number(semMatch[1]) : 1;
  const year = Math.max(1, Math.ceil(semester / 2));

  const cleanLabel = cohortString.replace(/[—–]/g, "-").trim();

  return {
    value: cohortString,
    cohortBase: cohortString,
    label: cleanLabel,
    field,
    degree,
    year,
    semester,
    planType,
  };
}

/**
 * Extracts unique base cohorts (degree + sem) from schedule state.
 */
export function extractUniqueCohorts(
  state: ScheduleState,
): Array<{ value: string; label: string; planType: PlanType }> {
  const map = new Map<
    string,
    { value: string; label: string; planType: PlanType }
  >();

  for (const block of state.blocks) {
    if (!block.cohort) continue;
    for (const cohort of blockCohorts(block)) {
      const part = cohortParts(cohort);
      const base = part.base.trim();
      if (!base) continue;

      if (!map.has(base)) {
        map.set(base, {
          value: base,
          label: base.replace(/[—–]/g, "-"),
          planType: block.planType,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "pl"),
  );
}

export function getCohortHierarchy(state: ScheduleState): {
  fields: Record<
    FieldOfStudy,
    Record<Degree, Record<number, CohortHierarchyNode[]>>
  >;
  allNodes: CohortHierarchyNode[];
} {
  const baseCohorts = extractUniqueCohorts(state);
  const allNodes: CohortHierarchyNode[] = [];

  const fields: Record<
    FieldOfStudy,
    Record<Degree, Record<number, CohortHierarchyNode[]>>
  > = {
    Informatyka: {
      "I stopień": {},
      "II stopień": {},
    },
    Cyberpsychologia: {
      "I stopień": {},
      "II stopień": {},
    },
  };

  for (const baseItem of baseCohorts) {
    const meta = parseCohortMetadata(baseItem.value, baseItem.planType);

    // Find all blocks matching this base cohort
    const matchingBlocks = state.blocks.filter((b) =>
      blockMatchesBaseCohort(b, baseItem.value),
    );

    // Analyze group distribution
    const labGroups = new Set<number>();
    const allGroups = new Set<number>();

    for (const b of matchingBlocks) {
      if (!b.cohort) continue;
      const m = b.cohort.match(/\/ gr\.?\s*(\d+)/i);
      if (m) {
        const gr = Number(m[1]);
        allGroups.add(gr);
        const act = (b.activity || "").toLowerCase().trim();
        if (["l", "lab", "p", "proj"].includes(act)) {
          labGroups.add(gr);
        }
      }
    }

    const sortedAllGroups = Array.from(allGroups).sort((a, b) => a - b);

    const isFirstDegreeInformatyka =
      meta.field === "Informatyka" &&
      meta.degree === "I stopień" &&
      labGroups.size > 0;

    if (isFirstDegreeInformatyka) {
      // Only offer laboratory/computer groups present in the schedule.
      // Exercise numbers can also describe language and elective groups.
      for (const g of [...labGroups].sort((a, b) => a - b)) {
        const exGr = exerciseGroupForLab(baseItem.value, g);
        const node: CohortHierarchyNode = {
          value: `${baseItem.value} / GL ${g}`,
          cohortBase: baseItem.value,
          groupNumber: g,
          groupLabel: `GL ${g}`,
          label: `Grupa GL ${g}`,
          sublabel: `Lab GL ${g} · Ćwiczenia C${exGr}`,
          field: meta.field,
          degree: meta.degree,
          year: meta.year,
          semester: meta.semester,
          planType: meta.planType,
        };
        allNodes.push(node);
      }
    } else if (sortedAllGroups.length > 0) {
      for (const g of sortedAllGroups) {
        const specMatch = baseItem.value.match(/\b(CY|DS|SIR)\b/i);
        const spec = specMatch ? specMatch[1].toUpperCase() : null;

        const label = spec ? `${spec} - Grupa ${g}` : `Grupa ${g}`;
        const sublabel = spec
          ? `${spec} · Grupa ${g} · sem. ${meta.semester}`
          : `Semestr ${meta.semester} · Grupa ${g}`;

        const node: CohortHierarchyNode = {
          value: `${baseItem.value} / gr. ${g}`,
          cohortBase: baseItem.value,
          groupNumber: g,
          groupLabel: `gr. ${g}`,
          label,
          sublabel,
          field: meta.field,
          degree: meta.degree,
          year: meta.year,
          semester: meta.semester,
          planType: meta.planType,
        };
        allNodes.push(node);
      }
    } else {
      const node: CohortHierarchyNode = {
        value: baseItem.value,
        cohortBase: baseItem.value,
        label: baseItem.label,
        sublabel: `Semestr ${meta.semester} · ${meta.planType}`,
        field: meta.field,
        degree: meta.degree,
        year: meta.year,
        semester: meta.semester,
        planType: meta.planType,
      };
      allNodes.push(node);
    }
  }

  for (const node of allNodes) {
    const degMap = fields[node.field][node.degree];
    if (!degMap[node.year]) {
      degMap[node.year] = [];
    }
    degMap[node.year].push(node);
  }

  return { fields, allNodes };
}

export type CohortHierarchy = ReturnType<typeof getCohortHierarchy>;

/**
 * Checks if a block belongs to the selected cohort base.
 */
export function blockMatchesBaseCohort(
  block: ScheduleBlock,
  cohortBase: string,
): boolean {
  const cleanTarget = cohortBase
    .replace(/\s*\/\s*(?:GK\/GL|GK|GL|Grupa\s*(?:GK|GL)|gr\.).*$/i, "")
    .replace(/[—–]/g, "-")
    .toLowerCase()
    .trim();

  const cohorts = blockCohorts(block);
  return cohorts.some((c) => {
    const part = cohortParts(c);
    const cleanBase = part.base.replace(/[—–]/g, "-").toLowerCase().trim();
    return cleanBase === cleanTarget;
  });
}

/**
 * Detects whether the catalog cohort has 2:1 paired lab/exercise groups.
 */
export function detectIsPairedCohort(catalog: SubjectCatalogItem[]): boolean {
  let maxLab = 0;
  let maxEx = 0;
  for (const item of catalog) {
    for (const act of item.activities) {
      const isLab = ["l", "lab", "p", "proj"].includes(
        act.activity.toLowerCase().trim(),
      );
      const isEx = ["c", "cw", "cwiczenia", "ćw"].includes(
        act.activity.toLowerCase().trim(),
      );
      for (const opt of act.options) {
        const m =
          opt.cohort?.match(/\/ gr\.?\s*(\d+)/i) || opt.group?.match(/(\d+)/);
        const gr = m ? Number(m[1]) : 0;
        if (isLab && gr > maxLab) maxLab = gr;
        if (isEx && gr > maxEx) maxEx = gr;
      }
    }
  }
  return maxLab > 3 || (maxLab > 0 && maxEx > 0 && maxLab > maxEx);
}

/**
 * Selects best matching activity option based on chosen group number.
 * When groupNumber is provided (the student's chosen laboratory group):
 * - For lab/project: selects matching lab group (e.g. GL 4).
 * - For exercises (C): maps the chosen GL/GK group to its exercise group.
 */
export function pickBestOptionForGroup(
  options: SubjectActivityOption[],
  activity: string,
  groupNumber?: number,
  isPaired?: boolean,
): SubjectActivityOption | undefined {
  if (!options || options.length === 0) return undefined;
  if (!groupNumber || options.length === 1) return options[0];

  const act = activity.toLowerCase().trim();
  const isExercise = ["c", "cw", "cwiczenia", "ćw"].includes(act);

  const optionGroups = options.map((opt) => {
    const m =
      opt.cohort?.match(/\/ gr\.?\s*(\d+)/i) || opt.group?.match(/(\d+)/);
    return {
      option: opt,
      gr: m ? Number(m[1]) : null,
    };
  });

  const targetGr =
    isExercise && isPaired
      ? exerciseGroupForLab(options[0].cohort, groupNumber)
      : groupNumber;

  // 1. Direct numeric match
  const directMatch = optionGroups.find((o) => o.gr === targetGr);
  if (directMatch) return directMatch.option;

  // 2. Substring match in group label or cohort
  const strMatch = options.find(
    (opt) =>
      opt.group.includes(String(targetGr)) ||
      Boolean(opt.cohort && opt.cohort.includes(`gr. ${targetGr}`)),
  );
  if (strMatch) return strMatch;

  // Fallback for exercise: try groupNumber directly if targetGr wasn't found
  if (isExercise && targetGr !== groupNumber) {
    const fallbackMatch = optionGroups.find((o) => o.gr === groupNumber);
    if (fallbackMatch) return fallbackMatch.option;
  }

  return options[0];
}

/**
 * Prefills subject selection with defaults matching student's group.
 */
export function prefillScheduleSelections(
  catalog: SubjectCatalogItem[],
  groupNumber?: number,
  options?: { isPaired?: boolean },
): {
  selectedSubjects: Record<string, boolean>;
  selectedGroups: Record<string, string>;
} {
  const selectedSubjects: Record<string, boolean> = {};
  const selectedGroups: Record<string, string> = {};
  const isPaired = options?.isPaired ?? detectIsPairedCohort(catalog);

  for (const item of catalog) {
    selectedSubjects[item.subject] = true;
    for (const act of item.activities) {
      if (act.options.length === 0) continue;
      // Language groups are independent of the laboratory/computer group.
      const chosenGroup = /^język obcy/i.test(item.subject)
        ? undefined
        : groupNumber;
      const chosen = pickBestOptionForGroup(
        act.options,
        act.activity,
        chosenGroup,
        isPaired,
      );
      if (chosen) {
        const key = `${item.subject}:${act.activity}`;
        selectedGroups[key] = chosen.id;
      }
    }
  }

  return { selectedSubjects, selectedGroups };
}

/**
 * Extracts unique subjects and all their activity options (groups/teachers/times)
 * for a specified cohort base.
 */
export function buildSubjectCatalog(
  state: ScheduleState,
  cohortBase: string,
): SubjectCatalogItem[] {
  const matchingBlocks = state.blocks.filter((b) =>
    blockMatchesBaseCohort(b, cohortBase),
  );
  const subjectMap = new Map<string, Map<string, SubjectActivityOption[]>>();

  for (const block of matchingBlocks) {
    const subject = (block.subject || "Bez nazwy").trim();
    const activityKey = (block.activity || "INNE").toLowerCase().trim();

    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, new Map());
    }
    const actMap = subjectMap.get(subject)!;
    if (!actMap.has(activityKey)) {
      actMap.set(activityKey, []);
    }

    const { group, base: cBase } = cohortParts(block.cohort);
    const groupLabel =
      group !== null
        ? `Grupa ${group}`
        : block.cohort && cBase.toLowerCase() !== cohortBase.toLowerCase()
          ? block.cohort
          : "Wszyscy";
    const teacher = teacherDisplay(block) || "Nieprzypisany";
    const campus = roomCampus(block, state.rooms);

    actMap.get(activityKey)!.push({
      id: block.id,
      cohort: block.cohort || cohortBase,
      group: groupLabel,
      teacher,
      day: block.day ?? null,
      start: block.start ?? null,
      duration: block.duration || 90,
      room: block.room || null,
      campus,
      parity: block.teachingWeekParity ?? null,
    });
  }

  const items: SubjectCatalogItem[] = [];

  for (const [subject, actMap] of subjectMap.entries()) {
    const activities: SubjectActivity[] = [];
    for (const [activityKey, rawOptions] of actMap.entries()) {
      // One choice represents every occurrence of the same teaching group.
      const seen = new Set<string>();
      const options: SubjectActivityOption[] = [];
      for (const opt of rawOptions) {
        const block = matchingBlocks.find((candidate) => candidate.id === opt.id)!;
        const key = activityGroupKey(block);
        if (!seen.has(key)) {
          seen.add(key);
          options.push(opt);
        }
      }

      options.sort((a, b) =>
        a.group.localeCompare(b.group, "pl", { numeric: true }),
      );

      activities.push({
        activity: activityKey,
        activityLabel: formatActivityName(activityKey),
        options,
      });
    }

    activities.sort((a, b) =>
      a.activityLabel.localeCompare(b.activityLabel, "pl"),
    );
    items.push({ subject, activities });
  }

  return items.sort((a, b) => a.subject.localeCompare(b.subject, "pl"));
}

/**
 * Resolves user schedule blocks based on config, chosen groups, and overrides.
 */
export function resolveUserBlocks(
  state: ScheduleState,
  config: UserScheduleConfig,
): ScheduleBlock[] {
  const results: ScheduleBlock[] = [];

  if (config.cohort) {
    const cohortBase = config.cohort.toLowerCase().trim();
    const matchingBlocks = state.blocks.filter((b) =>
      blockMatchesBaseCohort(b, cohortBase),
    );

    for (const block of matchingBlocks) {
      const subject = (block.subject || "Bez nazwy").trim();
      // If user explicitly excluded this subject
      if (config.selectedSubjects && config.selectedSubjects[subject] === false) {
        continue;
      }

      const activityKey = (block.activity || "INNE").toLowerCase().trim();
      const selectionKey = `${subject}:${activityKey}`;
      const chosenGroupOrId = config.selectedGroups?.[selectionKey];

      // If marked as NOT APPLICABLE (<NIE DOTYCZY>)
      if (
        chosenGroupOrId === NOT_APPLICABLE_VALUE ||
        chosenGroupOrId === NOT_APPLICABLE_LABEL ||
        chosenGroupOrId === "__none"
      ) {
        continue;
      }

      // A saved block ID selects its whole group, including added occurrences.
      if (chosenGroupOrId) {
        const selectedBlock = matchingBlocks.find((candidate) => candidate.id === chosenGroupOrId);
        const { group } = cohortParts(block.cohort);
        const groupString =
          group !== null ? `Grupa ${group}` : "Wszyscy";

        // Matches either direct block ID or group label
        const isSelected =
          block.id === chosenGroupOrId ||
          (selectedBlock && block.day && block.start != null &&
            activityGroupKey(block) === activityGroupKey(selectedBlock)) ||
          groupString === chosenGroupOrId ||
          String(group) === chosenGroupOrId ||
          block.cohort === chosenGroupOrId;

        if (!isSelected) {
          continue;
        }
      } else {
        // Fallback: check if cohort specifies lab group, e.g. "/ GL 4" or "/ gr. 4"
        const cohortLabMatch = config.cohort.match(
          /\/\s*(?:GL|GK|gr\.)\s*(\d+)/i,
        );
        if (cohortLabMatch) {
          const labNum = Number(cohortLabMatch[1]);
          const { group } = cohortParts(block.cohort);
          if (group !== null) {
            const isLab = ["l", "lab", "p", "proj"].includes(activityKey);
            const isEx = ["c", "cw", "cwiczenia", "ćw"].includes(activityKey);
            if (isLab && group !== labNum) {
              continue;
            }
            if (isEx && group !== exerciseGroupForLab(config.cohort, labNum)) {
              continue;
            }
          }
        }
      }

      // Check custom overrides
      const override = config.overrides?.[block.id];
      if (override?.hidden) {
        continue;
      }

      if (override) {
        results.push({
          ...block,
          subject: override.customSubject || block.subject,
          teacher: override.customTeacher || block.teacher,
          teacherDisplay: override.customTeacher || block.teacherDisplay,
          room:
            override.customRoom !== undefined ? override.customRoom : block.room,
          notes:
            override.customNotes !== undefined
              ? override.customNotes
              : block.notes,
        });
      } else {
        results.push(block);
      }
    }
  }

  // Include user's custom blocks
  if (config.customBlocks && config.customBlocks.length > 0) {
    for (const customBlock of config.customBlocks) {
      const override = config.overrides?.[customBlock.id];
      if (override?.hidden) {
        continue;
      }

      results.push({
        ...customBlock,
        isCustom: true,
        subject: override?.customSubject || customBlock.subject,
        teacher: override?.customTeacher || customBlock.teacher,
        teacherDisplay: override?.customTeacher || customBlock.teacherDisplay,
        room:
          override?.customRoom !== undefined
            ? override.customRoom
            : customBlock.room,
        notes:
          override?.customNotes !== undefined
            ? override.customNotes
            : customBlock.notes,
      });
    }
  }

  return results;
}

/**
 * Finds alternative groups for the same subject and activity within the cohort.
 */
export function findAlternativeGroups(
  state: ScheduleState,
  currentBlock: ScheduleBlock,
  cohortBase?: string,
): SubjectActivityOption[] {
  const base = cohortBase || cohortParts(currentBlock.cohort).base;
  const subject = (currentBlock.subject || "").trim();
  const activityKey = (currentBlock.activity || "INNE").toLowerCase().trim();

  const sameSubjects = state.blocks.filter((b) => {
    if ((b.subject || "").trim() !== subject) return false;
    if ((b.activity || "INNE").toLowerCase().trim() !== activityKey)
      return false;
    return blockMatchesBaseCohort(b, base);
  });

  const seen = new Set<string>();
  const options: SubjectActivityOption[] = [];

  for (const b of sameSubjects) {
    const { group, base: cBase } = cohortParts(b.cohort);
    const groupLabel =
      group !== null
        ? `Grupa ${group}`
        : b.cohort && cBase.toLowerCase() !== base.toLowerCase()
          ? b.cohort
          : "Wszyscy";
    const key = activityGroupKey(b);
    if (!seen.has(key)) {
      seen.add(key);
      options.push({
        id: b.id,
        cohort: b.cohort || base,
        group: groupLabel,
        teacher: teacherDisplay(b) || "Nieprzypisany",
        day: b.day ?? null,
        start: b.start ?? null,
        duration: b.duration || 90,
        room: b.room || null,
        campus: roomCampus(b, state.rooms),
        parity: b.teachingWeekParity ?? null,
      });
    }
  }

  return options.sort((a, b) =>
    a.group.localeCompare(b.group, "pl", { numeric: true }),
  );
}

export interface BlockCollisionInfo {
  conflictingBlockId: string;
  conflictingSubject: string;
  conflictingActivity: string;
  conflictingTime: string;
}

/**
 * Detects schedule collisions (overlapping blocks on the same day and compatible parity).
 */
export function detectScheduleCollisions(
  blocks: ScheduleBlock[],
): Map<string, BlockCollisionInfo[]> {
  const collisions = new Map<string, BlockCollisionInfo[]>();

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const b1 = blocks[i];
      const b2 = blocks[j];

      if (!b1.day || !b2.day || b1.day !== b2.day) continue;
      if (b1.start == null || b2.start == null) continue;

      // Check parity compatibility:
      // If one is strictly week A (0) and other is week B (1), they alternate weeks and do not collide.
      const p1 = b1.teachingWeekParity;
      const p2 = b2.teachingWeekParity;
      if (p1 != null && p2 != null && p1 !== p2) {
        continue;
      }

      const end1 = b1.start + (b1.duration || 90);
      const end2 = b2.start + (b2.duration || 90);

      if (Math.max(b1.start, b2.start) < Math.min(end1, end2)) {
        const time1 = `${minutesToTime(b1.start)} - ${minutesToTime(end1)}`;
        const time2 = `${minutesToTime(b2.start)} - ${minutesToTime(end2)}`;

        const b1List = collisions.get(b1.id) || [];
        b1List.push({
          conflictingBlockId: b2.id,
          conflictingSubject: b2.subject || "Zajęcia",
          conflictingActivity: formatActivityName(b2.activity),
          conflictingTime: time2,
        });
        collisions.set(b1.id, b1List);

        const b2List = collisions.get(b2.id) || [];
        b2List.push({
          conflictingBlockId: b1.id,
          conflictingSubject: b1.subject || "Zajęcia",
          conflictingActivity: formatActivityName(b1.activity),
          conflictingTime: time1,
        });
        collisions.set(b2.id, b2List);
      }
    }
  }

  return collisions;
}
