// scripts/mcp/weather-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { OpenMeteoResponse } from "../../src/utils/weather";

// สร้างอินสแตนซ์ของ MCP Server
const server = new Server(
  {
    name: "japan-weather-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ประกาศ Tool ให้ Kiro ทราบ
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_japan_weather",
        description: "Fetches current temperature and weather for Tokyo, Japan to update Devgotchi outfit.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// จัดการการเรียกใช้งาน Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_japan_weather") {
    try {
      // ดึงสภาพอากาศโตเกียวแบบ Realtime (Latitude: 35.6895, Longitude: 139.6917)
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&current_weather=true"
      );
      const data = (await res.json()) as OpenMeteoResponse;
      const temp = data.current_weather?.temperature ?? 20;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              city: "Tokyo",
              temperature: temp,
              isCold: temp < 15,
              recommendedOutfit: temp < 15 ? "Winter Clothes" : "Normal",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Failed to fetch weather data" }),
          },
        ],
      };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

// เชื่อมต่อผ่าน Standard I/O (Stdio) ตามมาตรฐาน MCP
const transport = new StdioServerTransport();
await server.connect(transport);