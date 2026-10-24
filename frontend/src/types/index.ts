export interface Review {
  id: number;
  external_id?: string | null;
  product_id: number;
  product_name: string;
  rating: number;
  review_title?: string | null;
  review_text: string;
  review_date?: string | null;
  sentiment_label: 'Positive' | 'Neutral' | 'Negative';
  sentiment_score: number;
  reviewer_name?: string | null;
  verified_purchase?: boolean | null;
  created_at: string;
}

export interface PaginatedReviews {
  items: Review[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Product {
  id: number;
  name: string;
  external_id?: string | null;
  created_at: string;
  review_count: number;
  average_rating: number;
}

export interface RatingCount {
  rating: number;
  count: number;
  percentage: number;
}

export interface ProductRatingSummary {
  product_id: number;
  product_name: string;
  review_count: number;
  average_rating: number;
  min_rating: number;
  q1: number;
  median: number;
  q3: number;
  max_rating: number;
}

export interface DashboardSummary {
  total_reviews: number;
  average_rating: number;
  positive_sentiment_pct: number;
  neutral_sentiment_pct: number;
  negative_sentiment_pct: number;
  total_products: number;
  data_quality_score: number;
  rating_distribution: RatingCount[];
  sentiment_breakdown: {
    Positive: number;
    Neutral: number;
    Negative: number;
  };
  review_volume_trend: {
    date: string;
    count: number;
    sma_7?: number | null;
  }[];
  average_rating_trend: {
    date: string;
    rating: number;
  }[];
  top_rated_products: Product[];
  lowest_rated_products: Product[];
  recent_reviews: Review[];
  data_quality_summary: {
    total_processed: number;
    valid_rows: number;
    rejected_rows: number;
    quality_score: number;
  };
}

export interface RatingsAnalytics {
  distribution: RatingCount[];
  overall_stats: {
    mean: number;
    median: number;
    mode: number;
    std_dev: number;
    min: number;
    max: number;
    q1: number;
    q3: number;
    iqr: number;
  };
  product_distributions: ProductRatingSummary[];
}

export interface SentimentAnalytics {
  distribution: {
    Positive: number;
    Neutral: number;
    Negative: number;
  };
  sentiment_by_rating: {
    rating: number;
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    positive_pct: number;
    negative_pct: number;
  }[];
  sentiment_by_product: {
    product_name: string;
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    positive_pct: number;
    negative_pct: number;
  }[];
  methodology: {
    model: string;
    note: string;
    thresholds?: Record<string, string>;
  };
}

export interface TrendPoint {
  date: string;
  review_count: number;
  average_rating: number;
  sma_7?: number | null;
  ema_7?: number | null;
  is_forecast: boolean;
}

export interface TrendsAnalytics {
  points: TrendPoint[];
  forecast_available: boolean;
  forecast_message: string;
  summary: {
    total_dated_reviews: number;
    first_date?: string | null;
    last_date?: string | null;
    date_span_days: number;
    unique_temporal_points: number;
  };
}

export interface IssueExplanation {
  issue_type: string;
  count: number;
  impact: string;
  rule_applied: string;
}

export interface DataQualityReport {
  total_rows_processed: number;
  valid_rows: number;
  rejected_rows: number;
  duplicate_rows: number;
  missing_ratings: number;
  missing_text: number;
  invalid_ratings: number;
  invalid_dates: number;
  quality_score: number;
  before_after_comparison: {
    before: {
      total_rows: number;
      data_integrity: number;
      unclean_or_problematic_rows: number;
    };
    after: {
      clean_rows_in_database: number;
      data_integrity: number;
      schema_conformity: string;
    };
  };
  issue_explanations: IssueExplanation[];
  problematic_rows_sample: {
    row_number: number;
    raw_data: Record<string, string | null>;
    reasons: string[];
  }[];
}

export interface InsightItem {
  type: 'positive' | 'warning' | 'trend' | 'benchmark';
  title: string;
  detail: string;
  calculation_basis: string;
  confidence: 'High' | 'Moderate' | 'Limited Evidence';
}

export interface InsightsReport {
  insights: InsightItem[];
  common_negative_terms: { word: string; count: number }[];
  common_positive_terms: { word: string; count: number }[];
  reliability_assessment: {
    sample_size: number;
    confidence_level: string;
    summary: string;
  };
}

export interface PreviewResponse {
  filename: string;
  total_rows_detected: number;
  detected_columns: string[];
  sample_rows: Record<string, any>[];
  suggested_mapping: Record<string, string | null>;
  preliminary_quality: {
    total_rows: number;
    missing_ratings_count: number;
    missing_text_count: number;
    has_rating_column: boolean;
    has_text_column: boolean;
  };
}

export interface ImportSummary {
  job_id: number;
  filename: string;
  rows_processed: number;
  rows_imported: number;
  rows_rejected: number;
  rows_duplicate: number;
  status: string;
  issues_summary: Record<string, number>;
  rejected_rows_sample: {
    row_number: number;
    raw_data: Record<string, string | null>;
    reasons: string[];
  }[];
}
