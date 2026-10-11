import { NextRequest, NextResponse } from "next/server";
import { AIIntentParser, AICommandExecutor } from "@/lib/ai-menu";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titleId = "TITLE_GAME_01", prompt, execute = true } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const intent = await AIIntentParser.parsePrompt({
      titleId,
      prompt
    });

    if (intent.action === "REJECTED") {
      return NextResponse.json(
        {
          success: false,
          intent,
          error: intent.error,
          suggestions: intent.suggestions
        },
        { status: 422 }
      );
    }

    let execution = null;
    if (execute) {
      execution = await AICommandExecutor.executeIntent(titleId, intent);
    }

    return NextResponse.json({
      success: true,
      intent,
      execution
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
