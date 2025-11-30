import { Page, PageType } from "../types.js";
import fs from "fs";
import path from "path";

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

export class AIService {
  private imageApiUrl: string;
  private imageApiKey: string;
  private imageModel: string;
  private endpoints: string;

  constructor() {
    // 图片生成服务配置
    this.imageApiUrl = getRequiredEnv("IMAGE_API_URL");
    this.imageApiKey = getRequiredEnv("IMAGE_API_KEY");
    this.imageModel = getRequiredEnv("IMAGE_MODEL");
    this.endpoints = getRequiredEnv("ENDPOINTS");
  }

  /**
   * 获取完整的 API URL
   */
  private getApiUrl(): string {
    return `${this.imageApiUrl}${this.endpoints}`;
  }

  /**
   * 判断是否为图片生成端点
   */
  private isImagesEndpoint(): boolean {
    return this.endpoints.includes("/images/generations");
  }

  /**
   * 解析大纲文本
   * 注意：大纲文本由 Claude Agent 生成，MCP 只负责解析和存储
   */
  parseOutlineFromAgent(outlineText: string): Page[] {
    return this.parseOutline(outlineText);
  }

  private parseOutline(text: string): Page[] {
    const pages: Page[] = [];
    
    // 移除提示词中的说明部分（如果有的话）
    // 只保留 <page> 标签之间的内容
    const pageTagRegex = /<page[^>]*>[\s\S]*?<\/page>/g;
    const pageMatches = text.match(pageTagRegex);
    
    if (!pageMatches || pageMatches.length === 0) {
      // 如果没有找到完整的 <page></page> 标签对，尝试按 <page> 开头分割
      const parts = text.split(/<page[^>]*>/);
      
      for (let i = 1; i < parts.length; i++) {
        let pageText = parts[i].trim();
        
        // 移除结束标签
        pageText = pageText.replace(/<\/page>[\s\S]*/, "").trim();
        if (!pageText) continue;
        
        const page = this.parseSinglePage(pageText, pages.length + 1);
        if (page) pages.push(page);
      }
    } else {
      // 使用正则表达式匹配的完整页面
      for (const match of pageMatches) {
        let pageText = match
          .replace(/<page[^>]*>/, "")
          .replace(/<\/page>/, "")
          .trim();
        
        if (!pageText) continue;
        
        const page = this.parseSinglePage(pageText, pages.length + 1);
        if (page) pages.push(page);
      }
    }

    return pages;
  }

  private parseSinglePage(pageText: string, pageNumber: number): Page | null {
    const lines = pageText.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return null;

    const firstLine = lines[0].trim();
    let pageType: PageType = "content";

    // 检测页面类型
    if (firstLine.includes("[封面]")) {
      pageType = "cover";
    } else if (firstLine.includes("[总结]")) {
      pageType = "summary";
    } else if (firstLine.includes("[内容]")) {
      pageType = "content";
    } else if (firstLine.includes("<title>")) {
      pageType = "cover";
    }

    // 如果第一行是类型标记，从第二行开始提取内容
    let contentStartIndex = 0;
    if (firstLine.includes("[") && firstLine.includes("]")) {
      contentStartIndex = 1;
    }

    const content = lines.slice(contentStartIndex).join("\n").trim();
    if (!content) return null;

    const page: Page = {
      pageNumber,
      type: pageType,
      content,
    };

    // 提取标题和副标题（支持多种格式）
    const titleMatch = content.match(/(?:<title>|标题[：:])\s*(.+?)(?:<\/title>|\n|$)/);
    const subtitleMatch = content.match(/(?:<subtitle>|副标题[：:])\s*(.+?)(?:<\/subtitle>|\n|$)/);

    if (titleMatch) page.title = titleMatch[1].trim();
    if (subtitleMatch) page.subtitle = subtitleMatch[1].trim();

    // 如果是第一页且没有明确的类型标记，假设为封面
    if (pageNumber === 1 && !firstLine.includes("[")) {
      page.type = "cover";
    }

    return page;
  }

  async generateImage(
    page: Page,
    theme: string,
    projectId: string,
    coverImagePath?: string
  ): Promise<string> {
    // Ensure project-specific images directory exists
    const dataDir = getDataDir();
    const projectImagesDir = path.join(dataDir, "images", projectId);
    if (!fs.existsSync(projectImagesDir)) {
      fs.mkdirSync(projectImagesDir, { recursive: true });
    }

    const imagePath = path.join(
      projectImagesDir,
      `page_${page.pageNumber}_${Date.now()}.png`
    );

    try {
      // 如果配置了图片 API，使用自定义 API 生成图片
      if (this.imageApiKey) {
        const imageData = await this.generateImageWithAPI(
          page,
          theme,
          coverImagePath
        );
        fs.writeFileSync(imagePath, imageData);
      } else {
        // 否则使用占位符
        fs.writeFileSync(imagePath, Buffer.from("placeholder image data"));
      }
    } catch (error) {
      console.error(`Failed to generate image for page ${page.pageNumber}:`, error);
      // 生成失败时使用占位符
      fs.writeFileSync(imagePath, Buffer.from("placeholder image data"));
    }

    return imagePath;
  }

