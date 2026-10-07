import test from "node:test";
import assert from "node:assert/strict";
import {
  parseSchedulePayload,
  importedNotices,
  mappedCohortParts,
  matchesCohort,
  cohortStudentGroups,
  matchesWeekend,
  roomCampus,
  suggestedTimeSlots,
  visibleBlocks,
  cohortDisplayText,
  weekendKeys,
  extractUniqueCohorts,
  buildSubjectCatalog,
  resolveUserBlocks,
  generateIcs,
  getGoogleCalendarUrl,
  getCohortHierarchy,
  getTeachingWeekInfo,
  isBlockInWeekParity,
  prefillScheduleSelections,
  detectScheduleCollisions,
  blockPlacementText,
  isBlockActiveNow,
} from "../src/index.ts";

const block = {
  id: "b1",
  subject: "Algorytmy",
  planType: "stacjonarne",
  cohort: "I stopień stac sem. 1 / gr. 1",
  activity: "C",
  teacher: "Anna",
  day: "MON",
  start: 480,
  duration: 90,
  room: "L1",
};
const state = {
  blocks: [block, { ...block, id: "parked", day: null, start: null }],
  rooms: [{ code: "L1", campus: "Czyżyny" }],
};

test("parses snapshot envelope without losing extra data", () => {
  const payload = parseSchedulePayload(
    JSON.stringify({
      state,
      validation: { conflicts: [] },
      timetableNotices: { notices: [] },
      custom: { keep: true },
    }),
  );
  assert.equal(payload.custom.keep, true);
  assert.deepEqual(importedNotices(payload), { notices: [] });
  assert.equal(importedNotices(parseSchedulePayload({ state })), undefined);
  assert.throws(
    () => parseSchedulePayload({ state: { blocks: [{}], rooms: [] } }),
    /id i subject/,
  );
});

test("maps CAL specialties and paired exercise groups", () => {
  assert.deepEqual(
    mappedCohortParts("II stopień niestac sem. 1 CAL / gr. 6").specialty,
    "SIR",
  );
  assert.equal(matchesCohort(block, "I stopień stac sem. 1 / gr. 4"), true);
  assert.equal(matchesCohort(block, "I stopień stac sem. 1 / gr. 2"), false);
  assert.deepEqual(cohortStudentGroups(block), [1, 4]);
  const cal = {
    ...block,
    planType: "niestacjonarne",
    cohort: "II stopień niestac sem. 1 CAL / gr. 3",
  };
  assert.equal(
    matchesCohort(cal, "II stopień niestac sem. 1 CY / gr. 1"),
    true,
  );
  assert.equal(
    matchesCohort(cal, "II stopień niestac sem. 1 DS / gr. 1"),
    false,
  );
});

test("keeps parked lessons in state but hides them from visible schedule", () => {
  assert.deepEqual(
    visibleBlocks(state, {
      planType: "stacjonarne",
      viewMode: "teacher",
      entity: "Anna",
    }).map((b) => b.id),
    ["b1"],
  );
  assert.equal(roomCampus({ room: "SEMINARYJNA" }), "Czyżyny");
  assert.deepEqual(
    suggestedTimeSlots({
      suggestedTimes: [
        { day: "MON", start: 480 },
        { day: "MON", start: 480 },
        { day: "BAD", start: 480 },
      ],
    }),
    [{ day: "MON", start: 480 }],
  );
});

test("matches dated and recurring nonstationary weekends", () => {
  const weekend = "2026-10-10_2026-10-11";
  const ns = { ...block, planType: "niestacjonarne" };
  assert.equal(matchesWeekend({ ...ns, date: "2026-10-11" }, weekend), true);
  assert.equal(matchesWeekend({ ...ns, date: "2026-10-18" }, weekend), false);
  assert.equal(
    matchesWeekend({ ...ns, allowedWeekends: [weekend] }, weekend),
    true,
  );
  assert.equal(
    matchesWeekend(
      { ...ns, allowedWeekends: ["2026-10-17_2026-10-18"] },
      weekend,
    ),
    false,
  );
  assert.deepEqual(
    weekendKeys({
      ...state,
      wishes: [{ payload: { parttime: { weekends: { [weekend]: {} } } } }],
    }),
    [weekend],
  );
});

