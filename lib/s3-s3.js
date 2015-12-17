/**
 * AWS.S3-like behavior with failover to a secondary S3 location
 */

'use strict';

// Used in init() below, this function mimics AWS.S3.  You must pass in a primary
// AWS.S3 object and secondary/failover AWS.S3 object
var s3 = function (primaryS3, secondaryS3) {
  var
    // request object that proxies to the real AWS.Request object
    Request = function(realRequest) {
      var
        // storage of on() callbacks
        onFunc = {},
        // proxying on() callbacks to the real AWS.Request object
        setupOn = function(realRequest, onType, onFunc) {
          realRequest.on(onType, function(response) {
            if (onFunc.hasOwnProperty(onType)) {
              onFunc[onType](response);
            }
          });
        };

      return {
        // simply store all of the on() callbacks when they come in
        on: function (type, callback) {
          onFunc[type] = callback;
          return this;
        },
        // send on the request to the real request handler
        send: function() {
          if (this.hasOwnProperty('params')) {
            realRequest.params = this.params;
          }
          // add on() calls on the real request object, and use the stored on() callbacks
          // wherever possible
          setupOn(realRequest, 'send', onFunc);
          setupOn(realRequest, 'retry', onFunc);
          setupOn(realRequest, 'extractError', onFunc);
          setupOn(realRequest, 'extractData', onFunc);
          setupOn(realRequest, 'success', onFunc);
          setupOn(realRequest, 'error', onFunc);
          setupOn(realRequest, 'complete', onFunc);

          realRequest.send();
        }
      };
    },

    /**
     * Ensure that no arguments were given to the s3-s3 functions, since this is
     * not supported right now.
     */
    noArguments = function(args, funcName) {
      if (args.length > 0) {
        throw new Error('Having arguments on ' + funcName + ' is not supported.' +
            'Use AWS.Request instead.');
      }
    };

  return {
    /**
     * Mimics putObject in AWS.S3
     */
    putObject: function() {
      noArguments(arguments, 'putObject');
      var realRequest = primaryS3.putObject();
      return new Request(realRequest);
    },

    /**
     * Mimics deleteObject in AWS.S3
     */
    deleteObject: function() {
      noArguments(arguments, 'deleteObject');
      var realRequest = primaryS3.deleteObject();
      return new Request(realRequest);
    },

    /**
     * Mimics getObject in AWS.S3
     */
    getObject: function() {
      noArguments(arguments, 'getObject');
      var realRequest = primaryS3.getObject();
      return new Request(realRequest);
    }
  };
};

// Allows creation of new object that mimics AWS.S3
module.exports = s3;
