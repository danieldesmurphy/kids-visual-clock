"use client";

import React, { useEffect, useMemo, useState } from "react";

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

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function makeDefaultSchedule() {
  return [
    {
      id: crypto.randomUUID(),
      label: "Bedtime",
      start: "20:30",
      end: "07:00",
      color: COLORS[3],
    },
    {
      id: crypto.randomUUID(),
      label: "School",
      start: "08:00",
      end: "15:00",
      color: COLORS[0],
    },
    {
      id: crypto.randomUUID(),
      label: "Free Time",
      start: "15:00",
      end: "18:00",
      color: COLORS[1],
    },
    {
      id: crypto.randomUUID(),
      label: "Reading",
      start: "19:00",
      end: "19:30",
      color: COLORS[4],
    },
  ];
}

function makeWeeklySchedules() {
  return Object.fromEntries(
    DAYS.map((day) => [day, makeDefaultSchedule()])
  );
}

const DEFAULT_KIDS = [
  {
    id: crypto.randomUUID(),
    name: "Kid 1",
    schedules: makeWeeklySchedules(),
  },
  {
    id: crypto.randomUUID(),
    name: "Kid 2",
    schedules: makeWeeklySchedules(),
  },
];

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatHourLabel(hour: number) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDegrees: number
) {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + r * Math.cos(angleRadians),
    y: cy + r * Math.sin(angleRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
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

function scheduleToSegments(schedule: any[]) {
  const segments: any[] = [];

  schedule.forEach((item) => {
    const start = timeToMinutes(item.start);
    const end = timeToMinutes(item.end);

    if (end > start) {
      segments.push({
        ...item,
        startMinutes: start,
        endMinutes: end,
      });
    } else {
      segments.push({
        ...item,
        startMinutes: start,
        endMinutes: 1440,
      });

      segments.push({
        ...item,
        startMinutes: 0,
        endMinutes: end,
      });
    }
  });

  return segments;
}

function KidClock({
  kid,
  selectedDay,
  now,
}: {
  kid: any;
  selectedDay: string;
  now: Date;
}) {
  const schedule = kid.schedules[selectedDay];

  const segments = useMemo(
    () => scheduleToSegments(schedule),
    [schedule]
  );

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes() +
    now.getSeconds() / 60;

  const handAngle = (currentMinutes / 1440) * 360;

  return (
    <div
      style={{
        background: "white",
        borderRadius: 24,
        padding: 20,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <h2
        style={{
          fontSize: 32,
          fontWeight: 900,
        }}
      >
        {kid.name}
      </h2>

      <p style={{ color: "#64748b" }}>
        {selectedDay} schedule
      </p>

      <svg
        viewBox="0 0 540 460"
        style={{ width: "100%" }}
      >
        <circle
          cx="270"
          cy="230"
          r="190"
          fill="white"
        />

        {segments.map((item: any, index: number) => {
          const startAngle =
            (item.startMinutes / 1440) * 360;

          const endAngle =
            (item.endMinutes / 1440) * 360;

          const midAngle =
            (startAngle + endAngle) / 2;

          const labelPoint = polarToCartesian(
            270,
            230,
            135,
            midAngle
          );

          return (
            <g key={index}>
              <path
                d={describeArc(
                  270,
                  230,
                  180,
                  startAngle,
                  endAngle
                )}
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
                fontFamily="Comic Sans MS"
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => {
          const angle = (hour / 24) * 360;

          const point = polarToCartesian(
            270,
            230,
            235,
            angle
          );

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
            >
              {formatHourLabel(hour)}
            </text>
          );
        })}

        <line
          x1="270"
          y1="230"
          x2={
            polarToCartesian(
              270,
              230,
              170,
              handAngle
            ).x
          }
          y2={
            polarToCartesian(
              270,
              230,
              170,
              handAngle
            ).y
          }
          stroke="#0f172a"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <circle
          cx="270"
          cy="230"
          r="8"
          fill="#0f172a"
        />
      </svg>
    </div>
  );
}

export default function Home() {
  const [now, setNow] = useState(new Date());

  const [kids] = useState(DEFAULT_KIDS);

  const [selectedDay, setSelectedDay] =
    useState(DAYS[new Date().getDay()]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: 20,
        fontFamily: "Arial",
      }}
    >
      <h1
        style={{
          fontSize: 40,
          fontWeight: 900,
          marginBottom: 10,
        }}
      >
        Kids Visual Schedule Clock
      </h1>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: "none",
              background:
                selectedDay === day
                  ? "#0f172a"
                  : "white",
              color:
                selectedDay === day
                  ? "white"
                  : "black",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 20,
        }}
      >
        {kids.map((kid) => (
          <KidClock
            key={kid.id}
            kid={kid}
            selectedDay={selectedDay}
            now={now}
          />
        ))}
      </div>
    </main>
  );
}