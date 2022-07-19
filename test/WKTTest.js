const should = require('chai').should();
import WKTTestUtils from './WKTTestUtils';
import { GeometryWriter } from '../lib/GeometryWriter'
import {
  CompoundCurve,
  ExtendedGeometryCollection,
  FiniteFilterType,
  GeometryCollection,
  GeometryType,
  LineString,
  MultiPolygon,
  Point,
  PointFiniteFilter,
  Polygon
} from '@ngageoint/simple-features-js'
import { GeometryReader } from '../lib/GeometryReader'


const GEOMETRIES_PER_TEST = 10;


function geometryTesterWithReplacement (text, replace, replacement, validateZM = false) {
  geometryTesterText(text, text.replaceAll(replace, replacement), null, validateZM);
}

function geometryTesterText (text, expected, validateZM = false) {
  if (expected == null) {
    expected = text;
  }
  const geometry = global.readGeometry(text, validateZM);
  const text2 = global.writeText(geometry);
  global.compareText(expected, text2);
}

/**
 * Test the geometry writing to and reading from bytes, compare with the
 * provided geometry
 * @param geometry geometry
 * @param compareGeometry compare geometry
 * @param validateZM compare geometry
 */
function geometryTester(geometry, compareGeometry, validateZM = false) {
  if (compareGeometry == null) {
    compareGeometry = geometry;
  }

  // Write the geometry to text
  const text = global.writeText(geometry);

  // Test the geometry read from text
  const geometryFromText = global.readGeometry(text, validateZM);
  global.compareText(global.writeText(compareGeometry), global.writeText(geometryFromText));

  global.compareGeometries(compareGeometry, geometryFromText);

  const envelope = compareGeometry.getEnvelope();
  const envelopeFromText = geometryFromText.getEnvelope();

  global.compareEnvelopes(envelope, envelopeFromText);
}


/**
 * Test fine filter for the geometry
 * @param geometry geometry
 */
function testFiniteFilter(geometry) {
  const bytes = GeometryWriter.writeGeometry(geometry);
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE, false, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE,true, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_NAN));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_NAN, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_NAN, false, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_NAN, true, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_INFINITE));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_INFINITE, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_INFINITE, false, true));
  _testFiniteFilter(bytes, new PointFiniteFilter(FiniteFilterType.FINITE_AND_INFINITE, true, true));
}

/**
 * Filter and validate the geometry bytes
 * @param bytes geometry bytes
 * @param filter point finite filter
 */
function _testFiniteFilter(bytes, filter) {
  const geometry = GeometryReader.readGeometry(bytes, filter);

  if (geometry != null) {
    const points = [];

    switch (geometry.geometryType) {
      case GeometryType.POINT:
        points.push(geometry);
        break;
      case GeometryType.LINESTRING:
        points.push(...geometry.points);
        break;
      case GeometryType.POLYGON:
        points.push(...geometry.getRing(0).points);
        break;
      default:
        should.fail("Unexpected test case: " + geometry.geometryType);
    }

    for (const point of points) {

      switch (filter.getType()) {
        case FiniteFilterType.FINITE:
          Number.isFinite(point.x).should.be.true;
          Number.isFinite(point.y).should.be.true;
          if (filter.isFilterZ() && point.hasZ) {
            Number.isFinite(point.z).should.be.true;
          }
          if (filter.isFilterM() && point.hasM) {
            Number.isFinite(point.m).should.be.true;
          }
          break;
        case FiniteFilterType.FINITE_AND_NAN:
          (Number.isFinite(point.x) || Number.isNaN(point.x)).should.be.true;
          (Number.isFinite(point.y) || Number.isNaN(point.y)).should.be.true;
          if (filter.isFilterZ() && point.hasZ) {
            (Number.isFinite(point.z) || Number.isNaN(point.z)).should.be.true;
          }
          if (filter.isFilterM() && point.hasM) {
            (Number.isFinite(point.m) || Number.isNaN(point.m)).should.be.true;
          }
          break;
        case FiniteFilterType.FINITE_AND_INFINITE:
          (Number.isFinite(point.x) || !Number.isFinite(point.x)).should.be.true;
          (Number.isFinite(point.y) || !Number.isFinite(point.y)).should.be.true;
          if (filter.isFilterZ() && point.hasZ) {
            (Number.isFinite(point.z) || !Number.isFinite(point.z)).should.be.true;
          }
          if (filter.isFilterM() && point.hasM) {
            (Number.isFinite(point.m) || !Number.isFinite(point.m)).should.be.true;
          }
          break;
      }

    }
  }

}

