import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BankingOfferDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const search = await searchParams;
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (value == null) continue;

    if (Array.isArray(value)) {
      value.forEach((item) => nextParams.append(key, item));
      continue;
    }

    nextParams.set(key, value);
  }

  nextParams.set('bank', slug);

  redirect(`/banking?${nextParams.toString()}`);
}
