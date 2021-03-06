// Backbone.PagedCollection.js 0.1

// (c) 2012 Amir Grozki
// Distributed under the MIT license.
// https://github.com/GeReV/Backbone.PagedCollection
// Based on https://gist.github.com/705733

(function (Backbone) {
  var PagedCollection = Backbone.PagedCollection = function(models, options) {  
    var _reset = this._reset;
    
    this._reset = function() {
      _reset.call(this);
      
      this.pages = {};
    };
    
    options || (options = {});
    
    if (options.model) this.model = options.model;
    if (options.comparator) this.comparator = options.comparator;
    
    this._reset();
    
    this.perPage = options.perPage || 10;
    this.total = options.total || models.length;
   
    this.collection = options.collection || Backbone.Collection;
    
    this.initialize.apply(this, arguments);
    
    if (models) this.reset(models, {silent: true, parse: options.parse, total: this.total });
  };
  
  _.extend(PagedCollection.prototype, Backbone.Collection.prototype, {
    initialize: function() {
      _.bindAll(this, 'parse', 'url', 'pageInfo', 'nextPage', 'previousPage');

      this.page = 1;
    },
    
    fetch: function(options) {
      options || (options = {});
      
      var collection, 
          self = this, 
          success = options.success;
      
      if (!this.pages[ this.page ] || options.force
          /*|| this.pages[ this.page ].timestamp < blabla // Something with the cache timestamp? */) {
            
        this.trigger("fetching");

        collection = new this.collection();
        collection.parse = this.parse;

        options.success = _.bind(function(resp) {
          
          this.pages[ this.page ] = { timestamp: (new Date).getTime(), collection: collection };
          
          //Backbone.Collection.prototype.reset.call(this, this.pages[ this.page ].collection.toArray() );
          this.trigger("reset");
          
          success && success(self, resp);
          
          this.trigger("fetched");
          
        }, this);
        
        options.parse = this.parse;
        options.url = collection.url({ page: this.page, limit: this.perPage });
        
        if (this.dataFilter) {
          options.data = this.dataFilter;
        }

        collection.fetch(options);
      }else{
        //Backbone.Collection.prototype.reset.call(this, this.pages[ this.page ].collection.toArray() );
        this.trigger("reset");
        
        success && success(self);
      }

    },
    
    reset: function(models, options) {

      var timestamp = (new Date).getTime(), i, pageCount = Math.max(1, Math.ceil(this.total / this.perPage));
      
      options || (options = {});
      models || (models = []);
        
      this.total = options.total || models.length;

      var initialModels = models.length;

      this._reset();
      
      if (this.total) {
        // Initialize the collection into pages if provided immediately.
        for(i = 1; i <= pageCount; ++i) {
			var last = this.perPage * i;
			var first = (this.perPage) * i - this.perPage;
          if (initialModels <= first) {
            break;
          }

          this.pages[i] = { timestamp: timestamp, collection: new this.collection(_.first(models, this.perPage), options) };
          
          this.pages[i].collection.url = this.url;

          models = _(models).rest(this.perPage);
        }
      }
      
      if (pageCount < this.page) {
        this.page = pageCount;
      }
      
      //Backbone.Collection.prototype.reset.call(this, this.total ? this.pages[ this.page ].collection.toArray() : [], options );
      this.trigger("reset");
    },
    
    parse: function(resp) {
      this.page = resp.page;
      this.perPage = resp.per_page;
      this.total = resp.total;
      
      return resp.items;
    },
    
    url: function() {
      return this.urlRoot;
    },
    
    pageInfo: function() {
      var info = {
            total: this.total,
            page: this.page,
            perPage: this.perPage,
            pages: Math.ceil(this.total / this.perPage),
            prev: false,
            next: false
          },
          max = Math.min(this.total, this.page * this.perPage);
          
      info.range = [(this.page - 1) * this.perPage + 1, max];
  
      if (this.page > 1) {
        info.prev = this.page - 1;
      }
  
      if (this.page < info.pages) {
        info.next = this.page + 1;
      }
  
      return info;
    },
    
    nextPage: function() {
      this.page = this.page + 1;
      
      this.fetch();
    },
    
    setPage: function(page) {
      this.page = page;
      
      this.fetch();
    },
    
    previousPage: function() {
      this.page = this.page - 1;
      
      this.fetch();
    },
    
    setFilter: function(filter) {
      this._reset();
      
      this.dataFilter = filter;
      
      this.page = 1;
      this.fetch();
    }
  
  });
  
  var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
      'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any',
      /*'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex',*/
      'toArray', 'size', 'first', 'initial', 'rest', 'last', /*'without',*/ 'indexOf',
      'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];
  
  _.each(methods, function(method) {
    PagedCollection.prototype[method] = function() {
      var models;
      if (typeof this.pages[this.page] !== 'undefined') {
        models = this.pages[ this.page ].collection.models;
      } else {
        models = [];
      }

      return _[method].apply(_, [models].concat(_.toArray(arguments)));
    };
  });
}(Backbone));