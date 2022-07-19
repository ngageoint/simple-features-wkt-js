import {
	CircularString,
	CompoundCurve,
	Curve,
	CurvePolygon,
	Geometry,
	GeometryCollection,
	GeometryFilter,
	GeometryType,
	LineString,
	MultiLineString,
	MultiPoint,
	MultiPolygon,
	Point,
	Polygon,
	PolyhedralSurface,
	SFException,
	Surface,
	TIN,
	Triangle
} from "@ngageoint/simple-features-js";
import { StringReader } from "./StringReader";
import {GeometryTypeInfo} from "./GeometryTypeInfo";


/**
 * Well Known Text reader
 */
export class GeometryReader {

	/**
	 * Text Reader
	 */
	private reader: StringReader;

	public constructor(reader: StringReader);
	public constructor(text: string);

	/**
	 * Constructor
	 * @param args
	 */
	public constructor(...args) {
		if (args.length === 1 && args[0] instanceof StringReader) {
			this.reader = args[0];
		} else if (args.length === 1 && typeof args[0] === 'string') {
			this.reader = new StringReader(args[0]);
		}
	}

	/**
	 * Read a geometry from the well-known text
	 * @param filter geometry filter
	 * @param containingType containing geometry type
	 * @return geometry
	 */
	public read(filter: GeometryFilter, containingType: GeometryType = undefined): Geometry {
		let geometry = null;

		// Read the geometry type
		const geometryTypeInfo = this.readGeometryType();

		if (geometryTypeInfo != null) {

			const geometryType = geometryTypeInfo.geometryType;
			const hasZ = geometryTypeInfo.hasZ;
			const hasM = geometryTypeInfo.hasM;

			switch (geometryType) {

			case GeometryType.GEOMETRY:
				throw new SFException("Unexpected Geometry Type of " + GeometryType.nameFromType(geometryType) + " which is abstract");
			case GeometryType.POINT:
				geometry = this.readPointText(hasZ, hasM);
				break;
			case GeometryType.LINESTRING:
				geometry = this.readLineString(filter, hasZ, hasM);
				break;
			case GeometryType.POLYGON:
				geometry = this.readPolygon(filter, hasZ, hasM);
				break;
			case GeometryType.MULTIPOINT:
				geometry = this.readMultiPoint(filter, hasZ, hasM);
				break;
			case GeometryType.MULTILINESTRING:
				geometry = this.readMultiLineString(filter, hasZ, hasM);
				break;
			case GeometryType.MULTIPOLYGON:
				geometry = this.readMultiPolygon(filter, hasZ, hasM);
				break;
			case GeometryType.GEOMETRYCOLLECTION:
				geometry = this.readGeometryCollection(filter, hasZ, hasM);
				break;
			case GeometryType.MULTICURVE:
				geometry = this.readMultiCurve(filter, hasZ, hasM);
				break;
			case GeometryType.MULTISURFACE:
				geometry = this.readMultiSurface(filter, hasZ, hasM);
				break;
			case GeometryType.CIRCULARSTRING:
				geometry = this.readCircularString(filter, hasZ, hasM);
				break;
			case GeometryType.COMPOUNDCURVE:
				geometry = this.readCompoundCurve(filter, hasZ, hasM);
				break;
			case GeometryType.CURVEPOLYGON:
				geometry = this.readCurvePolygon(filter, hasZ, hasM);
				break;
			case GeometryType.CURVE:
				throw new SFException("Unexpected Geometry Type of "
						+ GeometryType.nameFromType(geometryType) + " which is abstract");
			case GeometryType.SURFACE:
				throw new SFException("Unexpected Geometry Type of "
						+ GeometryType.nameFromType(geometryType) + " which is abstract");
			case GeometryType.POLYHEDRALSURFACE:
				geometry = this.readPolyhedralSurface(filter, hasZ, hasM);
				break;
			case GeometryType.TIN:
				geometry = this.readTIN(filter, hasZ, hasM);
				break;
			case GeometryType.TRIANGLE:
				geometry = this.readTriangle(filter, hasZ, hasM);
				break;
			default:
				throw new SFException("Geometry Type not supported: " + geometryType);
			}

			if (!GeometryReader.filter(filter, containingType, geometry)) {
				geometry = null;
			}

		}

		return geometry;
	}

