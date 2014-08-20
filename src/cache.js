angular.module('restkit.cache', ['restkit', 'restkit.mapper'])

/**
 *
 */
    .factory('cache', function ($rootScope, RestObject, RestError) {

        /**
         * Cache by pouch _id.
         * @type {{}}
         */
        var idCache = {};

        /**
         * Cache by type and whatever id was specified in the mapping.
         * @type {{}}
         */
        var restCache = {};

        function reset() {
            restCache = {};
            idCache = {};
        }

        reset();

        return {
            '_restCache': function () {return restCache},
            '_idCache': function () {return idCache},
            get: function (opts) {
                if (opts._id) {
                    return idCache[opts._id];
                }
                else if (opts.mapping) {
                    var idField = opts.mapping.id;
                    var id = opts[idField];
                    var type = opts.mapping.type;
                    var typeCache = restCache[type];
                    if (typeCache) {
                        return typeCache[id];
                    }
                    return null;
                }
                return null;
            },
            insert: function (obj) {
                if (obj instanceof RestObject) {
                    if (obj._id) {
                        if (!idCache[obj._id]) {
                            idCache[obj._id] = obj;
                        }
                    }
                    var idField = obj.idField;
                    var id = obj[idField];
                    if (id) {
                        var type = obj.mapping.type;
                        if (type) {
                            if (!restCache[type]) {
                                restCache[type] = {};
                            }
                            if (!restCache[type][id]) {
                                restCache[type][id] = obj;
                            }
                        }
                        else {
                            throw new RestError('Mapping has no type', {mapping: obj.mapping, obj: obj});
                        }

                    }
                }
                else {
                    throw new RestError('Only an instance of RestObject can be placed into the object cache.');
                }
            },
            reset: reset
        }
    })

;
