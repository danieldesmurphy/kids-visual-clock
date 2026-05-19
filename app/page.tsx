import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Clock } from "lucide-react";

const COLORS = [
  "#93c5fd", // blue
  "#86efac", // green
  "#fca5a5", // red
  "#fde68a", // yellow
  "#c4b5fd", // purple
  "#fdba74", // orange
  "#67e8f9", // cyan
  "#f0abfc", // pink
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function makeDefaultSchedule() {
  return [
    { id: crypto.randomUUID(), label: "Bedtime", start: "20:30", end: "07:00", color: COLORS[3] },
    { id: crypto.randomUUID(), label: "Breakfast", start: "07:00", end: "07:45", color: COLORS[5] },
    { id: crypto.randomUUID(), label: "School", start: "08:00", end: "15:00", color: COLORS[0] },
    { id: crypto.randomUUID(), label: "Free time", start: "15:00", end: "17:30", color: COLORS[1] },
    { id: crypto.randomUUID(), label: "Reading", start: "19:00", end: "19:30", color: COLORS[4] },
    { id: crypto.randomUUID(), label: "TV", start: "19:30", end: "20:00", color: COLORS[6] },
  ];
}

function makeWeeklySchedules() {
  return Object.fromEntries(DAYS.map((day) => [day, makeDefaultSchedule()]));
}

const DEFAULT_KIDS = [
  { id: crypto.randomUUID(), name: "Kid 1", schedules: makeWeeklySchedules() },
  { id: crypto.randomUUID(), name: "Kid 2", schedules: makeWeeklySchedules() },
];

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(total) {
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatHourLabel(hour) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function polarToCartesian(cx, cy, r, angleDegrees) {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRadians),
    y: cy + r * Math.sin(angleRadians),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    cx,
    cy,
    "L",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
}

function scheduleToSegments(schedule) {
  const segments = [];

  schedule.forEach((item) => {
    const start = timeToMinutes(item.start);
    const end = timeToMinutes(item.end);

    if (start === end) return;

    if (end > start) {
      segments.push({ ...item, startMinutes: start, endMinutes: end });
    } else {
      segments.push({ ...item, startMinutes: start, endMinutes: 1440 });
      segments.push({ ...item, startMinutes: 0, endMinutes: end });
    }
  });

  return segments.sort((a, b) => a.startMinutes - b.startMinutes);
}

function getCurrentActivity(schedule, now) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const segments = scheduleToSegments(schedule);

  return segments.find(
    (item) => currentMinutes >= item.startMinutes && currentMinutes < item.endMinutes
  );
}

function getNextActivity(schedule, now) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const segments = scheduleToSegments(schedule);
  const upcoming = segments.find((item) => item.startMinutes > currentMinutes);

  return upcoming || segments[0];
}

