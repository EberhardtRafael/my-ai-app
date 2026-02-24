"""
LLM-powered ticket generator
"""
import os
from typing import Dict, Optional
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
        
        # Extract a title from description
        title = self._extract_title(task_description)
        ticket_id = self._generate_ticket_id()
        
        similar_section = ""
        if similar_tasks:
            similar_section = "\n## Similar Historical Tasks\n\n"
            for task in similar_tasks:
                similar_section += f"- **{task['title']}**: {task['actual_hours']}h actual (similarity: {task['similarity']*100:.0f}%)\n"
        
        # Build estimation breakdown
        factors = estimation.get('factors', {})
        estimation_breakdown = f"""## Estimation Breakdown

**Total Estimated Time:** {estimation['hours']} hours
**Range:** {estimation['range'][0]}-{estimation['range'][1]} hours
**Confidence Level:** {estimation['confidence']*100:.0f}%

**Factors:**
- Base hours ({context}): {factors.get('base_hours', 0)}h
- Complexity multiplier: {factors.get('complexity_multiplier', 1.0)}x
- Scope multiplier: {factors.get('scope_multiplier', 1.0)}x
- Historical adjustment: {factors.get('history_adjustment', 1.0)}x
"""
        
        ticket = f"""# {ticket_id}: {title}

**Status:** 📝 Planned  
**Priority:** P2  
**Estimated:** {estimation['hours']}h ({estimation['confidence']*100:.0f}% confidence)  
**Context:** {context.title()}  
**Created:** {datetime.now().strftime('%Y-%m-%d')}

## User Story

As a developer/user,  
I want {task_description.lower()[:100]}{'...' if len(task_description) > 100 else ''}  
So that the application has improved functionality and user experience.

## Task Description

{task_description}

## Acceptance Criteria

- [ ] Core functionality implemented and working
- [ ] Code follows project conventions and best practices
- [ ] Unit tests written with >80% coverage
- [ ] Integration tests pass
- [ ] Documentation updated (README, inline comments)
- [ ] Code reviewed and approved
- [ ] No console errors or warnings
- [ ] Performance benchmarks met

## Technical Notes

**Context:** {context.title()} development

**Recommended Approach:**
1. Review existing similar implementations
2. Plan component/module structure
3. Implement core logic with tests
4. Add error handling and edge cases
5. Optimize and document

**Considerations:**
- Maintain backward compatibility
- Follow existing patterns in the codebase
- Consider performance implications
- Ensure accessibility standards

{estimation_breakdown}{similar_section}

## Testing Requirements

- [ ] Unit tests for all new functions/components
- [ ] Integration tests for API endpoints (if applicable)
- [ ] Manual testing across different scenarios
- [ ] Edge case testing
- [ ] Performance testing (if applicable)

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Tests passing (unit + integration)
- [ ] Code reviewed and approved
- [ ] Documentation complete
- [ ] Deployed to staging and verified
- [ ] No regressions in existing functionality

---

**Note:** This ticket was generated automatically based on repository history and task analysis. Adjust estimation and details as needed based on team knowledge.
"""
        return ticket
    
    def _extract_title(self, description: str) -> str:
        """Extract a concise title from description"""
        # Take first sentence or first 60 chars
        first_sentence = description.split('.')[0].split('\n')[0]
        title = first_sentence[:60].strip()
        
        # Capitalize properly
        if title and not title[0].isupper():
            title = title[0].upper() + title[1:]
        
        return title if title else "New Feature Implementation"
    
    def _generate_ticket_id(self) -> str:
        """Generate a ticket ID"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M')
        return f"TICKET-{timestamp[-6:]}"
