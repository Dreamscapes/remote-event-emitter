import { Server } from 'net'
import { EventEmitter } from 'events'
import { PassThrough } from 'stream'
import { Consumer } from '.'

describe('Consumer', () => {
  it('exists', () => {
    expect(Consumer).to.be.a('function')
  })

  it('extends EventEmitter', () => {
    const consumer = new Consumer()

    expect(consumer).to.be.instanceof(EventEmitter)
  })

  it('can be constructed', () => {
    const consumer = new Consumer()

    expect(consumer).to.be.instanceof(Consumer)
  })


  describe('.bind()', () => {
    let consumer

    beforeEach(() => {
      consumer = new Consumer()
    })

    afterEach(() => sinon.restore())


    it('exists', () => {
      expect(consumer).to.respondTo('listen')
    })

    it('returns Promise', () => {
      expect(consumer.listen().catch(() => {})).to.be.a('promise')
    })

    it('binds to given socket address', async () => {
      function fakeListen() {
        setImmediate(() => this.emit('listening'))
      }

      sinon.stub(Server.prototype, 'listen').callsFake(fakeListen)

      await consumer.listen({ address: '/tmp/fake.sock' })

      expect(Server.prototype.listen).to.have.callCount(1)
      expect(Server.prototype.listen).to.have.been.calledWith('/tmp/fake.sock')
    })
  })


  describe('.close()', () => {
    let consumer

    beforeEach(() => {
      consumer = new Consumer()
    })

    afterEach(() => sinon.restore())


    it('exists', () => {
      expect(consumer).to.respondTo('close')
    })

    it('returns Promise', () => {
      expect(consumer.close().catch(() => {})).to.be.a('promise')
    })

    it('closes the underlying server', async () => {
      sinon.stub(Server.prototype, 'close').callsArgWithAsync(0, null)
      await consumer.close()

      expect(Server.prototype.close).to.have.callCount(1)
    })

    it('rejects if the server failed to close itself', () => {
      sinon.stub(Server.prototype, 'close').callsArgWithAsync(0, new Error('failed'))

      return expect(consumer.close()).to.be.eventually.rejectedWith(/failed/gu)
    })
  })


  describe('Source emitter', () => {
    const address = '/tmp/fake.sock'
    let consumer
    let server


    beforeEach(() => {
      consumer = new Consumer()
      sinon.stub(Server.prototype, 'listen').callsFake(function fakeListen() {
        // Escape the internals!
        // eslint-disable-next-line consistent-this
        server = this
        setImmediate(() => this.emit('listening'))
      })

      return consumer.listen({ address })
    })

    afterEach(() => sinon.restore())

    it("is provided via the socket's 'connection' event", async () => {
      // This is the server's connection event which is emitted when a new client connects to the
      // socket ⚠️
      setImmediate(() => server.emit('connection', new PassThrough()))
      const source = await new Promise(resolve => consumer.once('connection', resolve))

      expect(source).to.be.instanceof(EventEmitter)
    })

    it('forwards socket errors to the source', async () => {
      const socket = new PassThrough()
      setImmediate(() => server.emit('connection', socket))
      const source = await new Promise(resolve => consumer.once('connection', resolve))

      // Emit an error on the fake socket
      setImmediate(() => socket.emit('error', new Error('👻')))

      const err = await new Promise(resolve => source.once('error', resolve))

      expect(err).to.have.property('message', '👻')
    })

    it('forwards close events to the source', async () => {
      const socket = new PassThrough()
      setImmediate(() => server.emit('connection', socket))
      const source = await new Promise(resolve => consumer.once('connection', resolve))

      // Emit close event on the fake socket
      setImmediate(() => socket.emit('close'))
      await new Promise(resolve => source.once('close', resolve))
    })

    it('forwards serialised payloads as events with arguments', async () => {
      const payload = { event: 'test', args: [{ first: true }, { second: 'yup' }] }
      const raw = `${JSON.stringify(payload)}\n`

      const socket = new PassThrough()
      setImmediate(() => server.emit('connection', socket))
      const source = await new Promise(resolve => consumer.once('connection', resolve))
      // Send the raw data to the socket
      setImmediate(() => socket.write(raw))
      // Get the JS object back on the source
      const received = await new Promise(resolve => source.once('test', (...args) => resolve(args)))

      expect(received).to.have.length(2)
      expect(received[0]).to.have.property('first', true)
      expect(received[1]).to.have.property('second', 'yup')
    })

    it('handles payloads with multiple serialised JSON strings', async () => {
      const payload = { event: 'test', args: [{ test: 'yes' }] }
      const raw = `${JSON.stringify(payload)}\n${JSON.stringify(payload)}\n`

      const socket = new PassThrough()
      setImmediate(() => server.emit('connection', socket))
      const source = await new Promise(resolve => consumer.once('connection', resolve))

      // Send the raw data to the socket
      setImmediate(() => socket.write(raw))

      // Get the two separate events
      const messages = await new Promise(resolve => {
        const events = []
        source.on('test', data => {
          events.push(data)

          if (events.length === 2) {
            return void resolve(events)
          }
        })
      })

      expect(messages).to.have.length(2)
      expect(messages[0]).to.have.property('test', 'yes')
      expect(messages[1]).to.have.property('test', 'yes')
    })

    it('waits for more data if the payload is not terminated by a newline', async () => {
      const payload = { event: 'test', args: [{ test: 'yes' }] }
      const raw = JSON.stringify(payload)

      const socket = new PassThrough()
      setImmediate(() => server.emit('connection', socket))
      const source = await new Promise(resolve => consumer.once('connection', resolve))

      let events = 0

      source.on('test', () => {
        events++
      })

      // Send the raw data to the socket
      socket.write(raw)
      await new Promise(resolve => setImmediate(resolve))

      expect(events).to.equal(0)
      socket.write('\n')
      await new Promise(resolve => setImmediate(resolve))
      await new Promise(resolve => setImmediate(resolve))
      expect(events).to.equal(1)
    })


    it('flushes all remaining data when the socket ends', async () => {
      const payload = { event: 'test', args: [{ test: 'yes' }] }
      const raw = JSON.stringify(payload)

      const socket = new PassThrough()
      setImmediate(() => server.emit('connection', socket))
      const source = await new Promise(resolve => consumer.once('connection', resolve))

      let events = 0

      source.on('test', () => {
        events++
      })

      // Send the raw data to the socket
      socket.write(raw)
      await new Promise(resolve => setImmediate(resolve))

      expect(events).to.equal(0)
      socket.end()
      await new Promise(resolve => setImmediate(resolve))
      await new Promise(resolve => setImmediate(resolve))
      expect(events).to.equal(1)
    })
  })
})
