/**
 * Page type for outline content
 */
export type PageType = "cover" | "content" | "summary";

/**
 * Project status
 */
export type ProjectStatus = "draft" | "generating" | "completed";

/**
 * Single page in an outline
 */
export interface Page {
  pageNumber: number;
  type: PageType;
  title?: string;
  subtitle?: string;
  content: string;
  imagePrompt?: string;
}

/**
 * Complete project data
 */
export interface Project {
  id: string;
  theme: string;
  referenceImage?: string;
  outline: Page[];
  images: Record<number, string>; // page number -> image path
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request to generate outline
 */
export interface GenerateOutlineRequest {
  theme: string;
  referenceImage?: string;
  pageCount?: number;
  language?: string;
  useEmoji?: boolean;
}

/**
 * Response from generate outline
 */
export interface GenerateOutlineResponse {
  projectId: string;
  outline: Page[];
  createdAt: string;
}

/**
 * Request to update outline
 */
export interface UpdateOutlineRequest {
  projectId: string;
  outline: Page[];
}

/**
 * Response from update outline
 */
export interface UpdateOutlineResponse {
  success: boolean;
  message: string;
}

/**
 * Request to generate images
 */
export interface GenerateImagesRequest {
  projectId: string;
  pages?: number[];
}

/**
 * Response from generate images
 */
export interface GenerateImagesResponse {
  status: "completed" | "failed";
  images: Record<number, string>;
  errors?: Record<number, string>;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Project list response
 */
export interface ProjectListResponse {
  projects: Array<{
    id: string;
    theme: string;
    pageCount: number;
    status: ProjectStatus;
    createdAt: string;
  }>;
}