	/**
	 * Read the geometry type info
	 * @return geometry type info
	 */
	public readGeometryType(): GeometryTypeInfo {

		let geometryInfo = null;

		// Read the geometry type
		let geometryTypeValue = this.reader.readToken();

		if (geometryTypeValue != null && geometryTypeValue.toUpperCase() !== "EMPTY") {
			let hasZ = false;
			let hasM = false;

			// Determine the geometry type
			let geometryType = GeometryType.fromName(geometryTypeValue.toLocaleUpperCase('en-US'));

			// If not found, check if the geometry type has Z and/or M suffix
			if (geometryType == null) {

				// Check if the Z and/or M is appended to the geometry type
				let geomType = geometryTypeValue.toLocaleUpperCase('en-US');
				if (geomType.endsWith("Z")) {
					hasZ = true;
				} else if (geomType.endsWith("M")) {
					hasM = true;
					if (geomType.endsWith("ZM")) {
						hasZ = true;
					}
				}

				let suffixSize = 0;
				if (hasZ) {
					suffixSize++;
				}
				if (hasM) {
					suffixSize++;
				}

				if (suffixSize > 0) {
					// Check for the geometry type without the suffix
					geomType = geometryTypeValue.substring(0, geometryTypeValue.length - suffixSize);
					geometryType = GeometryType.fromName(geomType.toLocaleUpperCase('en-US'));
				}

				if (geometryType == null) {
					throw new SFException("Expected a valid geometry type, found: '" + geometryTypeValue + "'");

				}

			}

			// Determine if the geometry has a z (3d) or m (linear referencing
			// system) value
			if (!hasZ && !hasM) {

				// Peek at the next token without popping it off
				let next = this.reader.peekToken();

				switch (GeometryReader.toUpperCase(next)) {
				case "Z":
					hasZ = true;
					break;
				case "M":
					hasM = true;
					break;
				case "ZM":
					hasZ = true;
					hasM = true;
					break;
				case "(":
				case "EMPTY":
					break;
				default:
					throw new SFException(
							"Invalid value following geometry type: '"
									+ geometryTypeValue + "', value: '" + next
									+ "'");
				}

				if (hasZ || hasM) {
					// Read off the Z and/or M token
					this.reader.readToken();
				}

			}

			geometryInfo = new GeometryTypeInfo(geometryType, hasZ, hasM);

		}

		return geometryInfo;
	}

