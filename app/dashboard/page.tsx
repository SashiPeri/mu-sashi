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
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function getMonthGrid(date: Date): (string | null)[] {
  const start = startOfMonth(date);
  const end   = endOfMonth(date);
  const cells: (string | null)[] = Array(start.getDay()).fill(null);
  for (let d = 1; d <= end.getDate(); d++)
    cells.push(getDateKey(new Date(date.getFullYear(), date.getMonth(), d)));
  return cells;
}

function DojoCalendar({ logs }: { logs: RepLogEntry[] }) {
  const [current, setCurrent] = useState(new Date());
  const activeDays = useMemo(
    () => new Set(logs.map((l) => getDateKey(new Date(l.created_at)))),
    [logs]
  );
  const grid  = useMemo(() => getMonthGrid(current), [current]);
  const label = current.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((d) => addMonths(d, -1))}
          aria-label="Previous month"
          className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors duration-150"
        >‹</button>
        <span className="text-[10px] text-zinc-500 tracking-widest uppercase font-mono">{label}</span>
        <button
          onClick={() => setCurrent((d) => addMonths(d, 1))}
          aria-label="Next month"
          className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors duration-150"
        >›</button>
      </div>

      <div className="grid grid-cols-7">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="text-center text-[9px] text-zinc-800 font-mono">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[2px]">
        {grid.map((day, i) => {
          if (!day) return <div key={i} />;
          const active = activeDays.has(day);
          return (
            <div
              key={day}
              title={day}
              className={[
                "aspect-square",
                active
                  ? "bg-red-950 border border-red-900/50"
                  : "bg-zinc-950 border border-zinc-900",
              ].join(" ")}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <div className="w-2 h-2 bg-red-950 border border-red-900/50" />
        <span className="text-[9px] text-zinc-700 font-mono uppercase tracking-widest">Dojo day</span>
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
      <article className="border border-zinc-900 bg-zinc-950 rounded-2xl p-6 transition-all duration-200 ease-out hover:-translate-y-[2px] hover:border-zinc-700 hover:shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <p className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors duration-200">
            {skill.name}
          </p>
          <span className="text-[11px] font-mono text-zinc-600 shrink-0 tabular-nums">{pct}%</span>
        </div>

        <div className="h-[1px] bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-red-900 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-700 tabular-nums">
            {skill.currentIteration.toLocaleString()}
            <span className="text-zinc-800 mx-1">/</span>
            {skill.targetGoal.toLocaleString()}
          </span>
          <span className="text-[9px] text-zinc-800 font-mono uppercase tracking-widest">reps</span>
        </div>
      </article>
    </Link>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border border-dashed border-zinc-900 rounded-2xl p-16 text-center space-y-5">
      <p className="text-sm text-zinc-600">No skills recorded.</p>
      <p className="text-[11px] text-zinc-800 font-mono max-w-[28ch] mx-auto leading-relaxed">
        Ten thousand reps begins with naming what you intend to master.
      </p>
      <button
        onClick={onAdd}
        className="text-[11px] font-mono text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-5 py-2 rounded-lg transition-all duration-150"
      >
        Add first skill
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
    <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 space-y-4">
      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">New skill</p>
      <div className="space-y-2">
        <input
          value={newSkillName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Name your practice"
          className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-700 outline-none focus:border-zinc-600 transition-colors duration-150"
          autoFocus
        />
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={newTargetGoal}
            onChange={(e) => onGoalChange(e.target.value)}
            className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm font-mono text-zinc-200 outline-none focus:border-zinc-600 transition-colors duration-150"
          />
          <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest shrink-0">target reps</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          className="flex-1 bg-red-950 hover:bg-red-900 text-red-300 hover:text-red-100 border border-red-900/50 py-2.5 text-[11px] font-mono uppercase tracking-widest rounded-lg transition-all duration-150"
        >
          Create skill
        </button>
        <button
          onClick={onCancel}
          className="flex-1 border border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700 py-2.5 text-[11px] font-mono uppercase tracking-widest rounded-lg transition-all duration-150"
        >
          Cancel
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
  const todayLabel       = new Date().toLocaleDateString("default", {
    weekday: "long", month: "long", day: "numeric",
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-48 h-[1px] bg-zinc-900 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-12 bg-zinc-700 animate-[shimmer_1.2s_ease-in-out_infinite]" />
        </div>
        <style>{`@keyframes shimmer { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }`}</style>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-[1280px] mx-auto px-8 py-10">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-10 mb-10 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <span className="text-xs font-mono text-zinc-500">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-zinc-200">{displayName}</p>
              <p className="text-[10px] font-mono text-zinc-700 mt-0.5">@{username}</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {[
              { label: "Total reps", value: totalReps.toLocaleString() },
              { label: "Streak",     value: streak },
              { label: "Skills",     value: skillCount },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className="flex items-center gap-8">
                <div className="text-right sm:text-left">
                  <p className="text-lg font-mono text-zinc-200 tabular-nums leading-none">{value}</p>
                  <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mt-1">{label}</p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-7 bg-zinc-900" />}
              </div>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-12 items-start">

          <aside className="space-y-8">
            <nav className="space-y-0.5">
              {[
                { label: "Practice", href: "/dashboard" },
                { label: "Profile",  href: "/profile"   },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block px-3 py-2 rounded-lg text-[11px] font-mono text-zinc-600 hover:text-zinc-200 hover:bg-zinc-950 transition-all duration-150"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="h-px bg-zinc-900" />
            <DojoCalendar logs={logs} />
          </aside>

          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Skills</p>
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-mono text-zinc-800">{todayLabel}</p>
                {skills.length < maxAllowedSkills && (
                  <button
                    onClick={() => setShowForm((v) => !v)}
                    className="text-[10px] font-mono text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-md transition-all duration-150"
                  >
                    {showForm ? "Cancel" : "+ New skill"}
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
                onCancel={() => {
                  setShowForm(false);
                  setNewSkillName("");
                  setNewTargetGoal("10000");
                }}
              />
            )}

            {skills.length === 0 && !showForm
              ? <EmptyState onAdd={() => setShowForm(true)} />
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