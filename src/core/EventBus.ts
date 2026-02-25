import type { EventHandler, Unsubscribe } from '../types.js';

interface HandlerEntry<T> { handler: EventHandler<T>; priority: number }

export class EventBus {
    private readonly _events = new Map<string, HandlerEntry<unknown>[]>();

    on<T = unknown>(event: string, handler: EventHandler<T>, priority = 0): Unsubscribe {
        if (!this._events.has(event)) this._events.set(event, []);
        const list = this._events.get(event)!;
        list.push({ handler: handler as EventHandler<unknown>, priority });
        list.sort((a, b) => b.priority - a.priority);
        return () => this.off(event, handler);
    }

    off<T = unknown>(event: string, handler: EventHandler<T>): void {
        const list = this._events.get(event);
        if (!list) return;
        const idx = list.findIndex(h => h.handler === handler);
        if (idx !== -1) list.splice(idx, 1);
    }

    emit<T = unknown>(event: string, data?: T): void {
        this._events.get(event)?.forEach(({ handler }) => handler(data as unknown));
    }

    async emitAsync<T = unknown>(event: string, data?: T): Promise<void> {
        const list = this._events.get(event);
        if (!list) return;
        for (const { handler } of list) await handler(data as unknown);
    }

    clear(event?: string): void {
        event ? this._events.delete(event) : this._events.clear();
    }
}
