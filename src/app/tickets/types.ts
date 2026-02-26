export interface GeneratedTicket {
  id: string;
  title: string;
  markdown: string;
  estimation: {
    hours: number;
    range: [number, number];
    confidence: number;
  };
  similar_tasks?: Array<{
    title: string;
    actual_hours: number;
    similarity: number;
  }>;
}

export interface TicketHistoryEntry {
  id: number;
  ticket_id: string;
  title: string;
  context: string;
  estimated_hours: number;
  estimate_low: number;
  estimate_high: number;
  confidence: number;
  predicted_commits: number;
  created_at: string;
}

export interface TicketStats {
  tickets_generated: number;
  github_commits_overall: number;
  avg_commits_per_ticket: number;
  avg_estimated_hours_per_ticket: number;
  avg_actual_merge_time_hours: number;
  median_actual_merge_time_hours: number;
  p90_actual_merge_time_hours: number;
  forecast_hours_next_ticket: number;
  ticket_velocity_per_week: number;
  historical_prs_analyzed: number;
}

export interface RepoStatsSnapshot {
  repo_name: string;
  avg_time_to_merge: number;
  total_branches_analyzed: number;
  cache_age: string;
}
