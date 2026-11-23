import { chatResponse } from "@/lib/rimy/chat-handler";

export async function POST(request: Request) {
    return chatResponse(request);
}
