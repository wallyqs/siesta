var s = require('../index')
    , assert = require('chai').assert;


describe('collection setup', function () {

    var Collection = require('../src/collection').Collection;
    var RestError = require('../src/error').RestError;

    beforeEach(function () {
        s.reset(true);
    });

    describe('install', function () {
        var collection;
        beforeEach(function (done) {
            collection = new Collection('MyCollection');
            done();
        });

        it('not installed', function () {
            assert.notOk(collection.installed);
        });

        describe('configure without mappings', function () {
            it('eventually finishes', function (done) {
                collection.install(function (err) {
                    if (err) done(err);
                    done();
                });
            });

            it('raises an error if trying to configure twice', function (done) {
                collection.install(function (err) {
                    if (err) done(err);
                    collection.install(function (err) {
                        assert.ok(err);
                        done();
                    })
                });
            });

            it('is accessible in the siesta object', function (done) {
                collection.install(function (err) {
                    if (err) done(err);
                    assert.equal(s.MyCollection, collection);
                    done();
                });
            });
        });

        it('raises an error if trying to configure twice', function (done) {
            collection.install(function (err) {
                if (err) done(err);
                collection.install(function (err) {
                    assert.ok(err);
                    done();
                })
            });
        });

        describe('configure with mappings', function () {
            it('name before object', function (done) {
                var mapping1 = collection.mapping('mapping1', {
                    id: 'id',
                    attributes: ['attr1', 'attr2']
                });
                var mapping2 = collection.mapping('mapping2', {
                    id: 'id',
                    attributes: ['attr1', 'attr2', 'attr3']
                });
                collection.install(function (err) {
                    if (err) done(err);
                    assert.equal(collection['mapping1'], mapping1);
                    assert.equal(collection['mapping2'], mapping2);
                    done();
                });
            });

            it('name within object', function (done) {
                var mapping1 = collection.mapping({
                    name: 'mapping1',
                    id: 'id',
                    attributes: ['attr1', 'attr2']
                });
                var mapping2 = collection.mapping({
                    name: 'mapping2',
                    id: 'id',
                    attributes: ['attr1', 'attr2', 'attr3']
                });
                collection.install(function (err) {
                    if (err) done(err);
                    assert.equal(collection['mapping1'], mapping1);
                    assert.equal(collection['mapping2'], mapping2);
                    done();
                });
            });

            it('no name specified within object', function () {
                assert.throws(function () {
                    collection.mapping({
                        id: 'id',
                        attributes: ['attr1', 'attr2']
                    });
                }, RestError);
            });

            it('vararg', function (done) {
                var mappings = collection.mapping({
                    name: 'mapping1',
                    id: 'id',
                    attributes: ['attr1', 'attr2']
                }, {
                    name: 'mapping2',
                    id: 'id',
                    attributes: ['attr1', 'attr2', 'attr3']
                });
                collection.install(function (err) {
                    if (err) done(err);
                    assert.equal(collection['mapping1'], mappings[0]);
                    assert.equal(collection['mapping2'], mappings[1]);
                    done();
                });
            });

            it('array', function (done) {
                var mappings = collection.mapping([{
                    name: 'mapping1',
                    id: 'id',
                    attributes: ['attr1', 'attr2']
                }, {
                    name: 'mapping2',
                    id: 'id',
                    attributes: ['attr1', 'attr2', 'attr3']
                }]);
                collection.install(function (err) {
                    if (err) done(err);
                    assert.equal(collection['mapping1'], mappings[0]);
                    assert.equal(collection['mapping2'], mappings[1]);
                    done();
                });
            });



        });

        describe('configure with descriptors', function () {
            var mapping1, mapping2;
            beforeEach(function () {
                mapping1 = collection.mapping('mapping1', {
                    id: 'id',
                    attributes: ['attr1', 'attr2']
                });
                mapping2 = collection.mapping({
                    name: 'mapping2',
                    id: 'id',
                    attributes: ['attr1', 'attr2', 'attr3']
                });
            });
            describe('request descriptor', function () {
                it('single', function (done) {
                    var requestDescriptor1 = collection.requestDescriptor({
                        method: 'POST',
                        mapping: mapping1,
                        path: '/path/(?<id>[0-9])/?'
                    });
                    var requestDescriptor2 = collection.requestDescriptor({
                        method: 'POST',
                        mapping: mapping2,
                        path: '/path/(?<id>[0-9])/?'
                    });
                    collection.install(function (err) {
                        if (err) {
                            done(err);
                        }
                        assert.equal(requestDescriptor1.mapping, mapping1);
                        assert.equal(requestDescriptor2.mapping, mapping2);
                        done();
                    })
                });
                it('vararg', function (done) {
                    var requestDescriptors = collection.requestDescriptor({
                        method: 'POST',
                        mapping: mapping1,
                        path: '/path/(?<id>[0-9])/?'
                    }, {
                        method: 'POST',
                        mapping: mapping2,
                        path: '/path/(?<id>[0-9])/?'
                    });
                    collection.install(function (err) {
                        if (err) {
                            done(err);
                        }
                        assert.equal(requestDescriptors[0].mapping, mapping1);
                        assert.equal(requestDescriptors[1].mapping, mapping2);
                        done();
                    })
                });
                it('array', function (done) {
                    var requestDescriptors = collection.requestDescriptor([{
                        method: 'POST',
                        mapping: mapping1,
                        path: '/path/(?<id>[0-9])/?'
                    }, {
                        method: 'POST',
                        mapping: mapping2,
                        path: '/path/(?<id>[0-9])/?'
                    }]);
                    collection.install(function (err) {
                        if (err) {
                            done(err);
                        }
                        assert.equal(requestDescriptors[0].mapping, mapping1);
                        assert.equal(requestDescriptors[1].mapping, mapping2);
                        done();
                    })
                });
            });
            describe('response descriptor', function () {
                it('single', function (done) {
                    var responseDescriptor1 = collection.responseDescriptor({
                        method: 'POST',
                        mapping: mapping1,
                        path: '/path/(?<id>[0-9])/?'
                    });
                    var responseDescriptor2 = collection.responseDescriptor({
                        method: 'POST',
                        mapping: mapping2,
                        path: '/path/(?<id>[0-9])/?'
                    });
                    collection.install(function (err) {
                        if (err) {
                            done(err);
                        }
                        assert.equal(responseDescriptor1.mapping, mapping1);
                        assert.equal(responseDescriptor2.mapping, mapping2);
                        done();
                    })
                });
                it('vararg', function (done) {
                    var responseDescriptors = collection.responseDescriptor({
                        method: 'POST',
                        mapping: mapping1,
                        path: '/path/(?<id>[0-9])/?'
                    }, {
                        method: 'POST',
                        mapping: mapping2,
                        path: '/path/(?<id>[0-9])/?'
                    });
                    collection.install(function (err) {
                        if (err) {
                            done(err);
                        }
                        assert.equal(responseDescriptors[0].mapping, mapping1);
                        assert.equal(responseDescriptors[1].mapping, mapping2);
                        done();
                    })
                });
                it('array', function (done) {
                    var responseDescriptors = collection.responseDescriptor([{
                        method: 'POST',
                        mapping: mapping1,
                        path: '/path/(?<id>[0-9])/?'
                    }, {
                        method: 'POST',
                        mapping: mapping2,
                        path: '/path/(?<id>[0-9])/?'
                    }]);
                    collection.install(function (err) {
                        if (err) {
                            done(err);
                        }
                        assert.equal(responseDescriptors[0].mapping, mapping1);
                        assert.equal(responseDescriptors[1].mapping, mapping2);
                        done();
                    })
                });
            });

        });


    });

});