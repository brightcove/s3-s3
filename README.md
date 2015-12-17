# (in progress, don't use yet!)

# s3-s3

A Node.js library for S3 redunancy, for use with S3 replication.  Normally, calls with this library will be sent to the primary S3 location.  If there are any unexpected issues with an S3 call, however, it will use a secondary, failover S3 location.  While two locations are used under the covers, the library tries to look just like the normal AWS SDK object for easy use.

[![Build Status](https://secure.travis-ci.org/brightcove/s3-s3.png?branch=master)](http://travis-ci.org/brightcove/s3-s3)

## Features

What features?  (Still need to fill this in.)

## Installation

```
$ npm install s3-s3
```

## Usage

What usage?  (Still need to fill this in.)

## Submitting changes

Thanks for considering making any updates to this project!  Here are the steps to take in your fork:

1. Run "npm install"
2. Add your changes in your fork as well as any new tests needed
3. Run "npm test"
4. Update the HEAD section in CHANGES.md with a description of what you have done
5. Push your changes and create the PR, and we'll try to get this merged in right away
