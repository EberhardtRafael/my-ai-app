import CollapsibleFilterSection from '@/components/ui/CollapsibleFilterSection';
import FilterOptionList from '@/components/ui/FilterOptionList';

type SidebarOption = {
  value: string;
  label: string;
};

export type FilterSidebarSection = {
  key: string;
  title: string;
  selectedValue: string;
  options: SidebarOption[];
  onSelect: (value: string) => void;
  defaultOpen?: boolean;
};

type FilterSidebarProps = {
  sections: FilterSidebarSection[];
};

export default function FilterSidebar({ sections }: FilterSidebarProps) {
  return (
    <div className="h-fit">
      <div className="overflow-hidden rounded-xl">
        {sections.map((section) => (
          <CollapsibleFilterSection
            key={section.key}
            title={section.title}
            defaultOpen={section.defaultOpen ?? true}
          >
            <FilterOptionList
              options={section.options}
              selectedValue={section.selectedValue}
              onSelect={section.onSelect}
              idPrefix={`filter-${section.key}`}
            />
          </CollapsibleFilterSection>
        ))}
      </div>
    </div>
  );
}
