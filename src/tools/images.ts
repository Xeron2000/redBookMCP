import { GenerateImagesRequest, GenerateImagesResponse } from "../types.js";
import { StorageService } from "../services/storage.js";
import { AIService } from "../services/ai.js";

export async function generateImagesHandler(
  args: GenerateImagesRequest,
  storage: StorageService,
  ai: AIService
): Promise<any> {
  // Validate input
  if (!args.projectId || typeof args.projectId !== "string") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: {
              code: "INVALID_INPUT",
              message: "Project ID is required and must be a string",
            },
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    // Get project
    const project = storage.getProject(args.projectId);
    if (!project) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: {
                code: "PROJECT_NOT_FOUND",
                message: `Project not found: ${args.projectId}`,
              },
            }),
          },
        ],
        isError: true,
      };
    }

    // Generate images
    const images = await ai.generateImages(
      project.outline,
      project.theme,
      args.projectId,
      args.pages
    );

    // Update project with images
    storage.updateProject(args.projectId, {
      images,
      status: "completed",
    });

    const response: GenerateImagesResponse = {
      status: "completed",
      images,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: {
              code: "GENERATION_FAILED",
              message: errorMessage,
            },
          }),
        },
      ],
      isError: true,
    };
  }
}