	/**
	 * Read a Point
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return point
	 */
	public readPointText(hasZ: boolean, hasM: boolean): Point {
		let point = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			point = this.readPoint(hasZ, hasM);
			GeometryReader.rightParenthesis(this.reader);
		}
		return point;
	}

	/**
	 * Read a Point
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return point
	 */
	public readPoint(hasZ: boolean, hasM: boolean): Point {
		const x = this.reader.readDouble();
		const y = this.reader.readDouble();
		const point = new Point(hasZ, hasM, x, y);
		if (hasZ || hasM) {
			if (hasZ) {
				point.z = this.reader.readDouble();
			}
			if (hasM) {
				point.m = this.reader.readDouble();
			}
		} else if (!GeometryReader.isCommaOrRightParenthesis(this.reader)) {
			point.z = this.reader.readDouble();
			if (!GeometryReader.isCommaOrRightParenthesis(this.reader)) {
				point.m = this.reader.readDouble();
			}
		}
		return point;
	}


	/**
	 * Read a Line String
	 * 
	 * @param filter
	 *            geometry filter
	 * @param hasZ
	 *            has z flag
	 * @param hasM
	 *            has m flag
	 * @return line string
	 */
	public readLineString(filter: GeometryFilter, hasZ: boolean, hasM: boolean): LineString {
		let lineString = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			lineString = new LineString(hasZ, hasM);
			do {
				let point = this.readPoint(hasZ, hasM);
				if (GeometryReader.filter(filter, GeometryType.LINESTRING, point)) {
					lineString.addPoint(point);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));

		}
		return lineString;
	}


	/**
	 * Read a Polygon
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return polygon
	 */
	public readPolygon(filter: GeometryFilter, hasZ: boolean, hasM: boolean): Polygon {
		let polygon = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			polygon = new Polygon(hasZ, hasM);
			do {
				let ring = this.readLineString(filter, hasZ, hasM);
				if (GeometryReader.filter(filter, GeometryType.POLYGON, ring)) {
					polygon.addRing(ring);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));
		}
		return polygon;
	}

	/**
	 * Read a Multi Point
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi point
	 */
	public readMultiPoint(filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiPoint {
		let multiPoint = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			multiPoint = new MultiPoint(hasZ, hasM);
			do {
				let point = null;
				if (GeometryReader.isLeftParenthesisOrEmpty(this.reader)) {
					point = this.readPointText(hasZ, hasM);
				} else {
					point = this.readPoint(hasZ, hasM);
				}
				if (GeometryReader.filter(filter, GeometryType.MULTIPOINT, point)) {
					multiPoint.addPoint(point);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));
		}
		return multiPoint;
	}
	

	/**
	 * Read a Multi Line String
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi line string
	 */
	public readMultiLineString(filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiLineString {
		let multiLineString = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			multiLineString = new MultiLineString(hasZ, hasM);
			do {
				let lineString = this.readLineString(filter, hasZ, hasM);
				if (GeometryReader.filter(filter, GeometryType.MULTILINESTRING, lineString)) {
					multiLineString.addLineString(lineString);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));
		}
		return multiLineString;
	}
	

	/**
	 * Read a Multi Polygon
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi polygon
	 */
	public readMultiPolygon(filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiPolygon {
		let multiPolygon = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			multiPolygon = new MultiPolygon(hasZ, hasM);
			do {
				let polygon = this.readPolygon(filter, hasZ, hasM);
				if (GeometryReader.filter(filter, GeometryType.MULTIPOLYGON, polygon)) {
					multiPolygon.addPolygon(polygon);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));

		}

		return multiPolygon;
	}
	
	/**
	 * Read a Geometry Collection
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return geometry collection
	 */
	public readGeometryCollection(filter: GeometryFilter, hasZ: boolean, hasM: boolean): GeometryCollection<Geometry> {
		let geometryCollection = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			geometryCollection = new GeometryCollection<Geometry>(hasZ, hasM);
			do {
				let geometry = this.read(filter, GeometryType.GEOMETRYCOLLECTION);
				if (geometry != null) {
					geometryCollection.addGeometry(geometry);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));
		}
		return geometryCollection;
	}

	/**
	 * Read a Multi Curve
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi curve
	 */
	public readMultiCurve(filter: GeometryFilter, hasZ: boolean, hasM: boolean): GeometryCollection<Curve> {
		let multiCurve = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			multiCurve = new GeometryCollection<Curve>(hasZ, hasM);
			do {
				let curve = null;
				if (GeometryReader.isLeftParenthesisOrEmpty(this.reader)) {
					curve = this.readLineString(filter, hasZ, hasM);
					if (!GeometryReader.filter(filter, GeometryType.MULTICURVE, curve)) {
						curve = null;
					}
				} else {
					curve = this.read(filter, GeometryType.MULTICURVE);
				}
				if (curve != null) {
					multiCurve.addGeometry(curve);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));
		}
		return multiCurve;
	}

	/**
	 * Read a Multi Surface
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi surface
	 */
	public readMultiSurface(filter: GeometryFilter, hasZ: boolean, hasM: boolean): GeometryCollection<Surface> {
		let multiSurface = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			multiSurface = new GeometryCollection<Surface>(hasZ, hasM);
			do {
				let surface = null;
				if (GeometryReader.isLeftParenthesisOrEmpty(this.reader)) {
					surface = this.readPolygon(filter, hasZ, hasM);
					if (!GeometryReader.filter(filter, GeometryType.MULTISURFACE, surface)) {
						surface = null;
					}
				} else {
					surface = this.read(filter, GeometryType.MULTISURFACE);
				}
				if (surface != null) {
					multiSurface.addGeometry(surface);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));

		}

		return multiSurface;
	}

	/**
	 * Read a Circular String
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return circular string
	 */
	public readCircularString(filter: GeometryFilter, hasZ: boolean, hasM: boolean): CircularString {
		let circularString = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			circularString = new CircularString(hasZ, hasM);
			do {
				let point = this.readPoint(hasZ, hasM);
				if (GeometryReader.filter(filter, GeometryType.CIRCULARSTRING, point)) {
					circularString.addPoint(point);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));
		}
		return circularString;
	}

	/**
	 * Read a Compound Curve
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return compound curve
	 */
	public readCompoundCurve(filter: GeometryFilter, hasZ: boolean, hasM: boolean): CompoundCurve {
		let compoundCurve = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			compoundCurve = new CompoundCurve(hasZ, hasM);
			do {
				let lineString = null;
				if (GeometryReader.isLeftParenthesisOrEmpty(this.reader)) {
					lineString = this.readLineString(filter, hasZ, hasM);
					if (!GeometryReader.filter(filter, GeometryType.COMPOUNDCURVE, lineString)) {
						lineString = null;
					}
				} else {
					lineString = this.read(filter, GeometryType.COMPOUNDCURVE);
				}
				if (lineString != null) {
					compoundCurve.addLineString(lineString);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));

		}
		return compoundCurve;
	}

	/**
	 * Read a Curve Polygon
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return curve polygon
	 */
	public readCurvePolygon(filter: GeometryFilter, hasZ: boolean, hasM: boolean): CurvePolygon<Curve> {
		let curvePolygon = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			curvePolygon = new CurvePolygon<Curve>(hasZ, hasM);
			do {
				let ring = null;
				if (GeometryReader.isLeftParenthesisOrEmpty(this.reader)) {
					ring = this.readLineString(filter, hasZ, hasM);
					if (!GeometryReader.filter(filter, GeometryType.CURVEPOLYGON, ring)) {
						ring = null;
					}
				} else {
					ring = this.read(filter, GeometryType.CURVEPOLYGON);
				}
				if (ring != null) {
					curvePolygon.addRing(ring);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));
		}
		return curvePolygon;
	}
	

	/**
	 * Read a Polyhedral Surface
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return polyhedral surface
	 */
	public readPolyhedralSurface(filter: GeometryFilter, hasZ: boolean, hasM: boolean): PolyhedralSurface {
		let polyhedralSurface = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			polyhedralSurface = new PolyhedralSurface(hasZ, hasM);
			do {
				let polygon = this.readPolygon(filter, hasZ, hasM);
				if (GeometryReader.filter(filter, GeometryType.POLYHEDRALSURFACE, polygon)) {
					polyhedralSurface.addPolygon(polygon);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));

		}

		return polyhedralSurface;
	}

	/**
	 * Read a TIN
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return TIN
	 */
	public readTIN(filter: GeometryFilter, hasZ: boolean, hasM: boolean): TIN {
		let tin = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			tin = new TIN(hasZ, hasM);
			do {
				let polygon = this.readPolygon(filter, hasZ, hasM);
				if (GeometryReader.filter(filter, GeometryType.TIN, polygon)) {
					tin.addPolygon(polygon);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));
		}
		return tin;
	}
	
	/**
	 * Read a Triangle
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return triangle
	 */
	public readTriangle(filter: GeometryFilter, hasZ: boolean, hasM: boolean): Triangle {
		let triangle = null;
		if (GeometryReader.leftParenthesisOrEmpty(this.reader)) {
			triangle = new Triangle(hasZ, hasM);
			do {
				let ring = this.readLineString(filter, hasZ, hasM);
				if (GeometryReader.filter(filter, GeometryType.TRIANGLE, ring)) {
					triangle.addRing(ring);
				}
			} while (GeometryReader.commaOrRightParenthesis(this.reader));
		}
		return triangle;
	}

	/**
	 * Read a geometry from the well-known text
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param containingType containing geometry type
	 * @return geometry
	 */
	public static readGeometry(reader: StringReader, filter: GeometryFilter = undefined, containingType: GeometryType = undefined): Geometry {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.read(filter, containingType);
	}

	/**
	 * Read the geometry type info
	 * 
	 * @param reader
	 *            text reader
	 * @return geometry type info
	 */
	public static readGeometryType(reader: StringReader): GeometryTypeInfo {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readGeometryType();
	}

	/**
	 * Read a Point
	 * @param reader text reader
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return point
	 */
	public static readPointText(reader: StringReader, hasZ: boolean, hasM: boolean): Point {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readPointText(hasZ, hasM);
	}

	/**
	 * Read a Point
	 * @param reader text reader
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return point
	 */
	public static readPoint(reader: StringReader, hasZ: boolean, hasM: boolean): Point {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readPoint(hasZ, hasM);
	}
	
	/**
	 * Read a Line String
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return line string
	 */
	public static readLineString(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): LineString {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readLineString(filter, hasZ, hasM);
	}

	/**
	 * Read a Polygon
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return polygon
	 */
	public static readPolygon(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): Polygon {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readPolygon(filter, hasZ, hasM);
	}
	

	/**
	 * Read a Multi Point
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi point
	 */
	public static readMultiPoint(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiPoint {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readMultiPoint(filter, hasZ, hasM);
	}

	/**
	 * Read a Multi Line String
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi line string
	 */
	public static readMultiLineString(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiLineString {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readMultiLineString(filter, hasZ, hasM);
	}

	/**
	 * Read a Multi Polygon
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi polygon
	 */
	public static readMultiPolygon(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): MultiPolygon {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readMultiPolygon(filter, hasZ, hasM);
	}
	

	/**
	 * Read a Geometry Collection
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return geometry collection
	 */
	public static readGeometryCollection(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): GeometryCollection<Geometry> {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readGeometryCollection(filter, hasZ, hasM);
	}

	/**
	 * Read a Multi Surface
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return multi surface
	 */
	public static readMultiSurface(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): GeometryCollection<Surface> {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readMultiSurface(filter, hasZ, hasM);
	}
	

	/**
	 * Read a Circular String
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return circular string
	 */
	public static readCircularString(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): CircularString {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readCircularString(filter, hasZ, hasM);
	}
	

	/**
	 * Read a Compound Curve
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return compound curve
	 */
	public static readCompoundCurve(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): CompoundCurve {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readCompoundCurve(filter, hasZ, hasM);
	}

	/**
	 * Read a Curve Polygon
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return curve polygon
	 */
	public static readCurvePolygon(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): CurvePolygon<Curve> {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readCurvePolygon(filter, hasZ, hasM);
	}

	/**
	 * Read a Polyhedral Surface
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return polyhedral surface
	 */
	public static readPolyhedralSurface(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): PolyhedralSurface {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readPolyhedralSurface(filter, hasZ, hasM);
	}

	/**
	 * Read a TIN
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return TIN
	 */
	public static readTIN(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): TIN {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readTIN(filter, hasZ, hasM);
	}

	/**
	 * Read a Triangle
	 * @param reader text reader
	 * @param filter geometry filter
	 * @param hasZ has z flag
	 * @param hasM has m flag
	 * @return triangle
	 */
	public static readTriangle(reader: StringReader, filter: GeometryFilter, hasZ: boolean, hasM: boolean): Triangle {
		const geometryReader = new GeometryReader(reader);
		return geometryReader.readTriangle(filter, hasZ, hasM);
	}

	/**
	 * Read a left parenthesis or empty set
	 * @param reader text reader
	 * @return true if not empty
	 */
	private static leftParenthesisOrEmpty(reader: StringReader): boolean {
		let nonEmpty;

		const token = reader.readToken();

		switch (GeometryReader.toUpperCase(token)) {
		case "EMPTY":
			nonEmpty = false;
			break;
		case "(":
			nonEmpty = true;
			break;
		default:
			throw new SFException("Invalid token, expected 'EMPTY' or '('. found: '" + token + "'");
		}

		return nonEmpty;
	}

	/**
	 * Read a comma or right parenthesis
	 * @param reader text reader
	 * @return true if a comma
	 */
	private static commaOrRightParenthesis(reader: StringReader): boolean {

		let comma;

		const token = reader.readToken();

		switch (GeometryReader.toUpperCase(token)) {
		case ",":
			comma = true;
			break;
		case ")":
			comma = false;
			break;
		default:
			throw new SFException("Invalid token, expected ',' or ')'. found: '"
					+ token + "'");
		}

		return comma;
	}

	/**
	 * Read a right parenthesis
	 * 
	 * @param reader
	 *            text reader
	 */
	private static rightParenthesis(reader: StringReader): void {
		let token = reader.readToken();
		if (token !== ")") {
			throw new SFException("Invalid token, expected ')'. found: '" + token + "'");
		}
	}

	/**
	 * Determine if the next token is either a left parenthesis or empty
	 * 
	 * @param reader
	 *            text reader
	 * @return true if a left parenthesis or empty
	 */
	private static isLeftParenthesisOrEmpty(reader: StringReader): boolean {

		let is = false;

		const token = reader.peekToken();

		switch (GeometryReader.toUpperCase(token)) {
		case "EMPTY":
		case "(":
			is = true;
			break;
		default:
		}

		return is;
	}

	/**
	 * Determine if the next token is either a comma or right parenthesis
	 * @param reader text reader
	 * @return true if a comma
	 */
	private static isCommaOrRightParenthesis(reader: StringReader): boolean {
		let is = false;

		const token = reader.peekToken();
		switch (token) {
			case ",":
			case ")":
				is = true;
				break;
			default:
		}

		return is;
	}

	/**
	 * Filter the geometry
	 * @param filter geometry filter or null
	 * @param containingType containing geometry type
	 * @param geometry geometry or null
	 * @return true if passes filter
	 */
	private static filter(filter: GeometryFilter, containingType: GeometryType, geometry: Geometry): boolean {
		return filter == null || geometry == null || filter.filter(containingType, geometry);
	}

	/**
	 * To upper case helper with null handling for switch statements
	 * @param value string value
	 * @return upper case value or empty string
	 */
	private static toUpperCase(value: string): string {
		return value != null ? value.toLocaleUpperCase('en-US') : "";
	}

}
