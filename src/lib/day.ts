/** Intervalo UTC do dia — alinhado com o registo de entregas do motor. */
export function dayRangeUTC(date = new Date()) {
  const iso = date.toISOString().slice(0, 10);
  return {
    iso,
    start: new Date(iso + "T00:00:00.000Z"),
    end: new Date(iso + "T23:59:59.999Z"),
  };
}
