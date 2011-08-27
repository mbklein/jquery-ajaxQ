/*!
 * jQuery AJAX Request Queueing Transport Plugin 0.1.1
 * http://github.com/mbklein/jquery-ajax-queue.git
 * Requires jQuery 1.5+
 *
 * Copyright Michael B. Klein
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 */
 
(function($) {
  var queues = { 
    queue: newRequestQueue()
  };

  function newRequestQueue(opts) {
    opts = opts || {}
    opts.maxRequests = opts.maxRequests || 5;
    return({ pending: 0, requests: [], opts: opts });
  }

  function sendNextRequest(queueName) {
    var thisQueue = queues[queueName];
    var context = thisQueue.requests.shift();
    if (context) {
      thisQueue.pending++;
      if (context.ajaxOptions.dequeued) {
        context.ajaxOptions.dequeued(context.xhr);
      }
      
      var jqxhr = $.ajax(context.ajaxOptions);
      jqxhr.success(function(data, status, xhr) {
        context.deferred.resolve(data, status, xhr);
      });

      jqxhr.error(function(jqXHR, status, error) {
        context.deferred.reject(jqXHR, status, error);
      });
      
      jqxhr.complete(function(jqXHR, status, error) {
        requestComplete(queueName);
      })
    }
  }

  function requestComplete(queueName) {
    var thisQueue = queues[queueName];
    thisQueue.pending--;
    sendNextRequest(queueName);
  }

  function queueRequest(queueName, ajaxOptions, deferred) {
    var thisQueue = queues[queueName];
    thisQueue.requests.push({ ajaxOptions: ajaxOptions, deferred: deferred });
    if (thisQueue.pending <= thisQueue.opts.maxRequests) {
      sendNextRequest(queueName);
    }
  }

  function cancelRequest(queueName, deferred) {
    var thisQueue = queues[queueName];
    for (var i = 0; i < thisQueue.length; i++) {
      if (thisQueue[i].deferred == deferred) {
        thisQueue.splice(i,1).deferred.reject(deferred, 'aborted');
      }
    }
  }

  $.extend({
      ajaxQ: function(queueName, opts) {
        if (! queues.hasOwnProperty(queueName)) {
            queues[queueName] = newRequestQueue(opts);
        } else {
            throw "QueueError: queue '" + options.queue + "' is already defined."
        }
      },
      clearQ: function(queueName) {
        var thisQueue = queues[queueName];
        if (thisQueue) {
          for (var i = 0; i < thisQueue.length; i++) {
            var context = thisQueue[i];
            cancelRequest(queueName, context.xhr);
          }
        }
      }
  });

  var originalAjax = $.ajax;
  $.ajax = function(opts) {
    if (opts.ajaxQ) {
      var thisQueue = opts.ajaxQ || 'queue';
      if (queues.hasOwnProperty(thisQueue)) {
        var deferred = $.Deferred();
        var promise = deferred.promise();
        promise.success = promise.done;
        promise.error = promise.fail;
        promise.complete = deferred.done;
        delete opts['ajaxQ'];
        queueRequest(thisQueue, opts, deferred);
        return promise;
      } else {
        throw "QueueError: queue '" + options.queue + "' is not defined."
      }
    } else {
      return originalAjax(opts);
    }
  }
})(jQuery);