test("formats first-degree groups and joint classes", () => {
  assert.equal(
    cohortDisplayText(block),
    "I stopień stac sem. 1 / C1 (GL1+GL4)",
  );
  assert.match(
    cohortDisplayText({
      ...block,
      additionalCohorts: ["I stopień stac sem. 3 / gr. 1"],
    }),
    /wspólnie z:/,
  );
});

test("extracts cohorts, catalogs subjects and resolves user blocks", () => {
  const cohorts = extractUniqueCohorts(state);
  assert.equal(cohorts.length, 1);
  assert.equal(cohorts[0].value, "I stopień stac sem. 1");

  const catalog = buildSubjectCatalog(state, "I stopień stac sem. 1");
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].subject, "Algorytmy");
  assert.equal(catalog[0].activities[0].options[0].group, "Grupa 1");

  const resolved = resolveUserBlocks(state, {
    cohort: "I stopień stac sem. 1",
    planType: "stacjonarne",
    selectedSubjects: { Algorytmy: true },
    selectedGroups: { "Algorytmy:c": "b1" },
    overrides: { b1: { customSubject: "Zaawansowane Algorytmy" } },
  });
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].subject, "Zaawansowane Algorytmy");

  // Not applicable test
  const ignored = resolveUserBlocks(state, {
    cohort: "I stopień stac sem. 1",
    planType: "stacjonarne",
    selectedSubjects: { Algorytmy: true },
    selectedGroups: { "Algorytmy:c": "__not_applicable" },
  });
  assert.equal(ignored.length, 0);
});

test("categorizes cohorts into hierarchy by field, degree and year", () => {
  const multiState = {
    blocks: [
      {
        id: "1",
        subject: "A",
        cohort: "I stopień stac sem. 1 / gr. 1",
        planType: "stacjonarne",
      },
      {
        id: "2",
        subject: "B",
        cohort: "I stopień stac sem. 3 / gr. 1",
        planType: "stacjonarne",
      },
      {
        id: "3",
        subject: "C",
        cohort: "Cyberpsychologia - I stopień stac. sem. 1 / gr. 1",
        planType: "stacjonarne",
      },
      {
        id: "4",
        subject: "D",
        cohort: "II stopień stac sem. 2 CY / gr. 1",
        planType: "stacjonarne",
      },
    ],
    rooms: [],
  };

  const { fields, allNodes } = getCohortHierarchy(multiState);
  assert.equal(allNodes.length, 4);
  assert.equal(fields.Informatyka["I stopień"][1].length, 1);
  assert.equal(fields.Informatyka["I stopień"][2].length, 1);
  assert.equal(fields.Informatyka["II stopień"][1].length, 1);
  assert.equal(fields.Cyberpsychologia["I stopień"][1].length, 1);
});

test("generates ics and google calendar urls", () => {
  const ics = generateIcs([block]);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /SUMMARY:Algorytmy \(C\)/);
  assert.match(ics, /END:VCALENDAR/);

  const gCal = getGoogleCalendarUrl(block);
  assert.match(gCal, /calendar\.google\.com\/calendar\/render/);
  assert.match(gCal, /Algorytmy/);
});

