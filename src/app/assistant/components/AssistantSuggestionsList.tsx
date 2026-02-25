import AssistantActionList from './AssistantActionList';

type AssistantSuggestionsListProps = {
  suggestions: string[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
};

export default function AssistantSuggestionsList({
  suggestions,
  isLoading,
  onSuggestionClick,
}: AssistantSuggestionsListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 font-semibold">Try asking</p>
      <AssistantActionList
        items={suggestions.map((suggestion) => ({
          key: suggestion,
          label: suggestion,
          onClick: () => onSuggestionClick(suggestion),
        }))}
        disabled={isLoading}
      />
    </div>
  );
}
