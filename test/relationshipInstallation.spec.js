var s = require('../index')
    , assert = require('chai').assert;

describe('mapping relationships', function () {


    var Collection = require('../src/collection').Collection;
    var RestError = require('../src/error').RestError;
    var RelationshipType = require('../src/relationship').RelationshipType;


    beforeEach(function () {
        s.reset(true);
    });

    var collection, carMapping, personMapping;

    function configureAPI(type, done) {
        collection = new Collection('myCollection');
        carMapping = collection.mapping('Car', {
            id: 'id',
            attributes: ['colour', 'name'],
            relationships: {
                owner: {
                    mapping: 'Person',
                    type: type,
                    reverse: 'cars'
                }
            }
        });
        personMapping = collection.mapping('Person', {
            id: 'id',
            attributes: ['name', 'age']
        });
        collection.install(done);
    }

    describe('valid', function () {


        describe('Foreign Key', function () {

            beforeEach(function (done) {
                configureAPI(RelationshipType.ForeignKey, function (err) {
                    if (err) done(err);
                    done();
                });
            });

            it('configures reverse mapping', function () {
                assert.equal(carMapping.relationships.owner.reverseMapping, personMapping);
            });

            it('configures reverse name', function () {
                assert.equal(carMapping.relationships.owner.reverseName, 'cars');

            it('configures forward mapping', function () {
                assert.equal(carMapping.relationships.owner.forwardMapping, carMapping);
            });

            });
            it('configures forward name', function () {
                assert.equal(carMapping.relationships.owner.forwardName, 'owner');
            });

            it('installs on reverse', function () {
                assert.equal(personMapping.relationships.cars, carMapping.relationships.owner);
            });


        });

        describe('OneToOne', function () {

            beforeEach(function (done) {
                configureAPI(RelationshipType.OneToOne, function (err) {
                    if (err) done(err);
                    done();
                });


            });
            it('configures reverse mapping', function () {
                assert.equal(carMapping.relationships.owner.reverseMapping, personMapping);
            });

            it('configures reverse name', function () {
                assert.equal(carMapping.relationships.owner.reverseName, 'cars');



            });

            it('configures forward mapping', function () {
                assert.equal(carMapping.relationships.owner.forwardMapping, carMapping);
            });
            it('configures forward name', function () {
                assert.equal(carMapping.relationships.owner.forwardName, 'owner');
            });

            it('installs on reverse', function () {
                assert.equal(personMapping.relationships.cars, carMapping.relationships.owner);
            });





        });

    });



    describe('invalid', function () {
        it('No such mapping', function (done) {
            var collection = new Collection('myCollection');
            collection.mapping('Car', {
                id: 'id',
                attributes: ['colour', 'name'],
                relationships: {
                    owner: {
                        mapping: 'asd',
                        type: RelationshipType.ForeignKey,
                        reverse: 'cars'
                    }
                }
            });
            collection.install(function (err) {
                assert.instanceOf(err, RestError);
                done();
            });
        });

        it('No such relationship type', function (done) {
            var collection = new Collection('myCollection');
            collection.mapping('Car', {
                id: 'id',
                attributes: ['colour', 'name'],
                relationships: {
                    owner: {
                        mapping: 'Person',
                        type: 'invalidtype',
                        reverse: 'cars'
                    }
                }
            });
            collection.mapping('Person', {
                id: 'id',
                attributes: ['name', 'age']
            });

            collection.install(function (err) {
                assert.instanceOf(err, RestError);
                done();
            });

        });
    });


});