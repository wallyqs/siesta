var s = require('../index')
    , assert = require('chai').assert;

describe('change identifiers', function () {

    var Collection = require('../src/collection').Collection;
    var cache = require('../src/cache');
    var collection, carMapping;

    var car;

    beforeEach(function (done) {
        s.reset(true);
        collection = new Collection('myCollection');
        carMapping = collection.mapping('Car', {
            id: 'id',
            attributes: ['colour', 'name']
        });
        collection.install(function (err) {
            if (err) done(err);
            carMapping.map({id: 'xyz', colour: 'red', name: 'ford'}, function (err, _car) {
                if (err) done(err);
                car = _car;
                done();
            })
        });
    });

    it('xyz', function (done) {
        assert.equal(cache.get({id: 'xyz', mapping: carMapping}), car);
        car.id = 'abc';
        assert.notOk(cache.get({id: 'xyz', mapping: carMapping}), car);
        assert.equal(cache.get({id: 'abc', mapping: carMapping}), car);
        done();
    });

});