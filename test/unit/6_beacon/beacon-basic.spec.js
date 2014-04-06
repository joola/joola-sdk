describe("beacon-basic", function () {
  before(function (done) {
    this.uid = global.uid;
    this.collection = 'test-collection-basic-' + this.uid;

    this.documents = require('../../fixtures/basic.json');
    done();
  });

  it("should load a single document", function (done) {
    var self = this;
    joola.beacon.insert(this.collection, ce.clone(this.documents[0]), function (err, doc) {
      self.dup = new Date(doc[0].timestamp).toISOString();
      doc = doc[0];
      expect(doc.saved).to.equal(true);
      done(err);
    });
  });

  it("should fail loading a duplicate single document", function (done) {
    var doc = ce.clone(this.documents[0]);
    doc.timestamp = this.dup;

    joola.beacon.insert(this.collection, doc, function (err, doc) {
      doc = doc[0];
      expect(doc.saved).to.equal(false);
      done();
    });
  });

  it("should not fail loading a duplicate multiple document", function (done) {
    var doc = ce.clone(this.documents[0]);
    doc.timestamp = this.dup;

    joola.beacon.insert(this.collection, [doc, doc], function (err, doc) {
      expect(doc.length).to.equal(2);
      doc.forEach(function (d) {
        expect(d.saved).to.equal(false);
      });
      done();
    });
  });

  it("should load array of documents", function (done) {
    var self = this;
    var docs = ce.clone(self.documents);
    var counter = 0;
    docs.forEach(function (d) {
      d.timestamp = new Date();
      d.timestamp.setMilliseconds(d.timestamp.getMilliseconds() - counter);
      counter++;
    });
    joola.beacon.insert(self.collection, docs, function (err, docs) {
      if (err)
        return done(err);

      docs.forEach(function (d) {
        expect(d.saved).to.equal(true);
      });
      done();
    });
  });

  it("should complete loading documents with no dimensions correctly", function (done) {
    var documents = [
      {"visitors": 2},
      {"visitors": 3},
      {"visitors": 4}
    ];
    joola.beacon.insert(this.collection + '-nots', documents, function (err, docs) {
      if (err)
        return done(err);

      expect(docs.length).to.equal(3);
      docs.forEach(function (d) {
        expect(d.saved).to.equal(true);
      });

      done();
    });
  });

  it("should complete loading documents with no timestamp", function (done) {
    var documents = [
      {"visitors": 2},
      {"visitors": 3},
      {"visitors": 4}
    ];
    joola.beacon.insert(this.collection + '-nots', documents, function (err, docs) {
      if (err)
        return done(err);

      expect(docs.length).to.equal(3);
      docs.forEach(function (d) {
        expect(d.saved).to.equal(true);
        expect(d.timestamp).to.be.ok;
      });

      done();
    });
  });
});