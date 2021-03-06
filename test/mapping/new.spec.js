/*
 These tests deal with the creation of new SiestaModel objects.
 */

var s = require('../../index')
    , assert = require('chai').assert;

describe('mapping new object', function () {
    var Collection = require('../../src/collection').Collection;

    var RelationshipType = require('../../src/relationship').RelationshipType;
    var ForeignKeyProxy = require('../../src/foreignKeyProxy').ForeignKeyProxy;
    var cache = require('../../src/cache');
    

    beforeEach(function () {
        s.reset(true);
    });

    describe('fields', function () {
        var collection, carMapping;

        beforeEach(function (done) {
            collection = new Collection('myCollection');
            carMapping = collection.mapping('Car', {
                id: 'id',
                attributes: ['colour', 'name']
            });
            collection.install(done);
        });

        it('valid', function () {
            var car = carMapping._new();
            _.each(carMapping._fields, function (f) {
                assert(car[f] !== undefined);
            });
        });

        describe('id field', function () {
            var car;
            beforeEach(function () {
                car = carMapping._new();
            });

            it('should be present', function () {
                assert.property(car, 'id');
            });

            describe('in cache', function () {
                beforeEach(function () {
                    cache.insert(car);
                    assert.equal(car, cache.get({_id: car._id}));
                    car.id = 'newRemoteId';
                });
                it('should update cache', function () {
                    assert.equal(car, cache.get({id: car.id, mapping: car.mapping}));
                });
                it('should remove previous', function () {
                    assert.equal(car, cache.get({id: car.id, mapping: car.mapping}));
                    car.id = 'brandNewRemoteId';
                    assert.equal(car, cache.get({id: car.id, mapping: car.mapping}));
                    assert.notOk(cache.get({id: 'newRemoteId', mapping: car.mapping}))
                });
                it('should remove all if set remoteid to null', function () {
                    assert.equal(car, cache.get({id: car.id, mapping: car.mapping}));
                    car.id = null;
                    assert.notOk(cache.get({id: 'newRemoteId', mapping: car.mapping}))
                })
            });
        });


    });

    describe('relationships', function () {
        var collection, carMapping, personMapping;

        function configureAPI(type, reverseName, done) {
            collection = new Collection('myCollection');
            carMapping = collection.mapping('Car', {
                id: 'id',
                attributes: ['colour', 'name'],
                relationships: {
                    owner: {
                        mapping: 'Person',
                        type: type,
                        reverse: reverseName
                    }
                }
            });
            personMapping = collection.mapping('Person', {
                id: 'id',
                attributes: ['age', 'name']
            });
            collection.install(done);
        }

        beforeEach(function (done) {
            configureAPI(RelationshipType.ForeignKey, 'cars', done);
        });

        describe('installation of proxies', function () {

            it('installs forward related object proxy', function () {
                var carObject = carMapping._new();
                assert.instanceOf(carObject.ownerProxy, ForeignKeyProxy);
            });

            it('installs reverse related object proxy', function () {
                var personObject = personMapping._new();
                assert.instanceOf(personObject.carsProxy, ForeignKeyProxy);
            });

        });

    });



});
