describe("collections", function () {
  before(function (done) {
    this.collection = 'test-collection-dispatch-' + global.uid;
    return done();
  });

  it("should return a valid list of collections", function (done) {
    joola.collections.list(function (err, collections) {
      if (err)
        return done(err);

      expect(collections).to.be.ok;
      return done();
    });
  });

  it("should add a collection", function (done) {
    var collection = {
      key: this.collection,
      name: this.collection
    };
    joola.collections.add(collection, function (err, collection) {
      if (err)
        return done(err);

      expect(collection).to.be.ok;
      return done();
    });
  });

  it("should fail adding an existing collection", function (done) {
    var collection = {
      key: this.collection,
      name: this.collection
    };
    joola.collections.add(collection, function (err) {
      if (err)
        return done();

      return done(new Error('This should fail'));
    });
  });

  it("should fail adding collection with incomplete details", function (done) {
    var collection = {
      key: this.collection + '1'
    };
    joola.collections.add(collection, function (err) {
      if (err)
        return done();

      return done(new Error('This should fail'));
    });
  });

  it("should update a collection", function (done) {
    var collection = {
      key: this.collection,
      name: this.collection,
      test: 1
    };
    joola.collections.update(collection, function (err, _collection) {
      if (err)
        return done(err);

      expect(_collection.test).to.equal(1);
      return done();
    });
  });

  it("should fail updating a collection with incomplete details", function (done) {
    var collection = {
      key: this.collection
    };
    joola.collections.update(collection, function (err, _collection) {
      if (err)
        return done();

      return done(new Error('This should fail'));
    });
  });

  it("should fail updating non existing collection", function (done) {
    var collection = {
      key: this.collection + '1',
      name: this.collection
    };
    joola.collections.update(collection, function (err, _collection) {
      if (err)
        return done();

      return done(new Error('This should fail'));
    });
  });

  it("should get a collection", function (done) {
    var self = this;
    joola.collections.get(this.collection, function (err, collection) {
      if (err)
        return done(err);

      expect(collection).to.be.ok;
      expect(collection.key).to.equal(self.collection);
      return done();
    });
  });

  it("should get collection stats", function (done) {
    joola.collections.stats(this.collection, function (err, stats) {
      if (err)
        return done(err);
      expect(stats).to.be.ok;
      done();
    });
  });

  it("should fail getting stats for non-existing collection", function (done) {
    joola.collections.stats(this.collection + '1', function (err) {
      if (err)
        return done();

      done(new Error('This should fail'));
    });
  });

  it("should get collection min date", function (done) {
    var self = this;
    joola.beacon.insert(this.collection, {timestamp: null}, function (err) {
      if (err)
        return done(err);
      joola.collections.mindate( self.collection, null, function (err, mindate) {
        if (err)
          return done(err);

        expect(joola.common.typeof(new Date(mindate))).to.equal('date');
        done();
      });
    });
  });

  it("should fail getting non-existing collection min date", function (done) {
    joola.collections.mindate(this.collection + '3', null, function (err) {
      if (err)
        return done();

      done(new Error('This should fail'));
    });
  });

  it("should get collection max date", function (done) {
    var self = this;
    joola.beacon.insert(this.collection, {timestamp: null}, function (err) {
      if (err)
        return done(err);
      joola.collections.maxdate(self.collection, null, function (err, maxdate) {
        if (err)
          return done(err);

        expect(joola.common.typeof(new Date(maxdate))).to.equal('date');
        done();
      });
    });
  });

  it("should fail getting non-existing collection max date", function (done) {
    joola.collections.maxdate(this.collection + '3', null, function (err) {
      if (err)
        return done();

      done(new Error('This should fail'));
    });
  });

  it("should get a collection meta data", function (done) {
    var self = this;
    var document = require('../../fixtures/basic.json')[0];
    joola.collections.metadata( document, self.collection, function (err, meta) {
      if (err)
        return done(err);

      expect(meta).to.be.ok;
      done();
    });
  });

  it("should delete a collection", function (done) {
    var self = this;
    joola.collections.delete(this.collection, function (err) {
      if (err)
        return done(err);

      joola.collections.get( self.collection, function (err, collections) {
        if (err)
          return done();

        done(new Error('This should fail'));
      });
    });
  });

  it("should fail deleting a non-existing collection", function (done) {
    joola.collections.delete(this.collection, function (err) {
      if (err)
        return done();

      done(new Error('This should fail'));
    });
  });
}); 