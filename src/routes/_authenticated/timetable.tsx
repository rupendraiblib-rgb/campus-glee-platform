import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({ meta: [{ title: "Timetable — Smart School ERP" }] }),
  component: TimetablePage,
});

const days = ["Mon","Tue","Wed","Thu","Fri","Sat"];
const slots = ["9:00","10:00","11:00","12:00","1:00","2:00"];

function TimetablePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
        <p className="text-sm text-muted-foreground">Weekly schedule. Dynamic editor & conflict detection coming next.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-7 text-xs">
          <div className="p-3 bg-muted/50 font-medium">Time</div>
          {days.map(d => <div key={d} className="p-3 bg-muted/50 font-medium border-l border-border">{d}</div>)}
          {slots.map((t) => (
            <Fragment key={t}>
              <div className="p-3 border-t border-border text-muted-foreground">{t}</div>
              {days.map((d) => (
                <div key={d+t} className="p-3 border-t border-l border-border text-muted-foreground">—</div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
