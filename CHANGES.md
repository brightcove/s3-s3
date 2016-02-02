CHANGELOG
=========

## HEAD (Unreleased)

--------------------

## 1.4.0 (2-1-2015)

* @bdeitte Add response parameter to error and failover callbacks

## 1.3.0 (1-14-2015)

* @bdeitte Remove httpDone, as it does not work well with failover
* @bdeitte Substantial doc updates based on testing

## 1.2.1 (12-29-2015)

* @bdeitte Add httpData and httpDone to types

## 1.2.0 (12-29-2015)

* @bdeitte Switch failover check from error.code to the correct error.statusCode.
* @bdeitte Update docs to remove not-ready-for-primetime note.  Still testing, but initial test by @sahlas all good now.

## 1.1.3 (12-26-2015)

* @bdeitte Fix error that occurred during failover due to copying params.

## 1.1.2 (12-21-2015)

* @bdeitte Fix up Buckets usage, which was not working quite right until now.

## 1.1.1 (12-21-2015)

* @bdeitte More docs
* @bdeitte Error when request.params.Bucket is used

## 1.1.0 (12-17-2015)

* @bdeitte Add in getObjects and listObjects to supported functions

## 1.0.0 (12-17-2015)

* @bdeitte Initial implementation
