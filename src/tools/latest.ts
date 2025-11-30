import { StorageService } from "../services/storage.js";

export async function listAllProjectsHandler(
  args: any,
  storage: StorageService
): Promise<any> {
  try {
    // 获取所有项目列表
    const projects = storage.listProjects();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            projects: projects,
            total: projects.length,
          }),
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
