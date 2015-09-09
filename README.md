# Brace (Ace Editor) worker loader (inliner) for webpack

**WARNING** This... _sort of_ works. You end up with the entire Ace (brace) library inside of the worker bundle (as well as your other bundle!) needlessly, and some JS errors as it tries to access `window`, which doesn't exist in that context.

So this was a bad idea and I didn't end up using it.

## Usage

``` javascript
var MyWorker = require("brace-worker!./my-worker.js");

```

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
