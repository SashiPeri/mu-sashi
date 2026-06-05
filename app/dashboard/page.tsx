"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadSkills, createSkill } from "@/lib/skill-storage";
import type { Skill } from "@/types/skill";
import type { RepLogEntry } from "@/types/mastery";

/* -----------------------------
   HELPERS
------------------------------*/

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

/* -----------------------------
   CALENDAR (FINAL VERSION)
------------------------------*/

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
    <section className="space-y-3 pt-6 border-t border-white/10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((d) => addMonths(d, -1))}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300"
        >
          ←
        </button>

        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          {monthLabel}
        </h2>

        <button
          onClick={() => setCurrent((d) => addMonths(d, 1))}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300"
        >
          →
        </button>
      </div>

      {/* WEEK HEADER */}
      <div className="grid grid-cols-7 text-[10px] font-mono text-zinc-600">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-7 gap-1.5">
        {grid.map((day, i) => {
          if (!day) return <div key={i} />;

          const active = activeDays.has(day);

          return (
            <div
              key={day}
              className="
                relative aspect-square
                bg-[#0F0F0F]
                border border-white/5
              "
              title={day}
            >
              {active && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* ink bloom */}
                  <div
                    className="w-[70%] h-[70%] rounded-sm"
                    style={{
                      background: "rgba(153, 27, 27, 0.25)",
                      filter: "blur(6px)",
                    }}
                  />

                  {/* core stain */}
                  <div
                    className="absolute w-[30%] h-[30%] rounded-sm"
                    style={{
                      background: "rgba(153, 27, 27, 0.5)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LEGEND */}
      <div className="flex gap-4 text-[10px] font-mono text-zinc-600">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-red-800" />
          dojo day
        </span>
      </div>
    </section>
  );
}

/* -----------------------------
   DASHBOARD
------------------------------*/

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

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        router.push("/");
        return;
      }

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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 space-y-10">

        {/* HEADER */}
        <div className="space-y-1">
          <h1 className="text-2xl font-serif">{displayName}</h1>
          <p className="text-xs font-mono text-zinc-500">
            @{username}
          </p>
        </div>

        {/* SKILLS */}
        <section className="space-y-4 pt-6 border-t border-white/10">

          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Skills
            </h2>

            <button
              onClick={() => setShowForm(true)}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300"
            >
              + add skill
            </button>
          </div>

          {/* FORM */}
          {showForm && (
            <div className="border border-white/10 p-4 space-y-3">
              <input
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="w-full bg-black border border-white/10 px-3 py-2 text-sm"
                placeholder="Skill name"
              />

              <input
                type="number"
                value={newTargetGoal}
                onChange={(e) => setNewTargetGoal(e.target.value)}
                className="w-full bg-black border border-white/10 px-3 py-2 text-sm"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 bg-red-900 text-white py-2 text-sm"
                >
                  Create
                </button>

                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-white/10 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* SKILL LIST */}
          <div className="space-y-3">
            {skills.map((skill) => {
              const pct = Math.round(
                (skill.currentIteration / skill.targetGoal) * 100
              );

              return (
                <Link key={skill.id} href={`/skills/${skill.id}`}>
                  <div className="border border-white/10 p-4 hover:border-white/30 transition">
                    <div className="flex justify-between">
                      <p className="text-sm">{skill.name}</p>
                      <p className="text-xs font-mono text-zinc-500">
                        {pct}%
                      </p>
                    </div>

                    <div className="mt-2 h-[1px] bg-white/10">
                      <div
                        className="h-full bg-red-900"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <p className="mt-2 text-[11px] font-mono text-zinc-500">
                      {skill.currentIteration} / {skill.targetGoal}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* CALENDAR (BOTTOM - CORRECT HIERARCHY) */}
        <DojoMonthCalendar logs={logs} />

      </div>
    </main>
  );
}