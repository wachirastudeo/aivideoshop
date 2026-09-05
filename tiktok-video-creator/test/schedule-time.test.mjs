import assert from "node:assert/strict";
import { getFreshScheduleDateTime } from "../modules/schedule-time.js";

const daytime = new Date(2026, 8, 5, 9, 15, 43, 123);
assert.deepEqual(getFreshScheduleDateTime(daytime), {
  date: "2026-09-05",
  time: "11:15",
  dateTime: "2026-09-05T11:15"
});

const crossesMidnight = new Date(2026, 8, 5, 23, 30, 0, 0);
assert.deepEqual(getFreshScheduleDateTime(crossesMidnight), {
  date: "2026-09-06",
  time: "01:30",
  dateTime: "2026-09-06T01:30"
});

console.log("schedule-time tests passed");