test("calculates correct teaching week parity A and B starting from 28.09.2026", () => {
  // 28.09.2026 -> Tydzien 1 (A)
  const week1 = getTeachingWeekInfo(new Date(2026, 8, 28));
  assert.equal(week1.weekNumber, 1);
  assert.equal(week1.parity, 0);
  assert.equal(week1.parityLabel, "A");

  // 06.10.2026 -> Tydzien 2 (B)
  const week2 = getTeachingWeekInfo(new Date(2026, 9, 6));
  assert.equal(week2.weekNumber, 2);
  assert.equal(week2.parity, 1);
  assert.equal(week2.parityLabel, "B");

  // 12.10.2026 -> Tydzien 3 (A)
  const week3 = getTeachingWeekInfo(new Date(2026, 9, 12));
  assert.equal(week3.weekNumber, 3);
  assert.equal(week3.parity, 0);
  assert.equal(week3.parityLabel, "A");

  const blockA = { ...block, teachingWeekParity: 0 };
  const blockB = { ...block, teachingWeekParity: 1 };
  const weeklyBlock = { ...block, teachingWeekParity: null };

  assert.equal(isBlockInWeekParity(blockA, "A"), true);
  assert.equal(isBlockInWeekParity(blockA, "B"), false);
  assert.equal(isBlockInWeekParity(blockB, "A"), false);
  assert.equal(isBlockInWeekParity(blockB, "B"), true);
  assert.equal(isBlockInWeekParity(weeklyBlock, "A"), true);
  assert.equal(isBlockInWeekParity(weeklyBlock, "B"), true);
});

test("generates lab groups GL 1..6 for semester 3 and automatically selects corresponding exercise groups", () => {
  const sem3State = {
    blocks: [
      {
        id: "bd_w",
        subject: "Bazy danych",
        cohort: "I stopień stac sem. 3",
        activity: "W",
        planType: "stacjonarne",
      },
      {
        id: "bd_c1",
        subject: "Bazy danych",
        cohort: "I stopień stac sem. 3 / gr. 1",
        activity: "C",
        planType: "stacjonarne",
      },
      {
        id: "bd_c2",
        subject: "Bazy danych",
        cohort: "I stopień stac sem. 3 / gr. 2",
        activity: "C",
        planType: "stacjonarne",
      },
      {
        id: "bd_c3",
        subject: "Bazy danych",
        cohort: "I stopień stac sem. 3 / gr. 3",
        activity: "C",
        planType: "stacjonarne",
      },
      {
        id: "bd_l1",
        subject: "Bazy danych",
        cohort: "I stopień stac sem. 3 / gr. 1",
        activity: "L",
        planType: "stacjonarne",
      },
      {
        id: "bd_l2",
        subject: "Bazy danych",
        cohort: "I stopień stac sem. 3 / gr. 2",
        activity: "L",
        planType: "stacjonarne",
      },
      {
        id: "bd_l3",
        subject: "Bazy danych",
        cohort: "I stopień stac sem. 3 / gr. 3",
        activity: "L",
        planType: "stacjonarne",
      },
      {
        id: "bd_l4",
        subject: "Bazy danych",
        cohort: "I stopień stac sem. 3 / gr. 4",
        activity: "L",
        planType: "stacjonarne",
      },
      {
        id: "bd_l5",
        subject: "Bazy danych",
        cohort: "I stopień stac sem. 3 / gr. 5",
        activity: "L",
        planType: "stacjonarne",
      },
      {
        id: "bd_l6",
        subject: "Bazy danych",
        cohort: "I stopień stac sem. 3 / gr. 6",
        activity: "L",
        planType: "stacjonarne",
      },
    ],
    rooms: [],
  };

  const { fields } = getCohortHierarchy(sem3State);
  const sem3Nodes = fields.Informatyka["I stopień"][2];
  assert.equal(sem3Nodes.length, 6);
  assert.equal(sem3Nodes[0].label, "Grupa GL 1");
  assert.equal(sem3Nodes[0].sublabel, "Lab GL 1 · Ćwiczenia C1");
  assert.equal(sem3Nodes[1].label, "Grupa GL 2");
  assert.equal(sem3Nodes[1].sublabel, "Lab GL 2 · Ćwiczenia C1");
  assert.equal(sem3Nodes[2].label, "Grupa GL 3");
  assert.equal(sem3Nodes[2].sublabel, "Lab GL 3 · Ćwiczenia C2");
  assert.equal(sem3Nodes[3].label, "Grupa GL 4");
  assert.equal(sem3Nodes[3].sublabel, "Lab GL 4 · Ćwiczenia C2");
  assert.equal(sem3Nodes[4].label, "Grupa GL 5");
  assert.equal(sem3Nodes[4].sublabel, "Lab GL 5 · Ćwiczenia C3");
  assert.equal(sem3Nodes[5].label, "Grupa GL 6");
  assert.equal(sem3Nodes[5].sublabel, "Lab GL 6 · Ćwiczenia C3");

  const catalog = buildSubjectCatalog(sem3State, sem3Nodes[0].cohortBase);

  // GL 1 -> Lab GL 1, Exercise C1
  const prefilled1 = prefillScheduleSelections(catalog, 1);
  assert.equal(prefilled1.selectedGroups["Bazy danych:w"], "bd_w");
  assert.equal(prefilled1.selectedGroups["Bazy danych:c"], "bd_c1");
  assert.equal(prefilled1.selectedGroups["Bazy danych:l"], "bd_l1");

  // GL 2 -> Lab GL 2, Exercise C1 (ceil(2/2) = 1)
  const prefilled2 = prefillScheduleSelections(catalog, 2);
  assert.equal(prefilled2.selectedGroups["Bazy danych:c"], "bd_c1");
  assert.equal(prefilled2.selectedGroups["Bazy danych:l"], "bd_l2");

  // GL 3 -> Lab GL 3, Exercise C2 (ceil(3/2) = 2)
  const prefilled3 = prefillScheduleSelections(catalog, 3);
  assert.equal(prefilled3.selectedGroups["Bazy danych:c"], "bd_c2");
  assert.equal(prefilled3.selectedGroups["Bazy danych:l"], "bd_l3");

  // GL 4 -> Lab GL 4, Exercise C2 (ceil(4/2) = 2)
  const prefilled4 = prefillScheduleSelections(catalog, 4);
  assert.equal(prefilled4.selectedGroups["Bazy danych:c"], "bd_c2");
  assert.equal(prefilled4.selectedGroups["Bazy danych:l"], "bd_l4");

  // GL 5 -> Lab GL 5, Exercise C3 (ceil(5/2) = 3)
  const prefilled5 = prefillScheduleSelections(catalog, 5);
  assert.equal(prefilled5.selectedGroups["Bazy danych:c"], "bd_c3");
  assert.equal(prefilled5.selectedGroups["Bazy danych:l"], "bd_l5");

  // GL 6 -> Lab GL 6, Exercise C3 (ceil(6/2) = 3)
  const prefilled6 = prefillScheduleSelections(catalog, 6);
  assert.equal(prefilled6.selectedGroups["Bazy danych:c"], "bd_c3");
  assert.equal(prefilled6.selectedGroups["Bazy danych:l"], "bd_l6");
});

