export const LETTERS = ['A', 'B', 'C', 'D', 'E'];
export const ROWS_PER_COACH = 8; // 8 rows x 5 seats = 40 seats per coach
const PER_COACH = LETTERS.length * ROWS_PER_COACH;

export type Seat = { code: string; letter: string };
export type Coach = {
  number: number;
  rows: { row: number; seats: Seat[] }[];
};

// Seat codes look like "2-3A" = coach 2, row 3, letter A
export function generateCoaches(total: number): Coach[] {
  const coaches: Coach[] = [];

  for (let i = 0; i < total; i++) {
    const coachNo = Math.floor(i / PER_COACH) + 1;
    const inCoach = i % PER_COACH;
    const rowNo = Math.floor(inCoach / LETTERS.length) + 1;
    const letter = LETTERS[inCoach % LETTERS.length];

    let coach = coaches[coachNo - 1];
    if (!coach) {
      coach = { number: coachNo, rows: [] };
      coaches.push(coach);
    }
    let row = coach.rows.find((r) => r.row === rowNo);
    if (!row) {
      row = { row: rowNo, seats: [] };
      coach.rows.push(row);
    }
    row.seats.push({ code: `${coachNo}-${rowNo}${letter}`, letter });
  }
  return coaches;
}

// Flat list, still used by the booking API to validate seats
export function generateSeats(total: number): string[] {
  return generateCoaches(total).flatMap((c) =>
    c.rows.flatMap((r) => r.seats.map((s) => s.code))
  );
}
