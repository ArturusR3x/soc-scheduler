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
  const randomizeShifts = useCallback(() => {
    console.log("RandomizeShifts update deployed: BACKEND+ excluded from shift 1"); // <-- deployment marker
    // Exclude members with group "BACKEND" (but not "BACKEND+")
    const filteredMembers = members.filter(m => {
      const group = (typeof m === "object" && m.group) ? m.group : null;
      // If m is just a name, get group from schedule or skip
      if (!group && typeof m === "string" && schedule) {
        // Try to get group from schedule or skip
        return true; // fallback: allow, since App.jsx already filters
      }
      return group !== "BACKEND";
    });
    if (!filteredMembers.length) return;
    const days = getMonthDays();
    const shifts = [1, 2, 3];
    const perShift = 2; // 2 people per shift per day

    // Helper: get group for a member (works for both object and string)
    const getGroup = m => {
      let group = null;
      if (typeof m === "object" && m.group) group = m.group;
      else if (typeof m === "string") {
        const found = members.find(mem => mem.name === m);
        group = found && found.group ? found.group : null;
      }
      // Debug log for group extraction
      console.log("[getGroup] member:", m, "group:", group);
      return group;
    };

    // Helper: case-insensitive group compare
    const isBackendPlus = m => (getGroup(m) || "").toLowerCase() === "backend+";
    const isSouth = m => (getGroup(m) || "").toLowerCase() === "south";

    // Track last shift for each member
    const lastShift = {};
    // Track how many times each member gets each shift
    const shiftCounts = {};
    filteredMembers.forEach(m => {
      lastShift[m] = null;
      shiftCounts[m] = { 1: 0, 2: 0, 3: 0, off: 0 };
    });

    // --- Fix: Initialize lastShift for first day using previous day in schedule ---
    if (days.length > 0) {
      const firstDay = days[0];
      const prevDay = addDays(firstDay, -1);
      const prevKey = format(prevDay, "yyyy-MM-dd");
      if (schedule[prevKey]) {
        filteredMembers.forEach(m => {
          const prevShift = schedule[prevKey][m];
          if (prevShift === 1 || prevShift === 2 || prevShift === 3) {
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
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const day = days[dayIdx];
      const dateKey = format(day, "yyyy-MM-dd");
      newSchedule[dateKey] = {};

      // For each shift, pick up to 2 members
      let available = {};
      filteredMembers.forEach(m => {
        // Rule 1: after shift 2, cannot get shift 1 next day
        if (lastShift[m] === 2) {
          available[m] = [2, 3, "off"];
        }
        // Rule 2: after shift 3, must be off
        else if (lastShift[m] === 3) {
          available[m] = ["off"];
        }
        // Otherwise, can get any shift
        else {
          available[m] = [1, 2, 3, "off"];
        }
      });

      // --- New rules logic ---
      // Helper: filter candidates for a shift based on group rules
      function filterShiftCandidates(candidates, assigned, shiftNum) {
        // Exclude BACKEND+ from shift 1
        if (shiftNum === 1) {
          candidates = candidates.filter(m => !isBackendPlus(m));
        }
        // Only one BACKEND+ per shift (2 or 3)
        if (shiftNum === 2 || shiftNum === 3) {
          const backendPlus = candidates.filter(isBackendPlus);
          if (backendPlus.length > 1) {
            const keep = shuffle(backendPlus).slice(0, 1);
            candidates = candidates.filter(m => !isBackendPlus(m)).concat(keep);
          }
        }
        // Rule 3: south cannot be together at shift 1
        if (shiftNum === 1) {
          const south = candidates.filter(isSouth);
          if (south.length > 1) {
            const keep = shuffle(south).slice(0, 1);
            candidates = candidates.filter(m => !isSouth(m)).concat(keep);
          }
        }
        // Rule 1: north can be together at shift 1 (no restriction)
        return candidates;
      }
      // --- End new rules logic ---

      // Try to vary shifts: prefer not to assign the same shift as yesterday
      // 1. Assign shift 1 (prefer members whose last shift was not 1)
      let shift1Candidates = filteredMembers
        .filter(m => available[m].includes(1))
        .filter(m => !isBackendPlus(m)); // exclude BACKEND+ here
      shift1Candidates = filterShiftCandidates(shift1Candidates, [], 1);
      let shift1Pref = shuffle(shift1Candidates.filter(m => lastShift[m] !== 1));
      let shift1Fill = shuffle(shift1Candidates.filter(m => lastShift[m] === 1));
      let shift1Assigned = [...shift1Pref, ...shift1Fill].slice(0, perShift);

      // 2. Assign shift 2 (prefer members whose last shift was not 2, and not already assigned)
      let shift2Candidates = filteredMembers
        .filter(m => available[m].includes(2) && !shift1Assigned.includes(m));
      // Only one BACKEND+ in shift 2
      const backendPlus2 = shift2Candidates.filter(isBackendPlus);
      if (backendPlus2.length > 1) {
        const keep = shuffle(backendPlus2).slice(0, 1);
        shift2Candidates = shift2Candidates.filter(m => !isBackendPlus(m)).concat(keep);
      }
      shift2Candidates = filterShiftCandidates(shift2Candidates, shift1Assigned, 2);
      let shift2Pref = shuffle(shift2Candidates.filter(m => lastShift[m] !== 2));
      let shift2Fill = shuffle(shift2Candidates.filter(m => lastShift[m] === 2));
      let shift2Assigned = [...shift2Pref, ...shift2Fill].slice(0, perShift);

      // 3. Assign shift 3 (prefer members whose last shift was not 3, and not already assigned)
      let shift3Candidates = filteredMembers
        .filter(m => available[m].includes(3) && !shift1Assigned.includes(m) && !shift2Assigned.includes(m));
      // Only one BACKEND+ in shift 3
      const backendPlus3 = shift3Candidates.filter(isBackendPlus);
      if (backendPlus3.length > 1) {
        const keep = shuffle(backendPlus3).slice(0, 1);
        shift3Candidates = shift3Candidates.filter(m => !isBackendPlus(m)).concat(keep);
      }
      shift3Candidates = filterShiftCandidates(shift3Candidates, [...shift1Assigned, ...shift2Assigned], 3);
      let shift3Pref = shuffle(shift3Candidates.filter(m => lastShift[m] !== 3));
      let shift3Fill = shuffle(shift3Candidates.filter(m => lastShift[m] === 3));
      let shift3Assigned = [...shift3Pref, ...shift3Fill].slice(0, perShift);

      // 4. The rest are off
      let assigned = [...shift1Assigned, ...shift2Assigned, ...shift3Assigned];
      let offAssigned = filteredMembers.filter(m => !assigned.includes(m));

      // Fill schedule for the day
      shift1Assigned.forEach(m => {
        newSchedule[dateKey][m] = 1;
        lastShift[m] = 1;
        shiftCounts[m][1]++;
      });
      shift2Assigned.forEach(m => {
        newSchedule[dateKey][m] = 2;
        lastShift[m] = 2;
        shiftCounts[m][2]++;
      });
      shift3Assigned.forEach(m => {
        newSchedule[dateKey][m] = 3;
        lastShift[m] = 3;
        shiftCounts[m][3]++;
      });
      offAssigned.forEach(m => {
        // Only update lastShift if previous shift was 3 (to enforce off after 3)
        if (lastShift[m] === 3) lastShift[m] = "off";
        else if (lastShift[m] !== "off") lastShift[m] = null;
        shiftCounts[m]["off"]++;
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
