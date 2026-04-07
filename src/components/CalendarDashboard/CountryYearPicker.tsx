"use client";

import { useState, useRef, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import styles from "./CalendarDashboard.module.css";
import { COUNTRIES, countryFlag, type CountryOption } from "./holidays";

interface CountryYearPickerProps {
  country: string;
  year: number;
  onCountryChange: (code: string) => void;
  onYearChange: (year: number) => void;
  loading: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function CountryYearPicker({
  country,
  year,
  onCountryChange,
  onYearChange,
  loading,
  darkMode,
  onToggleDarkMode,
}: CountryYearPickerProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const selectedCountry: CountryOption =
    COUNTRIES.find((c) => c.code === country) || { code: country, name: country };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 3 + i);

  return (
    <div className={styles.pickerBar} id="country-year-picker">
      {/* Country picker */}
      <div className={styles.pickerGroup} ref={dropdownRef}>
        <button
          className={styles.pickerBtn}
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            setSearch("");
          }}
          id="country-picker-btn"
        >
          <span className={styles.pickerFlag}>
            {countryFlag(selectedCountry.code)}
          </span>
          <span className={styles.pickerLabel}>{selectedCountry.name}</span>
          <span className={styles.pickerChevron}>
            {dropdownOpen ? "▴" : "▾"}
          </span>
        </button>

        {dropdownOpen && (
          <div className={styles.pickerDropdown}>
            <input
              className={styles.pickerSearch}
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              id="country-search-input"
            />
            <div className={styles.pickerList}>
              {filtered.map((c) => (
                <button
                  key={c.code}
                  className={`${styles.pickerOption} ${c.code === country ? styles.pickerOptionActive : ""}`}
                  onClick={() => {
                    onCountryChange(c.code);
                    setDropdownOpen(false);
                    setSearch("");
                  }}
                >
                  <span>{countryFlag(c.code)}</span>
                  <span>{c.name}</span>
                  <span className={styles.pickerCode}>{c.code}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className={styles.pickerEmpty}>No country found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Year picker */}
      <div className={styles.pickerGroup}>
        <select
          className={styles.yearSelect}
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          id="year-picker-select"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Dark/Light mode toggle */}
      <button
        className={styles.themeToggle}
        onClick={onToggleDarkMode}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        title={darkMode ? "Light mode" : "Dark mode"}
        id="theme-toggle-btn"
      >
        {darkMode ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* Loading indicator */}
      {loading && <div className={styles.pickerLoading}>⏳</div>}
    </div>
  );
}
