const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function getFreshScheduleDateTime(now = Date.now()) {
  const baseTime = now instanceof Date ? now.getTime() : Number(now);
  const scheduled = new Date(baseTime + TWO_HOURS_MS);
  scheduled.setSeconds(0, 0);

  const year = scheduled.getFullYear();
  const month = String(scheduled.getMonth() + 1).padStart(2, "0");
  const day = String(scheduled.getDate()).padStart(2, "0");
  const hours = String(scheduled.getHours()).padStart(2, "0");
  const minutes = String(scheduled.getMinutes()).padStart(2, "0");
  const date = `${year}-${month}-${day}`;
  const time = `${hours}:${minutes}`;

  return { date, time, dateTime: `${date}T${time}` };
}