test("detectScheduleCollisions correctly identifies overlapping classes and respects alternating parity", () => {
  const c1 = {
    id: "c1",
    subject: "Matematyka",
    day: "MON",
    start: 555,
    duration: 90,
    activity: "W",
  };
  const c2 = {
    id: "c2",
    subject: "Fizyka",
    day: "MON",
    start: 600,
    duration: 90,
    activity: "C",
  }; // Overlaps with c1 (600 < 645)
  const c3 = {
    id: "c3",
    subject: "Informatyka",
    day: "MON",
    start: 765,
    duration: 90,
    activity: "L",
  }; // No overlap with c1 or c2

  // Alternate weeks: Week A vs Week B at same time do NOT collide
  const c4a = {
    id: "c4a",
    subject: "WF A",
    day: "TUE",
    start: 450,
    duration: 90,
    teachingWeekParity: 0,
  };
  const c4b = {
    id: "c4b",
    subject: "WF B",
    day: "TUE",
    start: 450,
    duration: 90,
    teachingWeekParity: 1,
  };

  // Weekly class at same time as Week A DOES collide with Week A
  const c4w = {
    id: "c4w",
    subject: "Lektorat",
    day: "TUE",
    start: 450,
    duration: 90,
  };

  const collisions = detectScheduleCollisions([c1, c2, c3, c4a, c4b, c4w]);

  assert.equal(collisions.has("c1"), true);
  assert.equal(collisions.has("c2"), true);
  assert.equal(collisions.has("c3"), false);

  assert.equal(collisions.get("c1")[0].conflictingBlockId, "c2");
  assert.equal(collisions.get("c2")[0].conflictingBlockId, "c1");

  // c4a collides with c4w, but not c4b
  assert.equal(collisions.has("c4a"), true);
  assert.equal(
    collisions.get("c4a").some((c) => c.conflictingBlockId === "c4b"),
    false,
  );
  assert.equal(
    collisions.get("c4a").some((c) => c.conflictingBlockId === "c4w"),
    true,
  );
});

