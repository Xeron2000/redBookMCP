import {
  XIAOHONGSHU_OUTLINE_PROMPT,
  XIAOHONGSHU_IMAGE_PROMPT,
} from "../prompts.js";

export async function getOutlinePromptResource(): Promise<any> {
  return {
    contents: [
      {
        uri: "prompts://xiaohongshu-outline",
        mimeType: "text/plain",
        text: XIAOHONGSHU_OUTLINE_PROMPT,
      },
    ],
  };
}

export async function getImagePromptResource(): Promise<any> {
  return {
    contents: [
      {
        uri: "prompts://xiaohongshu-image",
        mimeType: "text/plain",
        text: XIAOHONGSHU_IMAGE_PROMPT,
      },
    ],
  };
}

export async function listPromptsResource(): Promise<any> {
  return {
    contents: [
      {
        uri: "prompts://list",
        mimeType: "application/json",
        text: JSON.stringify({
          prompts: [
            {
              name: "xiaohongshu-outline",
              description: "Prompt for generating Xiaohongshu content outlines",
              uri: "prompts://xiaohongshu-outline",
            },
            {
              name: "xiaohongshu-image",
              description: "Prompt for generating Xiaohongshu style images",
              uri: "prompts://xiaohongshu-image",
            },
          ],
        }),
      },
    ],
  };
}
