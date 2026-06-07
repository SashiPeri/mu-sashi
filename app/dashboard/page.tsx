"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadSkills, createSkill } from "@/lib/skill-storage";
import type { Skill } from "@/types/skill";
import type { RepLogEntry } from "@/types/mastery";

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function getMonthGrid(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const startDay = start.getDay();
  const daysInMonth = end.getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(date.getFullYear(), date.getMonth(), d);
    cells.push(getDateKey(day));
  }
  return cells;
}

function DojoMonthCalendar({ logs }: { logs: RepLogEntry[] }) {
  const [current, setCurrent] = useState(new Date());

  const activeDays = useMemo(() => {
    return new Set(logs.map((l) => getDateKey(new Date(l.created_at))));
  }, [logs]);

  const grid = useMemo(() => getMonthGrid(current), [current]);

  const monthLabel = current.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((d) => addMonths(d, -1))}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ←
        </button>
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          {monthLabel}
        </h2>
        <button
          onClick={() => setCurrent((d) => addMonths(d, 1))}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 text-[9px] font-mono text-zinc-700 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, i) => {
          if (!day) return <div key={i} />;
          const active = activeDays.has(day);
          return (
            <div
              key={day}
              className="relative aspect-square bg-[#0F0F0F] border border-white/5"
              title={day}
            >
              {active && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-[70%] h-[70%] rounded-sm"
                    style={{ background: "rgba(153, 27, 27, 0.25)", filter: "blur(6px)" }}
                  />
                  <div
                    className="absolute w-[30%] h-[30%] rounded-sm"
                    style={{ background: "rgba(153, 27, 27, 0.5)" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-[9px] font-mono text-zinc-700">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-red-800 inline-block" />
          dojo day
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [logs, setLogs] = useState<RepLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newTargetGoal, setNewTargetGoal] = useState("10000");

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) { router.push("/"); return; }

      const { skills: userSkills } = await loadSkills();
      setSkills(userSkills);

      const { data: repLogs } = await supabase
        .from("rep_logs")
        .select("*")
        .eq("user_id", user.id)
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

  const displayName = data?.display_name ?? "Welcome";
  const username = data?.username ?? "user";

  const totalReps = skills.reduce((sum, s) => sum + s.currentIteration, 0);
  const streak = data?.streak ?? 0;
  const skillCount = skills.length;
  const maxAllowedSkills = 3 + skills.filter(s => s.currentIteration >= 6000).length;

  const todayLabel = new Date().toLocaleDateString("default", {
    weekday: "long", month: "long", day: "numeric",
  });

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">

        {/* PROFILE CARD */}
        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">

            {/* LEFT: avatar + name */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <span className="text-sm font-mono text-zinc-400">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">{displayName}</p>
                <p className="text-[11px] font-mono text-zinc-600 mt-0.5">@{username}</p>
              </div>
            </div>

            {/* CENTER: stats */}
            <div className="flex items-center gap-8 justify-center flex-1">
              <div className="text-center">
                <p className="text-lg font-mono text-zinc-100">{totalReps.toLocaleString()}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mt-0.5">Total Reps</p>
              </div>
              <div className="w-px h-7 bg-zinc-800" />
              <div className="text-center">
                <p className="text-lg font-mono text-zinc-100">{streak}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mt-0.5">Streak</p>
              </div>
              <div className="w-px h-7 bg-zinc-800" />
              <div className="text-center">
                <p className="text-lg font-mono text-zinc-100">{skillCount}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mt-0.5">Skills</p>
              </div>
            </div>

            {/* RIGHT: add skill */}
            <div className="flex justify-end flex-1">
              {skills.length < maxAllowedSkills && (
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="text-xs font-mono border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 px-4 py-2 rounded-lg transition-colors"
                >
                  {showForm ? "— cancel" : "+ add skill"}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* 2-COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">

          {/* SIDEBAR */}
          <aside className="space-y-6">

            <nav className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3 space-y-0.5">
              {[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Profile",   href: "/profile"   },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-xs font-mono text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 px-3 py-2 rounded-lg transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
              <DojoMonthCalendar logs={logs} />
            </div>

          </aside>

          {/* MAIN */}
          <section className="space-y-4">

            <div className="flex items-center justify-between">
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">Skills</h2>
              <p className="text-[10px] font-mono text-zinc-700">{todayLabel}</p>
            </div>

            {showForm && (
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-5 space-y-3">
                <input
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-700 outline-none focus:border-zinc-600 transition-colors"
                  placeholder="Skill name"
                />
                <input
                  type="number"
                  value={newTargetGoal}
                  onChange={(e) => setNewTargetGoal(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600 transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    className="flex-1 bg-red-900/80 hover:bg-red-900 text-white py-2 text-xs rounded-lg transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 border border-zinc-800 text-zinc-500 hover:text-zinc-300 py-2 text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {skills.map((skill) => {
                const pct = Math.round(
                  (skill.currentIteration / skill.targetGoal) * 100
                );

                return (
                  <Link key={skill.id} href={`/skills/${skill.id}`}>
                    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 hover:border-red-900 hover:-translate-y-0.5 transition-all duration-300 group">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-zinc-200 group-hover:text-white transition-colors">
                            {skill.name}
                          </p>
                          <p className="text-[11px] font-mono text-zinc-600">
                            {skill.currentIteration.toLocaleString()} / {skill.targetGoal.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs font-mono text-zinc-600 shrink-0">{pct}%</p>
                      </div>

                      <div className="mt-4 h-[1px] bg-white/10">
                        <div
                          className="h-full bg-red-900 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}

              {skills.length === 0 && (
                <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-12 text-center">
                  <p className="text-xs font-mono text-zinc-700">
                    No skills yet. Add your first skill to begin.
                  </p>
                </div>
              )}
            </div>

          </section>
        </div>

      </div>
    </main>
  );
}