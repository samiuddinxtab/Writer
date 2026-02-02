export interface Section {
  id: number;
  name: string;
  slug: string;
  order_index?: number;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  section_id: number;
  section?: Pick<Section, 'name' | 'slug'>;
  published_at: string;
  updated_at: string;
  is_pinned: boolean;
}

export interface AdminArticleListItem {
  id: number;
  title: string;
  slug: string;
  updated_at: string;
  published_at: string | null;
  section: {
    id: number;
    name: string;
  };
}

export interface AdminArticleInput {
  title: string;
  content: string;
  section_id: number;
}

export interface AdminArticleResponse {
  id: number;
  createdAt?: string;
  updatedAt: string;
}
