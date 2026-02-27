import {
  PrismaClient,
  CardType,
  CreditTier,
  Network,
  RateType,
  SpendingCategory,
  BenefitCategory,
  PartnerType
} from '@prisma/client';
import cardsJson from '../content/cards/cards.json';
import { cardsSeedDatasetSchema, type CardSeedRecord } from '../src/lib/card-seed-schema';

const prisma = new PrismaClient();

const creditTierMap: Record<CardSeedRecord['creditTierMin'], CreditTier> = {
  excellent: CreditTier.EXCELLENT,
  good: CreditTier.GOOD,
  fair: CreditTier.FAIR,
  building: CreditTier.BUILDING
};

const networkMap: Record<NonNullable<CardSeedRecord['network']>, Network> = {
  visa: Network.VISA,
  mastercard: Network.MASTERCARD,
  amex: Network.AMEX,
  discover: Network.DISCOVER
};

const cardTypeMap: Record<NonNullable<CardSeedRecord['cardType']>, CardType> = {
  personal: CardType.PERSONAL,
  business: CardType.BUSINESS,
  student: CardType.STUDENT,
  secured: CardType.SECURED
};

const spendingCategoryMap: Record<string, SpendingCategory> = {
  dining: SpendingCategory.DINING,
  groceries: SpendingCategory.GROCERIES,
  travel: SpendingCategory.TRAVEL,
  gas: SpendingCategory.GAS,
  streaming: SpendingCategory.STREAMING,
  online_shopping: SpendingCategory.ONLINE_SHOPPING,
  entertainment: SpendingCategory.ENTERTAINMENT,
  utilities: SpendingCategory.UTILITIES,
  all: SpendingCategory.ALL,
  other: SpendingCategory.OTHER
};

const rateTypeMap: Record<'cashback' | 'points' | 'miles', RateType> = {
  cashback: RateType.CASHBACK,
  points: RateType.POINTS,
  miles: RateType.MILES
};

const benefitCategoryMap: Partial<Record<string, BenefitCategory>> = {
  purchase_protection: BenefitCategory.PURCHASE_PROTECTION,
  extended_warranty: BenefitCategory.EXTENDED_WARRANTY,
  cell_phone: BenefitCategory.CELL_PHONE,
  rental_car: BenefitCategory.RENTAL_CAR,
  travel_insurance: BenefitCategory.TRAVEL_INSURANCE,
  lounge_access: BenefitCategory.LOUNGE_ACCESS,
  price_protection: BenefitCategory.PRICE_PROTECTION,
  return_protection: BenefitCategory.RETURN_PROTECTION,
  concierge: BenefitCategory.CONCIERGE,
  tsa_global_entry: BenefitCategory.TSA_GLOBAL_ENTRY,
  streaming_credits: BenefitCategory.STREAMING_CREDITS,
  dining_credits: BenefitCategory.DINING_CREDITS,
  travel_credits: BenefitCategory.TRAVEL_CREDITS,
  other: BenefitCategory.OTHER
};

const partnerTypeMap: Partial<Record<string, PartnerType>> = {
  airline: PartnerType.AIRLINE,
  hotel: PartnerType.HOTEL,
  other: PartnerType.OTHER
};

function toDate(value?: string) {
  return value ? new Date(value) : undefined;
}

async function main() {
  const cards = cardsSeedDatasetSchema.parse(cardsJson);

  await prisma.$transaction(async (tx) => {
    for (const card of cards) {
      const cardData = {
        issuer: card.issuer,
        name: card.name,
        cardType: card.cardType ? cardTypeMap[card.cardType] : CardType.PERSONAL,
        network: card.network ? networkMap[card.network] : null,
        description: card.description ?? null,
        longDescription: card.longDescription ?? null,
        annualFee: card.annualFee,
        introApr: card.introApr ?? null,
        regularAprMin: card.regularAprMin ?? null,
        regularAprMax: card.regularAprMax ?? null,
        creditScoreMin: creditTierMap[card.creditTierMin],
        foreignTxFee: card.foreignTxFee ?? 0,
        editorRating: card.editorRating ?? null,
        pros: card.pros ?? [],
        cons: card.cons ?? [],
        imageUrl: card.imageUrl ?? null,
        applyUrl: card.applyUrl ?? null,
        affiliateUrl: card.affiliateUrl ?? null,
        isActive: card.isActive ?? true,
        lastVerified: toDate(card.lastVerified) ?? new Date()
      };

      const upserted = await tx.card.upsert({
        where: { slug: card.slug },
        update: cardData,
        create: { slug: card.slug, ...cardData }
      });

      await tx.rewardStructure.deleteMany({ where: { cardId: upserted.id } });
      if (card.rewards?.length) {
        await tx.rewardStructure.createMany({
          data: card.rewards.map((reward) => ({
            cardId: upserted.id,
            category: spendingCategoryMap[reward.category] ?? SpendingCategory.OTHER,
            rate: reward.rate,
            rateType: rateTypeMap[reward.rateType],
            capAmount: reward.capAmount ?? null,
            capPeriod: reward.capPeriod ?? null,
            isRotating: reward.isRotating ?? false,
            rotationQuarter: reward.rotationQuarter ?? null,
            notes: reward.notes ?? null
          }))
        });
      }

      await tx.signUpBonus.deleteMany({ where: { cardId: upserted.id } });
      if (card.signUpBonuses?.length) {
        await tx.signUpBonus.createMany({
          data: card.signUpBonuses.map((bonus) => ({
            cardId: upserted.id,
            bonusValue: bonus.bonusValue,
            bonusType: bonus.bonusType,
            bonusPoints: bonus.bonusPoints ?? null,
            spendRequired: bonus.spendRequired,
            spendPeriodDays: bonus.spendPeriodDays,
            isCurrentOffer: bonus.isCurrentOffer ?? true,
            expiresAt: toDate(bonus.expiresAt) ?? null
          }))
        });
      }

      await tx.benefit.deleteMany({ where: { cardId: upserted.id } });
      if (card.benefits?.length) {
        await tx.benefit.createMany({
          data: card.benefits.map((benefit) => ({
            cardId: upserted.id,
            category: benefitCategoryMap[benefit.category.toLowerCase()] ?? BenefitCategory.OTHER,
            name: benefit.name,
            description: benefit.description,
            estimatedValue: benefit.estimatedValue ?? null,
            activationMethod: benefit.activationMethod ?? null,
            finePrint: benefit.finePrint ?? null
          }))
        });
      }

      await tx.transferPartner.deleteMany({ where: { cardId: upserted.id } });
      if (card.transferPartners?.length) {
        await tx.transferPartner.createMany({
          data: card.transferPartners.map((partner) => ({
            cardId: upserted.id,
            partnerName: partner.partnerName,
            partnerType: partnerTypeMap[partner.partnerType.toLowerCase()] ?? PartnerType.OTHER,
            transferRatio: partner.transferRatio ?? 1,
            bonusMultiplier: partner.bonusMultiplier ?? null,
            bonusExpiresAt: toDate(partner.bonusExpiresAt) ?? null
          }))
        });
      }
    }
  }, { timeout: 30000 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Prisma seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
