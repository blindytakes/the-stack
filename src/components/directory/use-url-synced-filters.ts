'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type UseUrlSyncedFiltersOptions<TFilters> = {
  initialSearchParams?: string;
  parse: (searchParams: URLSearchParams) => TFilters;
  build: (currentSearchParams: URLSearchParams, filters: TFilters) => URLSearchParams;
  isActive?: boolean;
};

export function useUrlSyncedFilters<TFilters>({
  initialSearchParams = '',
  parse,
  build,
  isActive = true
}: UseUrlSyncedFiltersOptions<TFilters>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const hasHydratedFromUrl = useRef(false);
  const initialFilters = useMemo(
    () => parse(new URLSearchParams(initialSearchParams)),
    [initialSearchParams, parse]
  );
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    if (!isActive) return;

    setFilters(parse(new URLSearchParams(searchParamsString)));
    hasHydratedFromUrl.current = true;
  }, [isActive, parse, searchParamsString]);

  useEffect(() => {
    if (!isActive || !hasHydratedFromUrl.current) return;

    const params = build(new URLSearchParams(searchParamsString), filters);
    const nextQueryString = params.toString();
    if (nextQueryString === searchParamsString) return;

    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false
    });
  }, [build, filters, isActive, pathname, router, searchParamsString]);

  return {
    filters,
    setFilters
  };
}
