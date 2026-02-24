"""
Ticket estimation engine using statistical analysis and machine learning
"""
from typing import Dict, List, Tuple, Optional
import re
from datetime import datetime
import numpy as np
from scipy import stats
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

class TicketEstimator:
    def __init__(self):
        # Complexity keywords for categorization
        self.complexity_indicators = {
            'high': ['refactor', 'architecture', 'migration', 'integration', 'security', 
                    'authentication', 'authorization', 'payment', 'database', 'real-time', 
                    'websocket', 'performance', 'optimization'],
            'medium': ['api', 'form', 'validation', 'state management', 'routing', 'modal',
                      'dashboard', 'chart', 'table', 'search', 'filter', 'pagination'],
            'low': ['button', 'icon', 'text', 'color', 'style', 'css', 'toggle', 'link',
                   'fix', 'update', 'change']
        }
        
        # Fallback values only used when no historical data exists
        self.fallback_hours = {
            'frontend': 2,
            'backend': 3,
            'full-stack': 3,
            'infrastructure': 5,
            'testing': 2
        }
        
        # ML models (initialized when enough data available)
        self.regression_model = None
        self.scaler = StandardScaler()
        self.vectorizer = TfidfVectorizer(max_features=50, stop_words='english')
    
    def estimate(self, task_description: str, context: str, repo_metrics: Optional[Dict] = None, 
                 historical_tasks: Optional[List[Dict]] = None) -> Dict:
        """
        Estimate task completion time using statistical analysis and ML
        
        Args:
            task_description: Natural language description of the task
            context: Type of work (frontend/backend/full-stack/etc.)
            repo_metrics: Historical metrics from the repository
            historical_tasks: List of historical tasks for ML training
        
        Returns:
            Dictionary with estimation details including confidence intervals
        """
        # Statistical analysis of historical data
        if historical_tasks and len(historical_tasks) >= 5:
            times = [t.get('time_to_merge_hours', 0) for t in historical_tasks if t.get('time_to_merge_hours', 0) > 0]
            
            if len(times) >= 5:
                # Remove outliers using IQR method
                times_clean = self._remove_outliers(times)
                
                # Use robust statistics
                median_time = np.median(times_clean)
                mean_time = np.mean(times_clean)
                std_time = np.std(times_clean)
                
                # Try ML prediction if enough data
                ml_prediction = self._ml_predict(task_description, historical_tasks)
                
                if ml_prediction is not None:
                    base_hours = ml_prediction
                    method = "ml-model"
                else:
                    # Use median (more robust than mean)
                    base_hours = median_time
                    method = "statistical"
            else:
                base_hours = repo_metrics.get('median_time_to_merge_hours', 3) if repo_metrics else 3
                method = "data-driven"
        elif repo_metrics and repo_metrics.get('total_merged_prs', 0) > 0:
            base_hours = repo_metrics.get('median_time_to_merge_hours', 
                                         repo_metrics.get('avg_time_to_merge_hours', 3))
            method = "data-driven"
        else:
            base_hours = self.fallback_hours.get(context.lower(), 3)
            method = "fallback"
        
        # Detect complexity category
        complexity_category = self._detect_complexity(task_description)
        complexity_adjustment = self._get_complexity_adjustment(complexity_category)
        
        # Scope adjustment
        scope_adjustment = self._calculate_scope_adjustment(task_description)
        
        # Calculate final estimation
        estimated_hours = base_hours * complexity_adjustment * scope_adjustment
        estimated_hours = max(0.5, min(estimated_hours, 40))
        estimated_hours = round(estimated_hours, 1)
        
        # Calculate confidence interval using statistical methods
        confidence_level = 0.8  # 80% confidence interval
        if historical_tasks and len(historical_tasks) >= 5:
            times = [t.get('time_to_merge_hours', 0) for t in historical_tasks if t.get('time_to_merge_hours', 0) > 0]
            if len(times) >= 5:
                times_clean = self._remove_outliers(times)
                ci_low, ci_high = self._calculate_confidence_interval(times_clean, confidence_level)
                
                # Adjust CI based on complexity
                range_low = round(ci_low * complexity_adjustment * scope_adjustment, 1)
                range_high = round(ci_high * complexity_adjustment * scope_adjustment, 1)
            else:
                range_low = round(estimated_hours * 0.7, 1)
                range_high = round(estimated_hours * 1.3, 1)
        else:
            # Fallback to percentage-based range
            range_low = round(estimated_hours * 0.7, 1)
            range_high = round(estimated_hours * 1.3, 1)
        
        # Calculate confidence score
        confidence = self._calculate_confidence(repo_metrics, task_description, historical_tasks)
        
        # Distribution analysis
        distribution_stats = None
        if historical_tasks and len(historical_tasks) >= 10:
            distribution_stats = self._analyze_distribution(historical_tasks)
        
        result = {
            "hours": estimated_hours,
            "range": [max(0.5, range_low), range_high],
            "confidence": confidence,
            "factors": {
                "base_hours": round(base_hours, 2),
                "complexity": complexity_category,
                "complexity_adjustment": round(complexity_adjustment, 2),
                "scope_adjustment": round(scope_adjustment, 2),
                "method": method
            }
        }
        
        if distribution_stats:
            result["distribution"] = distribution_stats
        
        return result
    
    def _detect_complexity(self, description: str) -> str:
        """Detect complexity category from description keywords"""
        description_lower = description.lower()
        
        # Count matches in each category
        high_matches = sum(1 for kw in self.complexity_indicators['high'] if kw in description_lower)
        medium_matches = sum(1 for kw in self.complexity_indicators['medium'] if kw in description_lower)
        low_matches = sum(1 for kw in self.complexity_indicators['low'] if kw in description_lower)
        
        # Determine category
        if high_matches > 0:
            return 'high'
        elif medium_matches > 0:
            return 'medium'
        elif low_matches > 0:
            return 'low'
        else:
            return 'medium'  # Default to medium for unknown tasks
    
    def _get_complexity_adjustment(self, complexity: str) -> float:
        """Get adjustment factor based on complexity category"""
        adjustments = {
            'low': 0.6,     # 40% less time than typical
            'medium': 1.0,  # Baseline
            'high': 1.5     # 50% more time than typical
        }
        return adjustments.get(complexity, 1.0)
    
    def _calculate_scope_adjustment(self, description: str) -> float:
        """Adjust based on description detail level"""
        words = len(description.split())
        sentences = len(re.split(r'[.!?]+', description))
        
        # More detailed descriptions suggest larger scope
        if words < 15:
            return 0.7  # Very small task
        elif words < 30:
            return 0.9  # Small task
        elif words < 60:
            return 1.0  # Medium task
        elif words < 120:
            return 1.2  # Large task
        else:
            return 1.4  # Very large task
    
    def _calculate_confidence(self, repo_metrics: Optional[Dict], description: str, 
                             historical_tasks: Optional[List[Dict]] = None) -> float:
        """Calculate confidence level based on available data quality and statistical significance"""
        confidence = 0.3  # Start lower without data
        
        # Historical data quality is the primary confidence factor
        if repo_metrics:
            pr_count = repo_metrics.get('total_merged_prs', 0)
            
            # More PRs = better statistical confidence
            if pr_count >= 50:
                confidence = 0.85
            elif pr_count >= 20:
                confidence = 0.75
            elif pr_count >= 10:
                confidence = 0.65
            elif pr_count >= 5:
                confidence = 0.55
            elif pr_count > 0:
                confidence = 0.45
            
            # Consistency in repo (low variance) = higher confidence
            if pr_count > 0:
                min_time = repo_metrics.get('min_time_to_merge_hours', 0)
                max_time = repo_metrics.get('max_time_to_merge_hours', 0)
                avg_time = repo_metrics.get('avg_time_to_merge_hours', 1)
                
                if avg_time > 0:
                    variance_ratio = (max_time - min_time) / avg_time
                    if variance_ratio < 2:  # Very consistent
                        confidence += 0.1
                    elif variance_ratio > 10:  # Very inconsistent
                        confidence -= 0.1
        
        # Statistical significance from distribution analysis
        if historical_tasks and len(historical_tasks) >= 10:
            times = [t.get('time_to_merge_hours', 0) for t in historical_tasks if t.get('time_to_merge_hours', 0) > 0]
            if len(times) >= 10:
                # Calculate coefficient of variation (lower = more predictable)
                cv = np.std(times) / np.mean(times) if np.mean(times) > 0 else 1
                if cv < 0.3:  # Very low variation
                    confidence += 0.05
                elif cv > 1.0:  # High variation
                    confidence -= 0.05
        
        # Task description clarity adds minor confidence boost
        words = len(description.split())
        if words > 40:
            confidence += 0.05
        elif words < 10:
            confidence -= 0.05
        
        # Cap between 0.2 and 0.95
        return max(0.2, min(confidence, 0.95))
    
    def _remove_outliers(self, data: List[float]) -> np.ndarray:
        """Remove outliers using IQR method (Tukey's fences)"""
        arr = np.array(data)
        q1 = np.percentile(arr, 25)
        q3 = np.percentile(arr, 75)
        iqr = q3 - q1
        
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        # Keep values within bounds
        mask = (arr >= lower_bound) & (arr <= upper_bound)
        return arr[mask] if mask.any() else arr
    
    def _calculate_confidence_interval(self, data: np.ndarray, confidence_level: float = 0.8) -> Tuple[float, float]:
        """Calculate confidence interval using t-distribution"""
        if len(data) < 2:
            mean = data[0] if len(data) == 1 else 0
            return (mean * 0.7, mean * 1.3)
        
        mean = np.mean(data)
        se = stats.sem(data)  # Standard error
        
        # Use t-distribution for small samples
        ci = stats.t.interval(confidence_level, len(data) - 1, loc=mean, scale=se)
        
        return (max(0.5, ci[0]), ci[1])
    
    def _ml_predict(self, task_description: str, historical_tasks: List[Dict]) -> Optional[float]:
        """Use machine learning to predict task duration"""
        if len(historical_tasks) < 10:
            return None
        
        try:
            # Prepare training data
            X_features = []
            y_times = []
            texts = []
            
            for task in historical_tasks:
                time = task.get('time_to_merge_hours', 0)
                if time > 0:
                    branch_name = task.get('branch_name', '')
                    commits = task.get('commits_count', 0)
                    files = task.get('files_changed', 0)
                    
                    texts.append(branch_name)
                    X_features.append([commits, files])
                    y_times.append(time)
            
            if len(y_times) < 10:
                return None
            
            # Remove outliers from training data
            y_array = np.array(y_times)
            y_clean = self._remove_outliers(y_array)
            
            # Find indices of non-outlier values
            outlier_threshold_low = np.min(y_clean)
            outlier_threshold_high = np.max(y_clean)
            clean_indices = [i for i, y in enumerate(y_times) 
                           if outlier_threshold_low <= y <= outlier_threshold_high]
            
            X_features_clean = [X_features[i] for i in clean_indices]
            y_times_clean = [y_times[i] for i in clean_indices]
            texts_clean = [texts[i] for i in clean_indices]
            
            # TF-IDF vectorization of branch names
            tfidf_matrix = self.vectorizer.fit_transform(texts_clean)
            
            # Combine TF-IDF with numerical features
            X_numerical = np.array(X_features_clean)
            X_combined = np.hstack([tfidf_matrix.toarray(), X_numerical])
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X_combined)
            
            # Train linear regression
            model = LinearRegression()
            model.fit(X_scaled, y_times_clean)
            
            # Predict for new task
            # Use median values for unknown numerical features
            median_commits = np.median([x[0] for x in X_features_clean])
            median_files = np.median([x[1] for x in X_features_clean])
            
            new_tfidf = self.vectorizer.transform([task_description])
            new_features = np.hstack([new_tfidf.toarray(), [[median_commits, median_files]]])
            new_scaled = self.scaler.transform(new_features)
            
            prediction = model.predict(new_scaled)[0]
            
            # Ensure reasonable bounds
            prediction = max(0.5, min(prediction, np.percentile(y_times_clean, 95)))
            
            return prediction
            
        except Exception as e:
            # Silently fall back to statistical method if ML fails
            return None
    
    def _analyze_distribution(self, historical_tasks: List[Dict]) -> Dict:
        """Analyze the distribution of historical task completion times"""
        times = [t.get('time_to_merge_hours', 0) for t in historical_tasks if t.get('time_to_merge_hours', 0) > 0]
        
        if len(times) < 5:
            return {}
        
        times_clean = self._remove_outliers(times)
        
        # Test for normality (Shapiro-Wilk test)
        if len(times_clean) >= 3:
            _, p_value = stats.shapiro(times_clean)
            is_normal = p_value > 0.05
        else:
            is_normal = False
        
        # Calculate percentiles
        percentiles = {
            'p10': round(np.percentile(times_clean, 10), 1),
            'p25': round(np.percentile(times_clean, 25), 1),
            'p50': round(np.percentile(times_clean, 50), 1),
            'p75': round(np.percentile(times_clean, 75), 1),
            'p90': round(np.percentile(times_clean, 90), 1),
        }
        
        # Skewness (asymmetry of distribution)
        skewness = stats.skew(times_clean)
        
        return {
            'is_normal_distribution': is_normal,
            'percentiles': percentiles,
            'skewness': round(skewness, 2),
            'interpretation': self._interpret_skewness(skewness)
        }
    
    def _interpret_skewness(self, skewness: float) -> str:
        """Interpret the skewness value"""
        if skewness > 1:
            return "Positively skewed: Most tasks complete quickly, some take much longer"
        elif skewness < -1:
            return "Negatively skewed: Most tasks take longer, some complete very quickly"
        else:
            return "Symmetric: Tasks are evenly distributed around the average"
    
    def find_similar_tasks(self, task_description: str, historical_tasks: List[Dict], limit: int = 3) -> List[Dict]:
        """
        Find similar historical tasks using TF-IDF and cosine similarity
        
        Args:
            task_description: Description of the new task
            historical_tasks: List of historical tasks with branch names and metrics
            limit: Maximum number of similar tasks to return
        
        Returns:
            List of similar tasks with similarity scores
        """
        if not historical_tasks or len(historical_tasks) < 2:
            return []
        
        try:
            # Prepare documents (branch names)
            documents = [task.get('branch_name', '') for task in historical_tasks]
            documents.append(task_description)
            
            # Create TF-IDF matrix
            vectorizer = TfidfVectorizer(stop_words='english', max_features=100)
            tfidf_matrix = vectorizer.fit_transform(documents)
            
            # Calculate cosine similarity between new task and all historical tasks
            new_task_vector = tfidf_matrix[-1]
            historical_vectors = tfidf_matrix[:-1]
            
            similarities = cosine_similarity(new_task_vector, historical_vectors).flatten()
            
            # Get top similar tasks
            top_indices = np.argsort(similarities)[::-1][:limit]
            
            results = []
            for idx in top_indices:
                if similarities[idx] > 0.05:  # Only include if some similarity
                    task = historical_tasks[idx]
                    results.append({
                        "title": self._format_branch_name(task.get('branch_name', '')),
                        "actual_hours": round(task.get('time_to_merge_hours', 0), 1),
                        "similarity": round(float(similarities[idx]), 2),
                        "commits": task.get('commits_count', 0),
                        "files_changed": task.get('files_changed', 0)
                    })
            
            return results
            
        except Exception:
            # Fallback to simple keyword matching if ML approach fails
            return self._find_similar_tasks_fallback(task_description, historical_tasks, limit)
    
    def _find_similar_tasks_fallback(self, task_description: str, historical_tasks: List[Dict], limit: int) -> List[Dict]:
        """Fallback method using simple keyword matching"""
        task_keywords = self._extract_keywords(task_description.lower())
        
        similarities = []
        for task in historical_tasks:
            branch_name = task.get('branch_name', '').lower()
            similarity = self._calculate_similarity(task_keywords, branch_name)
            
            if similarity > 0.1:
                similarities.append({
                    "title": self._format_branch_name(task.get('branch_name', '')),
                    "actual_hours": round(task.get('time_to_merge_hours', 0), 1),
                    "similarity": round(similarity, 2),
                    "commits": task.get('commits_count', 0),
                    "files_changed": task.get('files_changed', 0)
                })
        
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        return similarities[:limit]
    
    def _extract_keywords(self, text: str) -> set:
        """Extract meaningful keywords from text"""
        # Remove common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                     'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being'}
        
        words = re.findall(r'\b\w+\b', text.lower())
        return set(w for w in words if w not in stop_words and len(w) > 2)
    
    def _calculate_similarity(self, keywords: set, branch_name: str) -> float:
        """Calculate similarity score between keywords and branch name"""
        branch_keywords = self._extract_keywords(branch_name)
        
        if not branch_keywords:
            return 0.0
        
        intersection = keywords.intersection(branch_keywords)
        union = keywords.union(branch_keywords)
        
        # Jaccard similarity
        return len(intersection) / len(union) if union else 0.0
    
    def _format_branch_name(self, branch_name: str) -> str:
        """Format branch name into a readable title"""
        # Remove common prefixes
        name = re.sub(r'^(feature|feat|fix|bugfix|hotfix|chore)[/-]', '', branch_name)
        # Replace separators with spaces
        name = re.sub(r'[-_/]', ' ', name)
        # Capitalize
        return name.title()