describe('WKT Tests', function () {
  it('test point', function () {
    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a point
      const point = global.createPoint(global.coinFlip(), global.coinFlip());
      geometryTester(point);
    }
  });


  it('test line string', function () {

    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a line string
      const lineString = global.createLineString(global.coinFlip(), global.coinFlip());
      geometryTester(lineString);
    }

  });

  it('test polygon', function () {

    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a polygon
      const polygon = global.createPolygon(global.coinFlip(), global.coinFlip());
      geometryTester(polygon);
    }

  });

  it('test multi point', function () {

    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a multi point
      const multiPoint = global.createMultiPoint(global.coinFlip(), global.coinFlip());
      geometryTester(multiPoint);
    }

  });

  it('test multi line string', function () {

    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a multi line string
      const multiLineString = global.createMultiLineString(global.coinFlip(), global.coinFlip());
      geometryTester(multiLineString);
    }

  });

  it('test multi curve with line strings', function () {

    const text = "MULTICURVE ( LINESTRING ( 18.889800697319032 -35.036463112927535, -37.76441919748682 -75.81115933696286, 68.9116399151478 -88.32707858422387 ), LINESTRING ( 145.52101409832818 -41.91160298025902, -173.4468670533211 11.756492650408305, -77.99433389977924 -39.554308892198534, 136.58380908612207 41.90364270668213, 39.97441553368359 -17.43335525530797, -121.31829755251131 -65.16951612235937, 49.88151008675286 7.029670331650452, 112.99918207874451 -35.62758965128506, -175.71124906933335 -36.04238233215776, -76.52909336488278 44.2390383216843 ) )";
    const geometry = global.readGeometry(text);
    (geometry instanceof GeometryCollection).should.be.true;
    geometry.geometryType.should.be.equal(GeometryType.GEOMETRYCOLLECTION)
    const multiCurve = geometry;
    (multiCurve.numGeometries() === 2).should.be.true;
    const geometry1 = multiCurve.geometries[0];
    const geometry2 = multiCurve.geometries[1];
    (geometry1 instanceof LineString).should.be.true;
    (geometry2 instanceof LineString).should.be.true;
    const lineString1 = geometry1;
    const lineString2 = geometry2;
    (lineString1.numPoints() === 3).should.be.true;
    (lineString2.numPoints() === 10).should.be.true;
    const point1 = lineString1.startPoint();
    const point2 = lineString2.endPoint();
    point1.x.should.be.equal(18.889800697319032);
    point1.y.should.be.equal(-35.036463112927535);
    point2.x.should.be.equal(-76.52909336488278);
    point2.y.should.be.equal(44.2390383216843);

    const extendedMultiCurve = new ExtendedGeometryCollection(multiCurve);
    (GeometryType.MULTICURVE).should.be.equal(extendedMultiCurve.geometryType);

    geometryTester(extendedMultiCurve, multiCurve);

    const text2 = global.writeText(extendedMultiCurve);
    text2.startsWith(GeometryType.nameFromType(GeometryType.MULTICURVE)).should.be.true;
    global.compareText(text, text2);
  });

  it('test multi curve with compound curve', function () {

    // Test a pre-created WKT saved as the abstract MultiCurve type with a CompoundCurve

    const text = "MULTICURVE (COMPOUNDCURVE (LINESTRING (3451418.006 5481808.951, 3451417.787 5481809.927, 3451409.995 5481806.744), LINESTRING (3451409.995 5481806.744, 3451418.006 5481808.951)))";
    const geometry = global.readGeometry(text);
    (geometry instanceof GeometryCollection).should.be.true;
    (geometry.geometryType).should.be.equal(GeometryType.GEOMETRYCOLLECTION);
    const multiCurve = geometry;
    (1).should.be.equal(multiCurve.numGeometries());
    const geometry1 = multiCurve.geometries[0];
    (geometry1 instanceof CompoundCurve).should.be.true;
    const compoundCurve1 = geometry1;
    (2).should.be.equal(compoundCurve1.numLineStrings());
    const lineString1 = compoundCurve1.lineStrings[0];
    const lineString2 = compoundCurve1.lineStrings[1];
    (3).should.be.equal(lineString1.numPoints());
    (2).should.be.equal(lineString2.numPoints());

    lineString1.getPoint(0).equals(new Point(3451418.006, 5481808.951)).should.be.true;
    lineString1.getPoint(1).equals(new Point(3451417.787, 5481809.927)).should.be.true;
    lineString1.getPoint(2).equals(new Point(3451409.995, 5481806.744)).should.be.true;

    lineString2.getPoint(0).equals(new Point(3451409.995, 5481806.744)).should.be.true;
    lineString2.getPoint(1).equals(new Point(3451418.006, 5481808.951)).should.be.true;


    const extendedMultiCurve = new ExtendedGeometryCollection(multiCurve);
    (GeometryType.MULTICURVE).should.be.equal(extendedMultiCurve.geometryType);

    geometryTester(extendedMultiCurve, multiCurve);

    const text2 = global.writeText(extendedMultiCurve);
    text2.startsWith(GeometryType.nameFromType(GeometryType.MULTICURVE)).should.be.true;
    global.compareText(text, text2);

  })

  it('test multi curve', function () {

    const multiCurve = global.createMultiCurve();

    const text = global.writeText(multiCurve);

    const extendedMultiCurve = new ExtendedGeometryCollection(multiCurve);
    extendedMultiCurve.geometryType.should.be.equal(GeometryType.MULTICURVE);

    const extendedText = global.writeText(extendedMultiCurve);
    text.startsWith(GeometryType.nameFromType(GeometryType.GEOMETRYCOLLECTION)).should.be.true;
    extendedText.startsWith(GeometryType.nameFromType(GeometryType.MULTICURVE)).should.be.true;

    const geometry1 = global.readGeometry(text);
    const geometry2 = global.readGeometry(extendedText);

    (geometry1 instanceof GeometryCollection).should.be.true;
    (geometry2 instanceof GeometryCollection).should.be.true;
    geometry1.geometryType.should.be.equal(GeometryType.GEOMETRYCOLLECTION);
    geometry2.geometryType.should.be.equal(GeometryType.GEOMETRYCOLLECTION);

    geometry1.equals(multiCurve).should.be.true;
    geometry1.equals(geometry2).should.be.true;

    const geometryCollection1 = geometry1;
    const geometryCollection2 = geometry2;
    geometryCollection1.isMultiCurve().should.be.true;
    geometryCollection2.isMultiCurve().should.be.true;

    geometryTester(multiCurve);
    geometryTester(extendedMultiCurve, multiCurve);
  });

  it('test multi surface', function () {

    // Test the abstract MultiSurface type

    const multiSurface = global.createMultiSurface();

    const text = global.writeText(multiSurface);

    const extendedMultiSurface = new ExtendedGeometryCollection(multiSurface);
    extendedMultiSurface.geometryType.should.be.equal(GeometryType.MULTISURFACE);

    const extendedText = global.writeText(extendedMultiSurface);
    text.startsWith(GeometryType.nameFromType(GeometryType.GEOMETRYCOLLECTION)).should.be.true;
    extendedText.startsWith(GeometryType.nameFromType(GeometryType.MULTISURFACE)).should.be.true;

    const geometry1 = global.readGeometry(text);
    const geometry2 = global.readGeometry(extendedText);

    (geometry1 instanceof GeometryCollection).should.be.true;
    (geometry2 instanceof GeometryCollection).should.be.true;
    geometry1.geometryType.should.be.equal(GeometryType.GEOMETRYCOLLECTION);
    geometry2.geometryType.should.be.equal(GeometryType.GEOMETRYCOLLECTION);

    geometry1.equals(multiSurface).should.be.true;
    geometry1.equals(geometry2).should.be.true;

    const geometryCollection1 = geometry1;
    const geometryCollection2 = geometry2;
    geometryCollection1.isMultiSurface().should.be.true;
    geometryCollection2.isMultiSurface().should.be.true;

    geometryTester(multiSurface);
    geometryTester(extendedMultiSurface, multiSurface);
  });

  it('test multi polygon', function () {
    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a multi polygon
      const multiPolygon = global.createMultiPolygon(global.coinFlip(), global.coinFlip());
      geometryTester(multiPolygon);
    }
  });

  it('test geometry collection', function () {
    for (let i = 0; i < GEOMETRIES_PER_TEST; i++) {
      // Create and test a geometry collection
      const geometryCollection = global.createGeometryCollection(global.coinFlip(), global.coinFlip());
      geometryTester(geometryCollection);
    }

  });

  it('test multi polygon 2.5D', function () {
    // Test a pre-created WKT string saved as a 2.5D MultiPolygon

    const text = "MULTIPOLYGON Z(((-91.07087880858114 14.123634886445812 0.0,-91.07087285992856 14.123533759353165 0.0,-91.07105845788698 14.123550415580155 0.0,-91.07106797573107 14.12356112315473 0.0,-91.07112508279522 14.12359443560882 0.0,-91.07105144284623 14.123746753409705 0.0,-91.07104865928 14.123752510973361 0.0,-91.0709799356739 14.123874022276935 0.0,-91.07095614106379 14.123925180688502 0.0,-91.07092996699276 14.124102450533544 0.0,-91.07090855184373 14.124346345286652 0.0,-91.07090141346072 14.124415349655804 0.0,-91.07086453181506 14.12441891884731 0.0,-91.07087404965915 14.12390376553958 0.0,-91.07087880858114 14.123634886445812 0.0)))";

    text.startsWith(GeometryType.nameFromType(GeometryType.MULTIPOLYGON) + " Z").should.be.true;

    const geometry = global.readGeometry(text);
    (geometry instanceof MultiPolygon).should.be.true;
    geometry.geometryType.should.be.equal(GeometryType.MULTIPOLYGON);
    const multiPolygon = geometry;
    multiPolygon.hasZ.should.be.true;
    multiPolygon.hasM.should.be.false;
    multiPolygon.numGeometries().should.be.equal(1);
    const polygon = multiPolygon.getPolygon(0);
    polygon.hasZ.should.be.true;
    polygon.hasM.should.be.false;
    polygon.numRings().should.be.equal(1);
    const ring = polygon.getRing(0);
    ring.hasZ.should.be.true;
    ring.hasM.should.be.false;
    ring.numPoints().should.be.equal(15);
    for (let point of ring.points) {
      point.hasZ.should.be.true;
      point.hasM.should.be.false;
      should.exist(point.z);
      should.not.exist(point.m);
    }

    const multiPolygonText = global.writeText(multiPolygon);
    global.compareText(text, multiPolygonText);

    const geometry2 = global.readGeometry(multiPolygonText);

    geometryTester(geometry, geometry2);
  });

  it('test geometries', function () {
    geometryTesterText("Point (10 10)");
    geometryTesterText("LineString ( 10 10, 20 20, 30 40)");
    geometryTesterText("Polygon\n((10 10, 10 20, 20 20, 20 15, 10 10))");
    geometryTesterText("MultiPoint ((10 10), (20 20))");
    geometryTesterText("MultiLineString\n(\n(10 10, 20 20), (15 15, 30 15)\n) ");
    geometryTesterText(" MultiPolygon\n(\n((10 10, 10 20, 20 20, 20 15, 10 10)),\n((60 60, 70 70, 80 60, 60 60 ))\n)");
    geometryTesterText("GeometryCollection\n(\nPOINT (10 10),\nPOINT (30 30),\nLINESTRING (15 15, 20 20)\n)");
    geometryTesterText("PolyhedralSurface Z\n(\n((0 0 0, 0 0 1, 0 1 1, 0 1 0, 0 0 0)),\n((0 0 0, 0 1 0, 1 1 0, 1 0 0, 0 0 0)),\n((0 0 0, 1 0 0, 1 0 1, 0 0 1, 0 0 0)),\n((1 1 0, 1 1 1, 1 0 1, 1 0 0, 1 1 0)),\n((0 1 0, 0 1 1, 1 1 1, 1 1 0, 0 1 0)),\n((0 0 1, 1 0 1, 1 1 1, 0 1 1, 0 0 1))\n)");
    geometryTesterText("Tin Z (\n((0 0 0, 0 0 1, 0 1 0, 0 0 0)),\n((0 0 0, 0 1 0, 1 0 0, 0 0 0)),\n((0 0 0, 1 0 0, 0 0 1, 0 0 0)),\n((1 0 0, 0 1 0, 0 0 1, 1 0 0))\n)");
    geometryTesterText("Point Z (10 10 5)");
    geometryTesterText("Point ZM (10 10 5 40)");
    geometryTesterText("Point M (10 10 40)");
    geometryTesterWithReplacement("MULTICURVE (COMPOUNDCURVE (LINESTRING (3451418.006 5481808.951, 3451417.787 5481809.927, 3451409.995 5481806.744), LINESTRING (3451409.995 5481806.744, 3451418.006 5481808.951)), LINESTRING (3451418.006 5481808.951, 3451417.787 5481809.927, 3451409.995 5481806.744), LINESTRING (3451409.995 5481806.744, 3451418.006 5481808.951))", GeometryType.nameFromType(GeometryType.MULTICURVE), GeometryType.nameFromType(GeometryType.GEOMETRYCOLLECTION));
    geometryTesterWithReplacement("COMPOUNDCURVE(EMPTY,CIRCULARSTRING EMPTY)", "(EMPTY,CIRCULARSTRING EMPTY)", " EMPTY");
    geometryTesterWithReplacement("COMPOUNDCURVE(LINESTRING EMPTY,CIRCULARSTRING EMPTY)", "(LINESTRING EMPTY,CIRCULARSTRING EMPTY)", " EMPTY");
    geometryTesterWithReplacement("COMPOUNDCURVE(EMPTY, CIRCULARSTRING(1 5,6 2,7 3))", "EMPTY, ", "");
    geometryTesterWithReplacement("COMPOUNDCURVE(LINESTRING EMPTY, CIRCULARSTRING(1 5,6 2,7 3))", "LINESTRING EMPTY,", "");
    geometryTesterText("CircularString(1.1 1.9, 1.1 2.5, 1.1 1.9)");
    geometryTesterText("Point(0.96 2.32)");
    geometryTesterWithReplacement("MultiCurve(CircularString(0.9 2.32, 0.95 2.3, 1.0 2.32),CircularString(0.9 2.32, 0.95 2.34, 1.0 2.32))", "MultiCurve", GeometryType.nameFromType(GeometryType.GEOMETRYCOLLECTION));
    geometryTesterWithReplacement("MultiCurve(CircularString(1.05 1.56, 1.03 1.53, 1.05 1.50),CircularString(1.05 1.50, 1.10 1.48, 1.15 1.52),CircularString(1.15 1.52, 1.14 1.54, 1.12 1.53),CircularString(1.12 1.53, 1.06 1.42, 0.95 1.28),CircularString(0.95 1.28, 0.92 1.31, 0.95 1.34),CircularString(0.95 1.34, 1.06 1.28, 1.17 1.32))", "MultiCurve", GeometryType.nameFromType(GeometryType.GEOMETRYCOLLECTION));
    geometryTesterText("MultiPolygon(((2.18 1.0, 2.1 1.2, 2.3 1.4, 2.5 1.2, 2.35 1.0, 2.18 1.0)),((2.3 1.4, 2.57 1.6, 2.7 1.3, 2.3 1.4)))");
    geometryTesterText("MultiSurface(((1.6 1.9, 1.9 1.9, 1.9 2.2, 1.6 2.2, 1.6 1.9)),((1.1 1.8, 0.7 1.2, 1.5 1.2, 1.1 1.8)))", "GEOMETRYCOLLECTION (POLYGON ((1.6 1.9, 1.9 1.9, 1.9 2.2, 1.6 2.2, 1.6 1.9)), POLYGON ((1.1 1.8, 0.7 1.2, 1.5 1.2, 1.1 1.8)))");
    geometryTesterWithReplacement("CurvePolygon(CompoundCurve(CircularString(2.6 1.0, 2.7 1.3, 2.8 1.0),(2.8 1.0, 2.6 1.0)))", "(2.8 1.0, 2.6 1.0)", GeometryType.nameFromType(GeometryType.LINESTRING) + "(2.8 1.0, 2.6 1.0)");
    geometryTesterText("GeometryCollection(MultiCurve((2.0 1.0, 2.1 1.0),CircularString(2.0 1.0, 1.98 1.1, 1.9 1.2),CircularString(2.1 1.0, 2.08 1.1, 2.0 1.2),(1.9 1.2, 1.85 1.3),(2.0 1.2, 1.9 1.35),(1.85 1.3, 1.9 1.35)),CircularString(1.85 1.3, 1.835 1.29, 1.825 1.315),CircularString(1.9 1.35, 1.895 1.38, 1.88 1.365),LineString(1.825 1.315, 1.88 1.365))", "GEOMETRYCOLLECTION (GEOMETRYCOLLECTION (LINESTRING (2.0 1.0, 2.1 1.0), CIRCULARSTRING (2.0 1.0, 1.98 1.1, 1.9 1.2), CIRCULARSTRING (2.1 1.0, 2.08 1.1, 2.0 1.2), LINESTRING (1.9 1.2, 1.85 1.3), LINESTRING (2.0 1.2, 1.9 1.35), LINESTRING (1.85 1.3, 1.9 1.35)), CIRCULARSTRING (1.85 1.3, 1.835 1.29, 1.825 1.315), CIRCULARSTRING (1.9 1.35, 1.895 1.38, 1.88 1.365), LINESTRING (1.825 1.315, 1.88 1.365))");
    geometryTesterText("COMPOUNDCURVE((0 0, 0.25 0), CIRCULARSTRING(0.25 0, 0.5 0.5, 0.75 0), (0.75 0, 1 0))", "COMPOUNDCURVE(LINESTRING(0 0, 0.25 0), CIRCULARSTRING(0.25 0, 0.5 0.5, 0.75 0), LINESTRING(0.75 0, 1 0))");
    geometryTesterText("POLYHEDRALSURFACE Z(\n	((0 0 0, 0 0 1, 0 1 1, 0 1 0, 0 0 0)),\n	((0 0 0, 0 1 0, 1 1 0, 1 0 0, 0 0 0)),\n	((0 0 0, 1 0 0, 1 0 1, 0 0 1, 0 0 0)),\n	((1 1 0, 1 1 1, 1 0 1, 1 0 0, 1 1 0)),\n	((0 1 0, 0 1 1, 1 1 1, 1 1 0, 0 1 0)),\n	((0 0 1, 1 0 1, 1 1 1, 0 1 1, 0 0 1))\n)");
    geometryTesterWithReplacement("POLYHEDRALSURFACE(\n	((0 0 0, 0 0 1, 0 1 1, 0 1 0, 0 0 0)),\n	((0 0 0, 0 1 0, 1 1 0, 1 0 0, 0 0 0)),\n	((0 0 0, 1 0 0, 1 0 1, 0 0 1, 0 0 0)),\n	((1 1 0, 1 1 1, 1 0 1, 1 0 0, 1 1 0)),\n	((0 1 0, 0 1 1, 1 1 1, 1 1 0, 0 1 0)),\n	((0 0 1, 1 0 1, 1 1 1, 0 1 1, 0 0 1))\n)", "POLYHEDRALSURFACE", "POLYHEDRALSURFACE Z", false);
    geometryTesterText("CIRCULARSTRING Z (220268 150415 1,220227 150505 2,220227 150406 3)");
    geometryTesterWithReplacement("CIRCULARSTRING(220268 150415 1,220227 150505 2,220227 150406 3)", "CIRCULARSTRING", "CIRCULARSTRING Z", false);
    geometryTesterText("TRIANGLE ((0 0, 0 9, 9 0, 0 0))");
    geometryTesterWithReplacement("MULTIPOLYGON(((0 0 0,4 0 0,4 4 0,0 4 0,0 0 0),(1 1 0,2 1 0,2 2 0,1 2 0,1 1 0)),((-1 -1 0,-1 -2 0,-2 -2 0,-2 -1 0,-1 -1 0)))", "MULTIPOLYGON", "MULTIPOLYGON Z", false);
    geometryTesterWithReplacement("TIN( ((0 0 0, 0 0 1, 0 1 0, 0 0 0)), ((0 0 0, 0 1 0, 1 1 0, 0 0 0)) )", "TIN", "TIN Z", false);
    geometryTesterWithReplacement("POINT(0 0 0)", "POINT", "POINT Z", false);
    geometryTesterWithReplacement("POINTM(0 0 0)", "POINTM", "POINT M");
    geometryTesterWithReplacement("POINT(0 0 0 0)", "POINT", "POINT ZM", false);
    geometryTesterWithReplacement("POINTZM(0 0 0 0)", "POINTZM", "POINT ZM");
    geometryTesterText("MULTIPOINTM(0 0 0,1 2 1)", "MULTIPOINT M((0 0 0),(1 2 1))");
    geometryTesterText("GEOMETRYCOLLECTIONM( POINTM(2 3 9), LINESTRINGM(2 3 4, 3 4 5) )", "GEOMETRYCOLLECTION M( POINT M(2 3 9), LINESTRING M(2 3 4, 3 4 5) )");
    geometryTesterText("GEOMETRYCOLLECTIONZ(POINTZ(13.21 47.21 0.21),\nLINESTRINGZ(15.21 57.58 0.31,\n15.81 57.12 0.33))", "GEOMETRYCOLLECTION Z(POINT Z(13.21 47.21 0.21),\nLINESTRING Z(15.21 57.58 0.31,\n15.81 57.12 0.33))");
    geometryTesterText("GEOMETRYCOLLECTIONM(POINTM(13.21 47.21 1000.0),\nLINESTRINGM(15.21 57.58 1000.0, 15.81 57.12 1100.0))", "GEOMETRYCOLLECTION M(POINT M(13.21 47.21 1000.0),\nLINESTRING M(15.21 57.58 1000.0, 15.81 57.12 1100.0))");
    geometryTesterText("GEOMETRYCOLLECTIONZM(POINTZM(13.21 47.21 0.21 1000.0),\nLINESTRINGZM(15.21 57.58 0.31 1000.0, 15.81 57.12 0.33 1100.0))", "GEOMETRYCOLLECTION ZM(POINT ZM(13.21 47.21 0.21 1000.0),\nLINESTRING ZM(15.21 57.58 0.31 1000.0, 15.81 57.12 0.33 1100.0))");
  });

  it('test finite filter', function () {
    const point = global.createPoint(false, false);
    const nan = new Point(Number.NaN, Number.NaN);
    const nanZ = global.createPoint(true, false);
    nanZ.z = (Number.NaN);
    const nanM = global.createPoint(false, true);
    nanM.m = (Number.NaN);
    const nanZM = global.createPoint(true, true);
    nanZM.z = (Number.NaN);
    nanZM.m = (Number.NaN);

    const infinite = new Point(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    const infiniteZ = global.createPoint(true, false);
    infiniteZ.z = (Number.POSITIVE_INFINITY);
    const infiniteM = global.createPoint(false, true);
    infiniteM.m = (Number.POSITIVE_INFINITY);
    const infiniteZM = global.createPoint(true, true);
    infiniteZM.z = (Number.POSITIVE_INFINITY);
    infiniteZM.m = (Number.POSITIVE_INFINITY);

    const nanInfinite = new Point(Number.NaN, Number.POSITIVE_INFINITY);
    const nanInfiniteZM = global.createPoint(true, true);
    nanInfiniteZM.z = (Number.NaN);
    nanInfiniteZM.m = (Number.NEGATIVE_INFINITY);

    const infiniteNan = new Point(Number.POSITIVE_INFINITY, Number.NaN);
    const infiniteNanZM = global.createPoint(true, true);
    infiniteNanZM.z = (Number.NEGATIVE_INFINITY);
    infiniteNanZM.m = (Number.NaN);

    const lineString1 = new LineString();
    lineString1.addPoint(point);
    lineString1.addPoint(nan);
    lineString1.addPoint(global.createPoint(false, false));
    lineString1.addPoint(infinite);
    lineString1.addPoint(global.createPoint(false, false));
    lineString1.addPoint(nanInfinite);
    lineString1.addPoint(global.createPoint(false, false));
    lineString1.addPoint(infiniteNan);

    const lineString2 = new LineString(true, false);
    lineString2.addPoint(global.createPoint(true, false));
    lineString2.addPoint(nanZ);
    lineString2.addPoint(global.createPoint(true, false));
    lineString2.addPoint(infiniteZ);

    const lineString3 = new LineString(false, true);
    lineString3.addPoint(global.createPoint(false, true));
    lineString3.addPoint(nanM);
    lineString3.addPoint(global.createPoint(false, true));
    lineString3.addPoint(infiniteM);

    const lineString4 = new LineString(true, true);
    lineString4.addPoint(global.createPoint(true, true));
    lineString4.addPoint(nanZM);
    lineString4.addPoint(global.createPoint(true, true));
    lineString4.addPoint(infiniteZM);
    lineString4.addPoint(global.createPoint(true, true));
    lineString4.addPoint(nanInfiniteZM);
    lineString4.addPoint(global.createPoint(true, true));
    lineString4.addPoint(infiniteNanZM);

    const polygon1 = new Polygon(lineString1);
    const polygon2 = new Polygon(lineString2);
    const polygon3 = new Polygon(lineString3);
    const polygon4 = new Polygon(lineString4);

    for (const pnt of lineString1.points) {
      testFiniteFilter(pnt);
    }

    for (const pnt of lineString2.points) {
      testFiniteFilter(pnt);
    }

    for (const pnt of lineString3.points) {
      testFiniteFilter(pnt);
    }

    for (const pnt of lineString4.points) {
      testFiniteFilter(pnt);
    }

    testFiniteFilter(lineString1);
    testFiniteFilter(lineString2);
    testFiniteFilter(lineString3);
    testFiniteFilter(lineString4);
    testFiniteFilter(polygon1);
    testFiniteFilter(polygon2);
    testFiniteFilter(polygon3);
    testFiniteFilter(polygon4);
  });
});
