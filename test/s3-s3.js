var
  assert = require('assert'),
  S3S3 = require('../lib/s3-s3.js'),

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
          else if (mockType.error500) {
            var error = { code: 500 };
            that.fail(error);
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
      calledDeletes: false,
      calledList: false,
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
      deleteObjects: function(){
        this.calledDeletes = true;
        return mockRequest(this);
      },
      listObjects: function(){
        this.calledList = true;
        return mockRequest(this);
      },
      getObject: function(){
        this.calledGet = true;
        return mockRequest(this);
      }
    };
  };

describe('s3-s3', function() {
  describe('basic API calls', function() {
    it('should call success after putObject send', function(done) {
      var primaryMock = mockS3(),
        secondaryMock = mockS3(),
        s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2'),
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

    it('should call success after deleteObject send', function(done) {
      var primaryMock = mockS3(),
        secondaryMock = mockS3(),
        s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2'),
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

    it('should call success after deleteObjects send', function(done) {
      var primaryMock = mockS3(),
        secondaryMock = mockS3(),
        s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2'),
        request = s3.deleteObjects();

      assert.ok(request !== null);
      request.on('success', function (response) {
        assert.ok(primaryMock.calledDeletes);
        assert.ok(primaryMock.calledSend);
        assert.ok(! secondaryMock.calledDeletes);
        assert.ok(! secondaryMock.calledSend);
        done();
      }).send();
    });

    it('should call success after listObjects send', function(done) {
      var primaryMock = mockS3(),
        secondaryMock = mockS3(),
        s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2'),
        request = s3.listObjects();

      assert.ok(request !== null);
      request.on('success', function (response) {
        assert.ok(primaryMock.calledList);
        assert.ok(primaryMock.calledSend);
        assert.ok(! secondaryMock.calledList);
        assert.ok(! secondaryMock.calledSend);
        done();
      }).send();
    });

    it('should call success after getObject send', function(done) {
      var primaryMock = mockS3(),
        secondaryMock = mockS3(),
        s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2'),
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

    it('should call error after putObject send failure', function(done) {
      var primaryMock = mockS3({error: true }),
        secondaryMock = mockS3(),
        s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2'),
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
        s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2'),
        request = s3.putObject();

      assert.ok(request !== null);
      request.on('success', function (response) {
        throw new Error('this should not happen!');
      })
      // we also chain calls in here to test that out
      .on('retry', function (response) {
        assert.ok(primaryMock.calledPut);
        assert.ok(primaryMock.calledSend);
        assert.ok(! secondaryMock.calledPut);
        assert.ok(! secondaryMock.calledSend);
        done();
      })
      .on('error', function (response) {
        throw new Error('this should not happen!');
      })
      .send();
    });
  });

  describe('parameter errors', function() {
    it('should fail if getObject given args', function(done) {
      var primaryMock = mockS3(),
        secondaryMock = mockS3(),
        s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2');
      try {
        var request = s3.getObject({});
      }
      catch(err) {
        done();
      }
    });

    it('should error when an unknown on type is used', function(done) {
      var primaryMock = mockS3(),
        secondaryMock = mockS3(),
        s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2'),
        request = s3.deleteObject();

      try {
        request.on('whatisthiscraziness', function (response) {
        });
      }
      catch (err) {
        done();
      }
    });

    it('should error when a Bucket parameter is used', function(done) {
      var primaryMock = mockS3(),
        secondaryMock = mockS3(),
        s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2'),
        request = s3.deleteObject();
        request.params = { Bucket: 'bucket' };

      try {
        request.send();
      }
      catch (err) {
        done();
      }
    });

    it('should error when not all parameters are given', function(done) {
      var primaryMock = mockS3(),
        secondaryMock = mockS3(),
        s3;

      try {
        s3 = new S3S3(primaryMock, 'bucket1', secondaryMock);
      }
      catch (err) {
        done();
      }
    });

  });

  describe('failover', function() {
    it('should failover to secondary after deleteObject send issues', function(done) {
        var primaryMock = mockS3({error500: true }),
          secondaryMock = mockS3(),
          s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2'),
          request = s3.deleteObject(),
          calledFailover = false;

        assert.ok(request !== null);
        request.on('success', function (response) {
          assert.ok(calledFailover);
          assert.ok(primaryMock.calledDelete);
          assert.ok(primaryMock.calledSend);
          assert.ok(secondaryMock.calledDelete);
          assert.ok(secondaryMock.calledSend);
          done();
        });
        request.on('failover', function (response) {
          calledFailover = true;
        });
        request.on('retry', function (response) {
          throw new Error('this should not happen!');
        });
        request.on('error', function (response) {
          throw new Error('this should not happen!');
        });
        request.send();
      });

      it('should error after deleteObject send issues with primary and secondary', function(done) {
        var primaryMock = mockS3({error500: true }),
          secondaryMock = mockS3({error500: true }),
          s3 = new S3S3(primaryMock, 'bucket1', secondaryMock, 'bucket2'),
          request = s3.deleteObject();

        assert.ok(request !== null);
        request.on('success', function (response) {
          throw new Error('this should not happen!');
        });
        request.on('retry', function (response) {
          throw new Error('this should not happen!');
        });
        request.on('error', function (response) {
          assert.ok(primaryMock.calledDelete);
          assert.ok(primaryMock.calledSend);
          assert.ok(secondaryMock.calledDelete);
          assert.ok(secondaryMock.calledSend);
          done();
        });
        request.send();
      });
  });
});