test("resolveUserBlocks includes user custom blocks and handles overrides", () => {
  const emptyState = { blocks: [], rooms: [] };
  const custom1 = {
    id: "custom-1",
    subject: "Własny lektorat",
    day: "WED",
    start: 450,
    duration: 90,
    activity: "Lektorat",
    planType: "stacjonarne",
  };
  const custom2 = {
    id: "custom-2",
    subject: "Ukryte zajęcia",
    day: "THU",
    start: 600,
    duration: 90,
    planType: "stacjonarne",
  };

  const resolved = resolveUserBlocks(emptyState, {
    cohort: "INF / GL 1",
    planType: "stacjonarne",
    selectedSubjects: {},
    selectedGroups: {},
    customBlocks: [custom1, custom2],
    overrides: {
      "custom-2": { hidden: true },
      "custom-1": { customSubject: "Język hiszpański" },
    },
  });

  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].id, "custom-1");
  assert.equal(resolved[0].subject, "Język hiszpański");
  assert.equal(resolved[0].isCustom, true);
});

test("catalog simplifies lecture group to Wszyscy and handles online room formatting", () => {
  const testState = {
    blocks: [
      {
        id: "lecture-1",
        subject: "Bazy danych I",
        activity: "W",
        teacher: "Stankievych Olena",
        cohort: "I stopień stac sem. 3",
        planType: "stacjonarne",
        day: "WED",
        start: 630,
        duration: 90,
        room: "ONLINE",
      },
      {
        id: "biz-1",
        subject: "Komunikacja w biznesie",
        activity: "C",
        teacher: "Jacek Jaśtal",
        cohort: "I stopień stac sem. 3 / gr. 1",
        planType: "stacjonarne",
        day: "TUE",
        start: 975,
        duration: 90,
        room: "SEMINARYJNA",
        teachingWeekParity: 0,
      },
      {
        id: "biz-2",
        subject: "Komunikacja w biznesie",
        activity: "C",
        teacher: "Jacek Jaśtal",
        cohort: "I stopień stac sem. 3 / gr. 2",
        planType: "stacjonarne",
        day: "TUE",
        start: 975,
        duration: 90,
        room: "SEMINARYJNA",
        teachingWeekParity: 1,
      },
    ],
    rooms: [],
  };

  const catalog = buildSubjectCatalog(testState, "I stopień stac sem. 3");
  const lectureItem = catalog.find((i) => i.subject === "Bazy danych I");
  assert.ok(lectureItem);
  assert.equal(lectureItem.activities[0].options[0].group, "Wszyscy");

  const bizItem = catalog.find((i) => i.subject === "Komunikacja w biznesie");
  assert.ok(bizItem);
  const bizOptions = bizItem.activities[0].options;
  assert.equal(bizOptions.find((o) => o.id === "biz-1")?.parity, 0);
  assert.equal(bizOptions.find((o) => o.id === "biz-2")?.parity, 1);

  // Online room in placement text and ics
  const placement = blockPlacementText(testState.blocks[0]);
  assert.match(placement, /ONLINE/);

  const ics = generateIcs([testState.blocks[0]]);
  assert.match(ics, /LOCATION:Online/);
});

