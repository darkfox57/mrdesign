import { CaseCard, type CaseCardProps } from "@/components/organisms/CaseCard";
import type { PublicCaseCard } from "@/lib/cases/public";

type CaseListProps = Omit<CaseCardProps, "item"> & { cases: PublicCaseCard[] };

// A grid of published cases (the portfolio index and the related cases of a case page).
export function CaseList({ cases, ...card }: CaseListProps) {
  return (
    <ul data-x="CaseList" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cases.map((item) => (
        <li key={item.id}>
          <CaseCard item={item} {...card} />
        </li>
      ))}
    </ul>
  );
}
