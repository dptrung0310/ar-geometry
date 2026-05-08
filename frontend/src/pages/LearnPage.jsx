import { useState } from "react";
import LESSONS from "../data/lessons";
import LessonCard from "../components/ui/LessonCard";
import SectionHeader from "../components/ui/SectionHeader";

const TABS = [
  { id: "all", label: "Tất cả" },
  { id: "poly", label: "Đa diện" },
  { id: "round", label: "Hình tròn xoay" },
  { id: "formula", label: "Công thức" },
];

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filtered =
    activeTab === "all" ? LESSONS : LESSONS.filter((l) => l.cat === activeTab);

  return (
    <div style={styles.page}>
      <SectionHeader
        eyebrow="học hình học"
        title="Thư viện bài học"
        desc="Từ cơ bản đến nâng cao — học từng bước với minh họa 3D trực quan."
      />

      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              background:
                activeTab === tab.id ? "rgba(0,229,255,.1)" : "transparent",
              color: activeTab === tab.id ? "var(--cyan)" : "var(--text3)",
              borderColor:
                activeTab === tab.id ? "rgba(0,229,255,.4)" : "var(--border)",
            }}
          >
            {tab.label}
            <span
              style={{
                ...styles.tabCount,
                background:
                  activeTab === tab.id ? "rgba(0,229,255,.2)" : "var(--bg3)",
                color: activeTab === tab.id ? "var(--cyan)" : "var(--text3)",
              }}
            >
              {tab.id === "all"
                ? LESSONS.length
                : LESSONS.filter((l) => l.cat === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      <div style={styles.grid}>
        {filtered.map((lesson, i) => (
          <LessonCard key={i} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: "1400px", margin: "0 auto", padding: "40px 24px 60px" },
  tabs: { display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all .2s",
  },
  tabCount: {
    padding: "1px 7px",
    borderRadius: "20px",
    fontSize: "11px",
    fontFamily: "'Space Mono', monospace",
  },
  grid: { display: "flex", flexDirection: "column", gap: "10px" },
};
