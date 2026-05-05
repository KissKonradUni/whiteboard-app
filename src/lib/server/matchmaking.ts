export interface QueueEntry {
    userId: number;
    userName: string;
    socketId: string;
}

class MatchmakingManager {
    private static instance: MatchmakingManager;
    private queue: QueueEntry[] = [];

    private constructor() {}

    static getInstance(): MatchmakingManager {
        if (!MatchmakingManager.instance) {
            MatchmakingManager.instance = new MatchmakingManager();
        }
        return MatchmakingManager.instance;
    }

    enqueue(entry: QueueEntry): void {
        this.dequeue(entry.userId);
        this.queue.push(entry);
    }

    dequeue(userId: number): void {
        this.queue = this.queue.filter(e => e.userId !== userId);
    }

    tryMatch(): [QueueEntry, QueueEntry] | null {
        if (this.queue.length >= 2) {
            const a = this.queue.shift()!;
            const b = this.queue.shift()!;
            return [a, b];
        }
        return null;
    }

    isQueued(userId: number): boolean {
        return this.queue.some(e => e.userId === userId);
    }
}

export const matchmakingManager = MatchmakingManager.getInstance();
