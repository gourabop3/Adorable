import { setupAbortCallback, setStream as setResumableStream, stopStream as stopResumableStream, getStream as getResumableStream } from "@/lib/internal/stream-manager";
import { redis, redisPublisher } from "@/lib/internal/redis";
import type { UIMessage } from "ai";

export async function getAbortCallback(appId: string, callback: () => void) {
  await setupAbortCallback(appId, callback);
}

export async function setStream(
  appId: string,
  message: UIMessage,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stream: any
) {
  return await setResumableStream(appId, message, stream);
}

export async function stopStream(appId: string) {
  await stopResumableStream(appId);
}

export async function getStream(appId: string) {
  return await getResumableStream(appId);
}