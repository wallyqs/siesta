/**
 * An integration test that creates two complex collections and then establishes inter-collection relationships
 * between the mappings in each before creating objects etc.
 *
 * We then proceed to test various aspects of the system.
 */

describe('intercollection relationships', function () {

    var myOfflineCollection;
    var myOnlineCollection;

    var $rootScope, Collection, Pouch, RelationshipType;


    beforeEach(function (done) {
        module('restkit', function ($provide) {
            $provide.value('$log', console);
            $provide.value('$q', Q);
        });

        inject(function (_$rootScope_, _Collection_, _Pouch_, _RelationshipType_) {
            $rootScope = _$rootScope_;
            Collection = _Collection_;
            Pouch = _Pouch_;
            RelationshipType = _RelationshipType_;
        });

        Pouch.reset();

        var finishedCreatingMyOfflineCollection = false;

        myOfflineCollection = new Collection('MyOfflineCollection', function () {

            myOfflineCollection.registerMapping('Folder', {
                attributes: ['name'],
                relationships: {
                    createdBy: {
                        mapping: 'User',
                        type: RelationshipType.ForeignKey,
                        reverse: 'folders'
                    }
                }
            });

            myOfflineCollection.registerMapping('DownloadedPhoto', {
                attributes: ['creationDate'],
                relationships: {
                    createdBy: {
                        mapping: 'User',
                        type: RelationshipType.ForeignKey,
                        reverse: 'files'
                    },
                    folder: {
                        mapping: 'Folder',
                        type: RelationshipType.ForeignKey,
                        reverse: 'files'
                    },
                    photo: {
                        mapping: 'MyOnlineCollection.Photo',
                        type: RelationshipType.OneToOne,
                        reverse: 'file'
                    }
                }
            });

            myOfflineCollection.registerMapping('User', {
                attributes: ['username'],
                indexes: ['username']
            });

        }, function (err) {
            if (err) done(err);
            finishedCreatingMyOfflineCollection = true;
            if (finishedCreatingMyOnlineCollection) {
                done();
            }
        });

        var finishedCreatingMyOnlineCollection = false;

        myOnlineCollection = new Collection('MyOnlineCollection', function () {

            myOnlineCollection.registerMapping('Photo', {
                id: 'photoId',
                attributes: ['height', 'width', 'url'],
                relationships: {
                    createdBy: {
                        mapping: 'User',
                        type: RelationshipType.ForeignKey,
                        reverse: 'photos'
                    }
                }
            });

            myOnlineCollection.registerMapping('User', {
                id: 'userId',
                attributes: ['username', 'name']
            });

        }, function (err) {
            if (err) done(err);
            if (finishedCreatingMyOfflineCollection) {
                done();
            }
        });

    });

    function mapRemoteUsers(callback) {
        myOnlineCollection.User.map([
            {username: 'mtford', name: 'Michael Ford', userId: '1'},
            {username: 'blahblah', name: 'Blah Blah', userId: '2'},
            {username: 'bobm', name: 'Bob Marley', userId: '3'}
        ], callback);
    }

    function mapRemotePhotos(callback) {
        myOnlineCollection.Photo.map([
            {height: 500, width: 500, url: 'http://somewhere/image.jpeg', photoId: '10', createdBy: '1'},
            {height: 1500, width: 1500, url: 'http://somewhere/image2.jpeg', photoId: '11', createdBy: '1'},
            {height: 500, width: 750, url: 'http://somewhere/image3.jpeg', photoId: '12', createdBy: '2'}
        ], callback);
    }

    function mapOfflineUsers(callback) {
        myOfflineCollection.User.map([
            {username: 'mike'},
            {username: 'gaz'}
        ], callback);
    }

    function installOfflineFixtures(callback) {
        async.parallel([
            mapOfflineUsers
        ], callback);
    }

    function installOnlineFixtures(callback) {
        async.parallel([
            mapRemoteUsers,
            mapRemotePhotos
        ], callback);
    }

    describe('local queries', function () {

        beforeEach(function (done) {
            installOnlineFixtures(function (err) {
                if (err) done(err);
                installOfflineFixtures(done);
            });
        });

        describe('offline', function () {
            it('should return mike when querying for him', function (done) {
                myOfflineCollection.User.query({username: 'mike'}, function (err, users) {
                    if (err) done(err);
                    assert.equal(users.length, 1);
                    assert.equal(users[0].username, 'mike');
                    done();
                });
            });
        });

        describe('online', function () {
            it('should return 3 users when run a local all query against users', function (done) {
                myOnlineCollection.User.all(function (err, users) {
                    if (err) done(err);
                    assert.equal(users.length, 3);
                    done();
                });
            });

            it('should return 3 photos when run a local all query against photos', function (done) {
                myOnlineCollection.Photo.all(function (err, photos) {
                    if (err) done(err);
                    assert.equal(photos.length, 3);
                    done();
                });
            });

            it('should return 2 photos with height 500', function (done) {
                myOnlineCollection.Photo.query({height: 500}, function (err, photos) {
                    if (err) done(err);
                    assert.equal(photos.length, 2);
                    _.each(photos, function (p) {
                        assert.equal(p.height, 500);
                    });
                    done();
                });
            });

            it('should return 1 photo with height 500, width, 750', function (done) {
                myOnlineCollection.Photo.query({height: 500, width: 750}, function (err, photos) {
                    if (err) done(err);
                    assert.equal(photos.length, 1);
                    assert.equal(photos[0].height, 500);
                    assert.equal(photos[0].width, 750);
                    done();
                });
            });

            it('should be able to query by remote identifier', function (done) {
                myOnlineCollection.User.get('1', function (err, user) {
                    if (err) done(err);
                    assert.equal(user.userId, '1');
                    done();
                })
            })


        });
    });

    describe('relationship mappings', function () {

        beforeEach(function (done) {
            installOnlineFixtures(done);
        });

        describe('online', function () {
            function assertNumPhotos(userId, numPhotos, done) {
                myOnlineCollection.User.get(userId, function (err, user) {
                    if (err) done(err);
                    assert.equal(user.userId, userId);
                    user.photos.get(function (err, photos) {
                        if (err) done(err);
                        assert.equal(photos ? photos.length : 0, numPhotos);
                        done();
                    });
                })
            }

            it('user with id 1 should have 2 photos', function (done) {
                assertNumPhotos('1', 2, done);
            });

            it('user with id 2 should have 1 photo', function (done) {
                assertNumPhotos('2', 1, done);
            });

            it('user with id 2 should have 1 photo', function (done) {
                assertNumPhotos('3', 0, done);
            });

        });

    });

});