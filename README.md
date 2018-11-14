# remote-event-emitter

[![Build Status][travis-badge]][travis-url]
![Built with GNU Make][make-badge]
![Required Node.js version][node-badge]

> Deliver Node's EventEmitter events over Unix sockets or TCP connections 🚀

## About

This module allows forwarding events (including JSON-serialisable arguments to the events) to another process, with the receiving end behaving as if the events were emitted locally. You can use this for IPC communications where one-directional messaging is needed (ie. one process sends events and another process receives them).

The events are delivered as follows:

1. The consumer (process which wants to receive events) creates a Unix socket or TCP connection and start listening for connections
1. The provider (process which wants to send events) connects to this socket and starts emitting events locally just like any other [`EventEmitter`][emitter-docs] instance - via `emitter.emit('event', ...args)`
1. The consumer emits a `connection` event every time someone connects to the socket. This event will receive a single argument, a `source`, which basically mirrors the event emitter from the provider side (it will emit the events the provider emits in the other process)

## Installation

Install this package on both ends and use either the `Consumer` or `Producer` class.

```sh
npm install --save remote-event-emitter
```

## Usage

### Consumer

```js
import { Consumer } from 'remote-event-emitter'

const consumer = new Consumer()
// Bind to a socket
await consumer.listen({ address: '/tmp/my-fancy.sock' })
// Or, bind to a TCP port 12345
await consumer.listen({ address: 12345 })

// Handle for incoming connections
consumer.on('connection', source => {
  // The events emitted on source will match the events emitted
  // in the provider process
  source.on('hello', string, flag => {
    console.log(string)   // -> "world"
    console.log(flag)   // true
  })

  source.once('close', () => {
    console.log('Client disconnected!')
  })
})

// When you no longer want to accept new connections from providers
// This will close the socket.
await consumer.close()
```

### Provider

```js
import { Provider } from 'remote-event-emitter'

// The socket must exist, otherwise an error will be thrown
const provider = new Provider({ address: '/tmp/my-fancy.sock' })

provider.emit('hello', 'world', true)

// Always close the connection when you are done sending events
provider.end()
```

## Reference implementations

See [mocha-reporter-remote][mocha-reporter-remote] for a reference implementation on the provider and [atom-ide-mocha][atom-ide-mocha] for the consumer side.

## License

See the [LICENSE](LICENSE) file for information.

[emitter-docs]: https://nodejs.org/dist/latest-v11.x/docs/api/events.html
[make-badge]: https://img.shields.io/badge/Built%20with-GNU%20Make-brightgreen.svg?style=flat-square
[node-badge]: https://img.shields.io/badge/Node.js-10.0-brightgreen.svg?style=flat-square
[travis-badge]: https://img.shields.io/travis/Dreamscapes/remote-event-emitter.svg?style=flat-square
[travis-url]: https://travis-ci.org/Dreamscapes/remote-event-emitter
[atom-ide-mocha]: https://github.com/Dreamscapes/atom-ide-mocha-core/tree/master/packages/atom-ide-mocha-core
[mocha-reporter-remote]: https://github.com/Dreamscapes/atom-ide-mocha-core/tree/master/packages/mocha-reporter-remote
