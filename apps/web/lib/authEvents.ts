// Simple event emitter for auth-related events
type EventListener = (...args: any[]) => void;

class EventEmitter {
  private events: { [key: string]: EventListener[] } = {};

  on(eventName: string, listener: EventListener): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);

    // Return an unsubscribe function
    return () => {
      this.off(eventName, listener);
    };
  }

  off(eventName: string, listenerToRemove: EventListener): void {
    if (!this.events[eventName]) {
      return;
    }
    this.events[eventName] = this.events[eventName].filter(
      (listener) => listener !== listenerToRemove
    );
  }

  emit(eventName: string, ...args: any[]): void {
    if (!this.events[eventName]) {
      return;
    }
    this.events[eventName].forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    });
  }
}

// Export a singleton instance
export const authEvents = new EventEmitter();

// Define event names
export const AUTH_EVENTS = {
  UNAUTHENTICATED: 'unauthenticated',
  // Add other events if needed (e.g., LOGOUT_REQUESTED)
};