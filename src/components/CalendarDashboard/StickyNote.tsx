"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { X, Palette, Edit3 } from "lucide-react";
import styles from "./CalendarDashboard.module.css";

export interface StickyNoteData {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  rotation: number;
}

const STICKY_COLORS = ["#fff740", "#ff7eb3", "#7afcff", "#98ff98", "#ffa07a"];

interface StickyNoteProps {
  note: StickyNoteData;
  onUpdate: (id: string, updates: Partial<StickyNoteData>) => void;
  onDelete: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function StickyNote({
  note,
  onUpdate,
  onDelete,
  containerRef,
}: StickyNoteProps) {
  const noteRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(!note.text);
  const dragOffset = useRef({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    if ((e.target as HTMLElement).classList.contains(styles.stickyDeleteBtn))
      return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const rect = noteRef.current!.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset.current.x;
      const newY = e.clientY - containerRect.top - dragOffset.current.y;
      onUpdate(note.id, { x: newX, y: newY });
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, note.id, onUpdate, containerRef]);

  const handleColorCycle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const idx = STICKY_COLORS.indexOf(note.color);
      const nextColor = STICKY_COLORS[(idx + 1) % STICKY_COLORS.length];
      onUpdate(note.id, { color: nextColor });
    },
    [note.id, note.color, onUpdate],
  );

  return (
    <div
      ref={noteRef}
      className={`${styles.stickyNote} ${isDragging ? styles.stickyDragging : ""}`}
      style={{
        left: note.x,
        top: note.y,
        background: note.color,
        transform: `rotate(${note.rotation}deg)`,
        zIndex: isDragging ? 1000 : 10,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {/* Tape effect at top */}
      <div className={styles.stickyTape} />

      {/* Delete button */}
      <button
        className={styles.stickyDeleteBtn}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(note.id);
        }}
        aria-label="Delete note"
      >
        <X size={16} />
      </button>

      {/* Color cycle button */}
      <button
        className={styles.stickyColorBtn}
        onClick={handleColorCycle}
        aria-label="Change color"
      >
        <Palette size={14} />
      </button>

      {/* Edit indicator */}
      {!isEditing && (
        <button
          className={styles.stickyEditBtn}
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          aria-label="Edit note"
        >
          <Edit3 size={12} />
        </button>
      )}

      {/* Note content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className={styles.stickyTextarea}
          value={note.text}
          placeholder="Write here..."
          onChange={(e) => onUpdate(note.id, { text: e.target.value })}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <p className={styles.stickyText}>
          {note.text || "Double-click to edit..."}
        </p>
      )}
    </div>
  );
}
