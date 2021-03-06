var s = require('../index')
    , assert = require('chai').assert;

describe('request descriptor', function () {

    var Collection = require('../src/collection').Collection;
    var Descriptor = require('../src/descriptor').Descriptor;
    var RestError = require('../src/error').RestError;
    var DescriptorRegistry = require('../src/descriptorRegistry').DescriptorRegistry;
    var RequestDescriptor = require('../src/requestDescriptor').RequestDescriptor;
    var ResponseDescriptor = require('../src/responseDescriptor').ResponseDescriptor;
    var Serialiser = require('../src/serialiser');
    var RelationshipType = require('../src/relationship').RelationshipType;

    var collection, carMapping, personMapping;

    beforeEach(function (done) {
        s.reset(true);

        collection = new Collection('myCollection');
        carMapping = collection.mapping('Car', {
            id: 'id',
            attributes: ['colour', 'name'],
            relationships: {
                owner: {
                    mapping: 'Person',
                    type: RelationshipType.ForeignKey,
                    reverse: 'cars'
                }
            }
        });
        personMapping = collection.mapping('Person', {
            id: 'id',
            attributes: ['name']
        });
        collection.install(done);
    });

    describe('matching', function () {

        describe('path', function () {
            it('match id', function () {
                var r = new Descriptor({path: '/cars/(?<id>[0-9])/?', mapping: carMapping});
                var match = r._matchPath('/cars/5/');
                assert.equal(match.id, '5');
                match = r._matchPath('/cars/5');
                assert.equal(match.id, '5');
            });
        });

        describe('http methods', function () {
            it('all http methods', function () {
                var r = new Descriptor({method: '*', mapping: carMapping});
                _.each(r.httpMethods, function (method) {
                    assert.include(r.method, method);
                });
                r = new Descriptor({method: ['*'], mapping: carMapping});
                _.each(r.httpMethods, function (method) {
                    assert.include(r.method, method);
                });
                r = new Descriptor({method: ['*', 'GET'], mapping: carMapping});
                _.each(r.httpMethods, function (method) {
                    assert.include(r.method, method);
                });
            });
            it('match against all', function () {
                var r = new Descriptor({method: '*', mapping: carMapping});
                _.each(r.httpMethods, function (method) {
                    assert.ok(r._matchMethod(method));
                    assert.ok(r._matchMethod(method.toUpperCase()));
                    assert.ok(r._matchMethod(method.toLowerCase()));
                });
            });
            it('match against some', function () {
                var r = new Descriptor({method: ['POST', 'PUT'], mapping: carMapping});
                assert.ok(r._matchMethod('POST'));
                assert.ok(r._matchMethod('PUT'));
                assert.ok(r._matchMethod('post'));
                assert.ok(r._matchMethod('put'));
                assert.ok(r._matchMethod('PoSt'));
                assert.ok(r._matchMethod('pUt'));
                assert.notOk(r._matchMethod('HEAD'));
                assert.notOk(r._matchMethod('head'));
                assert.notOk(r._matchMethod('hEaD'));
            });
            it('match against single', function () {
                function assertMatchMethod(r) {
                    assert.ok(r._matchMethod('POST'));
                    assert.ok(r._matchMethod('post'));
                    assert.ok(r._matchMethod('PoSt'));
                    assert.notOk(r._matchMethod('HEAD'));
                    assert.notOk(r._matchMethod('head'));
                    assert.notOk(r._matchMethod('hEaD'));
                }

                assertMatchMethod(new Descriptor({method: ['POST'], mapping: carMapping}));
                assertMatchMethod(new Descriptor({method: ['pOsT'], mapping: carMapping}));
                assertMatchMethod(new Descriptor({method: 'pOsT', mapping: carMapping}));
                assertMatchMethod(new Descriptor({method: 'post', mapping: carMapping}));
                assertMatchMethod(new Descriptor({method: 'POST', mapping: carMapping}));
            })
        });

    });


    describe('specify mapping', function () {
        it('as object', function () {
            var r = new Descriptor({mapping: carMapping});
            assert.equal(r.mapping, carMapping);
        });
        it('as string', function () {
            var r = new Descriptor({mapping: 'Car', collection: 'myCollection'});
            assert.equal('Car', r.mapping.type);
        });
        it('as string, but collection as object', function () {
            var r = new Descriptor({mapping: 'Car', collection: collection});
            assert.equal('Car', r.mapping.type);
        });
        it('should throw an exception if passed as string without collection', function () {
            assert.throws(_.partial(Descriptor, {mapping: 'Car'}), RestError);
        });
    });

    describe('data', function () {
        it('if null, should be null', function () {
            var r = new Descriptor({data: null, mapping: carMapping});
            assert.notOk(r.data);
        });
        it('if empty string, should be null', function () {
            var r = new Descriptor({data: '', mapping: carMapping});
            assert.notOk(r.data);
        });
        it('if length 1, should be a string', function () {
            var r = new Descriptor({data: 'abc', mapping: carMapping});
            assert.equal(r.data, 'abc');
        });
        it('if > length 1, should be an object', function () {
            var r = new Descriptor({data: 'path.to.data', mapping: carMapping});
            assert.equal(r.data.path.to, 'data');
        });
        describe('embed', function () {
            var data = {x: 1, y: 2, z: 3};
            it('if null, should simply return the object', function () {
                var r = new Descriptor({data: null, mapping: carMapping});
                assert.equal(data, r._embedData(data));
            });
            it('if empty string, should simply return the object', function () {
                var r = new Descriptor({data: '', mapping: carMapping});
                assert.equal(data, r._embedData(data));
            });
            it('if length 1, should return 1 level deep object', function () {
                var r = new Descriptor({data: 'abc', mapping: carMapping});
                assert.equal(data, r._embedData(data).abc);
            });
            it('if > length 1, should return n level deep object', function () {
                var r = new Descriptor({data: 'path.to.data', mapping: carMapping});
                var extractData = r._embedData(data);
                assert.equal(data, extractData.path.to.data);
            });
        });
        describe('extract', function () {
            var data = {x: 1, y: 2, z: 3};
            it('if null, should simply return the object', function () {
                var r = new Descriptor({data: null, mapping: carMapping});
                var extractData = r._extractData(data);
                assert.equal(extractData, data);
            });
            it('if empty string, should simply return the object', function () {
                var r = new Descriptor({data: '', mapping: carMapping});
                var extractData = r._extractData(data);
                assert.equal(extractData, data);
            });
            it('if length 1, should return 1 level deep object', function () {
                var r = new Descriptor({data: 'abc', mapping: carMapping});
                var extractData = r._extractData({abc: data});
                assert.equal(extractData, data);
            });
            it('if > length 1, should return n level deep object', function () {
                var r = new Descriptor({data: 'path.to.data', mapping: carMapping});
                var extractData = r._extractData({path: {to: {data: data}}});
                assert.equal(extractData, data);
            });
        });
    });

    describe('registry', function () {
        it('should register request descriptor', function () {
            var r = new RequestDescriptor({data: 'path.to.data', mapping: carMapping});
            DescriptorRegistry.registerRequestDescriptor(r);
            assert.include(DescriptorRegistry.requestDescriptors[carMapping.collection], r);
        });
        describe('request descriptors for collection', function () {
            var descriptor;
            beforeEach(function () {
                descriptor = new RequestDescriptor({data: 'path.to.data', mapping: carMapping});
                DescriptorRegistry.registerRequestDescriptor(descriptor);
            });
            it('request descriptors should be accessible by collection name', function () {
                assert.include(DescriptorRegistry.requestDescriptorsForCollection(carMapping.collection), descriptor);
            });
            it('request descriptors should be accessible by collection', function () {
                assert.include(DescriptorRegistry.requestDescriptorsForCollection(collection), descriptor);
            });
        });

    });

    describe('match http config', function () {
        describe('no data', function () {
            var descriptor;
            beforeEach(function () {
                descriptor = new Descriptor({
                    method: 'POST',
                    mapping: carMapping,
                    path: '/cars/(?<id>[0-9])/?'
                });
            });
            it('match', function () {
                assert.ok(descriptor._matchConfig({
                    type: 'POST',
                    url: '/cars/5/'
                }));
            });
            it('no match because of method', function () {
                assert.notOk(descriptor._matchConfig({
                    type: 'GET',
                    url: '/cars/5/'
                }));
            });
            it('no match because of url', function () {
                assert.notOk(descriptor._matchConfig({
                    type: 'POST',
                    url: '/asdasd/'
                }));
            });
        });


    });

    describe('match against data', function () {
        var descriptor;

        describe('data specified', function () {
            beforeEach(function () {
                descriptor = new Descriptor({
                    mapping: carMapping,
                    data: 'path.to.data'
                });
            });
            it('match', function () {
                assert.ok(descriptor._matchData({
                    path: {
                        to: {
                            data: {
                                x: 1,
                                y: 2
                            }
                        }
                    }
                }));
            });
            it('no match', function () {
                assert.notOk(descriptor._matchData({
                    path: { // Missing 'to'
                        data: {
                            x: 1,
                            y: 2
                        }
                    }
                }));
            });
        });

        describe('data unspecified', function () {

        })

    });

    describe('compound match', function () {
        var descriptor;
        beforeEach(function () {
            descriptor = new Descriptor({
                method: 'POST',
                mapping: carMapping,
                path: '/cars/(?<id>[0-9])/?',
                data: 'path.to.data'
            });
        });

        it('success', function () {
            var config = {
                type: 'POST',
                url: '/cars/5/'
            };
            var data = {
                path: {
                    to: {
                        data: {
                            x: 1,
                            y: 2
                        }
                    }
                }
            };
            assert.ok(descriptor.match(config, data));
        });
    });

    describe('defaults', function () {
        var descriptor;
        beforeEach(function () {
            descriptor = new Descriptor({mapping: carMapping});
        });
        it('default method is *', function () {
            _.each(descriptor.httpMethods, function (method) {
                assert.include(descriptor.method, method.toUpperCase());
            });
        });
        it('default path is blank', function () {
            assert.equal(descriptor.path, '');
        });
        it('default data is null', function () {
            assert.equal(descriptor.data, null);
        })
    });

    describe('errors', function () {
        it('no mapping', function () {
            assert.throws(function () {
                new Descriptor({data: 'data'})
            }, RestError);
        });
    });

    describe('RequestDescriptor', function () {
        describe('serialisation', function () {
            it('default', function () {
                var requestDescriptor = new RequestDescriptor({
                    method: 'POST',
                    mapping: carMapping,
                    path: '/cars/(?<id>[0-9])/?'
                });
                assert.notEqual(requestDescriptor.serialiser, Serialiser.idSerialiser);
            });

            describe('built-in', function () {
                var requestDescriptor;

                describe('id', function () {
                    beforeEach(function () {
                        requestDescriptor = new RequestDescriptor({
                            method: 'POST',
                            mapping: carMapping,
                            path: '/cars/(?<id>[0-9])/?',
                            serialiser: Serialiser.idSerialiser
                        });
                    });
                    it('uses the serialiser', function () {
                        assert.equal(requestDescriptor.serialiser, Serialiser.idSerialiser);
                    });
                    it('serialises', function (done) {
                        carMapping.map({colour: 'red', name: 'Aston Martin', id: 'xyz'}, function (err, car) {
                            if (err) done(err);
                            requestDescriptor._serialise(car, function (err, data) {
                                if (err) done(err);
                                assert.equal(data, car.id);
                                done();
                            })
                        });
                    });
                });

                describe('depth', function () {
                    var requestDescriptor;
                    beforeEach(function () {
                        requestDescriptor = new RequestDescriptor({
                            method: 'POST',
                            mapping: carMapping,
                            path: '/cars/(?<id>[0-9])/?',
                            serialiser: Serialiser.depthSerializer(0)
                        });
                    });

                    it('uses the serialiser', function () {
                        assert.notEqual(requestDescriptor.serialiser, Serialiser.idSerialiser);
                    });

                    it('serialises at depth', function (done) {
                        carMapping.map({colour: 'red', name: 'Aston Martin', id: 'xyz', owner: {id: '123', name: 'Michael Ford'}}, function (err, car) {
                            if (err) done(err);
                            requestDescriptor._serialise(car, function (err, data) {
                                if (err) done(err);
                                assert.equal(data.owner, '123');
                                done();
                            })
                        });
                    });
                });

                describe('transforms', function () {
                    var requestDescriptor;

                    it('key paths', function () {
                        requestDescriptor = new RequestDescriptor({
                            mapping: carMapping,
                            transforms: {
                                'colour': 'path.to.colour'
                            }
                        });
                        var data = {colour: 'red'};
                        requestDescriptor._transformData(data);
                        assert.notOk(data.colour);
                        assert.equal(data.path.to.colour, 'red');
                    });

                    it('key', function () {
                        requestDescriptor = new RequestDescriptor({
                            mapping: carMapping,
                            transforms: {
                                'colour': 'color'
                            }
                        });
                        var data = {colour: 'red'};
                        requestDescriptor._transformData(data);
                        assert.notOk(data.colour);
                        assert.equal(data.color, 'red');
                    });

                    it('function with return val', function () {
                        requestDescriptor = new RequestDescriptor({
                            mapping: carMapping,
                            transforms: {
                                'colour': function (val) {
                                    var newVal = val;
                                    if (val == 'red') {
                                        newVal = 'blue';
                                    }
                                    return newVal;
                                }
                            }
                        });
                        var data = {colour: 'red'};
                        requestDescriptor._transformData(data);
                        assert.equal(data.colour, 'blue');
                    });

                    it('function with return val and key', function () {
                        requestDescriptor = new RequestDescriptor({
                            mapping: carMapping,
                            transforms: {
                                'colour': function (val) {
                                    var newVal = val;
                                    if (val == 'red') {
                                        newVal = 'blue';
                                    }
                                    return ['color', newVal];
                                }
                            }
                        });
                        var data = {colour: 'red'};
                        requestDescriptor._transformData(data);
                        assert.notOk(data.colour);
                        assert.equal(data.color, 'blue');
                    });

                    it('invalid', function () {
                        requestDescriptor = new RequestDescriptor({
                            mapping: carMapping,
                            transforms: {
                                'colour': {wtf: {is: 'this'}}
                            }
                        });
                        var data = {colour: 'red'};
                        assert.throws(function () {
                            requestDescriptor._transformData(data);

                        }, RestError);
                    });

                    describe('during serialisation', function () {
                        beforeEach(function () {
                            requestDescriptor = new RequestDescriptor({
                                method: 'POST',
                                mapping: carMapping,
                                path: '/cars/(?<id>[0-9])/?',
                                serialiser: Serialiser.depthSerializer(0),
                                transforms: {
                                    'colour': 'path.to.colour'
                                }
                            });
                        });

                        it('performs transform', function (done) {
                            carMapping.map({colour: 'red', name: 'Aston Martin', id: 'xyz', owner: {id: '123', name: 'Michael Ford'}}, function (err, car) {
                                if (err) done(err);
                                requestDescriptor._serialise(car, function (err, data) {
                                    if (err) done(err);
                                    assert.equal(data.owner, '123');
                                    assert.equal(data.name, 'Aston Martin');
                                    assert.notOk(data.colour);
                                    assert.equal(data.path.to.colour, 'red');
                                    done();
                                });
                            });
                        });
                    });

                });


            });

            describe('embed', function () {

                describe('id', function () {
                    var requestDescriptor;
                    beforeEach(function () {
                        requestDescriptor = new RequestDescriptor({
                            method: 'POST',
                            mapping: carMapping,
                            path: '/cars/(?<id>[0-9])/?',
                            data: 'path.to',
                            serialiser: Serialiser.idSerialiser
                        });
                    });

                    it('serialises at depth', function (done) {
                        carMapping.map({colour: 'red', name: 'Aston Martin', id: 'xyz', owner: {id: '123', name: 'Michael Ford'}}, function (err, car) {
                            if (err) done(err);
                            requestDescriptor._serialise(car, function (err, data) {
                                if (err) done(err);
                                assert.equal(data.path.to, 'xyz');
                                done();
                            })
                        });
                    });
                });

                describe('depth', function () {
                    var requestDescriptor;
                    beforeEach(function () {
                        requestDescriptor = new RequestDescriptor({
                            method: 'POST',
                            mapping: carMapping,
                            path: '/cars/(?<id>[0-9])/?',
                            data: 'path.to'
                        });
                    });


                    it('serialises at depth', function (done) {
                        carMapping.map({colour: 'red', name: 'Aston Martin', id: 'xyz', owner: {id: '123', name: 'Michael Ford'}}, function (err, car) {
                            if (err) done(err);
                            requestDescriptor._serialise(car, function (err, data) {
                                if (err) done(err);
                                assert.equal(data.path.to.owner, '123');
                                done();
                            })
                        });
                    });
                });

                describe('custom', function () {
                    var requestDescriptor;
                    beforeEach(function () {
                        requestDescriptor = new RequestDescriptor({
                            method: 'POST',
                            mapping: carMapping,
                            path: '/cars/(?<id>[0-9])/?',
                            data: 'path.to',
                            serialiser: function (obj) {
                                return obj.id
                            }
                        });
                    });


                    it('serialises', function (done) {
                        carMapping.map({colour: 'red', name: 'Aston Martin', id: 'xyz', owner: {id: '123', name: 'Michael Ford'}}, function (err, car) {
                            if (err) done(err);
                            requestDescriptor._serialise(car, function (err, data) {
                                if (err) done(err);
                                assert.equal(data.path.to, 'xyz');
                                done();
                            })
                        });
                    });
                });


            });

            describe('custom', function () {

                function carSerialiser(fields, car, done) {
                    var data = {};
                    for (var idx in fields) {
                        var field = fields[idx];
                        if (car[field]) {
                            data[field] = car[field];
                        }
                    }
                    car.ownerProxy.get(function (err, person) {
                        if (err) {
                            done(err);
                        }
                        else {
                            if (person) {
                                data.owner = person.name;
                            }
                            done(null, data);
                        }
                    });
                }

                var requestDescriptor, serialiser;

                beforeEach(function () {
                    serialiser = _.partial(carSerialiser, ['name']);
                    requestDescriptor = new RequestDescriptor({
                        method: 'POST',
                        mapping: carMapping,
                        path: '/cars/?',
                        serialiser: serialiser
                    });
                });

                it('uses the custom serialiser', function () {
                    assert.equal(requestDescriptor.serialiser, serialiser);
                });

                it('serialises', function (done) {
                    carMapping.map({colour: 'red', name: 'Aston Martin', id: 'xyz', owner: {id: '123', name: 'Michael Ford'}}, function (err, car) {
                        if (err) done(err);
                        requestDescriptor._serialise(car, function (err, data) {
                            if (err) done(err);
                            assert.equal(data.owner, 'Michael Ford');
                            assert.equal(data.name, 'Aston Martin');
                            assert.notOk(data.colour);
                            done();
                        })
                    });
                })
            })
        })
    });

    describe('ResponseDescriptor', function () {

        describe('transforms', function () {
            var responseDescriptor;
            it('key paths', function () {
                responseDescriptor = new ResponseDescriptor({
                    mapping: carMapping,
                    transforms: {
                        'colour': 'path.to.colour'
                    }
                });
                var data = {colour: 'red'};
                responseDescriptor._transformData(data);
                assert.notOk(data.colour);
                assert.equal(data.path.to.colour, 'red');
            });

            it('key', function () {
                responseDescriptor = new ResponseDescriptor({
                    mapping: carMapping,
                    transforms: {
                        'colour': 'color'
                    }
                });
                var data = {colour: 'red'};
                responseDescriptor._transformData(data);
                assert.notOk(data.colour);
                assert.equal(data.color, 'red');
            });

            it('function with return val', function () {
                responseDescriptor = new ResponseDescriptor({
                    mapping: carMapping,
                    transforms: {
                        'colour': function (val) {
                            var newVal = val;
                            if (val == 'red') {
                                newVal = 'blue';
                            }
                            return newVal;
                        }
                    }
                });
                var data = {colour: 'red'};
                responseDescriptor._transformData(data);
                assert.equal(data.colour, 'blue');
            });

            it('function with return val and key', function () {
                responseDescriptor = new ResponseDescriptor({
                    mapping: carMapping,
                    transforms: {
                        'colour': function (val) {
                            var newVal = val;
                            if (val == 'red') {
                                newVal = 'blue';
                            }
                            return ['color', newVal];
                        }
                    }
                });
                var data = {colour: 'red'};
                responseDescriptor._transformData(data);
                assert.notOk(data.colour);
                assert.equal(data.color, 'blue');
            });

            it('invalid', function () {
                responseDescriptor = new ResponseDescriptor({
                    mapping: carMapping,
                    transforms: {
                        'colour': {wtf: {is: 'this'}}
                    }
                });
                var data = {colour: 'red'};
                assert.throws(function () {
                    responseDescriptor._transformData(data);

                }, RestError);
            });

        });

        describe('transforms during deserialisation', function () {
            var responseDescriptor;

            beforeEach(function () {
                responseDescriptor = new ResponseDescriptor({
                    mapping: carMapping,
                    transforms: {
                        'colour': 'color'
                    }
                });
            });

            it('transforms during extractData', function () {
                var extracted = responseDescriptor._extractData({colour: 'red'});
                assert.equal(extracted.color, 'red');
                assert.notOk(extracted.colour);
            });
            it('transforms during matchData', function () {
                var extracted = responseDescriptor._matchData({colour: 'red'});
                assert.equal(extracted.color, 'red');
                assert.notOk(extracted.colour);
            });
        });

    });


});