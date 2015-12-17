var
  assert = require('assert'),
  s3s3 = require('../lib/s3-s3.js'),

  // create a mock AWS.S3 object for testing
  mockS3 = function(mockType) {
    mockType = mockType || {};

    // create a mock AWS.Request object for testing
    var mockRequest = function(that){
      return {
        /**
         * Setup different on event types that we need to handle
         */
        on: function (type, callback) {
          var callbackFunc = function(response) {
            callback(response || {});
          };
          if (type === 'success') {
            that.success = callbackFunc;
          } else if (type === 'error') {
            that.fail = callbackFunc;
          } else if (type === 'retry') {
            that.retry = callbackFunc;
          }
          return this;
        },

        /**
         * Pretend to send by calling the appropriate on() handler
         */
        send: function(){
          that.calledSend = true;
          if (mockType.error) {
            that.fail();
          }
          else if (mockType.retry) {
            that.retry();
          }
          else {
            that.success();
          }
        }
      };
    };

    // return the properties/functions needed for AWS.S3 and testing
    return {
      calledPut: false,
      calledDelete: false,
      calledGet: false,
      calledSend: false,
      params: {},
      putObject: function(){
        this.calledPut = true;
        return mockRequest(this);
      },
      deleteObject: function(){
        this.calledDelete = true;
        return mockRequest(this);
      },
      getObject: function(){
        this.calledGet = true;
        return mockRequest(this);
      }
    };
  };

describe('s3-s3', function(){
  it('should call success after putObject send', function(done) {
    var primaryMock = mockS3(),
      secondaryMock = mockS3(),
      s3 = s3s3.init(primaryMock, secondaryMock),
      request = s3.putObject();

    assert.ok(request !== null);
    request.on('success', function (response) {
      assert.ok(primaryMock.calledPut);
      assert.ok(primaryMock.calledSend);
      assert.ok(! secondaryMock.calledPut);
      assert.ok(! secondaryMock.calledSend);
      done();
    }).send();
  });

  it('should call success after putObject send failure', function(done) {
    var primaryMock = mockS3({error: true }),
      secondaryMock = mockS3(),
      s3 = s3s3.init(primaryMock, secondaryMock),
      request = s3.putObject();

    assert.ok(request !== null);
    request.on('success', function (response) {
      throw new Error('this should not happen!');
    });
    request.on('error', function (response) {
      assert.ok(primaryMock.calledPut);
      assert.ok(primaryMock.calledSend);
      assert.ok(! secondaryMock.calledPut);
      assert.ok(! secondaryMock.calledSend);
      done();
    });
    request.send();
  });

  it('should call retry after putObject send retry', function(done) {
    var primaryMock = mockS3({retry: true }),
      secondaryMock = mockS3(),
      s3 = s3s3.init(primaryMock, secondaryMock),
      request = s3.putObject();

    assert.ok(request !== null);
    request.on('success', function (response) {
      throw new Error('this should not happen!');
    });
    request.on('retry', function (response) {
      assert.ok(primaryMock.calledPut);
      assert.ok(primaryMock.calledSend);
      assert.ok(! secondaryMock.calledPut);
      assert.ok(! secondaryMock.calledSend);
      done();
    });
    request.on('error', function (response) {
      throw new Error('this should not happen!');
    });
    request.send();
  });

  it('should call success after deleteObject send', function(done) {
    var primaryMock = mockS3(),
      secondaryMock = mockS3(),
      s3 = s3s3.init(primaryMock, secondaryMock),
      request = s3.deleteObject();

    assert.ok(request !== null);
    request.on('success', function (response) {
      assert.ok(primaryMock.calledDelete);
      assert.ok(primaryMock.calledSend);
      assert.ok(! secondaryMock.calledDelete);
      assert.ok(! secondaryMock.calledSend);
      done();
    }).send();
  });

  it('should call success after getObject send', function(done) {
    var primaryMock = mockS3(),
      secondaryMock = mockS3(),
      s3 = s3s3.init(primaryMock, secondaryMock),
      request = s3.getObject();

    assert.ok(request !== null);
    request.on('success', function (response) {
      assert.ok(primaryMock.calledGet);
      assert.ok(primaryMock.calledSend);
      assert.ok(! secondaryMock.calledGet);
      assert.ok(! secondaryMock.calledSend);
      done();
    }).send();
  });

});
