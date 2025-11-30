import { UpdateOutlineRequest, UpdateOutlineResponse } from "../types.js";
import { StorageService } from "../services/storage.js";

export async function updateOutlineHandler(
  args: UpdateOutlineRequest,
  storage: StorageService
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

  if (!args.outline || !Array.isArray(args.outline)) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: {
              code: "INVALID_INPUT",
              message: "Outline is required and must be an array",
            },
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    // Check if project exists
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

    // Update project
    storage.updateProject(args.projectId, {
      outline: args.outline,
    });

    const response: UpdateOutlineResponse = {
      success: true,
      message: "Outline updated successfully",
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
              code: "UPDATE_FAILED",
              message: errorMessage,
            },
          }),
        },
      ],
      isError: true,
    };
  }
}
