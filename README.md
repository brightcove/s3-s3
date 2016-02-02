# s3-s3

A Node.js library for S3 redunancy, making sure your calls to S3 keep working even if there is an issue with one S3 location.  This library is intended to be used with two buckets set up with [cross-region replication](http://docs.aws.amazon.com/AmazonS3/latest/dev/crr.html).

This library tries to look like a subset of the API from [AWS.S3](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html) for easy use.  Normally, calls with this library will be sent to the primary S3 location.  If there are any unexpected issues with an S3 call, however, it will use a secondary, failover S3 location.

[![Build Status](https://secure.travis-ci.org/brightcove/s3-s3.png?branch=master)](http://travis-ci.org/brightcove/s3-s3)

[![NPM](https://nodei.co/npm/s3-s3.png)](https://nodei.co/npm/s3-s3/)

## Usage

Before using this library, you should have two buckets set up for cross-region replication.  They need to be both replicating to each other.  See [Amazon's guide for setup](http://docs.aws.amazon.com/AmazonS3/latest/dev/crr-how-setup.html).  A few additional tips on setup:
- Don't forget to turn on versioning for both buckets
- Once you have gone through the replication steps, remember to go back to setting up the second bucket for replication as well
- If you are starting with one bucket that already has data, make sure to use the AWS SDK for an initial copy of files from one bucket to another

Once you have two buckets to use, you can set up s3-s3 in your code by first setting up the two buckets using [aws-sdk](https://aws.amazon.com/sdk-for-node-js/) in the normal way you would set them up.  Something like:

```
  var aws = require('aws-sdk'),
    // your location for the AWS config of the primary bucket
    awsConfig = require('config.json');
    // your location for the AWS config of the secondary bucket
    awsSecondaryConfig = require('config.json');
    // primary bucket S3 setup
    s3Primary = new AWS.S3(awsConfig);
    // secondary bucket S3 setup
    s3Secondary = new AWS.S3(awsSecondaryConfig);
```

With the above, you can then set up the s3-s3 object:
```
  var S3S3 = require('s3-s3'),
    s3 = new S3S3(s3Primary, primaryBucketName, s3Secondary, secondaryBucketName);
```

You can then use s3 to make many of the same calls that you would make with AWS.S3:

```
  var request = s3.putObject();
  request.params = {
    'Key': key
    'Body' : cmdStream,
    'ACL' : 'public-read'
  };
  request.on('success', function (response) {
    console.log('success!');
    callback();
  }).on('error', function (err, response) {
    console.log('error!');
    callback(err);
  }).on('failover', function (err) {
    // if you are streaming data in a Body param, you will need to reinitialize
    // request.params.Body here for it to work properly in failover
    console.log('failover!');
    // no callback, as we will still get an error or success
  }).send();
```

## Differences from AWS.S3

While the API attempts to mimic AWS.S3, it's not exactly the same.  Some differences:

1. Using the request object returned from an API call is required with this library.  AWS.S3 also allows you to pass in parameters to putObject/getObject/etc, and that is not a current feature of this library.
2. 'Bucket' is usually given in request.params.  This can not be done using this library.  You always specify the buckets when initializing s3-s3.
3. Not all methods and events are implemented.  You're welcome to create a PR to add more support.
4. The failover event used above is the one addition to the normal event list returned from AWS.S3.  It is used to indicate that a failover to the secondary location is being attempted due to issues communicating with the primary location.

## Usage with Streams

Whenever you have a stream as part of your parameters, as the Body or elsewhere, you need to make sure this stream is reinitialized in failover for this to work properly.  For example:

```
  var request = s3.putObject(),
    setupBody = function () {
      // just pretend doing this makes sense
      var getFile = child_process.spawn('cat', ['myfile.txt']);
      return getFile.stdout;
    };
  request.params = {
    'Key': key
    'Body' : setupBody();
    'ACL' : 'public-read'
  };
  request.on('success', function (response) {
    console.log('success!');
    callback();
  }).on('error', function (err, response) {
    console.log('error!');
    callback(err);
  }).on('failover', function (err, response) {
    // reinitialize Body as needed during failover
    request.params.Body = setupBody();
    console.log('failover!');
    // no callback, as we will still get an error or success
  }).send();
```

## APIs

New s3-s3 object:

```
  var S3S3 = require('s3-s3'),
    s3 = new S3S3(new AWS.S3(awsConfig), primaryBucketName, new AWS.S3(secondaryConfig), secondaryBucketName);
```

S3 APIs:

```
request = s3.putObject();
request = s3.deleteObject();
request = s3.deleteObjects();
request = s3.listObjects();
request = s3.getObject();
```

request events and send:
```
request.on('send', function(response) {})
       .on('retry', function(response) {})
       .on('extractError', function(response) {})
       .on('extractData', function(response) {})
       .on('success', function(response) {})
       .on('httpData', function(chunk, response) {})
       .on('complete', function(response) {})
       .on('error', function(error, response) {})
       .on('failover', function(error, response) {})
       .send();
```

## Submitting changes

Thanks for considering making any updates to this project!  Here are the steps to take in your fork:

1. Run "npm install"
2. Add your changes in your fork as well as any new tests needed
3. Run "npm test"
4. Update the HEAD section in CHANGES.md with a description of what you have done
5. Push your changes and create the PR, and we'll try to get this merged in right away
