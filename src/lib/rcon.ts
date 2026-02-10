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
  });

  rcon.on("end", () => {
    rcon = null;
  });

  return rcon;
}

export async function sendCommand(command: string): Promise<string> {
  const client = await getRcon();
  return client.send(command);
}