  private async generateImageWithAPI(
    page: Page,
    theme: string,
    coverImagePath?: string
  ): Promise<Buffer> {
    // 构建图片生成提示词
    const prompt = this.buildImagePrompt(page, theme, coverImagePath);

    // 判断是否为图片生成端点
    const isImages = this.isImagesEndpoint();

    let requestBody: any;
    if (isImages) {
      // images/generations 端点格式
      requestBody = {
        model: this.imageModel,
        prompt: prompt,
        n: 1,
        size: "1024x1365", // 3:4 比例
        response_format: "url", // 或 "b64_json"
      };
    } else {
      // chat/completions 端点格式
      requestBody = {
        model: this.imageModel,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1024,
      };
    }

    // 构建请求头
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.imageApiKey}`,
    };

    // 调用自定义 API
    const response = await fetch(this.getApiUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Image API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as any;

    // 处理 images/generations 响应格式
    if (isImages) {
      const imageData = data.data?.[0];
      if (!imageData) {
        throw new Error("No image data in API response");
      }

      // 处理 URL 格式
      if (imageData.url) {
        console.log(`Generated image URL: ${imageData.url}`);
        return await this.downloadImage(imageData.url);
      }
      // 处理 base64 格式
      else if (imageData.b64_json) {
        console.log("Generated image in base64 format");
        return Buffer.from(imageData.b64_json, "base64");
      }
      else {
        throw new Error("No URL or base64 data in image response");
      }
    }

    // 处理 chat/completions 响应格式
    let imageContent = data.choices?.[0]?.message?.content;
    if (!imageContent) {
      throw new Error("No image content in API response");
    }

    // 处理 Markdown 格式的图片链接: ![Generated Image](url)
    const markdownImageMatch = imageContent.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
    if (markdownImageMatch) {
      const imageUrl = markdownImageMatch[1];
      console.log(`Extracted image URL from markdown: ${imageUrl}`);
      return await this.downloadImage(imageUrl);
    }

    // 处理不同的返回格式
    // 1. 如果是 URL，下载图片
    if (imageContent.startsWith("http://") || imageContent.startsWith("https://")) {
      return await this.downloadImage(imageContent);
    }
    // 2. 如果是 base64 编码的 data URL
    else if (imageContent.startsWith("data:image")) {
      const base64Data = imageContent.split(",")[1];
      return Buffer.from(base64Data, "base64");
    }
    // 3. 如果是直接的 base64 字符串
    else if (imageContent.match(/^[A-Za-z0-9+/=]+$/)) {
      return Buffer.from(imageContent, "base64");
    }
    // 4. 其他格式，尝试直接转换
    else {
      return Buffer.from(imageContent);
    }
  }

  private async downloadImage(imageUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download image: ${response.status} ${response.statusText}`
        );
      }

      // 获取图片的 Content-Type 来确定格式
      const contentType = response.headers.get("content-type") || "image/jpeg";
      console.log(`Downloaded image from ${imageUrl}, type: ${contentType}`);

      // 将响应转换为 Buffer
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error(
        `Failed to download image from ${imageUrl}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 构建图片生成提示词
   * 
   * 使用提示词：.kiro/prompts/xiaohongshu-image.md
   * 
   * 此方法根据页面信息动态生成提示词，确保生成的图片符合小红书风格规范。
   */
  private buildImagePrompt(
    page: Page,
    theme: string,
    coverImagePath?: string
  ): string {
    const pageTypeLabel = {
      cover: "封面",
      content: "内容页",
      summary: "总结页",
    }[page.type];

    let prompt = `生成一张小红书风格的${pageTypeLabel}图片。

主题: ${theme}
页面类型: ${pageTypeLabel}
页面内容: ${page.content}

要求:
1. 竖版 3:4 比例
2. 小红书爆款风格
3. 清新、精致、有设计感
4. 文字清晰可读
5. 排版美观，留白合理
6. 不要带有任何小红书的 logo 或水印
7. 确保竖屏显示正确，不要旋转或倒置`;

    if (coverImagePath && page.type !== "cover") {
      prompt += `\n\n参考风格: 请参考封面图片的风格保持一致`;
    }

    return prompt;
  }

  async generateImages(
    pages: Page[],
    theme: string,
    projectId: string,
    pageNumbers?: number[]
  ): Promise<Record<number, string>> {
    const images: Record<number, string> = {};

    // Determine which pages to generate
    const pagesToGenerate = pageNumbers
      ? pages.filter((p) => pageNumbers.includes(p.pageNumber))
      : pages;

    // Generate cover first if it exists
    const coverPage = pagesToGenerate.find((p) => p.type === "cover");
    if (coverPage) {
      const imagePath = await this.generateImage(coverPage, theme, projectId);
      images[coverPage.pageNumber] = imagePath;
    }

    // Generate other pages with cover as reference
    const otherPages = pagesToGenerate.filter((p) => p.type !== "cover");
    const coverImagePath = coverPage
      ? images[coverPage.pageNumber]
      : undefined;

    for (const page of otherPages) {
      const imagePath = await this.generateImage(
        page,
        theme,
        projectId,
        coverImagePath
      );
      images[page.pageNumber] = imagePath;
    }

    return images;
  }
}
