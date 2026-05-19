"use client";

import React, { useEffect, useMemo, useState } from "react";

type ScheduleItem = {
  id: string;
  label: string;
  start: string;
  end: string;
  color: string;
};

type Kid = {
  id: string;
  name: string;
  schedules: Record<string, ScheduleItem[]>;
};

const COLORS = [
  "#93c5fd",
  "#86efac",
  "#fca5a5",
  "#fde68a",
  "#c4b5fd",
  "#fdba74",
  "#67e8f9",
  "#f0abfc",
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function makeDefaultSchedule(): ScheduleItem[] {
  return [
    { id: newId(), label: "Bedtime", start: "20:30", end: "07:00", color: COLORS[3] },
    { id: newId(), label: "School", start: "08:00", end: "15:00", color: COLORS[0] },
    { id: newId(), label: "Free Time", start: "15:00", end: "18:00", color: COLORS[1] },
    { id: newId(), label: "Reading", start: "19:00", end: "19:30", color: COLORS[4] },
  ];
}

function makeWeeklySchedules() {
  return Object.fromEntries(DAYS.map((day) => [day, makeDefaultSchedule()]));
}

function makeDefaultKids(): Kid[] {
  return [
    { id: newId(), name: "Kid 1", schedules: makeWeeklySchedules() },
    { id: newId(), name: "Kid 2", schedules: makeWeeklySchedules() },
  ];
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(total: number) {
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatHourLabel(hour: number) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDegrees: number) {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRadians),
    y: cy + r * Math.sin(angleRadians),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", cx, cy, "L", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y, "Z"].join(" ");
}

function scheduleToSegments(schedule: ScheduleItem[]) {
  const segments: Array<ScheduleItem & { startMinutes: number; endMinutes: number }> = [];

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

function getCurrentActivity(schedule: ScheduleItem[], now: Date) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return scheduleToSegments(schedule).find(
    (item) => currentMinutes >= item.startMinutes && currentMinutes < item.endMinutes
  );
}

function getNextActivity(schedule: ScheduleItem[], now: Date) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const segments = scheduleToSegments(schedule);
  return segments.find((item) => item.startMinutes > currentMinutes) || segments[0];
}

