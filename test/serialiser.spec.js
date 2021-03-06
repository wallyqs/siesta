var s = require('../index')
    , assert = require('chai').assert;

describe('serialisers', function () {

    var Collection = require('../src/collection').Collection;
    var RelationshipType = require('../src/relationship').RelationshipType;
    var Serialiser = require('../src/serialiser');

    var collection, carMapping, personMapping, vitalSignsMapping;


    beforeEach(function () {
        s.reset(true);
    });

    describe('id serialiser', function () {
        beforeEach(function (done) {
            collection = new Collection('myCollection');
            personMapping = collection.mapping('Person', {
                attributes: ['name', 'age']
            });
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
            collection.install(done);
        });
        it('should return the id if has one', function (done) {
            carMapping.map({colour: 'red', name: 'Aston Martin', id: 5}, function (err, car) {
                if (err) done(err);
                assert.equal(Serialiser.idSerialiser(car), car.id);
                done();
            });
        });
        it('should return null if doesnt have an id', function (done) {
            carMapping.map({colour: 'red', name: 'Aston Martin'}, function (err, car) {
                if (err) done(err);
                assert.equal(Serialiser.idSerialiser(car), null);
                done();
            });
        });
        it('should return null if no id field', function (done) {
            personMapping.map({name: 'Michael Ford', id: 5}, function (err, car) {
                if (err) done(err);
                assert.equal(Serialiser.idSerialiser(car), null);
                done();
            });
        });
    });

    describe('depth serialiser', function () {
        beforeEach(function (done) {
            collection = new Collection('myCollection');

            personMapping = collection.mapping('Person', {
                attributes: ['name', 'age'],
                id: 'id',
                relationships: {
                    vitalSigns: {
                        mapping: 'VitalSigns',
                        type: RelationshipType.OneToOne,
                        reverse: 'person'
                    }
                }
            });
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
            vitalSignsMapping = collection.mapping('VitalSigns', {
                id: 'id',
                attributes: ['heartRate', 'bloodPressure']
            });
            collection.install(done);

        });

        it('depth 0', function (done) {
            carMapping.map({colour: 'red', name: 'Aston Martin', id: 5, owner: {name: 'Michael Ford', id: 28}}, function (err, car) {
                if (err) done(err);
                Serialiser.depthSerializer(0)(car, function (err, data) {
                    if (err) done(err);
                    assert.equal(data.colour, car.colour);
                    assert.equal(data.name, car.name);
                    assert.equal(data.id, car.id);
                    assert.equal(data.owner, 28);
                    done();
                });
            });
        });

        it('depth 1', function (done) {
            carMapping.map({colour: 'red', name: 'Aston Martin', id: 5, owner: {name: 'Michael Ford', id: 28, vitalSigns: {id: 35, heartRate: 65}}}, function (err, car) {
                if (err) done(err);
                Serialiser.depthSerializer(1)(car, function (err, data) {
                    if (err) done(err);
                    assert.equal(data.colour, car.colour);
                    assert.equal(data.name, car.name);
                    assert.equal(data.id, car.id);
                    assert.equal(data.owner.id, 28);
                    assert.equal(data.owner.vitalSigns, 35);
                    done();
                });
            });
        });

        it('depth 2', function (done) {
            carMapping.map({colour: 'red', name: 'Aston Martin', id: 5, owner: {name: 'Michael Ford', id: 28, vitalSigns: {id: 35, heartRate: 65}}}, function (err, car) {
                if (err) done(err);
                Serialiser.depthSerializer(2)(car, function (err, data) {
                    if (err) done(err);
                    assert.equal(data.colour, car.colour);
                    assert.equal(data.name, car.name);
                    assert.equal(data.id, car.id);
                    assert.equal(data.owner.id, 28);
                    assert.equal(data.owner.vitalSigns.heartRate, 65);
                    done();
                });
            });
        });

    });


});