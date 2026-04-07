"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Image from "next/image";
import { Info } from "lucide-react";
import styles from "./CalendarDashboard.module.css";
import {
  WEEKDAYS,
  MONTH_NAMES,
  MONTH_OVERLAYS,
  getCalendarDays,
  randomBetween,
} from "./calendarUtils";
import StickyNote, { type StickyNoteData } from "./StickyNote";
import CountryYearPicker from "./CountryYearPicker";
import { type Holiday, holidayColor } from "./holidays";
import { calendarStorage } from "./storage";

const SPIRAL_COUNT = 19;
const STICKY_COLORS = ["#fff740", "#ff7eb3", "#7afcff", "#98ff98", "#ffa07a"];

type FlipState = "idle" | "flipping-next" | "flipping-prev";
type BottomTab = "holidays" | "notes";

/* ─── Holiday hook ─── */
function useHolidays(country: string, year: number) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchHolidays() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/holidays?country=${country}&year=${year}`,
        );
        const data = await res.json();
        if (!cancelled) {
          if (data.error) {
            setError(data.error);
            setHolidays([]);
          } else if (data.response?.holidays) {
            setHolidays(data.response.holidays);
          } else {
            setHolidays([]);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Failed to fetch holidays");
          setHolidays([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHolidays();
    return () => {
      cancelled = true;
    };
  }, [country, year]);

  return { holidays, loading, error };
}

/* ─── Calendar Page (image + grid) ─── */
function CalendarPage({
  year,
  month,
  selectedDate,
  onSelectDate,
  holidays,
  hoveredDay,
  onHoverDay,
  activeTab,
  onTabChange,
  noteText,
  onNoteTextChange,
  onSaveNote,
  savedFlash,
  onPageClick,
}: {
  year: number;
  month: number;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  holidays: Holiday[];
  hoveredDay: number | null;
  onHoverDay: (day: number | null) => void;
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  noteText: string;
  onNoteTextChange: (text: string) => void;
  onSaveNote: () => void;
  savedFlash: boolean;
  onPageClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const days = getCalendarDays(year, month);
  const today = new Date();

  // Build holiday lookup: day → Holiday[]
  const holidayMap = useMemo(() => {
    const map = new Map<number, Holiday[]>();
    for (const h of holidays) {
      const hd = h.date.datetime;
      if (hd.month === month + 1 && hd.year === year) {
        const existing = map.get(hd.day) || [];
        existing.push(h);
        map.set(hd.day, existing);
      }
    }
    return map;
  }, [holidays, month, year]);

  // Month holidays for the holidays tab
  const monthHolidays = useMemo(() => {
    return holidays
      .filter(
        (h) =>
          h.date.datetime.month === month + 1 && h.date.datetime.year === year,
      )
      .sort((a, b) => a.date.datetime.day - b.date.datetime.day);
  }, [holidays, month, year]);

  // Selected date holidays
  const selectedDayHolidays = useMemo(() => {
    if (
      selectedDate.getMonth() !== month ||
      selectedDate.getFullYear() !== year
    )
      return [];
    return holidayMap.get(selectedDate.getDate()) || [];
  }, [selectedDate, month, year, holidayMap]);

  // Format selected date for display
  const selectedDateLabel = selectedDate.toLocaleDateString("default", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className={styles.pageContainer} onClick={onPageClick}>
      {/* Navigation hint overlay */}
      {/* <div className={styles.navigationHint}>
        <div className={styles.upperHalfHint}>
          <span className={styles.navIcon}>«</span>
          <span className={styles.navText}>Previous Month</span>
        </div>
        <div className={styles.lowerHalfHint}>
          <span className={styles.navIcon}>»</span>
          <span className={styles.navText}>Next Month</span>
        </div>
      </div> */}

      {/* Info tooltip */}
      <div className={styles.infoTooltip}>
        <button className={styles.infoButton} aria-label="Navigation help">
          <span className={styles.infoIcon}>i</span>
        </button>
        <div className={styles.infoTooltipContent}>
          <div className={styles.infoTooltipTitle}>Navigation</div>
          <div className={styles.infoTooltipText}>
            <strong>Upper half:</strong> Click for previous month
            <br />
            <strong>Lower half:</strong> Click for next month
            {/* <br />
            <strong>Interactive areas:</strong> Click dates, tabs, and notes
            without changing month */}
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className={styles.imageSection}>
        <Image
          src={month % 2 === 0 ? "/calendar-hero.png" : "/kashi.png"}
          alt={`${MONTH_NAMES[month]} landscape`}
          fill
          className={styles.calendarImage}
          style={{ objectFit: "cover" }}
          priority
        />
        <div
          className={styles.imageOverlay}
          style={{
            background: `linear-gradient(135deg, transparent 40%, ${MONTH_OVERLAYS[month]} 100%)`,
          }}
        >
          <div className={styles.monthYearBadge}>
            <div className={styles.yearText}>{year}</div>
            <div className={styles.monthText}>{MONTH_NAMES[month]}</div>
          </div>
        </div>

        <svg
          className={styles.waveDecor}
          viewBox="0 0 520 50"
          preserveAspectRatio="none"
        >
          <path
            d="M0 50 L0 30 Q130 0 260 25 Q390 50 520 20 L520 50 Z"
            fill="#ffffff"
          />
          <path
            d="M0 50 L0 38 Q130 10 260 30 Q390 50 520 28 L520 50 Z"
            fill={MONTH_OVERLAYS[month].replace(/[\d.]+\)$/, "0.35)")}
          />
        </svg>
      </div>

      {/* Grid Section */}
      <div className={styles.gridSection}>
        {/* Left column: Tabs (Holidays / Notes) */}
        <div className={styles.notesLines}>
          {/* Tab bar */}
          <div className={styles.tabBar}>
            <button
              className={`${styles.tabBtn} ${activeTab === "holidays" ? styles.tabBtnActive : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onTabChange("holidays");
              }}
              id="tab-holidays"
            >
              Holidays
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "notes" ? styles.tabBtnActive : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onTabChange("notes");
              }}
              id="tab-notes"
            >
              Notes
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === "holidays" ? (
              /* ── Holidays Tab ── */
              <>
                {selectedDayHolidays.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <div
                      className={styles.noteSelectedDate}
                      style={{ marginBottom: 4 }}
                    >
                      <span className={styles.noteSelectedDateBadge}>
                        {selectedDate.getDate()}
                      </span>
                      <span>{selectedDateLabel}</span>
                    </div>
                    {selectedDayHolidays.map((h, i) => (
                      <div
                        key={`sel-${i}`}
                        className={styles.holidayNoteItem}
                        style={{ background: "rgba(59,152,230,0.05)" }}
                      >
                        <div
                          className={styles.holidayNoteDot}
                          style={{ background: holidayColor(h.type) }}
                        />
                        <div className={styles.holidayNoteText}>
                          <strong>{h.name}</strong>
                          {h.type.length > 0 && (
                            <div
                              style={{
                                fontSize: "0.55rem",
                                color: "#999",
                                marginTop: 1,
                              }}
                            >
                              {h.type.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div
                      style={{
                        borderBottom: "1px dashed #ddd",
                        margin: "4px 0",
                      }}
                    />
                  </div>
                )}
                {monthHolidays.length > 0 ? (
                  <div className={styles.notesScrollable}>
                    {monthHolidays.map((h, i) => (
                      <div
                        key={`${h.name}-${i}`}
                        className={styles.holidayNoteItem}
                      >
                        <div
                          className={styles.holidayNoteDot}
                          style={{ background: holidayColor(h.type) }}
                        />
                        <div className={styles.holidayNoteText}>
                          <span className={styles.holidayNoteDate}>
                            {h.date.datetime.day}
                          </span>{" "}
                          {h.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "#bbb",
                      textAlign: "center",
                      padding: "16px 0",
                    }}
                  >
                    No holidays loaded
                  </div>
                )}
              </>
            ) : (
              /* ── Notes Tab ── */
              <div className={styles.noteInputSection}>
                <div className={styles.noteSelectedDate}>
                  {" "}
                  <span className={styles.noteSelectedDateBadge}>
                    {selectedDate.getDate()}
                  </span>
                  <span>{selectedDateLabel}</span>
                </div>
                <textarea
                  className={styles.noteTextarea}
                  placeholder="Write your note..."
                  value={noteText}
                  onChange={(e) => {
                    e.stopPropagation();
                    onNoteTextChange(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      onSaveNote();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  id="calendar-note-input"
                />
                <button
                  className={styles.noteSaveBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveNote();
                  }}
                  disabled={!noteText.trim()}
                  id="save-note-to-wall"
                >
                  📌 Save to Wall
                </button>
                {savedFlash && (
                  <div className={styles.noteSaved}>
                    ✓ Note pinned to the wall!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Day grid */}
        <div className={styles.dayGrid}>
          <div className={styles.weekHeaderRow}>
            {WEEKDAYS.map((d) => (
              <span key={d} className={styles.weekHeaderDay}>
                {d}
              </span>
            ))}
          </div>
          <div className={styles.daysContainer}>
            {days.map((cell, idx) => {
              const { date: d, day: dayNum, isCurrentMonth } = cell;
              const isToday =
                isCurrentMonth &&
                dayNum === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear();
              const isSelected =
                isCurrentMonth &&
                dayNum === selectedDate.getDate() &&
                d.getMonth() === selectedDate.getMonth() &&
                d.getFullYear() === selectedDate.getFullYear();
              const dayOfWeek = d.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const dayHolidays = isCurrentMonth
                ? holidayMap.get(dayNum)
                : undefined;
              const isHovered = isCurrentMonth && hoveredDay === dayNum;

              let cls = styles.dayCell;
              if (!isCurrentMonth) {
                cls += ` ${styles.otherMonthCell}`;
              } else {
                if (isToday) cls += ` ${styles.todayCell}`;
                else if (isSelected) cls += ` ${styles.selectedCell}`;
                if (isWeekend && !isToday) cls += ` ${styles.weekendCell}`;
                if (dayHolidays) cls += ` ${styles.holidayCell}`;
              }

              // Determine styling - holiday takes precedence unless it's today
              const isHolidayToday = isToday && dayHolidays;
              const buttonStyle =
                dayHolidays && !isToday
                  ? {
                      background: holidayColor(dayHolidays[0].type),
                      color: "#fff",
                      fontWeight: "700",
                      boxShadow: `0 2px 8px ${holidayColor(dayHolidays[0].type)}40`,
                      border: `2px solid ${holidayColor(dayHolidays[0].type)}20`,
                    }
                  : isHolidayToday
                    ? {
                        background: `linear-gradient(135deg, ${holidayColor(dayHolidays[0].type)}, ${holidayColor(dayHolidays[0].type)}dd)`,
                        color: "#fff",
                        fontWeight: "800",
                        boxShadow: `
                      0 4px 15px ${holidayColor(dayHolidays[0].type)}40,
                      0 0 0 2px rgba(255, 255, 255, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2)
                    `,
                        border: `2px solid ${holidayColor(dayHolidays[0].type)}30`,
                      }
                    : undefined;

              return (
                <div key={idx} className={styles.dayWrapper}>
                  <button
                    className={cls}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrentMonth) onSelectDate(d);
                    }}
                    onMouseEnter={() => dayHolidays && onHoverDay(dayNum)}
                    onMouseLeave={() => onHoverDay(null)}
                    aria-label={d.toDateString()}
                    style={buttonStyle}
                  >
                    {dayNum}
                  </button>
                  {dayHolidays && isHovered && (
                    <div className={styles.holidayTooltip}>
                      {dayHolidays.map((h, i) => (
                        <div key={i}>{h.name}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function CalendarDashboard() {
  const today = new Date();

  // Initialize from local storage
  const [currentYear, setCurrentYear] = useState(() =>
    calendarStorage.getSelectedYear(),
  );
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const [flipState, setFlipState] = useState<FlipState>("idle");
  const [targetYear, setTargetYear] = useState(today.getFullYear());
  const [targetMonth, setTargetMonth] = useState(today.getMonth());

  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>(() =>
    calendarStorage.getStickyNotes(),
  );
  const wallRef = useRef<HTMLDivElement>(null);

  // Country & year for holidays - initialize from local storage
  const [country, setCountry] = useState(() =>
    calendarStorage.getSelectedCountry(),
  );
  const [holidayYear, setHolidayYear] = useState(() =>
    calendarStorage.getSelectedYear(),
  );

  // Tabs & note input
  const [activeTab, setActiveTab] = useState<BottomTab>("holidays");
  const [noteText, setNoteText] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = useCallback(() => setDarkMode((v) => !v), []);

  // Save sticky notes to local storage whenever they change
  useEffect(() => {
    calendarStorage.setStickyNotes(stickyNotes);
  }, [stickyNotes]);

  // Save country selection to local storage whenever it changes
  useEffect(() => {
    calendarStorage.setSelectedCountry(country);
  }, [country]);

  // Save year selection to local storage whenever it changes
  useEffect(() => {
    calendarStorage.setSelectedYear(holidayYear);
  }, [holidayYear]);

  // Default country is India (users can change via picker)

  // Sync holiday year with calendar year
  useEffect(() => {
    setHolidayYear(currentYear);
  }, [currentYear]);

  // Fetch holidays
  const { holidays, loading, error } = useHolidays(country, holidayYear);

  /* ── Month Navigation ── */
  const goNext = useCallback(() => {
    if (flipState !== "idle") return;
    let ny = currentYear,
      nm = currentMonth + 1;
    if (nm > 11) {
      nm = 0;
      ny++;
    }
    setTargetYear(ny);
    setTargetMonth(nm);
    setFlipState("flipping-next");
    setTimeout(() => {
      setCurrentYear(ny);
      setCurrentMonth(nm);
      setFlipState("idle");
    }, 850);
  }, [flipState, currentYear, currentMonth]);

  const goPrev = useCallback(() => {
    if (flipState !== "idle") return;
    let py = currentYear,
      pm = currentMonth - 1;
    if (pm < 0) {
      pm = 11;
      py--;
    }
    setTargetYear(py);
    setTargetMonth(pm);
    setFlipState("flipping-prev");
    setTimeout(() => {
      setCurrentYear(py);
      setCurrentMonth(pm);
      setFlipState("idle");
    }, 850);
  }, [flipState, currentYear, currentMonth]);

  /* Calendar Page Click Handler */
  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (flipState !== "idle") return;

      // Check if the click was on an interactive element
      const target = e.target as HTMLElement;
      const isInteractive =
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.tagName === "A" ||
        target.tagName === "LABEL" ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("select") ||
        target.closest("a") ||
        target.closest("label") ||
        target.classList.contains("dayCell") ||
        target.closest(".dayCell");

      if (isInteractive) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const midPoint = rect.height / 2;

      if (clickY < midPoint) {
        goPrev();
      } else {
        goNext();
      }
    },
    [flipState, goPrev, goNext],
  );

  const handleSelectDate = useCallback((d: Date) => {
    setSelectedDate(d);
  }, []);

  const handleHoverDay = useCallback((day: number | null) => {
    setHoveredDay(day);
  }, []);

  /* ── Country/Year change handlers ── */
  const handleCountryChange = useCallback((code: string) => {
    setCountry(code);
  }, []);

  const handleYearChange = useCallback((year: number) => {
    setHolidayYear(year);
    setCurrentYear(year);
    setCurrentMonth(0);
  }, []);

  /* ── Save note → create sticky on the wall ── */
  const handleSaveNote = useCallback(() => {
    if (!noteText.trim() || !wallRef.current) return;

    const wallRect = wallRef.current.getBoundingClientRect();
    const calendarWidth = 520;
    const calendarLeft = (wallRect.width - calendarWidth) / 2;

    // Position the sticky note to the left or right of the calendar
    const side = stickyNotes.length % 2 === 0 ? "left" : "right";
    const baseX =
      side === "left"
        ? Math.max(10, calendarLeft - 190)
        : Math.min(wallRect.width - 180, calendarLeft + calendarWidth + 20);
    const baseY = 160 + (stickyNotes.length % 5) * 140;

    // Format: "Apr 7 – My note text"
    const dateStr = selectedDate.toLocaleDateString("default", {
      month: "short",
      day: "numeric",
    });
    const dayName = selectedDate.toLocaleDateString("default", {
      weekday: "short",
    });

    const newNote: StickyNoteData = {
      id: `note-${Date.now()}`,
      x: baseX + randomBetween(-15, 15),
      y: Math.min(baseY + randomBetween(-10, 10), wallRect.height - 160),
      text: `${dayName}, ${dateStr}\n──────\n${noteText.trim()}`,
      color: STICKY_COLORS[stickyNotes.length % STICKY_COLORS.length],
      rotation: randomBetween(-5, 5),
    };

    setStickyNotes((prev) => [...prev, newNote]);
    setNoteText("");

    // Show saved flash
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }, [noteText, selectedDate, stickyNotes.length]);

  /* ── Sticky Notes: Double-click on wall */
  const handleWallDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== wallRef.current) return;

      // Check if we're on mobile
      const isMobile = window.innerWidth <= 700;

      if (isMobile) {
        // On mobile, position notes below calendar (relative positioning)
        const newNote: StickyNoteData = {
          id: `note-${Date.now()}`,
          x: 0, // Will be handled by CSS
          y: 0, // Will be handled by CSS
          text: "",
          color:
            STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
          rotation: 0, // No rotation on mobile for better readability
        };
        setStickyNotes((prev) => [...prev, newNote]);
      } else {
        // On desktop, position at click location (absolute positioning)
        const rect = wallRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newNote: StickyNoteData = {
          id: `note-${Date.now()}`,
          x: Math.max(0, Math.min(x - 80, rect.width - 170)),
          y: Math.max(0, Math.min(y - 60, rect.height - 140)),
          text: "",
          color:
            STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
          rotation: randomBetween(-6, 6),
        };
        setStickyNotes((prev) => [...prev, newNote]);
      }
    },
    [],
  );

  const updateNote = useCallback(
    (id: string, updates: Partial<StickyNoteData>) => {
      setStickyNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      );
    },
    [],
  );

  const deleteNote = useCallback((id: string) => {
    setStickyNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /* ── Render Flip Pages ── */
  const renderPage = useCallback(
    (y: number, m: number) => (
      <CalendarPage
        year={y}
        month={m}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        holidays={holidays}
        hoveredDay={hoveredDay}
        onHoverDay={handleHoverDay}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        noteText={noteText}
        onNoteTextChange={setNoteText}
        onSaveNote={handleSaveNote}
        savedFlash={savedFlash}
        onPageClick={handlePageClick}
      />
    ),
    [
      selectedDate,
      handleSelectDate,
      holidays,
      hoveredDay,
      handleHoverDay,
      activeTab,
      noteText,
      handleSaveNote,
      savedFlash,
      handlePageClick,
    ],
  );

  const flipPages = useMemo(() => {
    if (flipState === "flipping-next") {
      return (
        <>
          <div className={styles.pageStatic}>
            {renderPage(targetYear, targetMonth)}
          </div>
          <div className={`${styles.page} ${styles.flipUp}`}>
            {renderPage(currentYear, currentMonth)}
          </div>
        </>
      );
    }
    if (flipState === "flipping-prev") {
      return (
        <>
          <div className={styles.pageStatic}>
            {renderPage(currentYear, currentMonth)}
          </div>
          <div className={`${styles.page} ${styles.flipDown}`}>
            {renderPage(targetYear, targetMonth)}
          </div>
        </>
      );
    }
    return (
      <div className={styles.page}>{renderPage(currentYear, currentMonth)}</div>
    );
  }, [
    flipState,
    currentYear,
    currentMonth,
    targetYear,
    targetMonth,
    renderPage,
  ]);

  return (
    <div
      ref={wallRef}
      className={`${styles.wall} ${darkMode ? styles.dark : ""}`}
      onDoubleClick={handleWallDoubleClick}
      id="calendar-wall"
    >
      {/* Calendar */}
      <div className={styles.calendarContainer}>
        {/* Country/Year Picker */}
        <CountryYearPicker
          country={country}
          year={holidayYear}
          onCountryChange={handleCountryChange}
          onYearChange={handleYearChange}
          loading={loading}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {error && <div className={styles.apiError}>{error}</div>}

        {/* Nail */}
        <div className={styles.nailArea}>
          <div className={styles.nail} />
          <div className={styles.stringLeft} />
          <div className={styles.stringRight} />
        </div>

        {/* Spiral binding */}
        <div className={styles.spiralBinding}>
          {Array.from({ length: SPIRAL_COUNT }).map((_, i) => (
            <div key={i} className={styles.spiralLoop} />
          ))}
        </div>

        {/* Flip container */}
        <div className={styles.flipContainer}>
          {flipPages}
          <div className={styles.pageStack} />
        </div>

        {/* Navigation arrows - hidden due to new split-screen navigation */}
        {/* <div className={`${styles.monthNav} ${styles.navLeft}`}>
          <button
            className={styles.navArrow}
            onClick={goPrev}
            aria-label="Previous month"
            id="prev-month"
          >
            &lsaquo;
          </button>
        </div>
        <div className={`${styles.monthNav} ${styles.navRight}`}>
          <button
            className={styles.navArrow}
            onClick={goNext}
            aria-label="Next month"
            id="next-month"
          >
            &rsaquo;
          </button>
        </div> */}
      </div>

      {/* Sticky Notes */}
      {stickyNotes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          onUpdate={updateNote}
          onDelete={deleteNote}
          containerRef={wallRef}
        />
      ))}

      {/* Wall Info Tooltip */}
      <div className={styles.wallInfoTooltip}>
        <button className={styles.wallInfoButton} aria-label="Wall help">
          <Info size={18} />
        </button>
        <div className={styles.wallInfoTooltipContent}>
          <div className={styles.wallInfoTooltipTitle}>Wall Features</div>
          <div className={styles.wallInfoTooltipText}>
            <strong>Double-click:</strong> Add sticky notes to the wall
            <br />
            <strong>Notes tab:</strong> Pin date-specific notes
            <br />
            <strong>Drag notes:</strong> Move them around the wall
            <br />
            <strong>Split navigation:</strong> Click upper/lower half for
            prev/next month
          </div>
        </div>
      </div>
    </div>
  );
}
