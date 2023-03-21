##### w/ chatGPT

### createEnvelope
The `createEnvelope` method is a utility function that helps create an envelope object for communication between different parts of an application.

```typescript
function createEnvelope<T extends string, P>(type: T, payload: P, transferable?: undefined | Transferable[]): Envelope<T, P>
```
* type (required): a string indicating the type of the message being sent. This could be any string that can be used to identify the message type.
* payload (required): the message payload. This could be any JavaScript object or primitive value.
* transferable (optional): an array of objects that should be transferred instead of cloned when the message is sent. This could be an array buffer, a shared memory object or a message port.

#### Return value
The `createEnvelope` function returns an Envelope object that can be sent between different parts of the application.

### isEnvelope

The `isEnvelope` method is a utility method that checks whether a given object is an instance of the Envelope or not. The method takes one argument, obj, which is the object to be checked.

```typescript
isEnvelope<T extends Envelope>(some: any): some is T
```

##### w/o chatGPT
### createActorFactory

```typescript
function createActorFactory(props: { getMailbox: () => Mailbox<Envelope>; }): (name: string, constructor: ActorConstructor) => Actor;
```

### createDispatch / dispatch

```typescript
function createDispatch(target: EnvelopeDispatchTarget): (envelope: Envelope) => void
function dispatch(target: EnvelopeDispatchTarget, envelope: Envelope): void
```

### connectActorToActor

```typescript
function connectActorToActor(actor1: Actor | EnvelopeTransmitterWithMapper<Actor>, actor2: Actor | EnvelopeTransmitterWithMapper<Actor>): Function;
```

## Request - Response
### createRequest
```typescript
createRequest(transmitter: EnvelopeTransmitter): (envelope: Envelope, onResponse: SubscribeCallback) => Function;
```

### createRequest
```typescript
function createResponseFactory(dispatch: WithDispatch): (initial: Envelope) => (envelope: Envelope) => void;
```

## Channels
### openChannelFactory
```typescript
function openChannelFactory(transmitter: EnvelopeTransmitter): (envelope: Envelope, onOpenChannel: (context: OpenChanelContext) => void | Function) => () => void;
```

### supportChannelFactory
```typescript
function supportChannelFactory(transmitter: EnvelopeTransmitter): (initial: Envelope, onOpenChannel: (context: SupportChanelContext) => void | Function) => () => void;
```

### createHeartbeat
```typescript
type HeartbeatOptions = {
    maxTimeout?: number;
    checkTimeout?: number;
    dispatchTimeout?: number;
};
function createHeartbeat(context: WithDispatch & WithSubscribe, panic: (timeout: number) => void, options?: HeartbeatOptions): () => void;
```

## Worker
### connectActorToWorker
```typescript
function connectActorToWorker(actor: Actor, worker: Worker | SharedWorker): Promise<() => void>;
```
### connectWorkerToWorker
```typescript
function connectWorkerToWorker<W1 extends Worker | SharedWorker, W2 extends Worker | SharedWorker>(worker1: {
    name: string;
    worker: W1;
}, worker2: {
    name: string;
    worker: W1;
}): Promise<() => void>;

```
### connectActorToMessagePort
```typescript
function connectActorToMessagePort(actor: Actor, port: MessagePort | MessagePortName): Function;
```
### onConnectMessagePort
```typescript
onConnectMessagePort(context: DedicatedWorkerGlobalScope | SharedWorkerGlobalScope, callback: (name: MessagePortName) => unknown | Function): VoidFunction;
```
