import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

// Make sure our tests always run in the 'test' environment
// eslint-disable-next-line no-process-env
process.env.NODE_ENV = 'test'

global.expect = chai.expect
global.sinon = sinon

chai.use(sinonChai)
