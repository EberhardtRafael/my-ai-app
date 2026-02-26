"""
LLM-powered ticket generator
"""
import os
import re
from typing import Dict, Optional, List
from datetime import datetime

# You can use OpenAI or Anthropic - here's the structure for both
class TicketGenerator:
    def __init__(self):
        self.api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('ANTHROPIC_API_KEY')
        self.provider = 'openai' if os.environ.get('OPENAI_API_KEY') else 'anthropic'
    
    def generate(self, task_description: str, context: str, estimation: Dict, 
                 repo_metrics: Optional[Dict] = None, similar_tasks: Optional[list] = None) -> str:
        """
        Generate a comprehensive ticket using LLM
        
        Args:
            task_description: User's description of the task
            context: Type of work (frontend/backend/etc.)
            estimation: Estimation details from TicketEstimator
            repo_metrics: Repository metrics
            similar_tasks: List of similar historical tasks
        
        Returns:
            Formatted markdown ticket
        """
        # Build context for the LLM
        prompt = self._build_prompt(task_description, context, estimation, repo_metrics, similar_tasks)
        
        # For now, return a template-based ticket
        # In production, you'd call OpenAI/Anthropic API here
        return self._generate_template_ticket(task_description, context, estimation, similar_tasks)
    
    def _build_prompt(self, task_description: str, context: str, estimation: Dict, 
                      repo_metrics: Optional[Dict], similar_tasks: Optional[list]) -> str:
        """Build prompt for LLM"""
        similar_context = ""
        if similar_tasks:
            similar_context = "\n\nSimilar historical tasks:\n"
            for task in similar_tasks:
                similar_context += f"- {task['title']}: {task['actual_hours']}h (similarity: {task['similarity']*100:.0f}%)\n"
        
        repo_context = ""
        if repo_metrics:
            repo_context = f"\n\nRepository metrics:\n"
            repo_context += f"- Average time to merge: {repo_metrics.get('avg_time_to_merge_hours', 0):.1f}h\n"
            repo_context += f"- Total merged PRs: {repo_metrics.get('total_merged_prs', 0)}\n"
        
        prompt = f"""Generate a comprehensive software development ticket for the following task:

Task Description: {task_description}

Context: {context}
Estimated Time: {estimation['hours']}h (range: {estimation['range'][0]}-{estimation['range'][1]}h)
Confidence: {estimation['confidence']*100:.0f}%
{similar_context}{repo_context}

Generate a ticket with:
1. A clear, concise title
2. User Story (As a... I want... So that...)
3. Detailed Acceptance Criteria (specific, testable checkboxes)
4. Technical Notes and Implementation Hints
5. Estimation Breakdown
6. Related Files/Components (if applicable)
7. Testing Requirements

Format in markdown with proper headers and checkboxes."""
        
        return prompt
    
    def _generate_template_ticket(self, task_description: str, context: str, 
                                   estimation: Dict, similar_tasks: Optional[list]) -> str:
        """Generate ticket using template (fallback when LLM not available)"""
        cleaned_task_description = self._normalize_prompt_text(task_description)

        # Extract a title from description
        title = self._extract_title(cleaned_task_description)
        ticket_id = self._generate_ticket_id()
        acceptance_criteria = self._extract_acceptance_criteria(cleaned_task_description)
        risk_section = self._build_risk_section(cleaned_task_description)
        related_components = self._extract_related_components(cleaned_task_description)
        dependencies = self._extract_dependencies(cleaned_task_description)
        implementation_plan = self._build_implementation_plan(cleaned_task_description, context)
        task_breakdown = self._build_task_breakdown(cleaned_task_description, context)
        testing_requirements = self._build_testing_requirements(cleaned_task_description, context)
        priority = self._determine_priority(cleaned_task_description, estimation)
        definition_of_done = self._build_definition_of_done(cleaned_task_description, context)

        estimation_range = estimation.get('range', [estimation.get('hours', 0), estimation.get('hours', 0)])
        range_low = min(estimation_range[0], estimation_range[1])
        range_high = max(estimation_range[0], estimation_range[1])
        
        similar_section = ""
        if similar_tasks:
            similar_section = "\n## Similar Historical Tasks\n\n"
            for task in similar_tasks:
                similar_section += f"- **{task['title']}**: {task['actual_hours']}h actual (similarity: {task['similarity']*100:.0f}%)\n"
        
        # Build estimation breakdown
        factors = estimation.get('factors', {})
        estimation_breakdown = f"""## Estimation Breakdown

**Total Estimated Time:** {estimation['hours']} hours
**Range:** {range_low}-{range_high} hours
**Confidence Level:** {estimation['confidence']*100:.0f}%

**Factors:**
- Base hours ({context}): {factors.get('base_hours', 0)}h
- Complexity adjustment: {factors.get('complexity_adjustment', 1.0)}x
- Scope adjustment: {factors.get('scope_adjustment', 1.0)}x
- Estimation method: {factors.get('method', 'fallback')}
"""
        
        ticket = f"""# {ticket_id}: {title}

**Status:** 📝 Planned  
    **Priority:** {priority}  
**Estimated:** {estimation['hours']}h ({estimation['confidence']*100:.0f}% confidence)  
**Context:** {context.title()}  
**Created:** {datetime.now().strftime('%Y-%m-%d')}

## User Story

As a developer/user,  
I want {cleaned_task_description.lower()[:100]}{'...' if len(cleaned_task_description) > 100 else ''}  
So that the application has improved functionality and user experience.

## Task Description

{cleaned_task_description}

## Acceptance Criteria

{acceptance_criteria}

## Technical Notes

**Context:** {context.title()} development

**Recommended Approach:**
{implementation_plan}

## Implementation Breakdown

{task_breakdown}

**Considerations:**
- Maintain backward compatibility
- Follow existing patterns in the codebase
- Consider performance implications
- Ensure accessibility standards

## Related Components

{related_components}

## Dependencies

{dependencies}

{risk_section}

{estimation_breakdown}{similar_section}

## Testing Requirements

{testing_requirements}

## Definition of Done

{definition_of_done}

---

**Note:** This ticket was generated automatically based on repository history and task analysis. Adjust estimation and details as needed based on team knowledge.
"""
        return ticket

    def _normalize_prompt_text(self, text: str) -> str:
        """Apply lightweight typo and grammar cleanup for clearer generated tickets."""
        cleaned = re.sub(r'\s+', ' ', (text or '').strip())
        if not cleaned:
            return "New feature implementation"

        typo_map = {
            'prtoject': 'project',
            'projcet': 'project',
            'teh': 'the',
            'recieve': 'receive',
            'seperate': 'separate',
            'definately': 'definitely',
            'wierd': 'weird',
            'enviroment': 'environment',
            'dependancies': 'dependencies',
        }

        for typo, correction in typo_map.items():
            cleaned = re.sub(rf'\b{re.escape(typo)}\b', correction, cleaned, flags=re.IGNORECASE)

        cleaned = re.sub(r'\b(I|i)\s+want\s+add\b', 'I want to add', cleaned)
        cleaned = re.sub(r'\b(I|i)\s+need\s+add\b', 'I need to add', cleaned)
        cleaned = re.sub(r'\b(We|we)\s+need\s+add\b', 'We need to add', cleaned)
        cleaned = re.sub(r'\b(We|we)\s+want\s+add\b', 'We want to add', cleaned)

        cleaned = cleaned[0].upper() + cleaned[1:] if cleaned else cleaned
        return cleaned

    def _extract_acceptance_criteria(self, description: str) -> str:
        """Create task-specific acceptance criteria from description text"""
        lowered_description = description.lower()

        if 'related products' in lowered_description and 'pdp' in lowered_description:
            return "\n".join([
                "- [ ] PDP shows a Related Products section for products with configured relations",
                "- [ ] Backend returns related products through a dedicated API/GraphQL field",
                "- [ ] Product relation model supports many-to-many product links",
                "- [ ] Related Products UI renders mini-PLP style cards with required metadata",
                "- [ ] Filters (when provided) update the related products list correctly",
                "- [ ] Empty/fallback state appears when no related products are available",
                "- [ ] Unit/integration tests cover backend relation query and PDP rendering",
            ])

        segments = [segment.strip() for segment in re.split(r'[\n\.;]+', description) if segment.strip()]
        criteria: List[str] = []

        for segment in segments:
            normalized = segment[0].upper() + segment[1:] if segment else segment
            lowered = normalized.lower()

            if len(normalized) < 8:
                continue

            if any(keyword in lowered for keyword in ['api', 'endpoint', 'route']):
                criteria.append(f"- [ ] API behavior implemented for: {normalized}")
            elif any(keyword in lowered for keyword in ['ui', 'page', 'component', 'button', 'form']):
                criteria.append(f"- [ ] UI behavior implemented for: {normalized}")
            elif any(keyword in lowered for keyword in ['test', 'coverage', 'jest', 'pytest']):
                criteria.append(f"- [ ] Test coverage includes: {normalized}")
            elif any(keyword in lowered for keyword in ['performance', 'optimize', 'latency', 'fast']):
                criteria.append(f"- [ ] Performance requirement validated: {normalized}")
            else:
                criteria.append(f"- [ ] {normalized}")

            if len(criteria) >= 6:
                break

        baseline = [
            "- [ ] Code follows project conventions and best practices",
            "- [ ] Unit and integration tests pass",
            "- [ ] Documentation updated where behavior changes",
        ]

        final_criteria = criteria[:]
        for default_item in baseline:
            if len(final_criteria) >= 8:
                break
            final_criteria.append(default_item)

        return "\n".join(final_criteria)

    def _build_risk_section(self, description: str) -> str:
        """Infer likely implementation risks from task keywords"""
        lowered = description.lower()
        risks: List[str] = []

        if any(keyword in lowered for keyword in ['auth', 'oauth', 'security', 'token', 'permission']):
            risks.append("- Security/auth risk: verify permissions, token handling, and access boundaries")
        if any(keyword in lowered for keyword in ['database', 'migration', 'schema', 'sql']):
            risks.append("- Data risk: validate schema changes and maintain backward compatibility")
        if any(keyword in lowered for keyword in ['performance', 'real-time', 'stream', 'websocket']):
            risks.append("- Performance risk: benchmark critical paths and monitor response times")
        if any(keyword in lowered for keyword in ['ui', 'frontend', 'responsive', 'accessibility', 'a11y']):
            risks.append("- UX risk: validate responsive behavior and accessibility expectations")
        if any(keyword in lowered for keyword in ['integration', 'third-party', 'github', 'api']):
            risks.append("- Integration risk: guard for external API failures and rate limits")

        if not risks:
            risks.append("- Delivery risk: confirm assumptions early with a small vertical slice")

        return "## Risks & Mitigations\n\n" + "\n".join(risks)

    def _extract_related_components(self, description: str) -> str:
        """Infer likely components/files impacted by the task"""
        lowered = description.lower()
        components: List[str] = []

        mapping = [
            (['ticket', 'tickets'], 'tickets page and ticket generator modules'),
            (['auth', 'oauth', 'login', 'token'], 'authentication routes and session/token handling'),
            (['api', 'endpoint', 'route'], 'API route handlers and request/response validation'),
            (['database', 'schema', 'migration', 'sql'], 'database models, migrations, and persistence layer'),
            (['ui', 'frontend', 'component', 'page', 'button', 'form'], 'UI components and page-level state management'),
            (['test', 'jest', 'pytest', 'coverage'], 'unit/integration test suites and fixtures'),
            (['recommendation', 'ml', 'model', 'estimation'], 'estimation/recommendation logic and metric computations'),
        ]

        for keywords, label in mapping:
            if any(keyword in lowered for keyword in keywords):
                components.append(f"- {label}")

        if not components:
            components.append("- core application modules associated with this feature scope")

        return "\n".join(components[:6])

    def _extract_dependencies(self, description: str) -> str:
        """Infer runtime or implementation dependencies from language cues"""
        lowered = description.lower()
        deps: List[str] = []

        if any(keyword in lowered for keyword in ['github', 'oauth', 'token', 'api']):
            deps.append("- External GitHub API availability and valid OAuth token/cookies")
        if any(keyword in lowered for keyword in ['database', 'sqlite', 'schema', 'migration']):
            deps.append("- Database schema consistency and migration compatibility")
        if any(keyword in lowered for keyword in ['test', 'jest', 'pytest']):
            deps.append("- Test tooling configuration and representative fixtures")
        if any(keyword in lowered for keyword in ['performance', 'benchmark']):
            deps.append("- Baseline metrics for before/after performance comparison")

        deps.append("- Environment variables configured for local/dev execution")

        unique_deps: List[str] = []
        for item in deps:
            if item not in unique_deps:
                unique_deps.append(item)

        return "\n".join(unique_deps[:6])

    def _build_implementation_plan(self, description: str, context: str) -> str:
        """Produce a concise implementation sequence based on context and text"""
        lowered = description.lower()
        steps: List[str] = [
            "1. Confirm scope, inputs/outputs, and non-functional constraints",
            "2. Implement core behavior with minimal vertical slice first",
            "3. Add validation/error handling and edge-case protection",
        ]

        if any(keyword in lowered for keyword in ['database', 'schema', 'migration']):
            steps.append("4. Apply persistence/schema changes and verify backward compatibility")
        elif any(keyword in lowered for keyword in ['api', 'endpoint', 'route']):
            steps.append("4. Update API contracts and ensure response stability")
        elif any(keyword in lowered for keyword in ['ui', 'frontend', 'component', 'page']):
            steps.append("4. Connect UI state/events and verify interaction flow")
        else:
            steps.append("4. Integrate with adjacent modules and maintain existing behavior")

        if context.lower() in ['full-stack', 'backend']:
            steps.append("5. Add telemetry/logging for observability of the new workflow")
        else:
            steps.append("5. Validate visual and interaction behavior across key states")

        return "\n".join(steps)

    def _build_testing_requirements(self, description: str, context: str) -> str:
        """Generate context-aware testing checklist"""
        lowered = description.lower()
        checks: List[str] = []

        if context.lower() in ['frontend', 'full-stack'] or any(
            keyword in lowered for keyword in ['ui', 'component', 'page', 'form']
        ):
            checks.append("- [ ] Component/page interaction tests cover success and failure states")
            checks.append("- [ ] Accessibility sanity checks pass for keyboard and labels")

        if context.lower() in ['backend', 'full-stack'] or any(
            keyword in lowered for keyword in ['api', 'endpoint', 'database', 'schema']
        ):
            checks.append("- [ ] API contract tests validate status codes and response shape")
            checks.append("- [ ] Data-layer tests cover edge cases and invalid input handling")

        checks.append("- [ ] Regression test added for the primary user path")
        checks.append("- [ ] Manual smoke test executed in local environment")

        if any(keyword in lowered for keyword in ['performance', 'optimize', 'latency']):
            checks.append("- [ ] Performance comparison captured against baseline")

        return "\n".join(checks[:8])

    def _build_task_breakdown(self, description: str, context: str) -> str:
        """Build actionable work packages instead of generic text."""
        lowered = description.lower()
        items: List[str] = []

        if 'related products' in lowered and 'pdp' in lowered:
            items.extend([
                "### Backend",
                "- [ ] Add/validate many-to-many product relation model and migration",
                "- [ ] Expose `relatedProducts(productId, limit, filters)` query in API",
                "- [ ] Add fallback strategy when no explicit related products exist",
                "",
                "### Frontend",
                "- [ ] Add Related Products section component on PDP",
                "- [ ] Render mini-PLP style product grid with loading/empty states",
                "- [ ] Add filter controls required for the mini-PLP scope",
                "",
                "### Integration",
                "- [ ] Connect PDP data fetch to backend related-products query",
                "- [ ] Verify pagination/limit behavior and consistent product card rendering",
            ])

        if any(keyword in lowered for keyword in ['database', 'migration', 'schema', 'many to many']):
            items.extend([
                "",
                "### Data",
                "- [ ] Document schema change and rollback path",
                "- [ ] Seed/update test data for new relations",
            ])

        if context.lower() in ['full-stack', 'frontend'] and not any('### Frontend' in x for x in items):
            items.extend([
                "",
                "### Frontend",
                "- [ ] Build UI behavior and wire state transitions",
                "- [ ] Add user feedback for loading/error/success states",
            ])

        if context.lower() in ['full-stack', 'backend'] and not any('### Backend' in x for x in items):
            items.extend([
                "",
                "### Backend",
                "- [ ] Implement API/data logic with validation and error handling",
                "- [ ] Add telemetry/logging for key actions and failures",
            ])

        if not items:
            items = [
                "- [ ] Define final API/UI contract",
                "- [ ] Implement core behavior",
                "- [ ] Add tests and docs for changed behavior",
            ]

        return "\n".join(items).strip()

    def _determine_priority(self, description: str, estimation: Dict) -> str:
        """Infer a lightweight priority tier from risk/urgency language and effort"""
        lowered = description.lower()
        estimated_hours = float(estimation.get('hours', 0) or 0)

        urgent_terms = ['urgent', 'critical', 'blocker', 'security', 'production', 'outage', 'hotfix']
        high_impact_terms = ['payment', 'auth', 'checkout', 'data loss', 'compliance']

        if any(term in lowered for term in urgent_terms):
            return 'P0'
        if any(term in lowered for term in high_impact_terms):
            return 'P1'
        if estimated_hours >= 16:
            return 'P1'
        if estimated_hours >= 6:
            return 'P2'
        return 'P3'

    def _build_definition_of_done(self, description: str, context: str) -> str:
        """Generate adaptive definition of done checklist"""
        lowered = description.lower()
        done = [
            "- [ ] All acceptance criteria are satisfied",
            "- [ ] Automated tests are green in CI/local",
            "- [ ] Code reviewed and approved",
            "- [ ] User-facing or developer docs updated",
            "- [ ] No regressions observed in related flows",
        ]

        if context.lower() in ['backend', 'full-stack'] or any(
            keyword in lowered for keyword in ['api', 'database', 'schema']
        ):
            done.append("- [ ] API/data compatibility validated for existing consumers")

        if context.lower() in ['frontend', 'full-stack'] or any(
            keyword in lowered for keyword in ['ui', 'page', 'component']
        ):
            done.append("- [ ] UX/accessibility checks completed for key screens")

        return "\n".join(done[:8])
    
    def _extract_title(self, description: str) -> str:
        """Extract a concise title from description"""
        description_lower = description.lower()

        if 'related products' in description_lower and 'pdp' in description_lower:
            if any(keyword in description_lower for keyword in ['many-to-many', 'data model', 'schema', 'database']):
                return 'Implement PDP related-products data model and relations'
            if any(keyword in description_lower for keyword in ['api', 'graphql', 'query', 'endpoint']):
                return 'Implement PDP related-products API and query integration'
            if any(keyword in description_lower for keyword in ['filter', 'mini plp', 'cards', 'ui', 'component']):
                return 'Implement PDP related-products mini-PLP UI with filters'
            return 'Implement PDP related-products section end to end'

        first_sentence = description.split('.')[0].split('\n')[0].strip()

        if not first_sentence:
            return "New Feature Implementation"

        cleaned = re.sub(r'\s+', ' ', first_sentence)
        cleaned = re.sub(
            r'^(please\s+|can you\s+|i want to\s+|i need to\s+|we need to\s+|let\'s\s+)',
            '',
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.split(r'\b(which means|that means|then|basically)\b', cleaned, flags=re.IGNORECASE)[0]
        cleaned = re.sub(r'\b(i\'m|im|we\'re|were)\s+gonna\s+', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\b(gonna|going to|have to|need to)\b', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip(' ,.-:')

        action_prefixes = [
            'add', 'implement', 'create', 'build', 'fix', 'improve', 'update', 'refactor', 'support', 'enable'
        ]

        words = cleaned.split()
        if words and words[0].lower() in action_prefixes:
            cleaned = f"{words[0].capitalize()} {' '.join(words[1:])}".strip()
        elif cleaned:
            cleaned = cleaned[0].upper() + cleaned[1:]

        words = cleaned.split()
        if len(words) > 10:
            cleaned = ' '.join(words[:10])

        title = cleaned[:72].strip(' -:')
        return title if title else "New Feature Implementation"
    
    def _generate_ticket_id(self) -> str:
        """Generate a ticket ID"""
        timestamp = datetime.now().strftime('%y%m%d%H%M%S')
        return f"TICKET-{timestamp}"
