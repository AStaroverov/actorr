# Webactor
Everything that you need for actor architecture on client

Webactor exports a set of functions to implement a message passing mechanism between different parts of a JavaScript application. It creates and manages message channels, defines message types and provides functions to send and receive messages over these channels. The code uses a combination of maps, finalization registry, weak references, and closure to keep track of messages and message channels, and to prevent memory leaks. The module supports message passing between different threads (Web workers) and between different JavaScript contexts within the same thread.

## Public methods

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
function isEnvelope<T extends Envelope>(some: any): some is T
```

### createActorFactory
The createActorFactory method is a higher-order function that returns a factory function for creating actors with a given behavior function.

The return function createActorFactory creates an actor that communicates with other actors using a message-passing system. The behavior function defines how the actor should respond to incoming messages.


```typescript
function createActorFactory(props: { getMailbox: () => Mailbox<Envelope>; }): (name: string, constructor: ActorConstructor) => Actor;
```

### createDispatch / dispatch
The createDispatch function takes a target argument and returns a dispatch function that can be called with an envelope argument. The dispatch function is a shorthand for calling createDispatch and passing both target and envelope arguments in a single call.

The dispatch function send envelope through target.
```typescript
function createDispatch(target: EnvelopeDispatchTarget): (envelope: Envelope) => void
function dispatch(target: EnvelopeDispatchTarget, envelope: Envelope): void
```

### connectActorToActor
This function takes in two Actors or Actors with mappers and sets up a bi-directional connection between them.
```typescript
function connectActorToActor(actor1: Actor | EnvelopeTransmitterWithMapper<Actor>, actor2: Actor | EnvelopeTransmitterWithMapper<Actor>): Function;
```

## Request - Response
### createRequest
This function takes a transmitter object as an argument. The function returns another function that is used to make requests to the transmitter
```typescript
function createRequest(transmitter: EnvelopeTransmitter): (envelope: Envelope, onResponse: SubscribeCallback) => Function;
```

##### w/o chatGPT
### createResponseFactory
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
<!--
### connectWorkerToWorker
```typescript
function connectWorkerToWorker(
    worker1: { name: string; worker: Worker | SharedWorker; },
    worker2: { name: string; worker: Worker | SharedWorker; }
): Promise<() => void>;
```
-->
### connectActorToMessagePort
```typescript
function connectActorToMessagePort(actor: Actor, port: MessagePort | MessagePortName): Function;
```
### onConnectMessagePort
```typescript
function onConnectMessagePort(context: DedicatedWorkerGlobalScope | SharedWorkerGlobalScope, callback: (name: MessagePortName) => unknown | Function): VoidFunction;
```
