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
      queue: newRequestContext()
    };
  
    function newRequestContext(opts) {
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
        $.ajax(context.ajaxOptions);
      }
    }
  
    function requestComplete(queueName) {
      var thisQueue = queues[queueName];
      thisQueue.pending--;
      sendNextRequest(queueName);
    }

    function queueRequest(queueName, ajaxOptions, jqXHR) {
      var thisQueue = queues[queueName];
      thisQueue.requests.push({ ajaxOptions: ajaxOptions, xhr: jqXHR });
      if (thisQueue.pending <= thisQueue.opts.maxRequests) {
        sendNextRequest(queueName);
      }
    }
  
    function cancelRequest(queueName, jqXHR) {
      var thisQueue = queues[queueName];
      for (var i = 0; i < thisQueue.length; i++) {
        if (thisQueue[i].xhr == jqXHR) {
          thisQueue.splice(i,1).xhr.abort();
        }
      }
    }
  
    $.extend({
        ajaxQ: function(queueName, opts) {
          if (! queues.hasOwnProperty(queueName)) {
              queues[queueName] = newRequestContext(opts);
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

    $.ajaxTransport('ajaxQ',function(options, originalOptions, jqXHR) { 
        var originalComplete = originalOptions.complete;
        originalOptions.complete = function(xhr, status) {
            originalComplete(xhr, status);
            requestComplete(thisQueue);
        }
        originalOptions.dataType = originalOptions.realDataType;
        var thisQueue = originalOptions.ajaxQ || 'queue';
        if (queues.hasOwnProperty(thisQueue)) {
          return {
            send: function(headers, completeCallback) {
              queueRequest(thisQueue, originalOptions, jqXHR);
            },
            abort: function() {
              cancelRequest(jqXHR);
            }
          }
        } else {
            throw "QueueError: queue '" + options.queue + "' is not defined."
        }
    });
})(jQuery);
