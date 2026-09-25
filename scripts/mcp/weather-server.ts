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
    name: "thailand-weather-server",
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
        name: "get_thailand_weather",
        description: "Fetches current temperature and weather for Bangkok, Thailand to update Devgotchi outfit.",
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
  if (request.params.name === "get_thailand_weather") {
    try {
      // ดึงสภาพอากาศกรุงเทพฯแบบ Realtime (Latitude: 13.7563, Longitude: 100.5018)
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&current_weather=true"
      );
      const data = (await res.json()) as OpenMeteoResponse;
      const temp = data.current_weather?.temperature ?? 32;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              city: "Bangkok",
              temperature: temp,
              isCold: temp < 24,
              recommendedOutfit: temp < 24 ? "Winter Clothes" : "Normal",
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