describe('response descriptor', function () {

    var RestAPI;

    beforeEach(function () {
        module('restkit.responseDescriptor', function ($provide) {
            $provide.value('$log', console);
            $provide.value('$q', Q);
        });

        inject(function (_RestAPI_) {
            RestAPI = _RestAPI_;
        });

        RestAPI._reset();
    });

    it('dsfsdfsdf', function () {

    });

});