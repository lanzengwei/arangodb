/*jshint globalstrict:false, strict:false, maxlen: 500 */
/*global assertUndefined, assertEqual, assertTrue, assertFalse, AQL_EXECUTE */

////////////////////////////////////////////////////////////////////////////////
/// DISCLAIMER
///
/// Copyright 2017 ArangoDB GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is ArangoDB GmbH, Cologne, Germany
///
/// @author Andrey Abramov
/// @author Vasiliy Nabatchikov
////////////////////////////////////////////////////////////////////////////////

var jsunity = require("jsunity");
var db = require("@arangodb").db;

////////////////////////////////////////////////////////////////////////////////
/// @brief test suite
////////////////////////////////////////////////////////////////////////////////

function iResearchFeatureAqlTestSuite () {
  return {
    setUpAll : function () {
    },

    tearDownAll : function () {
      db._drop("TestCollection");
      db._drop("TestCollection0");
      db._drop("TestCollection1");
      db._drop("TestCollection2");
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief IResearchFeature tests
////////////////////////////////////////////////////////////////////////////////

    testViewDDL: function() {
      // collections
      db._drop("TestCollection0");
      db._drop("TestCollection1");
      db._drop("TestCollection2");
      db._dropView("TestView");
      db._create("TestCollection0");
      db._create("TestCollection1");
      db._create("TestCollection2");
      var view = db._createView("TestView", "arangosearch", {});

      var properties = view.properties();
      assertTrue(Array === properties.collections.constructor);
      assertEqual(0, properties.collections.length);

      var meta = { links: { "TestCollection0": {} } };
      view.properties(meta, true); // partial update
      properties = view.properties();
      assertTrue(Array === properties.collections.constructor);
      assertEqual(1, properties.collections.length);

      meta = { links: { "TestCollection1": {} } };
      view.properties(meta, true); // partial update
      properties = view.properties();
      assertTrue(Array === properties.collections.constructor);
      assertEqual(2, properties.collections.length);

      meta = { links: { "TestCollection2": {} } };
      view.properties(meta, false); // full update
      properties = view.properties();
      assertTrue(Array === properties.collections.constructor);
      assertEqual(1, properties.collections.length);


      // commit
      db._dropView("TestView");
      view = db._createView("TestView", "arangosearch", {});

      properties = view.properties();
      assertTrue(Object === properties.commit.constructor);
      assertEqual(10, properties.commit.cleanupIntervalStep);
      assertEqual(60000, properties.commit.commitIntervalMsec);
      assertEqual(5000, properties.commit.commitTimeoutMsec);
      assertTrue(Object === properties.commit.consolidate.constructor);
      assertEqual(4, Object.keys(properties.commit.consolidate).length);
      assertTrue(Object === properties.commit.consolidate.bytes.constructor);
      assertEqual(300, properties.commit.consolidate.bytes.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.bytes.threshold.toFixed(6));
      assertTrue(Object === properties.commit.consolidate.bytes_accum.constructor);
      assertEqual(300, properties.commit.consolidate.bytes_accum.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.bytes_accum.threshold.toFixed(6));
      assertTrue(Object === properties.commit.consolidate.count.constructor);
      assertEqual(300, properties.commit.consolidate.count.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.count.threshold.toFixed(6));
      assertTrue(Object === properties.commit.consolidate.fill.constructor);
      assertEqual(300, properties.commit.consolidate.fill.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.fill.threshold.toFixed(6));

      meta = { commit: {
        commitIntervalMsec: 10000,
        consolidate: {
          bytes: { segmentThreshold: 20, threshold: 0.5 },
          bytes_accum: {},
          count: {}
        }
      } };
      view.properties(meta, true); // partial update
      properties = view.properties();
      assertTrue(Object === properties.commit.constructor);
      assertEqual(10, properties.commit.cleanupIntervalStep);
      assertEqual(10000, properties.commit.commitIntervalMsec);
      assertEqual(5000, properties.commit.commitTimeoutMsec);
      assertTrue(Object === properties.commit.consolidate.constructor);
      assertEqual(3, Object.keys(properties.commit.consolidate).length);
      assertTrue(Object === properties.commit.consolidate.bytes.constructor);
      assertEqual(20, properties.commit.consolidate.bytes.segmentThreshold);
      assertEqual((0.5).toFixed(6), properties.commit.consolidate.bytes.threshold.toFixed(6));
      assertTrue(Object === properties.commit.consolidate.bytes_accum.constructor);
      assertEqual(300, properties.commit.consolidate.bytes_accum.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.bytes_accum.threshold.toFixed(6));
      assertTrue(Object === properties.commit.consolidate.count.constructor);
      assertEqual(300, properties.commit.consolidate.count.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.count.threshold.toFixed(6));

      meta = { commit: {
        cleanupIntervalStep: 20,
        consolidate: { count: { segmentThreshold: 30, threshold: 0.75 } }
      } };
      view.properties(meta, false); // full update
      properties = view.properties();
      assertTrue(Object === properties.commit.constructor);
      assertEqual(20, properties.commit.cleanupIntervalStep);
      assertEqual(60000, properties.commit.commitIntervalMsec);
      assertEqual(5000, properties.commit.commitTimeoutMsec);
      assertTrue(Object === properties.commit.consolidate.constructor);
      assertEqual(1, Object.keys(properties.commit.consolidate).length);
      assertTrue(Object === properties.commit.consolidate.count.constructor);
      assertEqual(30, properties.commit.consolidate.count.segmentThreshold);
      assertEqual((0.75).toFixed(6), properties.commit.consolidate.count.threshold.toFixed(6));


      // data path

      db._dropView("TestView");
      view = db._createView("TestView", "arangosearch", {});

      properties = view.properties();
      assertTrue(String === properties.dataPath.constructor);
      assertTrue(properties.dataPath.length > 0);

      meta = { dataPath: "TestPath" };
      view.properties(meta);
      properties = view.properties();
      assertTrue(String === properties.dataPath.constructor);
      assertTrue(properties.dataPath.length > 0);
      assertEqual("TestPath", properties.dataPath);

      // locale
      db._dropView("TestView");
      view = db._createView("TestView", "arangosearch", {});

      properties = view.properties();
      assertTrue(String === properties.dataPath.constructor);
      assertTrue(properties.locale.length > 0);

      meta = { locale: "de_DE.UTF-16" };
      view.properties(meta);
      properties = view.properties();
      assertTrue(String === properties.locale.constructor);
      assertTrue(properties.locale.length > 0);
      assertEqual("de_DE.UTF-8", properties.locale);

      // threads max idle/total
      db._dropView("TestView");
      view = db._createView("TestView", "arangosearch", {});

      properties = view.properties();
      assertTrue(Number === properties.threadsMaxIdle.constructor);
      assertEqual(5, properties.threadsMaxIdle);
      assertTrue(Number === properties.threadsMaxTotal.constructor);
      assertEqual(5, properties.threadsMaxTotal);

      meta = { threadsMaxIdle: 42 };
      view.properties(meta, true); // partial update
      properties = view.properties();
      assertTrue(Number === properties.threadsMaxIdle.constructor);
      assertEqual(42, properties.threadsMaxIdle);
      assertTrue(Number === properties.threadsMaxTotal.constructor);
      assertEqual(5, properties.threadsMaxTotal);

      meta = { threadsMaxTotal: 1 };
      view.properties(meta, true); // partial update
      properties = view.properties();
      assertTrue(Number === properties.threadsMaxIdle.constructor);
      assertEqual(42, properties.threadsMaxIdle);
      assertTrue(Number === properties.threadsMaxTotal.constructor);
      assertEqual(1, properties.threadsMaxTotal);

      meta = { threadsMaxIdle: 0 };
      view.properties(meta, false); // full update
      properties = view.properties();
      assertTrue(Number === properties.threadsMaxIdle.constructor);
      assertEqual(0, properties.threadsMaxIdle);
      assertTrue(Number === properties.threadsMaxTotal.constructor);
      assertEqual(5, properties.threadsMaxTotal);
    },

    testLinkDDL: function() {
      db._drop("TestCollection0");
      db._drop("TestCollection1");
      db._drop("TestCollection2");
      db._dropView("TestView");
      db._create("TestCollection0");
      db._create("TestCollection1");
      db._create("TestCollection2");
      var view = db._createView("TestView", "arangosearch", {});

      var meta = { links: {
        "TestCollection0": {},
        "TestCollection1": { analyzers: [ "text_en"], includeAllFields: true, trackListPositions: true },
        "TestCollection2": { fields: {
          "b": { fields: { "b1": {} } },
          "c": { includeAllFields: true },
          "d": { trackListPositions: true },
          "e": { analyzers: [ "text_de"] }
        } }
      } };
      view.properties(meta, true); // partial update
      var properties = view.properties();
      assertTrue(Object === properties.links.constructor);
      assertEqual(3, Object.keys(properties.links).length);

      assertTrue(Object === properties.links.TestCollection0.constructor);
      assertTrue(Object === properties.links.TestCollection0.fields.constructor);
      assertEqual(0, Object.keys(properties.links.TestCollection0.fields).length);
      assertTrue(Boolean === properties.links.TestCollection0.includeAllFields.constructor);
      assertEqual(false, properties.links.TestCollection0.includeAllFields);
      assertTrue(Boolean === properties.links.TestCollection0.trackListPositions.constructor);
      assertEqual(false, properties.links.TestCollection0.trackListPositions);
      assertTrue(Array === properties.links.TestCollection0.analyzers.constructor);
      assertEqual(1, properties.links.TestCollection0.analyzers.length);
      assertTrue(String === properties.links.TestCollection0.analyzers[0].constructor);
      assertEqual("identity", properties.links.TestCollection0.analyzers[0]);


      assertTrue(Object === properties.links.TestCollection1.constructor);
      assertTrue(Object === properties.links.TestCollection1.fields.constructor);
      assertEqual(0, Object.keys(properties.links.TestCollection1.fields).length);
      assertTrue(Boolean === properties.links.TestCollection1.includeAllFields.constructor);
      assertEqual(true, properties.links.TestCollection1.includeAllFields);
      assertTrue(Boolean === properties.links.TestCollection1.trackListPositions.constructor);
      assertEqual(true, properties.links.TestCollection1.trackListPositions);
      assertTrue(Array === properties.links.TestCollection1.analyzers.constructor);
      assertEqual(1, properties.links.TestCollection1.analyzers.length);
      assertTrue(String === properties.links.TestCollection1.analyzers[0].constructor);
      assertEqual("text_en", properties.links.TestCollection1.analyzers[0]);


      assertTrue(Object === properties.links.TestCollection2.constructor);

      assertTrue(Object === properties.links.TestCollection2.fields.constructor);
      assertEqual(4, Object.keys(properties.links.TestCollection2.fields).length);

      assertTrue(Object === properties.links.TestCollection2.fields.b.fields.constructor);
      assertEqual(1, Object.keys(properties.links.TestCollection2.fields.b.fields).length);

      assertTrue(Boolean === properties.links.TestCollection2.fields.c.includeAllFields.constructor);
      assertEqual(true, properties.links.TestCollection2.fields.c.includeAllFields);

      assertTrue(Boolean === properties.links.TestCollection2.fields.d.trackListPositions.constructor);
      assertEqual(true, properties.links.TestCollection2.fields.d.trackListPositions);

      assertTrue(Array === properties.links.TestCollection2.fields.e.analyzers.constructor);
      assertEqual(1, properties.links.TestCollection2.fields.e.analyzers.length);
      assertTrue(String === properties.links.TestCollection2.fields.e.analyzers[0].constructor);
      assertEqual("text_de", properties.links.TestCollection2.fields.e.analyzers[0]);

      assertTrue(Boolean === properties.links.TestCollection2.includeAllFields.constructor);
      assertEqual(false, properties.links.TestCollection2.includeAllFields);
      assertTrue(Boolean === properties.links.TestCollection2.trackListPositions.constructor);
      assertEqual(false, properties.links.TestCollection2.trackListPositions);
      assertTrue(Array === properties.links.TestCollection2.analyzers.constructor);
      assertEqual(1, properties.links.TestCollection2.analyzers.length);
      assertTrue(String === properties.links.TestCollection2.analyzers[0].constructor);
      assertEqual("identity", properties.links.TestCollection2.analyzers[0]);

      meta = { links: { "TestCollection0": null, "TestCollection2": {} } };
      view.properties(meta, true); // partial update
      properties = view.properties();
      assertTrue(Object === properties.links.constructor);
      assertEqual(2, Object.keys(properties.links).length);

      assertTrue(Object === properties.links.TestCollection1.constructor);
      assertTrue(Object === properties.links.TestCollection1.fields.constructor);
      assertEqual(0, Object.keys(properties.links.TestCollection1.fields).length);
      assertTrue(Boolean === properties.links.TestCollection1.includeAllFields.constructor);
      assertEqual(true, properties.links.TestCollection1.includeAllFields);
      assertTrue(Boolean === properties.links.TestCollection1.trackListPositions.constructor);
      assertEqual(true, properties.links.TestCollection1.trackListPositions);
      assertTrue(Array === properties.links.TestCollection1.analyzers.constructor);
      assertEqual(1, properties.links.TestCollection1.analyzers.length);
      assertTrue(String === properties.links.TestCollection1.analyzers[0].constructor);
      assertEqual("text_en", properties.links.TestCollection1.analyzers[0]);


      assertTrue(Object === properties.links.TestCollection2.constructor);
      assertTrue(Object === properties.links.TestCollection2.fields.constructor);
      assertEqual(0, Object.keys(properties.links.TestCollection2.fields).length);
      assertTrue(Boolean === properties.links.TestCollection2.includeAllFields.constructor);
      assertEqual(false, properties.links.TestCollection2.includeAllFields);
      assertTrue(Boolean === properties.links.TestCollection2.trackListPositions.constructor);
      assertEqual(false, properties.links.TestCollection2.trackListPositions);
      assertTrue(Array === properties.links.TestCollection2.analyzers.constructor);
      assertEqual(1, properties.links.TestCollection2.analyzers.length);
      assertTrue(String === properties.links.TestCollection2.analyzers[0].constructor);
      assertEqual("identity", properties.links.TestCollection2.analyzers[0]);

      meta = { links: { "TestCollection0": { includeAllFields: true }, "TestCollection1": {} } };
      view.properties(meta, false); // full update
      properties = view.properties();
      assertTrue(Object === properties.links.constructor);
      assertEqual(2, Object.keys(properties.links).length);

      assertTrue(Object === properties.links.TestCollection0.constructor);
      assertTrue(Object === properties.links.TestCollection0.fields.constructor);
      assertEqual(0, Object.keys(properties.links.TestCollection0.fields).length);
      assertTrue(Boolean === properties.links.TestCollection0.includeAllFields.constructor);
      assertEqual(true, properties.links.TestCollection0.includeAllFields);
      assertTrue(Boolean === properties.links.TestCollection0.trackListPositions.constructor);
      assertEqual(false, properties.links.TestCollection0.trackListPositions);
      assertTrue(Array === properties.links.TestCollection0.analyzers.constructor);
      assertEqual(1, properties.links.TestCollection0.analyzers.length);
      assertTrue(String === properties.links.TestCollection0.analyzers[0].constructor);
      assertEqual("identity", properties.links.TestCollection0.analyzers[0]);


      assertTrue(Object === properties.links.TestCollection1.constructor);
      assertTrue(Object === properties.links.TestCollection1.fields.constructor);
      assertEqual(0, Object.keys(properties.links.TestCollection1.fields).length);
      assertTrue(Boolean === properties.links.TestCollection1.includeAllFields.constructor);
      assertEqual(false, properties.links.TestCollection1.includeAllFields);
      assertTrue(Boolean === properties.links.TestCollection1.trackListPositions.constructor);
      assertEqual(false, properties.links.TestCollection1.trackListPositions);
      assertTrue(Array === properties.links.TestCollection1.analyzers.constructor);
      assertEqual(1, properties.links.TestCollection1.analyzers.length);
      assertTrue(String === properties.links.TestCollection1.analyzers[0].constructor);
      assertEqual("identity", properties.links.TestCollection1.analyzers[0]);
    },

    testViewCreate: function() {
      // 1 empty collection
      db._dropView("TestView");
      db._drop("TestCollection0");
      var col0 = db._create("TestCollection0");
      var view = db._createView("TestView", "arangosearch", {});

      var meta = { links: { "TestCollection0": { includeAllFields: true } } };
      view.properties(meta, true); // partial update

      var result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.name RETURN doc", null, { waitForSync: true }).json;
      assertEqual(0, result.length);

      col0.save({ name: "quarter", text: "quick over" });
      result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.name RETURN doc", null, { waitForSync: true }).json;
      assertEqual(1, result.length);
      assertEqual("quarter", result[0].name);

      // 1 non-empty collection
      db._dropView("TestView");
      db._drop("TestCollection0");
      col0 = db._create("TestCollection0");
      view = db._createView("TestView", "arangosearch", {});

      col0.save({ name: "full", text: "the quick brown fox jumps over the lazy dog" });
      col0.save({ name: "half", text: "quick fox over lazy" });
      col0.save({ name: "other half", text: "the brown jumps the dog" });
      col0.save({ name: "quarter", text: "quick over" });

      meta = { links: { "TestCollection0": { includeAllFields: true } } };
      view.properties(meta, true); // partial update

      result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.name RETURN doc", null, { waitForSync: true }).json;
      assertEqual(4, result.length);
      assertEqual("full", result[0].name);
      assertEqual("half", result[1].name);
      assertEqual("other half", result[2].name);
      assertEqual("quarter", result[3].name);

      // 2 non-empty collections
      db._dropView("TestView");
      db._drop("TestCollection0");
      db._drop("TestCollection1");
      col0 = db._create("TestCollection0");
      var col1 = db._create("TestCollection1");
      view = db._createView("TestView", "arangosearch", {});

      col0.save({ name: "full", text: "the quick brown fox jumps over the lazy dog" });
      col0.save({ name: "half", text: "quick fox over lazy" });
      col1.save({ name: "other half", text: "the brown jumps the dog" });
      col1.save({ name: "quarter", text: "quick over" });

      meta = { links: {
        "TestCollection0": { includeAllFields: true },
        "TestCollection1": { includeAllFields: true }
      } };
      view.properties(meta, true); // partial update

      result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.name RETURN doc", null, { waitForSync: true }).json;
      assertEqual(4, result.length);
      assertEqual("full", result[0].name);
      assertEqual("half", result[1].name);
      assertEqual("other half", result[2].name);
      assertEqual("quarter", result[3].name);

      // 1 empty collection + 2 non-empty collections
      db._dropView("TestView");
      db._drop("TestCollection0");
      db._drop("TestCollection1");
      db._drop("TestCollection2");
      col0 = db._create("TestCollection0");
      col1 = db._create("TestCollection1");
      var col2 = db._create("TestCollection2");
      view = db._createView("TestView", "arangosearch", {});

      col2.save({ name: "full", text: "the quick brown fox jumps over the lazy dog" });
      col2.save({ name: "half", text: "quick fox over lazy" });
      col0.save({ name: "other half", text: "the brown jumps the dog" });
      col0.save({ name: "quarter", text: "quick over" });

      meta = { links: {
        "TestCollection0": { includeAllFields: true },
        "TestCollection1": { includeAllFields: true },
        "TestCollection2": { includeAllFields: true }
      } };
      view.properties(meta, true); // partial update

      result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.name RETURN doc", null, { waitForSync: true }).json;
      assertEqual(4, result.length);
      assertEqual("full", result[0].name);
      assertEqual("half", result[1].name);
      assertEqual("other half", result[2].name);
      assertEqual("quarter", result[3].name);
    },

    testViewModify: function() {
      // 1 empty collection
      db._dropView("TestView");
      db._drop("TestCollection0");
      var col0 = db._create("TestCollection0");
      var view = db._createView("TestView", "arangosearch", {});

      var meta = { links: { "TestCollection0": { includeAllFields: true } } };
      view.properties(meta, true); // partial update

      meta = {
        commit: {
          commitIntervalMsec: 10000,
          consolidate: {
            bytes: { segmentThreshold: 20, threshold: 0.5 },
            bytes_accum: {},
            count: {}
          }
        },
        dataPath: "TestPath",
        locale: "de_DE.UTF-16",
        threadsMaxIdle: 42,
        threadsMaxTotal: 1
      };
      view.properties(meta, true); // partial update

      var result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.name RETURN doc", null, { waitForSync: true }).json;
      assertEqual(0, result.length);
      var properties = view.properties();
      assertEqual(10, properties.commit.cleanupIntervalStep);
      assertEqual(10000, properties.commit.commitIntervalMsec);
      assertEqual(5000, properties.commit.commitTimeoutMsec);
      assertEqual(3, Object.keys(properties.commit.consolidate).length);
      assertEqual(20, properties.commit.consolidate.bytes.segmentThreshold);
      assertEqual((0.5).toFixed(6), properties.commit.consolidate.bytes.threshold.toFixed(6));
      assertEqual(300, properties.commit.consolidate.bytes_accum.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.bytes_accum.threshold.toFixed(6));
      assertEqual(300, properties.commit.consolidate.count.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.count.threshold.toFixed(6));
      assertEqual("TestPath", properties.dataPath);
      assertEqual("de_DE.UTF-8", properties.locale);
      assertEqual(42, properties.threadsMaxIdle);
      assertEqual(1, properties.threadsMaxTotal);

      col0.save({ name: "quarter", text: "quick over" });
      result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.name RETURN doc", null, { waitForSync: true }).json;
      assertEqual(1, result.length);
      assertEqual("quarter", result[0].name);

      // 1 non-empty collection
      db._dropView("TestView");
      db._drop("TestCollection0");
      col0 = db._create("TestCollection0");
      view = db._createView("TestView", "arangosearch", {});

      col0.save({ name: "full", text: "the quick brown fox jumps over the lazy dog" });
      col0.save({ name: "half", text: "quick fox over lazy" });
      col0.save({ name: "other half", text: "the brown jumps the dog" });
      col0.save({ name: "quarter", text: "quick over" });

      meta = { links: { "TestCollection0": { includeAllFields: true } } };
      view.properties(meta, true); // partial update

      meta = {
        commit: {
          commitIntervalMsec: 10000,
          consolidate: {
            bytes: { segmentThreshold: 20, threshold: 0.5 },
            bytes_accum: {},
            count: {}
          }
        },
        dataPath: "TestPath",
        locale: "de_DE.UTF-16",
        threadsMaxIdle: 42,
        threadsMaxTotal: 1
      };
      view.properties(meta, true); // partial update

      result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.name RETURN doc", null, { waitForSync: true }).json;
      assertEqual(4, result.length);
      assertEqual("full", result[0].name);
      assertEqual("half", result[1].name);
      assertEqual("other half", result[2].name);
      assertEqual("quarter", result[3].name);
      properties = view.properties();
      assertEqual(10, properties.commit.cleanupIntervalStep);
      assertEqual(10000, properties.commit.commitIntervalMsec);
      assertEqual(5000, properties.commit.commitTimeoutMsec);
      assertEqual(3, Object.keys(properties.commit.consolidate).length);
      assertEqual(20, properties.commit.consolidate.bytes.segmentThreshold);
      assertEqual((0.5).toFixed(6), properties.commit.consolidate.bytes.threshold.toFixed(6));
      assertEqual(300, properties.commit.consolidate.bytes_accum.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.bytes_accum.threshold.toFixed(6));
      assertEqual(300, properties.commit.consolidate.count.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.count.threshold.toFixed(6));
      assertEqual("TestPath", properties.dataPath);
      assertEqual("de_DE.UTF-8", properties.locale);
      assertEqual(42, properties.threadsMaxIdle);
      assertEqual(1, properties.threadsMaxTotal);

      // 2 non-empty collections
      db._dropView("TestView");
      db._drop("TestCollection0");
      db._drop("TestCollection1");
      col0 = db._create("TestCollection0");
      var col1 = db._create("TestCollection1");
      view = db._createView("TestView", "arangosearch", {});

      col0.save({ name: "full", text: "the quick brown fox jumps over the lazy dog" });
      col0.save({ name: "half", text: "quick fox over lazy" });
      col1.save({ name: "other half", text: "the brown jumps the dog" });
      col1.save({ name: "quarter", text: "quick over" });

      meta = { links: {
        "TestCollection0": { includeAllFields: true },
        "TestCollection1": { includeAllFields: true }
      } };
      view.properties(meta, true); // partial update

      meta = {
        commit: {
          commitIntervalMsec: 10000,
          consolidate: {
            bytes: { segmentThreshold: 20, threshold: 0.5 },
            bytes_accum: {},
            count: {}
          }
        },
        dataPath: "TestPath",
        locale: "de_DE.UTF-16",
        threadsMaxIdle: 42,
        threadsMaxTotal: 1
      };
      view.properties(meta, true); // partial update

      result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.name RETURN doc", null, { waitForSync: true }).json;
      assertEqual(4, result.length);
      assertEqual("full", result[0].name);
      assertEqual("half", result[1].name);
      assertEqual("other half", result[2].name);
      assertEqual("quarter", result[3].name);
      properties = view.properties();
      assertEqual(10, properties.commit.cleanupIntervalStep);
      assertEqual(10000, properties.commit.commitIntervalMsec);
      assertEqual(5000, properties.commit.commitTimeoutMsec);
      assertEqual(3, Object.keys(properties.commit.consolidate).length);
      assertEqual(20, properties.commit.consolidate.bytes.segmentThreshold);
      assertEqual((0.5).toFixed(6), properties.commit.consolidate.bytes.threshold.toFixed(6));
      assertEqual(300, properties.commit.consolidate.bytes_accum.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.bytes_accum.threshold.toFixed(6));
      assertEqual(300, properties.commit.consolidate.count.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.count.threshold.toFixed(6));
      assertEqual("TestPath", properties.dataPath);
      assertEqual("de_DE.UTF-8", properties.locale);
      assertEqual(42, properties.threadsMaxIdle);
      assertEqual(1, properties.threadsMaxTotal);

      // 1 empty collection + 2 non-empty collections
      db._dropView("TestView");
      db._drop("TestCollection0");
      db._drop("TestCollection1");
      db._drop("TestCollection2");
      col0 = db._create("TestCollection0");
      col1 = db._create("TestCollection1");
      var col2 = db._create("TestCollection2");
      view = db._createView("TestView", "arangosearch", {});

      col2.save({ name: "full", text: "the quick brown fox jumps over the lazy dog" });
      col2.save({ name: "half", text: "quick fox over lazy" });
      col0.save({ name: "other half", text: "the brown jumps the dog" });
      col0.save({ name: "quarter", text: "quick over" });

      meta = { links: {
        "TestCollection0": { includeAllFields: true },
        "TestCollection1": { includeAllFields: true },
        "TestCollection2": { includeAllFields: true }
      } };
      view.properties(meta, true); // partial update

      meta = {
        commit: {
          commitIntervalMsec: 10000,
          consolidate: {
            bytes: { segmentThreshold: 20, threshold: 0.5 },
            bytes_accum: {},
            count: {}
          }
        },
        dataPath: "TestPath",
        locale: "de_DE.UTF-16",
        threadsMaxIdle: 42,
        threadsMaxTotal: 1
      };
      view.properties(meta, true); // partial update

      result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.name RETURN doc", null, { waitForSync: true }).json;
      assertEqual(4, result.length);
      assertEqual("full", result[0].name);
      assertEqual("half", result[1].name);
      assertEqual("other half", result[2].name);
      assertEqual("quarter", result[3].name);
      properties = view.properties();
      assertEqual(10, properties.commit.cleanupIntervalStep);
      assertEqual(10000, properties.commit.commitIntervalMsec);
      assertEqual(5000, properties.commit.commitTimeoutMsec);
      assertEqual(3, Object.keys(properties.commit.consolidate).length);
      assertEqual(20, properties.commit.consolidate.bytes.segmentThreshold);
      assertEqual((0.5).toFixed(6), properties.commit.consolidate.bytes.threshold.toFixed(6));
      assertEqual(300, properties.commit.consolidate.bytes_accum.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.bytes_accum.threshold.toFixed(6));
      assertEqual(300, properties.commit.consolidate.count.segmentThreshold);
      assertEqual((0.85).toFixed(6), properties.commit.consolidate.count.threshold.toFixed(6));
      assertEqual("TestPath", properties.dataPath);
      assertEqual("de_DE.UTF-8", properties.locale);
      assertEqual(42, properties.threadsMaxIdle);
      assertEqual(1, properties.threadsMaxTotal);
    },

    testLinkModify: function() {
      db._dropView("TestView");
      db._drop("TestCollection0");
      var col0 = db._create("TestCollection0");
      var view = db._createView("TestView", "arangosearch", {});

      col0.save({ a: "foo", c: "bar", z: 0 });
      col0.save({ a: "foz", d: "baz", z: 1 });
      col0.save({ b: "bar", c: "foo", z: 2 });
      col0.save({ b: "baz", d: "foz", z: 3 });

      var meta = { links: { "TestCollection0": { fields: { a: {} } } } };
      view.properties(meta, true); // partial update

      var result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.z RETURN doc", null, { waitForSync: true }).json;
      assertEqual(2, result.length);
      assertEqual(0, result[0].z);
      assertEqual(1, result[1].z);

      meta = { links: { "TestCollection0": { fields: { b: {} } } } };
      view.properties(meta, true); // partial update

      result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.z RETURN doc", null, { waitForSync: true }).json;
      assertEqual(2, result.length);
      assertEqual(2, result[0].z);
      assertEqual(3, result[1].z);

      meta = { links: { "TestCollection0": { fields: { c: {} } } } };
      view.properties(meta, false); // full update

      result = AQL_EXECUTE("FOR doc IN VIEW TestView SORT doc.z RETURN doc", null, { waitForSync: true }).json;
      assertEqual(2, result.length);
      assertEqual(0, result[0].z);
      assertEqual(2, result[1].z);
    },

  };
}

////////////////////////////////////////////////////////////////////////////////
/// @brief executes the test suite
////////////////////////////////////////////////////////////////////////////////

jsunity.run(iResearchFeatureAqlTestSuite);

return jsunity.done();
