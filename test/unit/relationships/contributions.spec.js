describe('relationship contributions', function () {

    var Store, Collection, RestError, Mapping, ForeignKeyRelationship, RestObject, cache, OneToOneRelationship, RelationshipType, RelatedObjectProxy;
    var collection, carMapping, personMapping, dogMapping;


    beforeEach(function (done) {
        module('restkit.relationship', function ($provide) {
            $provide.value('$log', console);
            $provide.value('$q', Q);
        });
        module('restkit.mapping', function ($provide) {
            $provide.value('$log', console);
            $provide.value('$q', Q);
        });

        inject(function (_Store_, _RestError_, _RelatedObjectProxy_, _RelationshipType_, _Collection_, _Mapping_, _ForeignKeyRelationship_, _OneToOneRelationship_, _RestObject_, _cache_) {
            Collection = _Collection_;
            Mapping = _Mapping_;
            ForeignKeyRelationship = _ForeignKeyRelationship_;
            OneToOneRelationship = _OneToOneRelationship_;
            RestObject = _RestObject_;
            cache = _cache_;
            RelationshipType = _RelationshipType_;
            RelatedObjectProxy = _RelatedObjectProxy_;
            RestError = _RestError_;
            Store = _Store_;
        });

        Collection._reset();

        collection = new Collection('myCollection');
        carMapping = collection.mapping('Car', {
            id: 'id',
            attributes: ['colour', 'name']
        });
        personMapping = collection.mapping('Person', {
            id: 'id',
            attributes: ['name', 'age']
        });
        dogMapping = collection.mapping('Dog', {
            id: 'id',
            attributes: ['name', 'age', 'breed']
        });
        collection.install(done);

    });

    it('should contribute to an object belonging to the forward mapping', function () {
        var obj = carMapping._new({colour: 'red', name: 'Aston Martin', id: 'asdasd'});
        var relationship = new ForeignKeyRelationship('owner', 'cars', carMapping, personMapping);
        relationship.contributeToRestObject(obj);
        assert.instanceOf(obj.owner, RelatedObjectProxy);
    });
    it('should contribute to an object belonging to a reverse mapping', function () {
        var obj = personMapping._new({name: 'Michael Ford', id: 'asdasd'});
        var relationship = new ForeignKeyRelationship('owner', 'cars', carMapping, personMapping);
        relationship.contributeToRestObject(obj);
        assert.instanceOf(obj.cars, RelatedObjectProxy);
    });
    it('should throw an error if relationship has ', function () {
        var obj = dogMapping._new({name: 'Woody', id: 'asdasd', age: 2, breed: 'Chinese Crested'});
        var relationship = new ForeignKeyRelationship('owner', 'cars', carMapping, personMapping);
        assert.throws(_.bind(relationship.contributeToRestObject, relationship, obj), RestError);
    })

});