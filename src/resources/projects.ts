import { StorageService } from "../services/storage.js";
import { ProjectListResponse } from "../types.js";

export async function listProjectsResource(
  storage: StorageService
): Promise<any> {
  try {
    const projectsList = storage.listProjects();
    const projects = projectsList.map((p) => ({
      ...p,
      status: p.status as any,
    }));
    const response: ProjectListResponse = {
      projects,
    };

    return {
      contents: [
        {
          uri: "projects://list",
          mimeType: "application/json",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      contents: [
        {
          uri: "projects://list",
          mimeType: "text/plain",
          text: `Error: ${errorMessage}`,
        },
      ],
    };
  }
}

export async function getProjectResource(
  projectId: string,
  storage: StorageService
): Promise<any> {
  try {
    const project = storage.getProject(projectId);
    if (!project) {
      return {
        contents: [
          {
            uri: `project://${projectId}`,
            mimeType: "text/plain",
            text: `Project not found: ${projectId}`,
          },
        ],
      };
    }

    return {
      contents: [
        {
          uri: `project://${projectId}`,
          mimeType: "application/json",
          text: JSON.stringify(project, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      contents: [
        {
          uri: `project://${projectId}`,
          mimeType: "text/plain",
          text: `Error: ${errorMessage}`,
        },
      ],
    };
  }
}

export async function getProjectImagesResource(
  projectId: string,
  storage: StorageService
): Promise<any> {
  try {
    const project = storage.getProject(projectId);
    if (!project) {
      return {
        contents: [
          {
            uri: `project://${projectId}/images`,
            mimeType: "text/plain",
            text: `Project not found: ${projectId}`,
          },
        ],
      };
    }

    const imagesList = Object.entries(project.images).map(([page, path]) => ({
      page: parseInt(page),
      path,
    }));

    return {
      contents: [
        {
          uri: `project://${projectId}/images`,
          mimeType: "application/json",
          text: JSON.stringify(imagesList, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      contents: [
        {
          uri: `project://${projectId}/images`,
          mimeType: "text/plain",
          text: `Error: ${errorMessage}`,
        },
      ],
    };
  }
}
