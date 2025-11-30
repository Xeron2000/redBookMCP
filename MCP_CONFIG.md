# MCP 配置指南

## 快速开始

编辑 Claude Desktop 配置文件：
- Windows: `%APPDATA%\Claude\config.json`
- macOS/Linux: `~/.config/claude/config.json`

### 基础配置

```json
{
  "mcpServers": {
    "xiaohongshu": {
      "command": "npx",
      "args": ["@xeron688/xiaohongshu-mcp"],
      "env": {
        "IMAGE_API_URL": "your_api_url",
        "IMAGE_API_KEY": "your_api_key",
        "IMAGE_MODEL": "your_model_name",
        "DATA_DIR": "./data",
        "ENDPOINTS": "/v1/images/generations"
      }
    }
  }
}
```

### 自定义端点配置

支持通过 `ENDPOINTS` 环境变量灵活切换不同的 API 端点。

#### 配置参数说明

- **IMAGE_API_URL**: API 服务的基础 URL
- **IMAGE_API_KEY**: API 密钥
- **IMAGE_MODEL**: 使用的模型名称
- **ENDPOINTS**: API 端点路径，支持两种类型：
  - `/v1/images/generations` - 图片生成端点
  - `/v1/chat/completions` - 聊天完成端点
- **DATA_DIR**: 数据存储目录

#### 端点类型说明

- **`/v1/images/generations`**: 图片生成端点（OpenAI 兼容格式）
  - 请求格式：`{ model, prompt, n, size, response_format }`
  - 响应格式：`{ data: [{ url: "...", b64_json: "..." }] }`

- **`/v1/chat/completions`**: 聊天完成端点（OpenAI 兼容格式）
  - 请求格式：`{ model, messages, max_tokens }`
  - 响应格式：`{ choices: [{ message: { content: "..." } }] }`

#### 配置示例

**示例 1：使用图片生成端点**

```json
{
  "env": {
    "IMAGE_API_URL": "your_api_url",
    "IMAGE_API_KEY": "your_api_key",
    "IMAGE_MODEL": "your_model_name",
    "ENDPOINTS": "/v1/images/generations"
  }
}
```

**示例 2：使用聊天完成端点**

```json
{
  "env": {
    "IMAGE_API_URL": "your_api_url",
    "IMAGE_API_KEY": "your_api_key",
    "IMAGE_MODEL": "your_model_name",
    "ENDPOINTS": "/v1/chat/completions"
  }
}
```

重启 Claude Desktop，等待 5-10 秒连接。

## 可用工具

- `generate_outline` - 创建项目大纲
- `update_outline` - 更新大纲
- `generate_images` - 生成图片
- `get_project` - 获取项目详情

## 可用资源

- `projects://list` - 项目列表
- `project://{projectId}` - 项目详情
- `project://{projectId}/images` - 项目图片

## 数据存储

- 项目数据：`data/projects.json`
- 生成图片：`data/images/`
