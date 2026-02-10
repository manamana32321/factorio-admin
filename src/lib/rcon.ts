import { Rcon } from "rcon-client";

let rcon: Rcon | null = null;

export async function getRcon(): Promise<Rcon> {
  if (rcon?.authenticated) {
    return rcon;
  }

  rcon = await Rcon.connect({
    host: process.env.RCON_HOST!,
    port: Number(process.env.RCON_PORT || 27015),
    password: process.env.RCON_PASSWORD!,
  });

  rcon.on("error", () => {
    rcon = null;
    luaUnlocked = false;
  });

  rcon.on("end", () => {
    rcon = null;
    luaUnlocked = false;
  });

  return rcon;
}

// Track whether Lua commands have been unlocked this session
let luaUnlocked = false;

/**
 * Factorio blocks the first /sc or /c command per game session with an
 * achievement-disable warning. This sends a no-op /sc to "unlock" Lua,
 * resending once if the warning is detected.
 */
async function ensureLuaUnlocked(): Promise<void> {
  if (luaUnlocked) return;

  const client = await getRcon();

  // Factorio may need up to 3 attempts: warning → confirm → execute
  for (let i = 0; i < 3; i++) {
    const res = await client.send('/sc rcon.print("__lua_ok__")');
    console.log(`[rcon] lua probe attempt ${i + 1}:`, JSON.stringify(res));
    if (res.includes("__lua_ok__")) {
      luaUnlocked = true;
      return;
    }
  }

  console.log("[rcon] lua unlock failed after 3 attempts");
  luaUnlocked = true; // proceed anyway
}

export async function sendCommand(command: string): Promise<string> {
  // Auto-unlock Lua if the command uses /sc or /silent-command
  if (command.startsWith("/sc ") || command.startsWith("/silent-command ")) {
    await ensureLuaUnlocked();
  }

  const client = await getRcon();
  return client.send(command);
}
