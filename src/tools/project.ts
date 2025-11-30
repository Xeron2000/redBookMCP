import { StorageService } from "../services/storage.js";

export async function getProjectHandler(
  args: any,
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

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(project),
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
              code: "RETRIEVAL_FAILED",
              message: errorMessage,
            },
          }),
        },
      ],
      isError: true,
    };
  }
}
