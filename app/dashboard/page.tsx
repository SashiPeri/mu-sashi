"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadSkills, createSkill } from "@/lib/skill-storage";
import type { Skill } from "@/types/skill";
import type { RepLogEntry } from "@/types/mastery";

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function MasteryRing({ pct }: { pct: number }) {
  const r    = 72;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
      <svg
        viewBox="0 0 160 160"
        className="w-full h-full -rotate-90"
        aria-label={`${pct}% mastery`}
      >
        <circle cx="80" cy="80" r={r} fill="none" stroke="#1c1c1c" strokeWidth="1.5" />
        <circle
          cx="80" cy="80" r={r}
          fill="none" stroke="#6b6b6b" strokeWidth="1.5"
          strokeLinecap="butt"
          strokeDasharray={`${fill} ${circ}`}
          style={{ transition: "stroke-dasharray 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-mono text-zinc-200 tabular-nums leading-none">{pct}</span>
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] mt-1.5">Mastery</span>
      </div>
    </div>
  );
}

function ActivityHeatmap({ logs }: { logs: RepLogEntry[] }) {
  const repsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of logs) {
      const key = getDateKey(new Date(log.created_at));
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [logs]);

  const { weeks, colLabels } = useMemo(() => {
    const today    = new Date();
    const todayK   = getDateKey(today);
    const dayOfWeek = today.getDay();
    const daysToSat = (6 - dayOfWeek + 7) % 7;
    const lastSat   = new Date(today);
    lastSat.setDate(today.getDate() + daysToSat);

    const weeksArr: ({ key: string; isToday: boolean } | null)[][] = [];
    const colLbls: string[] = [];

    for (let w = 15; w >= 0; w--) {
      const week: ({ key: string; isToday: boolean } | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(lastSat);
        date.setDate(lastSat.getDate() - (w * 7 + (6 - d)));
        const key = getDateKey(date);
        week.push(date > today ? null : { key, isToday: key === todayK });
      }
      weeksArr.push(week);
      colLbls.push(String(16 - w));
    }

    return { weeks: weeksArr, colLabels: colLbls };
  }, []);

  const maxReps = useMemo(() => {
    const vals = Object.values(repsByDay);
    return vals.length ? Math.max(...vals) : 1;
  }, [repsByDay]);

  function intensityClass(key: string): string {
    const count = repsByDay[key] ?? 0;
    if (count === 0) return "bg-[#111] border border-[#1a1a1a]";
    const ratio = count / maxReps;
    if (ratio < 0.2)  return "bg-zinc-800";
    if (ratio < 0.4)  return "bg-zinc-700";
    if (ratio < 0.65) return "bg-zinc-600";
    if (ratio < 0.85) return "bg-zinc-500";
    return "bg-zinc-300";
  }

  const rowLabels = ["M", "", "W", "", "F", "", "S"];

  return (
    <div className="space-y-3">
      <div className="flex ml-5">
        {colLabels.map((l, i) => (
          <div key={i} className="flex-1 text-center text-[8px] font-mono text-zinc-700">{l}</div>
        ))}
      </div>

      <div className="flex gap-[2px]">
        <div className="flex flex-col gap-[2px] mr-1.5">
          {rowLabels.map((l, i) => (
            <div key={i} className="h-3.5 flex items-center">
              <span className="text-[8px] font-mono text-zinc-700 w-3">{l}</span>
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px] flex-1">
            {week.map((cell, di) => (
              <div
                key={di}
                title={cell ? `${cell.key}: ${repsByDay[cell.key] ?? 0} reps` : undefined}
                className={["h-3.5 w-full", cell ? intensityClass(cell.key) : "bg-transparent"].join(" ")}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-5 mt-1">
        <span className="text-[8px] font-mono text-zinc-700">less</span>
        {["bg-[#111] border border-[#1a1a1a]", "bg-zinc-800", "bg-zinc-700", "bg-zinc-600", "bg-zinc-300"].map((cls, i) => (
          <div key={i} className={`w-3 h-3 ${cls}`} />
        ))}
        <span className="text-[8px] font-mono text-zinc-700">more</span>
      </div>
    </div>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  const pct = skill.targetGoal > 0
    ? Math.min(100, Math.round((skill.currentIteration / skill.targetGoal) * 100))
    : 0;

  return (
    <Link href={`/skills/${skill.id}`} className="block group">
      <article className="border-r border-zinc-800/60 pr-8 last:border-r-0 last:pr-0 transition-all duration-150">
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <p className="text-lg text-zinc-200 group-hover:text-white transition-colors duration-150 leading-tight">
            {skill.name}
          </p>
          <span className="text-2xl font-mono text-zinc-300 tabular-nums shrink-0">{pct}</span>
        </div>

        <div className="h-[1px] bg-zinc-800 overflow-hidden mb-3">
          <div
            className="h-full bg-zinc-500 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-[11px] font-mono text-zinc-600 tabular-nums">
          {skill.currentIteration.toLocaleString()} / {skill.targetGoal.toLocaleString()}
        </p>
      </article>
    </Link>
  );
}

function AddSkillForm({
  newSkillName, newTargetGoal, onNameChange, onGoalChange, onSubmit, onCancel,
}: {
  newSkillName: string; newTargetGoal: string;
  onNameChange: (v: string) => void; onGoalChange: (v: string) => void;
  onSubmit: () => void; onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      <input
        value={newSkillName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Skill name"
        className="w-full bg-transparent border-b border-zinc-800 focus:border-zinc-600 px-0 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-700 outline-none transition-colors duration-150"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={newTargetGoal}
          onChange={(e) => onGoalChange(e.target.value)}
          className="flex-1 bg-transparent border-b border-zinc-800 focus:border-zinc-600 px-0 py-1.5 text-sm font-mono text-zinc-200 outline-none transition-colors duration-150"
        />
        <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest shrink-0">reps</span>
      </div>
      <div className="flex gap-3 pt-1">
        <button
          onClick={onSubmit}
          className="text-[10px] font-mono text-red-700 hover:text-red-400 uppercase tracking-widest transition-colors duration-150"
        >
          Create
        </button>
        <button
          onClick={onCancel}
          className="text-[10px] font-mono text-zinc-700 hover:text-zinc-400 uppercase tracking-widest transition-colors duration-150"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EmptySkills({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-zinc-700 mb-4">No skills yet.</p>
      <button
        onClick={onAdd}
        className="text-[10px] font-mono text-zinc-600 hover:text-zinc-300 uppercase tracking-widest transition-colors duration-150"
      >
        + Add skill
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [data,          setData]          = useState<any>(null);
  const [skills,        setSkills]        = useState<Skill[]>([]);
  const [logs,          setLogs]          = useState<RepLogEntry[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [newSkillName,  setNewSkillName]  = useState("");
  const [newTargetGoal, setNewTargetGoal] = useState("10000");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!profile) { router.push("/"); return; }

      const { skills: userSkills } = await loadSkills();
      const { data: repLogs }      = await supabase
        .from("rep_logs").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setSkills(userSkills);
      setLogs(repLogs ?? []);
      setData(profile);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleCreate = async () => {
    const { skill, error } = await createSkill({
      name: newSkillName,
      targetGoal: Number(newTargetGoal),
    });
    if (error || !skill) return alert(error);
    const { skills: freshSkills } = await loadSkills();
    setSkills(freshSkills);
    setNewSkillName("");
    setNewTargetGoal("10000");
    setShowForm(false);
  };

  const displayName      = data?.display_name ?? "Practitioner";
  const username         = data?.username     ?? "user";
  const totalReps        = skills.reduce((sum, s) => sum + s.currentIteration, 0);
  const streak           = data?.streak       ?? 0;
  const skillCount       = skills.length;
  const maxAllowedSkills = 3 + skills.filter(s => s.currentIteration >= 6000).length;

  const masteryPct = useMemo(() => {
    if (!skills.length) return 0;
    const avg = skills.reduce((sum, s) => {
      return sum + (s.targetGoal > 0 ? Math.min(100, (s.currentIteration / s.targetGoal) * 100) : 0);
    }, 0) / skills.length;
    return Math.round(avg);
  }, [skills]);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-48 h-[1px] bg-zinc-900 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-12 bg-zinc-800 animate-[shimmer_1.2s_ease-in-out_infinite]" />
        </div>
        <style>{`@keyframes shimmer { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }`}</style>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex">

      {/* SIDEBAR */}
      <aside className="w-[330px] shrink-0 min-h-screen bg-[#0a0a0a] border-r border-zinc-900 flex flex-col px-8 py-10">

        <div className="mb-8">
          <h1 className="text-2xl text-zinc-100 leading-tight">{displayName}</h1>
          <p className="text-[11px] font-mono text-zinc-600 mt-1">@{username}</p>
        </div>

        <div className="mb-10">
          <MasteryRing pct={masteryPct} />
        </div>

        <div className="space-y-6 mb-auto">
          <div className="border-t border-zinc-900 pt-6">
            <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">Total Reps</p>
            <p className="text-3xl font-mono text-zinc-200 tabular-nums">{totalReps.toLocaleString()}</p>
          </div>
          <div className="border-t border-zinc-900 pt-6">
            <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">Day Streak</p>
            <p className="text-3xl font-mono text-zinc-200 tabular-nums">{streak}</p>
          </div>
          <div className="border-t border-zinc-900 pt-6">
            <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">Skills</p>
            <p className="text-3xl font-mono text-zinc-200 tabular-nums">{skillCount} / {maxAllowedSkills}</p>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-6 mt-8">
          {showForm ? (
            <AddSkillForm
              newSkillName={newSkillName}
              newTargetGoal={newTargetGoal}
              onNameChange={setNewSkillName}
              onGoalChange={setNewTargetGoal}
              onSubmit={handleCreate}
              onCancel={() => { setShowForm(false); setNewSkillName(""); setNewTargetGoal("10000"); }}
            />
          ) : (
            skills.length < maxAllowedSkills && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 text-[10px] font-mono text-red-700 hover:text-red-400 uppercase tracking-widest transition-colors duration-150"
              >
                <span className="text-base leading-none">+</span>
                <span>Add skill</span>
              </button>
            )
          )}
        </div>

      </aside>

      {/* CONTENT */}
      <div className="flex-1 min-h-screen flex flex-col px-10 py-10 overflow-auto">

        <div className="flex items-start justify-between mb-10">
          <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Dashboard</p>
          <p className="text-[11px] font-mono text-zinc-600">{todayLabel}</p>
        </div>

        <section className="mb-14">
          <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-6">Skills</p>
          {skills.length === 0 ? (
            <EmptySkills onAdd={() => setShowForm(true)} />
          ) : (
            <div className={`grid gap-0 ${
              skills.length === 1 ? "grid-cols-1" :
              skills.length === 2 ? "grid-cols-2" :
              "grid-cols-3"
            }`}>
              {skills.map((skill) => <SkillCard key={skill.id} skill={skill} />)}
            </div>
          )}
        </section>

        <section>
          <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-6">
            Activity — 16 weeks
          </p>
          <ActivityHeatmap logs={logs} />
        </section>

      </div>

    </main>
  );
}