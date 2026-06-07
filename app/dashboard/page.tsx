"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadSkills, createSkill } from "@/lib/skill-storage";
import type { Skill } from "@/types/skill";
import type { RepLogEntry } from "@/types/mastery";

function getDateKey(date: Date) {
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day   = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, delta: number) { return new Date(d.getFullYear(), d.getMonth() + delta, 1); }
function getMonthGrid(date: Date) {
  const start = startOfMonth(date);
  const end   = endOfMonth(date);
  const cells: (string | null)[] = [];
  for (let i = 0; i < start.getDay(); i++) cells.push(null);
  for (let d = 1; d <= end.getDate(); d++)
    cells.push(getDateKey(new Date(date.getFullYear(), date.getMonth(), d)));
  return cells;
}

function DojoMonthCalendar({ logs }: { logs: RepLogEntry[] }) {
  const [current, setCurrent] = useState(new Date());

  const activeDays = useMemo(
    () => new Set(logs.map((l) => getDateKey(new Date(l.created_at)))),
    [logs]
  );
  const grid       = useMemo(() => getMonthGrid(current), [current]);
  const monthLabel = current.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-0.5">
        <button
          onClick={() => setCurrent((d) => addMonths(d, -1))}
          className="text-zinc-700 hover:text-zinc-400 transition-colors text-xs leading-none pb-0.5"
          aria-label="Previous month"
        >←</button>
        <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-light">
          {monthLabel}
        </span>
        <button
          onClick={() => setCurrent((d) => addMonths(d, 1))}
          className="text-zinc-700 hover:text-zinc-400 transition-colors text-xs leading-none pb-0.5"
          aria-label="Next month"
        >→</button>
      </div>

      <div className="grid grid-cols-7">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d, i) => (
          <div key={i} className="text-center text-[8px] text-zinc-800 font-mono">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {grid.map((day, i) => {
          if (!day) return <div key={i} />;
          const active = activeDays.has(day);
          return (
            <div
              key={day}
              title={day}
              className={`aspect-square relative ${
                active
                  ? "bg-red-950/40 border border-red-900/30"
                  : "bg-zinc-950 border border-zinc-900/60"
              }`}
            >
              {active && (
                <div className="absolute inset-[3px] bg-red-900/50" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <div className="w-2 h-2 bg-red-900/50 border border-red-900/30" />
        <span className="text-[8px] uppercase tracking-[0.25em] text-zinc-800 font-mono">Dojo day</span>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-700 font-mono">{label}</span>
      <span className="text-xl font-light text-zinc-200 tabular-nums">{value}</span>
    </div>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  const pct = skill.targetGoal > 0
    ? Math.min(100, Math.round((skill.currentIteration / skill.targetGoal) * 100))
    : 0;

  return (
    <Link href={`/skills/${skill.id}`} className="block group">
      <div
        className="relative overflow-hidden border border-zinc-900 bg-zinc-950 p-6 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:border-red-950 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        style={{ borderRadius: "16px" }}
      >
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <p className="text-sm font-light text-zinc-300 group-hover:text-zinc-100 transition-colors duration-300 leading-snug">
            {skill.name}
          </p>
          <span className="text-xs font-mono text-zinc-700 shrink-0 tabular-nums">{pct}%</span>
        </div>

        <div className="h-[1px] w-full bg-zinc-900 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-red-900 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-700 tabular-nums">
            {skill.currentIteration.toLocaleString()}
            <span className="text-zinc-800 mx-1.5">/</span>
            {skill.targetGoal.toLocaleString()}
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-800 font-mono">reps</span>
        </div>

        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "linear-gradient(135deg, rgba(127,29,29,0.04) 0%, transparent 60%)",
            borderRadius: "16px",
          }}
        />
      </div>
    </Link>
  );
}

function EmptySkills({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="border border-zinc-900 border-dashed p-16 text-center space-y-6"
      style={{ borderRadius: "16px" }}
    >
      <div className="space-y-2">
        <p className="text-xs font-light text-zinc-600 tracking-wide">No skills forged yet.</p>
        <p className="text-[10px] font-mono text-zinc-800">
          The journey of ten thousand reps begins with one.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="text-[10px] uppercase tracking-[0.25em] font-mono text-zinc-700 hover:text-zinc-400 border border-zinc-800 hover:border-zinc-600 px-5 py-2.5 transition-all duration-200"
        style={{ borderRadius: "8px" }}
      >
        Begin a skill
      </button>
    </div>
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
    <div className="border border-zinc-800/80 bg-zinc-950 p-6 space-y-4" style={{ borderRadius: "16px" }}>
      <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-700 font-mono">New skill</p>
      <div className="space-y-3">
        <input
          value={newSkillName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Name your practice"
          className="w-full bg-black border border-zinc-900 px-4 py-3 text-sm font-light text-zinc-300 placeholder:text-zinc-800 outline-none focus:border-zinc-700 transition-colors duration-200"
          style={{ borderRadius: "10px" }}
          autoFocus
        />
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={newTargetGoal}
            onChange={(e) => onGoalChange(e.target.value)}
            className="flex-1 bg-black border border-zinc-900 px-4 py-3 text-sm font-mono text-zinc-300 outline-none focus:border-zinc-700 transition-colors duration-200"
            style={{ borderRadius: "10px" }}
          />
          <span className="text-[10px] uppercase tracking-widest text-zinc-800 font-mono shrink-0">target reps</span>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSubmit}
          className="flex-1 bg-red-950 hover:bg-red-900 text-red-200 hover:text-white py-2.5 text-[10px] uppercase tracking-[0.2em] font-mono border border-red-900/40 transition-all duration-200"
          style={{ borderRadius: "8px" }}
        >
          Forge skill
        </button>
        <button
          onClick={onCancel}
          className="flex-1 border border-zinc-900 text-zinc-700 hover:text-zinc-400 hover:border-zinc-700 py-2.5 text-[10px] uppercase tracking-[0.2em] font-mono transition-all duration-200"
          style={{ borderRadius: "8px" }}
        >
          Dismiss
        </button>
      </div>
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
      setSkills(userSkills);

      const { data: repLogs } = await supabase
        .from("rep_logs").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false });

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
  const todayLabel       = new Date().toLocaleDateString("default", {
    weekday: "long", month: "long", day: "numeric",
  });

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex items-center gap-3">
          <div className="w-px h-6 bg-red-900 animate-pulse" />
          <span className="text-[9px] uppercase tracking-[0.4em] text-zinc-700 font-mono">
            Entering the dojo
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-zinc-900">
          <div className="flex items-center gap-5">
            <div
              className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0"
              style={{ borderRadius: "50%" }}
            >
              <span className="text-xs font-mono text-zinc-500">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-base font-light text-zinc-200 tracking-wide">{displayName}</h1>
              <p className="text-[10px] font-mono text-zinc-700">@{username}</p>
            </div>
          </div>

          <div className="flex items-end gap-10">
            <StatCell label="Total Reps" value={totalReps.toLocaleString()} />
            <div className="w-px h-8 bg-zinc-900 self-center" />
            <StatCell label="Streak"     value={streak} />
            <div className="w-px h-8 bg-zinc-900 self-center" />
            <StatCell label="Skills"     value={skillCount} />
          </div>
        </header>

        {/* BODY */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10 items-start">

          {/* SIDEBAR */}
          <aside className="space-y-8">
            <nav className="space-y-0.5">
              {[
                { label: "Practice", href: "/dashboard" },
                { label: "Profile",  href: "/profile"   },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-[0.25em] font-mono text-zinc-700 hover:text-zinc-300 hover:bg-zinc-950 transition-all duration-150 group"
                  style={{ borderRadius: "8px" }}
                >
                  <span className="w-[2px] h-3 bg-transparent group-hover:bg-red-900 transition-colors duration-150 shrink-0" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="w-full h-px bg-zinc-900" />
            <DojoMonthCalendar logs={logs} />
          </aside>

          {/* MAIN */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[2px] h-4 bg-red-900" />
                <span className="text-[9px] uppercase tracking-[0.35em] text-zinc-600 font-mono">
                  Active skills
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-mono text-zinc-800">{todayLabel}</span>
                {skills.length < maxAllowedSkills && (
                  <button
                    onClick={() => setShowForm((v) => !v)}
                    className="text-[9px] uppercase tracking-[0.25em] font-mono text-zinc-700 hover:text-zinc-400 border border-zinc-900 hover:border-zinc-700 px-3 py-1.5 transition-all duration-200"
                    style={{ borderRadius: "6px" }}
                  >
                    {showForm ? "— cancel" : "+ new skill"}
                  </button>
                )}
              </div>
            </div>

            {showForm && (
              <AddSkillForm
                newSkillName={newSkillName}
                newTargetGoal={newTargetGoal}
                onNameChange={setNewSkillName}
                onGoalChange={setNewTargetGoal}
                onSubmit={handleCreate}
                onCancel={() => { setShowForm(false); setNewSkillName(""); setNewTargetGoal("10000"); }}
              />
            )}

            {skills.length === 0 && !showForm
              ? <EmptySkills onAdd={() => setShowForm(true)} />
              : (
                <div className="space-y-3">
                  {skills.map((skill) => <SkillCard key={skill.id} skill={skill} />)}
                </div>
              )
            }
          </section>
        </div>

      </div>
    </main>
  );
}