import path from "path";
import { fileURLToPath } from "url";
import { Project, Page } from "../types.js";
import fs from "fs";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

function getDataDir(): string {
  return getRequiredEnv("DATA_DIR");
}

function getProjectsFile(): string {
  return path.join(getDataDir(), "projects.json");
}

interface ProjectsStore {
  projects: Record<string, Project>;
}

export class StorageService {
  private store: ProjectsStore;
  private dataDir: string;
  private projectsFile: string;

  constructor() {
    this.dataDir = getDataDir();
    this.projectsFile = getProjectsFile();

    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Load or initialize projects store
    if (fs.existsSync(this.projectsFile)) {
      const data = fs.readFileSync(this.projectsFile, "utf-8");
      this.store = JSON.parse(data);
    } else {
      this.store = { projects: {} };
      this.save();
    }
  }

  private save(): void {
    fs.writeFileSync(this.projectsFile, JSON.stringify(this.store, null, 2));
  }

  createProject(
    id: string,
    theme: string,
    outline: Page[],
    referenceImage?: string
  ): Project {
    const now = new Date().toISOString();
    const project: Project = {
      id,
      theme,
      referenceImage,
      outline,
      images: {},
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    this.store.projects[id] = project;
    this.save();
    return project;
  }

  getProject(projectId: string): Project | null {
    return this.store.projects[projectId] || null;
  }

  updateProject(projectId: string, updates: Partial<Project>): Project {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const now = new Date().toISOString();
    const updatedProject = { ...project, ...updates, updatedAt: now };

    this.store.projects[projectId] = updatedProject;
    this.save();
    return updatedProject;
  }

  listProjects(): Array<{
    id: string;
    theme: string;
    pageCount: number;
    status: string;
    createdAt: string;
  }> {
    return Object.values(this.store.projects)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((project) => ({
        id: project.id,
        theme: project.theme,
        pageCount: project.outline.length,
        status: project.status,
        createdAt: project.createdAt,
      }));
  }

  deleteProject(projectId: string): void {
    delete this.store.projects[projectId];
    this.save();
  }

  getLatestProject(): Project | null {
    const projects = Object.values(this.store.projects);
    if (projects.length === 0) {
      return null;
    }
    // 按创建时间排序，返回最新的项目
    return projects.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }

  close(): void {
    // No-op for file-based storage
  }
}
