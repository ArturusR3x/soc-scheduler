import React, { useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
} from "date-fns";
import { format as formatDate, subMonths, addMonths } from "date-fns";
const API_BASE = "http://192.168.1.229:4000";
// Make sure selectedDate is passed as a prop to MonthViewCalendar
export default function MonthViewCalendar({
  schedule,
  members,
  monthDate,
  setSelectedDate,
  setCurrentMonth,
  setSchedule,
  selectedDate, // <-- add this prop
}) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const handleMonthChange = (offset) => {
    setCurrentMonth((prev) => {
      const newDate = offset === -1 ? subMonths(prev, 1) : addMonths(prev, 1);
      return newDate;
    });
  };

  // Helper: get all days in the current month
  const getMonthDays = () => {
    const days = [];
    let day = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  // Helper: shuffle array
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Fair random assignment of shifts for the month with rules and varied shifts
  const randomizeShifts = useCallback(async () => {
    console.log("RandomizeShifts update deployed: BACKEND+ excluded from shift 1");

    // Fetch latest member groups from DB before randomizing
    let latestMembers = members;
    try {
      const res = await fetch(`${API_BASE}/api/all-member-groups`);
      if (res.ok) {
        latestMembers = await res.json();
      }
    } catch (err) {
      console.warn("Failed to fetch latest member groups, using local members array.");
    }

    // Fix: Use member names for assignment, but use objects for group logic
    const memberNames = Array.isArray(latestMembers) && typeof latestMembers[0] === "object"
      ? latestMembers.map(m => m.name)
      : latestMembers;

    // Helper: get group for a member (works for both object and string)
    const getGroup = m => {
      let group = null;
      if (typeof m === "object" && m.group) group = m.group;
      if (typeof m === "string") {
        const found = latestMembers.find(mem =>
          (mem.name && mem.name.trim() === m.trim()) ||
          (mem.email && mem.email.trim() === m.trim())
        );
        group = found && found.group ? found.group : null;
      }
      console.log(`[getGroup] User:`, m, `Fetched group:`, group);
      return group;
    };

    // Exclude members with group "BACKEND" (but not "BACKEND+")
    const filteredMembers = memberNames.filter(name => {
      const group = getGroup(name);
      return group !== "BACKEND";
    });
    if (!filteredMembers.length) return;
    const days = getMonthDays();
    const shifts = [1, 2, 3];
    const perShift = 2; // 2 people per shift per day

    const isBackendPlus = m => (getGroup(m) || "").toLowerCase() === "backend+";
    const isSouth = m => (getGroup(m) || "").toLowerCase() === "south";

    // Track last shift for each member
    const lastShift = {};
    filteredMembers.forEach(m => { lastShift[m] = null; });

    // --- Fix: Initialize lastShift for first day using previous day in schedule ---
    if (days.length > 0) {
      const firstDay = days[0];
      const prevDay = addDays(firstDay, -1);
      const prevKey = format(prevDay, "yyyy-MM-dd");
      if (schedule[prevKey]) {
        filteredMembers.forEach(m => {
          const prevShift = schedule[prevKey][m];
          if ([1,2,3,"off"].includes(prevShift)) {
            lastShift[m] = prevShift;
          } else {
            lastShift[m] = null;
          }
        });
      }
    }
    // --- End fix ---

    // Build schedule day by day
    const newSchedule = {};
    // Shuffle members once per month for fairness
    const shuffledMembers = shuffle([...filteredMembers]);

    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const day = days[dayIdx];
      const dateKey = format(day, "yyyy-MM-dd");
      newSchedule[dateKey] = {};

      // --- Prioritize cycling shift: s1->s2->s3->off ---
      // Assign each member their next shift in the cycle, using shuffled order
      let memberNextShift = {};
      shuffledMembers.forEach(m => {
        let prevShift = lastShift[m];
        let nextShift;
        if (prevShift === null || prevShift === "off") nextShift = 1;
        else if (prevShift === 1) nextShift = 2;
        else if (prevShift === 2) nextShift = 3;
        else if (prevShift === 3) nextShift = "off";
        else nextShift = 1;
        memberNextShift[m] = nextShift;
      });

      // --- Ensure every day has 3 shifts filled ---
      // Distribute members evenly into 3 shifts, cycling their assignment
      let cycleOrder = [1, 2, 3, "off"];
      let membersToAssign = [...shuffledMembers];
      let shiftAssignments = { 1: [], 2: [], 3: [], off: [] };

      // Assign shifts in cycle, always fill 3 shifts per day
      for (let i = 0; i < membersToAssign.length; i++) {
        const m = membersToAssign[i];
        const shiftIdx = (dayIdx + i) % 4;
        const shiftNum = cycleOrder[shiftIdx];
        shiftAssignments[shiftNum].push(m);
        memberNextShift[m] = shiftNum;
      }

      // --- Apply rules to each shift ---
      // Shift 1: Exclude BACKEND+, only one SOUTH, north can be together
      shiftAssignments[1] = shiftAssignments[1].filter(m => !isBackendPlus(m));
      const south1 = shiftAssignments[1].filter(isSouth);
      if (south1.length > 1) {
        const keep = shuffle(south1).slice(0, 1);
        shiftAssignments[1] = shiftAssignments[1].filter(m => !isSouth(m)).concat(keep);
      }

      // Shift 2: Only one BACKEND+ allowed
      const backendPlus2 = shiftAssignments[2].filter(isBackendPlus);
      if (backendPlus2.length > 1) {
        const keep = shuffle(backendPlus2).slice(0, 1);
        shiftAssignments[2] = shiftAssignments[2].filter(m => !isBackendPlus(m)).concat(keep);
      }

      // Shift 3: Only one BACKEND+ allowed
      const backendPlus3 = shiftAssignments[3].filter(isBackendPlus);
      if (backendPlus3.length > 1) {
        const keep = shuffle(backendPlus3).slice(0, 1);
        shiftAssignments[3] = shiftAssignments[3].filter(m => !isBackendPlus(m)).concat(keep);
      }

      // BACKEND+ cannot be alone at any shift
      if (shiftAssignments[1].length === 1 && isBackendPlus(shiftAssignments[1][0])) shiftAssignments[1] = [];
      if (shiftAssignments[2].length === 1 && isBackendPlus(shiftAssignments[2][0])) shiftAssignments[2] = [];
      if (shiftAssignments[3].length === 1 && isBackendPlus(shiftAssignments[3][0])) shiftAssignments[3] = [];

      // Limit each shift to 2 people maximum
      shiftAssignments[1] = shuffle(shiftAssignments[1]).slice(0, 2);
      shiftAssignments[2] = shuffle(shiftAssignments[2]).slice(0, 2);
      shiftAssignments[3] = shuffle(shiftAssignments[3]).slice(0, 2);

      // --- FIX: Ensure every shift is filled if possible ---
      // If a shift is empty, move someone from 'off' to fill it (prioritize filling empty shifts)
      for (let shiftNum of [1, 2, 3]) {
        if (shiftAssignments[shiftNum].length === 0 && shiftAssignments["off"].length > 0) {
          // Move one person from off to this shift
          const person = shiftAssignments["off"].shift();
          shiftAssignments[shiftNum].push(person);
        }
      }

      // Fill schedule for the day
      shiftAssignments[1].forEach(m => {
        newSchedule[dateKey][m] = 1;
        lastShift[m] = 1;
      });
      shiftAssignments[2].forEach(m => {
        newSchedule[dateKey][m] = 2;
        lastShift[m] = 2;
      });
      shiftAssignments[3].forEach(m => {
        newSchedule[dateKey][m] = 3;
        lastShift[m] = 3;
      });
      shiftAssignments["off"].forEach(m => {
        newSchedule[dateKey][m] = "off";
        lastShift[m] = "off";
      });
    }

    if (typeof setSchedule === "function") {
      setSchedule(prev => ({ ...prev, ...newSchedule }));
    }
  }, [members, monthDate, setSchedule, schedule]);

  // Month/year select UI
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 mb-2">
        <button
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1 rounded font-semibold transition"
          onClick={randomizeShifts}
        >
          Randomize Shifts
        </button>
        <div className="flex items-center gap-4">
          <button
            className="px-2 py-1 rounded bg-gray-700 text-white hover:bg-blue-700 transition"
            onClick={() => handleMonthChange(-1)}
            title="Previous Month"
          >
            &#8592;
          </button>
          <span className="text-lg font-bold text-blue-200 select-none">
            {formatDate(monthDate, "MMMM yyyy")}
          </span>
          <button
            className="px-2 py-1 rounded bg-gray-700 text-white hover:bg-blue-700 transition"
            onClick={() => handleMonthChange(1)}
            title="Next Month"
          >
            &#8594;
          </button>
        </div>
      </div>
      {/* Weekday headers */}
      <div className="w-full min-w-0 overflow-x-auto">
        <div className="grid grid-cols-7 text-xs font-semibold text-center text-white bg-gray-700 rounded-t w-full min-w-[560px]">
          {weekdayNames.map((day) => (
            <div key={day} className="p-1 border border-gray-600">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar body */}
      <div className="w-full min-w-0 overflow-x-auto">
        <div className="grid grid-cols-7 border-l border-b border-gray-600 w-full min-w-[560px] overflow-visible">

          {(() => {
            const calendarCells = [];
            let day = startDate;
            let colIdx = 0;
            while (day <= endDate) {
              const dateKey = format(day, "yyyy-MM-dd");
              const formattedDate = format(day, "d");
              const shifts = schedule[dateKey] || {};
              const isLastCol = colIdx % 7 === 6;
              const borderClass = isLastCol ? "" : "border-r";
              // Defensive: only highlight if selectedDate is a valid Date
              let isSelected = false;
              if (
                selectedDate &&
                selectedDate instanceof Date &&
                !isNaN(selectedDate.getTime()) &&
                format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
              ) {
                isSelected = true;
              }
              calendarCells.push(
                <div
                  key={dateKey}
                  className={`h-32 p-2 cursor-pointer ${borderClass} border-t border-gray-600 text-xs relative rounded-lg transition-shadow duration-200
                    ${isSelected ? "ring-4 ring-blue-500 ring-offset-2 z-10" : ""}
                    ${!isSameMonth(day, monthStart)
                      ? "bg-gray-800 text-gray-500"
                      : format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                        ? "bg-blue-100 text-blue-900 shadow-lg border-blue-400"
                        : "bg-gray-900 text-white hover:shadow-lg hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-900 hover:to-blue-700"}
                  `}
                  style={{ minWidth: 0 }}
                  onClick={() => setSelectedDate(new Date(dateKey))}
                  title="Click to assign shifts for this date"
                >
                  {/* Date badge */}
                  <div className="absolute top-1 right-1 z-10">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold select-none shadow-sm
                      ${format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"}
                    `}>
                      {formattedDate}
                    </span>
                  </div>
                  {/* Member shifts */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 pt-8 pb-4 relative z-0" style={{ minHeight: '108px', maxHeight: '108px' }}>
                    {members.filter(member => shifts[member]).length === 0 && (
                      <div className="text-gray-400 text-center select-none w-full">&nbsp;</div>
                    )}
                    {(() => {
                      // Group members by shift (1,2,3)
                      const shiftGroups = { 1: [], 2: [], 3: [] };
                      members.forEach(member => {
                        const shift = shifts[member];
                        if (shift === 1 || shift === '1') shiftGroups[1].push(member);
                        else if (shift === 2 || shift === '2') shiftGroups[2].push(member);
                        else if (shift === 3 || shift === '3') shiftGroups[3].push(member);
                      });
                      const shiftColors = { 1: 'bg-green-500', 2: 'bg-[#800020]', 3: 'bg-blue-500' }; // 2: burgundy
                      // Render each shift row, top to bottom
                      return [1,2,3].map(shiftNum => {
                        const people = shiftGroups[shiftNum];
                        if (people.length === 0) return null;
                        // Split into rows of max 2 people
                        const rows = [];
                        for (let i = 0; i < people.length; i += 2) {
                          rows.push(people.slice(i, i+2));
                        }
                        return rows.map((row, idx) => (
                          <div
                            key={`shift${shiftNum}-row${idx}`}
                            className={`w-full rounded-lg px-2 py-1 text-xs text-white font-semibold shadow-lg flex flex-row items-center gap-2 mb-1 ${shiftColors[shiftNum]}`}
                            title={`Shift ${shiftNum}: ${row.join(', ')}`}
                            style={{ minWidth: 0, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18), 0 1.5px 0 #222' }}
                          >
                            {row.map(person => (
                              <span key={person} className="block font-bold text-[0.7rem] leading-tight flex-1 truncate">{person}</span>
                            ))}
                            {row.length === 1 && <span className="flex-1" />} {/* fill space if only 1 */}
                            <span className="block text-[0.65rem] ml-2">Shift {shiftNum}</span>
                          </div>
                        ));
                      });
                    })()}
                  </div>
                </div>
              );
              day = addDays(day, 1);
              colIdx++;
            }
            return calendarCells;
          })()}
        </div>
      </div>
    </div>
  );
}