function KidClock({ kid, selectedDay, now }: { kid: Kid; selectedDay: string; now: Date }) {
  const schedule = kid.schedules[selectedDay] || [];
  const segments = useMemo(() => scheduleToSegments(schedule), [schedule]);
  const currentActivity = getCurrentActivity(schedule, now);
  const nextActivity = getNextActivity(schedule, now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const handAngle = (currentMinutes / 1440) * 360;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>{kid.name}</h2>
          <p style={{ color: "#64748b", marginTop: 8 }}>{selectedDay} schedule</p>
        </div>
        <div style={{ textAlign: "right", fontWeight: 800 }}>
          {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>

      <svg viewBox="0 0 540 460" style={{ width: "100%" }}>
        <circle cx="270" cy="230" r="190" fill="white" />

        {segments.map((item, index) => {
          const startAngle = (item.startMinutes / 1440) * 360;
          const endAngle = (item.endMinutes / 1440) * 360;
          const midAngle = (startAngle + endAngle) / 2;
          const labelPoint = polarToCartesian(270, 230, 135, midAngle);

          return (
            <g key={`${item.id}-${index}`}>
              <path d={describeArc(270, 230, 180, startAngle, endAngle)} fill={item.color} stroke="white" strokeWidth="2" />
              <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="900" fontFamily="Comic Sans MS, Chalkboard SE, cursive">
                {item.label}
              </text>
            </g>
          );
        })}

        <circle cx="270" cy="230" r="88" fill="white" />
        <circle cx="270" cy="230" r="181" fill="none" stroke="#0f172a" strokeWidth="2" />
        <circle cx="270" cy="230" r="88" fill="none" stroke="#cbd5e1" strokeWidth="2" />

        {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => {
          const point = polarToCartesian(270, 230, 235, (hour / 24) * 360);
          return (
            <text key={hour} x={point.x} y={point.y} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="700" fontFamily="monospace">
              {formatHourLabel(hour)}
            </text>
          );
        })}

        <line x1="270" y1="230" x2={polarToCartesian(270, 230, 170, handAngle).x} y2={polarToCartesian(270, 230, 170, handAngle).y} stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
        <circle cx="270" cy="230" r="8" fill="#0f172a" />
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={infoBoxStyle}>
          <div style={smallLabelStyle}>Right now</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{currentActivity?.label || "Unscheduled"}</div>
          <div style={{ color: "#64748b" }}>
            {currentActivity ? `${minutesToTime(currentActivity.startMinutes)}–${minutesToTime(currentActivity.endMinutes)}` : "No task assigned"}
          </div>
        </div>
        <div style={infoBoxStyle}>
          <div style={smallLabelStyle}>Coming up next</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{nextActivity?.label || "Nothing scheduled"}</div>
          <div style={{ color: "#64748b" }}>{nextActivity ? `Starts at ${minutesToTime(nextActivity.startMinutes)}` : ""}</div>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 24,
  padding: 20,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

const infoBoxStyle: React.CSSProperties = {
  background: "#f8fafc",
  borderRadius: 18,
  padding: 16,
};

const smallLabelStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  fontSize: 16,
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "none",
  fontWeight: 800,
  cursor: "pointer",
};

export default function Home() {
  const [now, setNow] = useState(new Date());
  const [kids, setKids] = useState<Kid[]>(makeDefaultKids);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay()]);
  const [selectedKidId, setSelectedKidId] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("kids-visual-clock-data");
    if (saved) {
      const parsed = JSON.parse(saved) as Kid[];
      setKids(parsed);
      setSelectedKidId(parsed[0]?.id || "");
    } else {
      setSelectedKidId((current) => current || kids[0]?.id || "");
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("kids-visual-clock-data", JSON.stringify(kids));
  }, [kids]);

  const selectedKid = kids.find((kid) => kid.id === selectedKidId) || kids[0];
  const selectedSchedule = selectedKid?.schedules[selectedDay] || [];

  function updateKidName(name: string) {
    setKids((current) => current.map((kid) => (kid.id === selectedKid.id ? { ...kid, name } : kid)));
  }

  function updateItem(itemId: string, key: keyof ScheduleItem, value: string) {
    setKids((current) =>
      current.map((kid) => {
        if (kid.id !== selectedKid.id) return kid;
        return {
          ...kid,
          schedules: {
            ...kid.schedules,
            [selectedDay]: kid.schedules[selectedDay].map((item) => (item.id === itemId ? { ...item, [key]: value } : item)),
          },
        };
      })
    );
  }

  function addItem() {
    setKids((current) =>
      current.map((kid) => {
        if (kid.id !== selectedKid.id) return kid;
        return {
          ...kid,
          schedules: {
            ...kid.schedules,
            [selectedDay]: [
              ...kid.schedules[selectedDay],
              { id: newId(), label: "New Activity", start: "16:00", end: "17:00", color: COLORS[kid.schedules[selectedDay].length % COLORS.length] },
            ],
          },
        };
      })
    );
  }

  function removeItem(itemId: string) {
    setKids((current) =>
      current.map((kid) => {
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

  function resetAll() {
    const fresh = makeDefaultKids();
    setKids(fresh);
    setSelectedKidId(fresh[0].id);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f1f5f9", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: 40, fontWeight: 900, margin: "0 0 12px" }}>Kids Visual Schedule Clock</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {DAYS.map((day) => (
          <button key={day} onClick={() => setSelectedDay(day)} style={{ ...buttonStyle, background: selectedDay === day ? "#0f172a" : "white", color: selectedDay === day ? "white" : "black" }}>
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20 }}>
        {kids.map((kid) => (
          <KidClock key={kid.id} kid={kid} selectedDay={selectedDay} now={now} />
        ))}
      </div>

      <section style={{ ...cardStyle, marginTop: 24 }}>
        <h2 style={{ fontSize: 28, marginTop: 0 }}>Edit Schedule</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          {kids.map((kid) => (
            <button key={kid.id} onClick={() => setSelectedKidId(kid.id)} style={{ ...buttonStyle, background: selectedKid?.id === kid.id ? "#0f172a" : "#e2e8f0", color: selectedKid?.id === kid.id ? "white" : "black" }}>
              {kid.name}
            </button>
          ))}
        </div>

        {selectedKid && (
          <>
            <label style={smallLabelStyle}>Kid name</label>
            <input value={selectedKid.name} onChange={(event) => updateKidName(event.target.value)} style={{ ...inputStyle, maxWidth: 320, marginBottom: 18, display: "block" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{selectedDay} schedule</h3>
              <button onClick={addItem} style={{ ...buttonStyle, background: "#0f172a", color: "white" }}>Add Activity</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
              {selectedSchedule.map((item) => (
                <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                    <input type="color" value={item.color} onChange={(event) => updateItem(item.id, "color", event.target.value)} style={{ width: 48, height: 42 }} />
                    <input value={item.label} onChange={(event) => updateItem(item.id, "label", event.target.value)} style={inputStyle} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={smallLabelStyle}>Start</label>
                      <input type="time" value={item.start} onChange={(event) => updateItem(item.id, "start", event.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={smallLabelStyle}>End</label>
                      <input type="time" value={item.end} onChange={(event) => updateItem(item.id, "end", event.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  <button onClick={() => removeItem(item.id)} style={{ ...buttonStyle, background: "#fee2e2", color: "#991b1b", marginTop: 12 }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <button onClick={resetAll} style={{ ...buttonStyle, background: "#e2e8f0", marginTop: 18 }}>
              Reset All Schedules
            </button>
          </>
        )}
      </section>
    </main>
  );
}
