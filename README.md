# s3-s3

**This library still needs to be tested out at Brightcove.  Until we've done that Toxy proxy testing, use at your own risk!  (Or rather, use at your own risk even more than usual.)**

A Node.js library for S3 redunancy, making sure your calls to S3 keep working even if there is an issue with one S3 location.  This library is intended to be used with two buckets set up with [cross-region replication](http://docs.aws.amazon.com/AmazonS3/latest/dev/crr.html).

This library tries to look like a subset of the API from [AWS.S3](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html) for easy use.  Normally, calls with this library will be sent to the primary S3 location.  If there are any unexpected issues with an S3 call, however, it will use a secondary, failover S3 location.

[![Build Status](https://secure.travis-ci.org/brightcove/s3-s3.png?branch=master)](http://travis-ci.org/brightcove/s3-s3)

[![NPM](https://nodei.co/npm/s3-s3.png)](https://nodei.co/npm/s3-s3/)

## Usage

Before using this library, you should have two buckets set up for cross-region replication.  They need to be both replicating to each other.  See [Amazon's guide for setup](http://docs.aws.amazon.com/AmazonS3/latest/dev/crr-how-setup.html).  A few additional tips on setup:
- don't forget to turn on versioning for both buckets
- once you have gone through the replication steps, remember to go back to setting up the second bucket for replication as well
- if you are starting with one bucket that arleady has data, make sure to use the AWS SDK for an initial copy of files from one bucket to another

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

Make sure the configurations used above contain a bucket.  Sometimes this is specified later, in params, but for this library it must be specified up front.

With the above, you can then set up the s3-s3 object:
```
  var S3S3 = require('s3-s3'),
    s3 = new S3S3(s3Primary, s3Secondary);
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
  }).on('failover', function (response) {
    console.log('failover!');
    // no callback, as we will still get an error or success
  }).send();
```

Two things to note about the example above.  The first is that using the request object returned from an API call is required with this library.  AWS.S3 also allows you to pass in parameters to putObject above, and that is not a current feature of this library.  The second thing to note is the failover event used above- this is the one addition to the normal event list returned from AWS.S3.  It is used to indicate that a failover to the secondary location is being attempted due to issues communicating with the primary location.

## APIs

New s3-s3 object:

```
  var S3S3 = require('s3-s3'),
    s3 = new S3S3(s3Primary, s3Secondary);
```

S3 APIs:

```
request = s3.putObject();
request = s3.deleteObject();
request = s3.deleteObjects();
request = s3.listObjects();
request = s3.getObject();
```

Some of the usual S3 APIs are not supported above, simply because the creators of this project didn't need them.  You're welcome to create a PR to add more support.

request events and send:
```
request.on('send', function() {})
       .on('retry', function() {})
       .on('extractError', function() {})
       .on('extractData', function() {})
       .on('success', function() {})
       .on('complete', function() {})
       .on('error', function() {})
       .on('failover', function() {})
       .send();
```

Some of the usual S3.Request events are not supported above, simply because the creators of this project didn't need them.  You're welcome to create a PR to add more support.

## Submitting changes

Thanks for considering making any updates to this project!  Here are the steps to take in your fork:

1. Run "npm install"
2. Add your changes in your fork as well as any new tests needed
3. Run "npm test"
4. Update the HEAD section in CHANGES.md with a description of what you have done
5. Push your changes and create the PR, and we'll try to get this merged in right away
