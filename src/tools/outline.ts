import { v4 as uuidv4 } from "uuid";
import { GenerateOutlineResponse } from "../types.js";
import { StorageService } from "../services/storage.js";
import { AIService } from "../services/ai.js";

/**
 * 生成小红书图文大纲
 * 
 * 使用提示词：.kiro/prompts/xiaohongshu-outline.md
 * 
 * 此工具接收由 Claude Agent 生成的大纲文本，并将其解析为结构化的页面数据。
 * Claude 应该使用 .kiro/prompts/xiaohongshu-outline.md 中的提示词来生成符合格式的大纲。
 * 
 * 大纲格式要求：
 * - 使用 <page> 标签分割每一页
 * - 每页开头标注类型：[封面]、[内容]、[总结]
 * - 内容要详细、具体、专业、有价值
 */
export async function generateOutlineHandler(
  args: any,
  storage: StorageService,
  ai: AIService
): Promise<any> {
  // Validate input
  if (!args.theme || typeof args.theme !== "string") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: {
              code: "INVALID_INPUT",
              message: "Theme is required and must be a string",
            },
          }),
        },
      ],
      isError: true,
    };
  }

  // 大纲文本由 Claude Agent 生成
  if (!args.outline || typeof args.outline !== "string") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: {
              code: "INVALID_INPUT",
              message: "Outline text is required and must be a string",
            },
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    // Parse outline from agent-generated text
    const outline = ai.parseOutlineFromAgent(args.outline);

    // Validate outline
    if (!outline || outline.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: {
                code: "PARSE_FAILED",
                message: "Failed to parse outline",
              },
            }),
          },
        ],
        isError: true,
      };
    }

    // Create project
    const projectId = uuidv4();
    const project = storage.createProject(
      projectId,
      args.theme,
      outline,
      args.referenceImage
    );

    const response: GenerateOutlineResponse = {
      projectId: project.id,
      outline: project.outline,
      createdAt: project.createdAt,
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
              code: "PARSE_ERROR",
              message: errorMessage,
            },
          }),
        },
      ],
      isError: true,
    };
  }
}
