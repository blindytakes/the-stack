import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  derivePlannerBenefitsValue,
  deriveTotalBenefitsValue
} from '@/lib/cards/planner-benefits';

describe('card planner benefit heuristics', () => {
  it('keeps total benefit value separate from the conservative planner estimate', () => {
    const benefits = [
      {
        category: 'TRAVEL_CREDITS',
        name: 'Travel credit',
        estimatedValue: new Prisma.Decimal(300)
      },
      {
        category: 'OTHER',
        name: 'Uber Cash',
        estimatedValue: new Prisma.Decimal(120)
      },
      {
        category: 'DINING_CREDITS',
        name: 'DoorDash DashPass Membership',
        estimatedValue: new Prisma.Decimal(96)
      },
      {
        category: 'OTHER',
        name: 'Cell Phone Protection',
        estimatedValue: new Prisma.Decimal(100)
      }
    ];

    expect(deriveTotalBenefitsValue(benefits)).toBe(616);
    expect(derivePlannerBenefitsValue(benefits)).toBe(366);
  });

  it('drops zero and blocked benefit values from the planner estimate', () => {
    const benefits = [
      {
        category: 'TRAVEL_CREDITS',
        name: 'Travel credit',
        estimatedValue: new Prisma.Decimal(0)
      },
      {
        category: 'OTHER',
        name: 'Priority Pass Lounge Access',
        estimatedValue: new Prisma.Decimal(200)
      }
    ];

    expect(derivePlannerBenefitsValue(benefits)).toBe(0);
  });

  it('uses conservative values for restrictive hotel and partner credits', () => {
    const benefits = [
      {
        category: 'TRAVEL_CREDITS',
        name: '$500 Credit for Stays with The Edit',
        estimatedValue: new Prisma.Decimal(500)
      },
      {
        category: 'OTHER',
        name: '$50 Lifestyle Collection Experience Credit',
        estimatedValue: new Prisma.Decimal(50)
      },
      {
        category: 'OTHER',
        name: '$300 in DoorDash Promos',
        estimatedValue: new Prisma.Decimal(300)
      },
      {
        category: 'OTHER',
        name: '$300 in StubHub Credits',
        estimatedValue: new Prisma.Decimal(300)
      },
      {
        category: 'OTHER',
        name: '$120 in Lyft Credits',
        estimatedValue: new Prisma.Decimal(120)
      },
      {
        category: 'OTHER',
        name: '$150 Annual Fee Refund After $150,000 Spend',
        estimatedValue: new Prisma.Decimal(150)
      }
    ];

    expect(deriveTotalBenefitsValue(benefits)).toBe(1420);
    expect(derivePlannerBenefitsValue(benefits)).toBe(891);
  });
});