function KidClockCard({ kid, now, selectedDay }) {
  const activeSchedule = kid.schedules[selectedDay] || [];
  const segments = useMemo(() => scheduleToSegments(activeSchedule), [activeSchedule]);
  const currentActivity = getCurrentActivity(activeSchedule, now);
  const nextActivity = getNextActivity(activeSchedule, now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const handAngle = (currentMinutes / 1440) * 360;

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black">{kid.name}</h2>
            <p className="text-sm text-slate-500">{selectedDay} schedule</p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
            <div className="text-xs text-slate-500">Now</div>
            <div className="font-mono text-lg font-bold">{formatTime(now)}</div>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[500px]">
          <svg viewBox="0 0 540 460" className="h-full w-full drop-shadow-sm">
            <circle cx="270" cy="230" r="190" fill="white" />

            {segments.map((item, index) => {
              const startAngle = (item.startMinutes / 1440) * 360;
              const endAngle = (item.endMinutes / 1440) * 360;
              const midAngle = (startAngle + endAngle) / 2;
              const labelPoint = polarToCartesian(270, 230, 135, midAngle);

              return (
                <g key={`${item.id}-${index}`}>
                  <path
                    d={describeArc(270, 230, 180, startAngle, endAngle)}
                    fill={item.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="16"
                    fontWeight="900"
                    fontFamily="Comic Sans MS, Chalkboard SE, Marker Felt, cursive"
                    letterSpacing="0.3"
                    fill="#0f172a"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}

            <circle cx="270" cy="230" r="88" fill="white" />
            <circle cx="270" cy="230" r="181" fill="none" stroke="#0f172a" strokeWidth="2" />
            <circle cx="270" cy="230" r="88" fill="none" stroke="#cbd5e1" strokeWidth="2" />

            {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => {
              const angle = (hour / 24) * 360;
              const point = polarToCartesian(270, 230, 235, angle);

              return (
                <text
                  key={hour}
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="13"
                  fontWeight="700"
                  fontFamily="monospace"
                  letterSpacing="0.5"
                  fill="#0f172a"
                >
                  {formatHourLabel(hour)}
                </text>
              );
            })}

            <line
              x1="270"
              y1="230"
              x2={polarToCartesian(270, 230, 170, handAngle).x}
              y2={polarToCartesian(270, 230, 170, handAngle).y}
              stroke="#0f172a"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="270" cy="230" r="8" fill="#0f172a" />
          </svg>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-slate-500">
              <Clock size={16} />
              <span className="text-xs">Right now</span>
            </div>
            <div className="text-3xl font-black leading-tight">
              {currentActivity?.label || "Unscheduled"}
            </div>
            {currentActivity ? (
              <p className="mt-1 text-sm text-slate-600">
                {minutesToTime(currentActivity.startMinutes)}–{minutesToTime(currentActivity.endMinutes)}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-600">No task is assigned.</p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">Coming up next</div>
            <div className="mt-1 text-2xl font-bold">{nextActivity?.label || "Nothing scheduled"}</div>
            {nextActivity && (
              <p className="mt-1 text-sm text-slate-600">
                Starts at {minutesToTime(nextActivity.startMinutes)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function KidsVisualScheduleClock() {
  const [now, setNow] = useState(new Date());
  const [kids, setKids] = useState(DEFAULT_KIDS);
  const [selectedKidId, setSelectedKidId] = useState(DEFAULT_KIDS[0].id);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay()]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedKid = kids.find((kid) => kid.id === selectedKidId) || kids[0];
  const selectedSchedule = selectedKid.schedules[selectedDay] || [];

  function updateKidName(id, name) {
    setKids((currentKids) =>
      currentKids.map((kid) => (kid.id === id ? { ...kid, name } : kid))
    );
  }

  function updateItem(itemId, key, value) {
    setKids((currentKids) =>
      currentKids.map((kid) => {
        if (kid.id !== selectedKid.id) return kid;

        return {
          ...kid,
          schedules: {
            ...kid.schedules,
            [selectedDay]: kid.schedules[selectedDay].map((item) =>
              item.id === itemId ? { ...item, [key]: value } : item
            ),
          },
        };
      })
    );
  }

  function addItem() {
    setKids((currentKids) =>
      currentKids.map((kid) => {
        if (kid.id !== selectedKid.id) return kid;

        return {
          ...kid,
          schedules: {
            ...kid.schedules,
            [selectedDay]: [
              ...kid.schedules[selectedDay],
              {
                id: crypto.randomUUID(),
                label: "New activity",
                start: "16:00",
                end: "17:00",
                color: COLORS[kid.schedules[selectedDay].length % COLORS.length],
              },
            ],
          },
        };
      })
    );
  }

  function removeItem(itemId) {
    setKids((currentKids) =>
      currentKids.map((kid) => {
        if (kid.id !== selectedKid.id) return kid;

        return {
          ...kid,
          schedules: {
            ...kid.schedules,
            [selectedDay]: kid.schedules[selectedDay].filter((item) => item.id !== itemId),
          },
        };
      })
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-black">Kids Visual Schedule Clock</h1>
          <p className="mt-1 text-slate-500">
            Two separate kid displays with schedules that can change by day of the week.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {kids.map((kid) => (
            <KidClockCard key={kid.id} kid={kid} now={now} selectedDay={selectedDay} />
          ))}
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex flex-wrap gap-2 pb-4">
              {DAYS.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "outline"}
                  onClick={() => setSelectedDay(day)}
                  className="rounded-xl"
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Edit {selectedDay} Schedule</h2>
                <p className="text-sm text-slate-500">Choose which kid you want to edit.</p>
              </div>

              <div className="flex gap-2">
                {kids.map((kid) => (
                  <Button
                    key={kid.id}
                    variant={selectedKid.id === kid.id ? "default" : "outline"}
                    onClick={() => setSelectedKidId(kid.id)}
                    className="rounded-xl"
                  >
                    {kid.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-4 max-w-sm">
              <Label className="text-xs text-slate-500">Kid name</Label>
              <Input
                value={selectedKid.name}
                onChange={(event) => updateKidName(selectedKid.id, event.target.value)}
                className="rounded-xl text-lg font-bold"
              />
            </div>

            <div className="mb-4 flex justify-end">
              <Button onClick={addItem} className="rounded-xl">
                <Plus className="mr-1 h-4 w-4" /> Add activity
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {selectedSchedule.map((item) => (
                <div key={item.id} className="rounded-2xl border bg-white p-3 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      aria-label="Color"
                      type="color"
                      value={item.color}
                      onChange={(event) => updateItem(item.id, "color", event.target.value)}
                      className="h-10 w-12 cursor-pointer rounded border bg-white"
                    />
                    <div className="flex-1">
                      <Label className="sr-only">Activity name</Label>
                      <Input
                        value={item.label}
                        onChange={(event) => updateItem(item.id, "label", event.target.value)}
                        className="rounded-xl font-semibold"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="rounded-xl text-slate-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500">Start</Label>
                      <Input
                        type="time"
                        value={item.start}
                        onChange={(event) => updateItem(item.id, "start", event.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">End</Label>
                      <Input
                        type="time"
                        value={item.end}
                        onChange={(event) => updateItem(item.id, "end", event.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
