"use client";

import React, { useEffect, useMemo, useState } from "react";

type Activity = {

  id: string;

  label: string;

  start: string;

  end: string;

  color: string;

};

const COLORS = [

  "#93c5fd",

  "#86efac",

  "#fde68a",

  "#fca5a5",

  "#c4b5fd",

  "#f9a8d4",

  "#67e8f9",

  "#fdba74",

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

function createDefaultSchedule(): Activity[] {

  return [

    {

      id: crypto.randomUUID(),

      label: "Sleep",

      start: "20:00",

      end: "07:00",

      color: "#fde68a",

    },

    {

      id: crypto.randomUUID(),

      label: "School",

      start: "08:00",

      end: "15:00",

      color: "#93c5fd",

    },

    {

      id: crypto.randomUUID(),

      label: "Free Time",

      start: "15:00",

      end: "18:00",

      color: "#86efac",

    },

    {

      id: crypto.randomUUID(),

      label: "Reading",

      start: "18:00",

      end: "19:00",

      color: "#c4b5fd",

    },

  ];

}

function createWeek() {

  return Object.fromEntries(

    DAYS.map((day) => [day, createDefaultSchedule()])

  );

}

function timeToMinutes(time: string) {

  const [h, m] = time.split(":").map(Number);

  return h * 60 + m;

}

function polarToCartesian(

  cx: number,

  cy: number,

  radius: number,

  angle: number

) {

  return {

    x: cx + radius * Math.cos(angle),

    y: cy + radius * Math.sin(angle),

  };

}

function createArc(

  cx: number,

  cy: number,

  radius: number,

  startAngle: number,

  endAngle: number

) {

  const start = polarToCartesian(cx, cy, radius, startAngle);

  const end = polarToCartesian(cx, cy, radius, endAngle);

  const largeArc = endAngle - startAngle <= Math.PI ? 0 : 1;

  return `

    M ${cx} ${cy}

    L ${start.x} ${start.y}

    A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}

    Z

  `;

}

function Clock({

  activities,

}: {

  activities: Activity[];

}) {

  const size = 320;

  const radius = 140;

  const center = size / 2;

  const now = new Date();

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const handAngle =

    (currentMinutes / (24 * 60)) * Math.PI * 2 - Math.PI / 2;

  const handX = center + radius * 0.8 * Math.cos(handAngle);

  const handY = center + radius * 0.8 * Math.sin(handAngle);

  return (

    <svg width={size} height={size}>

      {activities.map((activity) => {

        let start =

          (timeToMinutes(activity.start) / (24 * 60)) *

            Math.PI *

            2 -

          Math.PI / 2;

        let end =

          (timeToMinutes(activity.end) / (24 * 60)) *

            Math.PI *

            2 -

          Math.PI / 2;

        if (end <= start) {

          end += Math.PI * 2;

        }

        const mid = (start + end) / 2;

        const labelX =

          center + radius * 0.65 * Math.cos(mid);

        const labelY =

          center + radius * 0.65 * Math.sin(mid);

        return (

          <g key={activity.id}>

            <path

              d={createArc(

                center,

                center,

                radius,

                start,

                end

              )}

              fill={activity.color}

              stroke="white"

              strokeWidth={2}

            />

            <text

              x={labelX}

              y={labelY}

              textAnchor="middle"

              dominantBaseline="middle"

              fontSize="14"

              fontWeight="bold"

            >

              {activity.label}

            </text>

          </g>

        );

      })}

      <line

        x1={center}

        y1={center}

        x2={handX}

        y2={handY}

        stroke="#111827"

        strokeWidth={5}

        strokeLinecap="round"

      />

      <circle

        cx={center}

        cy={center}

        r={8}

        fill="#111827"

      />

    </svg>

  );

}

export default function Page() {

  const [selectedDay, setSelectedDay] =

    useState("Sunday");

  const [kid1Schedules, setKid1Schedules] =

    useState(createWeek());

  const [kid2Schedules, setKid2Schedules] =

    useState(createWeek());

  useEffect(() => {

    const interval = setInterval(() => {

      setKid1Schedules((x) => ({ ...x }));

    }, 60000);

    return () => clearInterval(interval);

  }, []);

  function updateActivity(

    kid: 1 | 2,

    id: string,

    field: keyof Activity,

    value: string

  ) {

    const setter =

      kid === 1

        ? setKid1Schedules

        : setKid2Schedules;

    setter((prev: any) => ({

      ...prev,

      [selectedDay]: prev[selectedDay].map(

        (a: Activity) =>

          a.id === id

            ? { ...a, [field]: value }

            : a

      ),

    }));

  }

  function addActivity(kid: 1 | 2) {

    const setter =

      kid === 1

        ? setKid1Schedules

        : setKid2Schedules;

    setter((prev: any) => ({

      ...prev,

      [selectedDay]: [

        ...prev[selectedDay],

        {

          id: crypto.randomUUID(),

          label: "New Activity",

          start: "12:00",

          end: "13:00",

          color:

            COLORS[

              Math.floor(

                Math.random() * COLORS.length

              )

            ],

        },

      ],

    }));

  }

  function deleteActivity(

    kid: 1 | 2,

    id: string

  ) {

    const setter =

      kid === 1

        ? setKid1Schedules

        : setKid2Schedules;

    setter((prev: any) => ({

      ...prev,

      [selectedDay]: prev[selectedDay].filter(

        (a: Activity) => a.id !== id

      ),

    }));

  }

  const kid1 =

    kid1Schedules[selectedDay] || [];

  const kid2 =

    kid2Schedules[selectedDay] || [];

  return (

    <div

      style={{

        padding: 24,

        background: "#f3f4f6",

        minHeight: "100vh",

        fontFamily: "Arial",

      }}

    >

      <h1

        style={{

          fontSize: 48,

          marginBottom: 20,

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

            onClick={() =>

              setSelectedDay(day)

            }

            style={{

              padding: "10px 16px",

              borderRadius: 10,

              border: "none",

              cursor: "pointer",

              background:

                selectedDay === day

                  ? "#111827"

                  : "white",

              color:

                selectedDay === day

                  ? "white"

                  : "black",

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

            "repeat(auto-fit, minmax(500px, 1fr))",

          gap: 20,

        }}

      >

        {[1, 2].map((kidNum) => {

          const activities =

            kidNum === 1 ? kid1 : kid2;

          return (

            <div

              key={kidNum}

              style={{

                background: "white",

                borderRadius: 24,

                padding: 20,

              }}

            >

              <h2

                style={{

                  fontSize: 40,

                  marginBottom: 10,

                }}

              >

                Kid {kidNum}

              </h2>

              <Clock activities={activities} />

              <button

                onClick={() =>

                  addActivity(

                    kidNum as 1 | 2

                  )

                }

                style={{

                  marginTop: 20,

                  marginBottom: 20,

                  padding: "10px 16px",

                  border: "none",

                  borderRadius: 10,

                  background: "#111827",

                  color: "white",

                  cursor: "pointer",

                }}

              >

                Add Activity

              </button>

              <div>

                {activities.map((a) => (

                  <div

                    key={a.id}

                    style={{

                      border:

                        "1px solid #ddd",

                      borderRadius: 12,

                      padding: 12,

                      marginBottom: 12,

                    }}

                  >

                    <input

                      value={a.label}

                      onChange={(e) =>

                        updateActivity(

                          kidNum as 1 | 2,

                          a.id,

                          "label",

                          e.target.value

                        )

                      }

                      style={{

                        width: "100%",

                        marginBottom: 8,

                        padding: 8,

                      }}

                    />

                    <div

                      style={{

                        display: "flex",

                        gap: 8,

                        marginBottom: 8,

                      }}

                    >

                      <input

                        type="time"

                        value={a.start}

                        onChange={(e) =>

                          updateActivity(

                            kidNum as 1 | 2,

                            a.id,

                            "start",

                            e.target.value

                          )

                        }

                      />

                      <input

                        type="time"

                        value={a.end}

                        onChange={(e) =>

                          updateActivity(

                            kidNum as 1 | 2,

                            a.id,

                            "end",

                            e.target.value

                          )

                        }

                      />

                    </div>

                    <input

                      type="color"

                      value={a.color}

                      onChange={(e) =>

                        updateActivity(

                          kidNum as 1 | 2,

                          a.id,

                          "color",

                          e.target.value

                        )

                      }

                    />

                    <button

                      onClick={() =>

                        deleteActivity(

                          kidNum as 1 | 2,

                          a.id

                        )

                      }

                      style={{

                        marginLeft: 12,

                        background:

                          "#ef4444",

                        color: "white",

                        border: "none",

                        padding:

                          "8px 12px",

                        borderRadius: 8,

                        cursor: "pointer",

                      }}

                    >

                      Delete

                    </button>

                  </div>

                ))}

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}