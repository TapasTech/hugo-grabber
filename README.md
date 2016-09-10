Hugo Grabber
---

Chrome extension for grab contents from web pages easily.

Features
---
* Flexible rules (see [rules.js](src/rules.js))
* Rules can be subscribed and updated automatically

Rule transformation
---
Note that only local files ending with `.js` are allowed to be
subscribed. To allow remote retrieving, `.js` rules must be
transformed into JSON versions by commands below:

``` sh
$ node scripts/build-json.js my-rules.js
# There will be a `my-rules.json` file in the same directory
```
