export type EventLike<EventName extends string> = {
  type: EventName;
  defaultPrevented?: boolean;
};

type EventHandler<
  EventName extends keyof NameEventTypeMap,
  NameEventTypeMap extends AnyNameEventTypeMap
> = (event: NameEventTypeMap[EventName]) => unknown;

type EventHandlerList<
  EventName extends keyof NameEventTypeMap,
  NameEventTypeMap extends AnyNameEventTypeMap
> = EventHandler<EventName, NameEventTypeMap>[];

type AnyNameEventTypeMap = Record<string, EventLike<string>>;

export default class EventTarget<
  NameEventMap extends AnyNameEventTypeMap = AnyNameEventTypeMap
> {
  private _nameHandlersMap = new Map<
    keyof NameEventMap,
    EventHandler<keyof NameEventMap, NameEventMap>[]
  >();

  public addEventListener<S extends keyof NameEventMap>(
    type: S,
    callback: EventHandler<S, NameEventMap>
  ): void {
    let handlers = this._nameHandlersMap.get(type);
    if (handlers === undefined) {
      handlers = [];
      this._nameHandlersMap.set(type, handlers);
    }
    (handlers as EventHandlerList<S, NameEventMap>).push(callback);
  }

  public removeEventListener<S extends keyof NameEventMap>(
    type: S,
    callback: EventHandler<S, NameEventMap>
  ): void {
    const handlers = this._nameHandlersMap.get(type);
    if (handlers === undefined) {
      return;
    }
    for (let i = 0, l = handlers.length; i < l; i++) {
      if (handlers[i] === callback) {
        handlers.splice(i, 1);
        return;
      }
    }
  }

  public dispatchEvent<S extends keyof NameEventMap>(
    event: NameEventMap[S]
  ): boolean {
    const handlers = this._nameHandlersMap.get(event.type);
    if (handlers === undefined) {
      return true;
    }
    const handlersCopy = handlers.slice();
    for (let i = 0, l = handlersCopy.length; i < l; i++) {
      handlersCopy[i].call(this, event);
    }
    return !event.defaultPrevented;
  }
}
