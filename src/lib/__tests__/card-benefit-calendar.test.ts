import { describe, expect, it } from 'vitest';
import { buildBenefitCalendarEvents, buildBenefitCalendarIcs } from '@/lib/card-benefit-calendar';

function getEventDate(title: string) {
  const event = buildBenefitCalendarEvents({
    selectedCardIds: ['amex-gold', 'amex-platinum'],
    settingsByCardId: {
      'amex-gold': { anniversaryDate: '2026-04-29' },
      'amex-platinum': { anniversaryDate: '2026-04-29' }
    },
    startDate: new Date(2026, 5, 1),
    months: 1
  }).find((item) => item.title === title);

  expect(event).toBeDefined();
  return event?.startsAt;
}

function expectLocalDate(date: Date | undefined, year: number, month: number, day: number) {
  expect(date?.getFullYear()).toBe(year);
  expect(date ? date.getMonth() + 1 : undefined).toBe(month);
  expect(date?.getDate()).toBe(day);
}

describe('buildBenefitCalendarEvents', () => {
  it('places monthly credits on the last day of the month', () => {
    expectLocalDate(getEventDate('Use monthly Uber Cash'), 2026, 6, 30);
    expectLocalDate(getEventDate('Use monthly dining credit'), 2026, 6, 30);
  });

  it('places quarterly and semiannual credits on the window end date', () => {
    expectLocalDate(getEventDate('Use quarterly Resy credit'), 2026, 6, 30);
    expectLocalDate(getEventDate('Use semiannual Resy credit'), 2026, 6, 30);
  });

  it('exports active reminders as an iCalendar file', () => {
    const events = buildBenefitCalendarEvents({
      selectedCardIds: ['amex-platinum'],
      settingsByCardId: {
        'amex-platinum': { anniversaryDate: '2026-04-29' }
      },
      startDate: new Date(2026, 5, 1),
      months: 1
    });
    const ics = buildBenefitCalendarIcs(events);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('X-WR-CALNAME:The Stack Card Benefit Calendar');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260630');
    expect(ics).toContain('DTEND;VALUE=DATE:20260701');
    expect(ics).toContain('SUMMARY:Amex Platinum: Use monthly Uber Cash');
    expect(ics).toContain('END:VCALENDAR');
  });
});
