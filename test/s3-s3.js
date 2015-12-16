var
  assert = require('assert'),
  s3s3 = require('../lib/s3-s3.js'),

  // create a mock AWS.S3 object for testing
  mockS3 = function(mockType) {
    mockType = mockType || {};

    // create a mock AWS.Request object for testing
    var mockRequest = function(that){
      return {
        on: function (type, callback) {
          if (type === 'success') {
            that.success = function (response) {
              callback(response || {});
            };
          } else if (type === 'error') {
            that.fail = function (error) {
              callback(error);
            };
          }
          return this;
        },
        send: function(){
          that.calledSend = true;
          if (mockType.error) {
            that.fail();
          }
          else {
            that.success();
          }
        }
      };
    };
    return {
      calledPut: false,
      calledSend: false,
      params: {},
      putObject: function(){
        this.calledPut = true;
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

});
