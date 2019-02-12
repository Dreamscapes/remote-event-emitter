import * as net from 'net'
import * as fs from 'fs'
import { EventEmitter } from 'events'
import { SEPARATOR } from '../constants'
import { Provider } from '.'


const destination = '/tmp/remote-event-emitter.test.sock'

describe('Provider', () => {
  let server

  before(() => {
    // In case the socket was not cleaned up due to the test suite prematurely crashing or some
    // such, remove the socket forcibly.
    try {
      // eslint-disable-next-line no-sync
      fs.unlinkSync(destination)
    } catch {
      // noop
    }

    server = net.createServer(req => {
      req.unref()
    }).listen(destination)
  })

  after(done => {
    server.close(done)
  })

  afterEach(() => sinon.restore())


  it('exists', () => {
    expect(Provider).to.be.a('function')
  })

  it('extends EventEmitter', () => {
    const provider = new Provider({ destination })

    expect(provider).to.be.instanceof(EventEmitter)
    provider.end()
  })

  it('can be constructed', () => {
    const provider = new Provider({ destination })

    expect(provider).to.be.instanceof(Provider)
    provider.end()
  })

  it('connects to the given destination', () => {
    sinon.stub(net, 'connect').returns(new EventEmitter())
    void new Provider({ destination })

    expect(net.connect).to.have.callCount(1)
    expect(net.connect).to.have.been.calledWith(destination)
  })

  it('re-emits socket errors on itself', async () => {
    const socket = new EventEmitter()
    const error = new Error('socket fail')
    sinon.stub(net, 'connect').returns(socket)
    setImmediate(() => void socket.emit('error', error))

    const provider = new Provider({ destination })
    const err = await new Promise(resolve => provider.once('error', resolve))

    expect(err).to.equal(error)
  })


  describe('.emit()', () => {
    it('sends JSON-serialised string terminated by a newline', async () => {
      const provider = new Provider({ destination })
      const req = await new Promise(resolve => server.once('connection', resolve))

      provider.emit('test', { testdata: 'random-string' })

      const received = await new Promise(resolve => req.once('data', resolve))
      provider.end()

      expect(received).to.be.instanceof(Buffer)

      // Let's try to parse it
      const raw = received.toString('utf8')
      const payload = JSON.parse(raw)

      expect(raw.endsWith(SEPARATOR)).to.equal(true)
      expect(payload).to.have.all.keys([
        'event',
        'args',
      ])
      expect(payload).to.have.property('event', 'test')
      expect(payload.args).to.be.an('array')
      expect(payload.args[0]).to.be.an('object')
      expect(payload.args[0]).to.have.property('testdata', 'random-string')
    })

    it('re-emits the event on itself', done => {
      const emitter = new EventEmitter()
      emitter.write = sinon.stub()

      sinon.stub(net, 'connect').returns(emitter)
      const provider = new Provider({ destination })
      setImmediate(() => {
        provider.emit('test')
      })

      provider.once('test', () => {
        done()
      })
    })
  })


  describe('.end()', () => {
    it('closes the socket', async () => {
      const provider = new Provider({ destination })
      const req = await new Promise(resolve => server.once('connection', resolve))

      provider.end()

      await new Promise(resolve => req.once('close', resolve))
    })
  })
})
