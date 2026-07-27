import { NextResponse } from 'next/server';

export interface ChatRequestPayload {
  userId: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export async function POST(req: Request & { user?: { id: string } }) {
  try {
    // 1. Derive authenticated user ID securely from session/token
    const authenticatedUserId = req.user?.id;

    // 2. Validate authentication status (401 Unauthorized if missing)
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthenticated: Valid session required' },
        { status: 401 }
      );
    }

    // 3. Parse JSON payload
    const body: ChatRequestPayload = await req.json();
    const { userId, messages } = body;

    // 4. User ID Validation (403 Forbidden if payload tries to impersonate another user)
    if (userId && userId !== authenticatedUserId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot access or impersonate another user ID' },
        { status: 403 }
      );
    }

    // 5. Always use validated authenticatedUserId downstream
    const activeUserId = authenticatedUserId;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request: Messages array is required' },
        { status: 400 }
      );
    }

    // 6. Secure chat response generation logic
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    return NextResponse.json({
      success: true,
      userId: activeUserId,
      message: {
        role: 'assistant',
        content: `BlockFlow Assistant: Received query "${lastUserMessage}". Schedule optimization active for user ${activeUserId}.`,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
