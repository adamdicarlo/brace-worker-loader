var WebWorkerTemplatePlugin = require('webpack/lib/webworker/WebWorkerTemplatePlugin')
var SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
var loaderUtils = require('loader-utils')
var uglify = require('uglify-js')
var util = require('util')

/**
 * This loader is based on
 * - https://github.com/thlorenz/brace/blob/master/build/stringify-workers.js, and
 * - https://github.com/webpack/worker-loader/blob/master/index.js
 */
module.exports = function () {}
module.exports.pitch = function inlineAceWorker (request) {
  if (!this.webpack) throw new Error('Only usable with webpack')
  this.cacheable && this.cacheable()
  this.addDependency(this.resourcePath)

  var callback = this.async()
  var query = loaderUtils.parseQuery(this.query)
  var outputOptions = {
    filename: '[hash].worker.js',
    chunkFilename: '[id].[hash].worker.js',
    namedChunkFilename: null
  }
  if (this.options && this.options.worker && this.options.worker.output) {
    for (var name in this.options.worker.output) {
      outputOptions[name] = this.options.worker.output[name]
    }
  }
  var workerCompiler = this._compilation.createChildCompiler('worker', outputOptions)
  workerCompiler.apply(new WebWorkerTemplatePlugin(outputOptions))
  workerCompiler.apply(new SingleEntryPlugin(this.context, '!!' + request, 'main'))
  if (this.options && this.options.worker && this.options.worker.plugins) {
    this.options.worker.plugins.forEach(function(plugin) {
      workerCompiler.apply(plugin)
    })
  }
  var subCache = 'subcache ' + __dirname + ' ' + request
  workerCompiler.plugin('compilation', function(compilation) {
    if (compilation.cache) {
      if (!compilation.cache[subCache])
        compilation.cache[subCache] = {}
      compilation.cache = compilation.cache[subCache]
    }
  })
  workerCompiler.runAsChild(function(err, entries, compilation) {
    if (err) return callback(err)

    compilation.fileDependencies.forEach(function (dep) {
      this.addDependency(dep)
    }, this)

    compilation.contextDependencies.forEach(function (dep) {
      this.addContextDependency(dep)
    }, this)

    if (entries[0]) {
      var workerFile = entries[0].files[0]
      var workerId = query.id

      var code = "module.exports.id = '" + workerId + "'\n" +
        'module.exports.src = ' + JSON.stringify(minify(compilation.assets[workerFile].source()))

      return callback(null, code)
    } else {
      return callback(null, null)
    }
  }.bind(this))
}

function minify (code) {
  var compressor = uglify.Compressor()
  var ast = uglify.parse(code)

  ast.figure_out_scope()
  return ast.transform(compressor).print_to_string()
}
