import Anthropic from '@anthropic-ai/sdk';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const SYSTEM_PROMPT = `Te egy segítőkész asszisztens vagy a Whiteboard App nevű webalkalmazáshoz.
Rövid, konkrét válaszokat adj magyarul. Csak az alkalmazáshoz kapcsolódó kérdésekre válaszolj.`;

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

type Message = { role: 'user' | 'assistant'; content: string };

export const POST: RequestHandler = async ({ request }) => {
    try {
        if (!ANTHROPIC_API_KEY) {
            throw error(503, 'Hiányzó API kulcs.');
        }

        const body = await request.json().catch(() => null);
        if (!body || typeof body.message !== 'string') {
            throw error(400, 'Hiányzó message mező.');
        }

        const userMessage = body.message.slice(0, 500);
        const rawHistory: unknown[] = Array.isArray(body.history) ? body.history : [];

        // ✅ FIXED validation
        const history: Message[] = rawHistory
            .filter((m): m is Message =>
                typeof m === 'object' &&
                m !== null &&
                (
                    (m as Message).role === 'user' ||
                    (m as Message).role === 'assistant'
                ) &&
                typeof (m as Message).content === 'string'
            )
            .slice(-10);

        const messages: Message[] = [
            ...history,
            { role: 'user', content: userMessage },
        ];

        const stream = client.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: SYSTEM_PROMPT,
            messages,
        });

        // ✅ CRITICAL: Proper SSE wrapper
        const encoder = new TextEncoder();

        return new Response(
            new ReadableStream({
                async start(controller) {
                    try {
                        for await (const event of stream) {
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify(event)}\n\n`
                                )
                            );
                        }

                        controller.enqueue(
                            encoder.encode(`data: [DONE]\n\n`)
                        );

                        controller.close();
                    } catch (err) {
                        console.error('STREAM ERROR:', err);
                        controller.error(err);
                    }
                }
            }),
            {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            }
        );

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ message: 'Szerver hiba' }), {
            status: 500,
        });
    }
};