test("one group choice includes every placed recurring and added occurrence", () => {
  const lecture = {
    id: "lecture",
    subject: "Bazy danych I",
    activity: "W",
    cohort: "I stopień stac sem. 3",
    groupNo: 1,
    planType: "stacjonarne",
    day: "WED",
    start: 630,
  };
  const exercise = {
    ...lecture,
    id: "exercise-3",
    activity: "C",
    cohort: "I stopień stac sem. 3 / gr. 3",
    groupNo: 3,
    start: 1185,
  };
  const testState = {
    blocks: [
      { ...lecture, id: "lecture@additional", start: 1170, date: "2026-10-07" },
      lecture,
      { ...exercise, id: "exercise-2", cohort: "I stopień stac sem. 3 / gr. 2", groupNo: 2 },
      exercise,
      { ...exercise, id: "exercise-3@oneoff", day: "THU", start: 720, date: "2026-10-08" },
      { ...exercise, id: "exercise-3@parked", day: null, start: null },
    ],
    rooms: [],
  };
  const catalog = buildSubjectCatalog(testState, lecture.cohort);
  const activities = catalog[0].activities;
  assert.equal(activities.find((item) => item.activity === "w").options.length, 1);
  assert.equal(activities.find((item) => item.activity === "w").options[0].id, "lecture");
  assert.equal(activities.find((item) => item.activity === "c").options.length, 2);

  const resolved = resolveUserBlocks(testState, {
    cohort: lecture.cohort,
    planType: "stacjonarne",
    selectedSubjects: { "Bazy danych I": true },
    selectedGroups: { "Bazy danych I:w": "lecture", "Bazy danych I:c": "exercise-3" },
  });
  assert.deepEqual(resolved.map((item) => item.id), [
    "lecture@additional", "lecture", "exercise-3", "exercise-3@oneoff",
  ]);
});

test("isBlockActiveNow correctly detects active blocks based on time, day, and parity", () => {
  // 2026-10-06 is Tuesday (TUE), Week 2 (B)
  const testNow = new Date(2026, 9, 6, 16, 30); // 16:30 = 990 min

  const activeBlockB = {
    id: "act-1",
    subject: "Programowanie",
    day: "TUE",
    start: 960, // 16:00
    duration: 90, // ends at 17:30 (1050)
    teachingWeekParity: 1, // Week B
    planType: "stacjonarne",
  };

  const activeWeeklyBlock = {
    ...activeBlockB,
    id: "act-2",
    teachingWeekParity: null,
  };

  const wrongParityBlockA = {
    ...activeBlockB,
    id: "act-3",
    teachingWeekParity: 0, // Week A
  };

  const wrongDayBlock = {
    ...activeBlockB,
    id: "act-4",
    day: "MON",
  };

  const futureBlock = {
    ...activeBlockB,
    id: "act-5",
    start: 1080, // 18:00
  };

  const pastBlock = {
    ...activeBlockB,
    id: "act-6",
    start: 840, // 14:00 - 15:30
  };

  assert.equal(isBlockActiveNow(activeBlockB, testNow), true);
  assert.equal(isBlockActiveNow(activeWeeklyBlock, testNow), true);
  assert.equal(isBlockActiveNow(wrongParityBlockA, testNow), false);
  assert.equal(isBlockActiveNow(wrongDayBlock, testNow), false);
  assert.equal(isBlockActiveNow(futureBlock, testNow), false);
  assert.equal(isBlockActiveNow(pastBlock, testNow), false);

  // Exact boundaries
  const exactStart = new Date(2026, 9, 6, 16, 0); // 16:00
  const exactEnd = new Date(2026, 9, 6, 17, 30); // 17:30
  assert.equal(isBlockActiveNow(activeBlockB, exactStart), true);
  assert.equal(isBlockActiveNow(activeBlockB, exactEnd), false);
});
