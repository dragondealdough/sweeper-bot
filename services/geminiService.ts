
import { GoogleGenAI } from "@google/genai";
import { TileState } from "../types";

export async function getScanInsight(grid: TileState[][], playerX: number, playerY: number): Promise<string> {
  // Use process.env.API_KEY directly as required by @google/genai guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Extract a 5x5 window around the player for analysis
  const radius = 2;
  const localGrid: any[] = [];
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const ny = playerY + dy;
      const nx = playerX + dx;
      if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
        const tile = grid[ny][nx];
        localGrid.push({
          relX: dx,
          relY: dy,
          revealed: tile.isRevealed,
          neighbors: tile.isRevealed ? tile.neighborMines : "hidden",
          flag: tile.flag
        });
      }
    }
  }

  const prompt = `
    I am playing a Dig Dug style Minesweeper game.
    The current local 5x5 grid centered at the player (0,0) is:
    ${JSON.stringify(localGrid)}
    
    Give me a very short tactical advice (max 15 words) on which adjacent tile is likely safe or where a mine might be.
    Be cryptic but helpful, like an old miner.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // response.text is a getter, not a method
    return response.text || "The ground is silent...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The radio signal is jammed.";
  }
}
