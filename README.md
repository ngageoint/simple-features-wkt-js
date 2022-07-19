# Simple Features WKT Javascript

#### Simple Features Well Known Text Lib ####

The Simple Features Libraries were developed at the [National Geospatial-Intelligence Agency (NGA)](http://www.nga.mil/) in collaboration with [BIT Systems](https://www.caci.com/bit-systems/). The government has "unlimited rights" and is releasing this software to increase the impact of government investments by providing developers with the opportunity to take things in new directions. The software use, modification, and distribution rights are stipulated within the [MIT license](http://choosealicense.com/licenses/mit/).

### Pull Requests ###
If you'd like to contribute to this project, please make a pull request. We'll review the pull request and discuss the changes. All pull request contributions to this project will be released under the MIT license.

Software source code previously released under an open source license and then modified by NGA staff is considered a "joint work" (see 17 USC § 101); it is partially copyrighted, partially public domain, and as a whole is protected by the copyrights of the non-government authors and must be released according to the terms of the original open source license.

### About ###

[Simple Features WKT](http://ngageoint.github.io/simple-features-wkt-js/) is a Javascript library for reading and writing [Simple Feature](https://github.com/ngageoint/simple-features-js) Geometries to and from Well-Known Binary.


### Usage ###

View the latest [JS Docs](http://ngageoint.github.io/simple-features-wkt-js)


#### Browser Usage ####
```html
<script src="/path/to/simple-features-wkt-js/dist/sf-wkt.min.js"></script>
```
##### - Read
```javascript
const { GeometryReader } = window.SimpleFeaturesWKT;

//const text = ...
const geometry = GeometryReader.readGeometry(text);
const geometryType = geometry.getGeometryType();
```
##### - Write
```javascript
const { GeometryWriter } = window.SimpleFeaturesWKT;
// const geometry = ...

const text = GeometryWriter.writeGeometry(geometry);
```

#### Node Usage ####
[![NPM](https://img.shields.io/npm/v/@ngageoint/simple-features-wkt-js.svg)](https://www.npmjs.com/package/@ngageoint/simple-features-wkt-js)

Pull from [NPM](https://www.npmjs.com/package/@ngageoint/simple-features-wkt-js)

```install
npm install --save simple-features-wkt-js
```
##### - Read
```javascript
const { GeometryReader } = require("@ngageoint/simple-features-wkt-js");

//const text = ...
const geometry = GeometryReader.readGeometry(text);
const geometryType = geometry.getGeometryType();
```
##### - Write
```javascript
const { GeometryWriter } = require("@ngageoint/simple-features-wkt-js");

// const geometry = ...
const text = GeometryWriter.writeGeometry(geometry);
```

### Build ###

![Build & Test](https://github.com/ngageoint/simple-features-wkt-js/actions/workflows/run-tests.yml/badge.svg)

Build this repository using Node.js:
   
    npm install
    npm run build
