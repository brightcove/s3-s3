/**
 * AWS.S3-like behavior with failover to a secondary S3 location
 */

'use strict';

// Used in module.exports below, this function mimics AWS.S3.  You must pass in a primary
// AWS.S3 object and secondary/failover AWS.S3 object
var s3 = function (primaryS3, primaryBucket, secondaryS3, secondaryBucket) {

  if (! primaryS3 || ! primaryBucket || ! secondaryS3 || ! secondaryBucket) {
    throw new Error('You must specify all of the following when setting up s3-s3 ' +
      'for it to work properly: primaryS3, primaryBucket, secondaryS3, secondaryBucket');
  }

  var
    // Request object that proxies to the real AWS.Request object, which can be found in realRequest.
    // If a secondary location needs to be used, a new AWS.Request object is created from
    // createSecondaryRequest.
    Request = function(realRequest, createSecondaryRequest) {
      var
        // where we are using the primary S3 source
        usingPrimary = true,
        // standard on() responses
        standardOnTypes = [ 'send', 'retry', 'extractError', 'extractData', 'success', 'complete',
          'httpData' ],
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

        // simply store all of the on() callbacks when they come in, if we know about them
        on: function (type, callback) {
          if (standardOnTypes.indexOf(type) != -1 || type === 'error' || type === 'failover') {
            onFunc[type] = callback;
          }
          else {
            throw new Error('Unknown on type.  s3-s3 does not currently support ' + type);
          }
          return this;
        },

        // send on the request to the real request handler
        send: function() {
          var that = this;

          if (this.hasOwnProperty('params')) {
            if (usingPrimary && this.params.hasOwnProperty('Bucket')) {
              throw new Error('The Bucket parameter can not be used on request.' +
                'Specify the buckets in the configs passed to s3-s3 instead.');
            }
            realRequest.params = this.params;

            if (usingPrimary) {
              realRequest.params.Bucket = primaryBucket;
            }
            else {
              realRequest.params.Bucket = secondaryBucket;
            }
          }

          // add on() calls on the real request object, and use the stored on() callbacks
          // wherever possible
          standardOnTypes.forEach(function (onType) {
            setupOn(realRequest, onType, onFunc);
          });

          // error is a special on() call which we use to see if this is a call that needs to
          // go to the secondary
          realRequest.on('error', function(error, response) {
            if (usingPrimary && error &&
                error.hasOwnProperty('statusCode') &&
              (error.statusCode === 400 || error.statusCode >= 500)) {

              // we are now in failover mode, and set up a new Request for it
              // and let listeners now what is happening
              usingPrimary = false;
              realRequest = createSecondaryRequest();
              if (onFunc.hasOwnProperty('failover')) {
                onFunc.failover(error, response);
              }

              // call this send() function again to set up everything again
              that.send();
            }
            else if (onFunc.hasOwnProperty('error')) {
              onFunc.error(error, response);
            }
          });

          // now that we have on() handlers all set up, really send()
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
      var realRequest = primaryS3.putObject(),
        createSecondaryRequest = function() { return secondaryS3.putObject(); };
      return new Request(realRequest, createSecondaryRequest);
    },

    /**
     * Mimics deleteObject in AWS.S3
     */
    deleteObject: function() {
      noArguments(arguments, 'deleteObject');
      var realRequest = primaryS3.deleteObject(),
        createSecondaryRequest = function() { return secondaryS3.deleteObject(); };
      return new Request(realRequest, createSecondaryRequest);
    },

    /**
     * Mimics deleteObjects in AWS.S3
     */
    deleteObjects: function() {
      noArguments(arguments, 'deleteObjects');
      var realRequest = primaryS3.deleteObjects(),
        createSecondaryRequest = function() { return secondaryS3.deleteObjects(); };
      return new Request(realRequest, createSecondaryRequest);
    },

    /**
     * Mimics listObjects in AWS.S3
     */
    listObjects: function() {
      noArguments(arguments, 'listObjects');
      var realRequest = primaryS3.listObjects(),
        createSecondaryRequest = function() { return secondaryS3.listObjects(); };
      return new Request(realRequest, createSecondaryRequest);
    },

    /**
     * Mimics getObject in AWS.S3
     */
    getObject: function() {
      noArguments(arguments, 'getObject');
      var realRequest = primaryS3.getObject(),
        createSecondaryRequest = function() { return secondaryS3.getObject(); };
      return new Request(realRequest, createSecondaryRequest);
    }
  };
};

// Allows creation of new object that mimics AWS.S3
module.exports = s3;
