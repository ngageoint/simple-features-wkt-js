import {
	CircularString,
	CompoundCurve,
	Curve,
	CurvePolygon,
	Geometry,
	GeometryCollection,
	GeometryType,
	LineString,
	MultiLineString,
	MultiPoint,
	MultiPolygon,
	Point,
	Polygon,
	PolyhedralSurface,
	SFException,
    TIN,
    Triangle
} from "@ngageoint/simple-features-js";
import { StringWriter } from "./StringWriter";

/**
 * Well Known Text writer
 */
export class GeometryWriter {
	/**
	 * Write a geometry to a well-known text string
	 * @param geometry geometry
	 * @return well-known text string
	 */
	public static writeGeometry(geometry: Geometry): string {
		const writer = new GeometryWriter();
		writer.write(geometry);
		return writer.toString();
	}

	/**
	 * Writer
	 */
	private readonly writer: StringWriter;


	/**
	 * Constructor
	 * @param writer writer
	 */
	public constructor(writer: StringWriter = new StringWriter()) {
		this.writer = writer;
	}

	/**
	 * Get the writer
	 * @return writer
	 */
	public getWriter(): StringWriter {
		return this.writer;
	}

	/**
	 * {@inheritDoc}
	 */
	public toString(): string {
		return this.writer.toString();
	}

	/**
	 * Write a geometry to well-known text
	 * @param geometry geometry	
	 */
	public write(geometry: Geometry): void {
		const geometryType = geometry.geometryType;

		// Write the geometry type
		this.writer.write(GeometryType.nameFromType(geometryType));
		this.writer.write(" ");

		const hasZ = geometry.hasZ;
		const hasM = geometry.hasM;

		if (hasZ || hasM) {
			if (hasZ) {
				this.writer.write("Z");
			}
			if (hasM) {
				this.writer.write("M");
			}
			this.writer.write(" ");
		}

		switch (geometryType) {
			case GeometryType.GEOMETRY:
				throw new SFException("Unexpected Geometry Type of " + GeometryType.nameFromType(geometryType) + " which is abstract");
			case GeometryType.POINT:
				this.writePointText(geometry as Point);
				break;
			case GeometryType.LINESTRING:
				this.writeLineString(geometry as LineString);
				break;
			case GeometryType.POLYGON:
				this.writePolygon(geometry as Polygon);
				break;
			case GeometryType.MULTIPOINT:
				this.writeMultiPoint(geometry as MultiPoint);
				break;
			case GeometryType.MULTILINESTRING:
				this.writeMultiLineString(geometry as MultiLineString);
				break;
			case GeometryType.MULTIPOLYGON:
				this.writeMultiPolygon(geometry as MultiPolygon);
				break;
			case GeometryType.GEOMETRYCOLLECTION:
			case GeometryType.MULTICURVE:
			case GeometryType.MULTISURFACE:
				this.writeGeometryCollection(geometry as GeometryCollection<Geometry>);
				break;
			case GeometryType.CIRCULARSTRING:
				this.writeCircularString(geometry as CircularString);
				break;
			case GeometryType.COMPOUNDCURVE:
				this.writeCompoundCurve(geometry as CompoundCurve);
				break;
			case GeometryType.CURVEPOLYGON:
				this.writeCurvePolygon(geometry as CurvePolygon<Curve>);
				break;
			case GeometryType.CURVE:
				throw new SFException("Unexpected Geometry Type of " + GeometryType.nameFromType(geometryType) + " which is abstract");
			case GeometryType.SURFACE:
				throw new SFException("Unexpected Geometry Type of " + GeometryType.nameFromType(geometryType) + " which is abstract");
			case GeometryType.POLYHEDRALSURFACE:
				this.writePolyhedralSurface(geometry as PolyhedralSurface);
				break;
			case GeometryType.TIN:
				this.writeTIN(geometry as TIN);
				break;
			case GeometryType.TRIANGLE:
				this.writeTriangle(geometry as Triangle);
				break;
			default:
				throw new SFException("Geometry Type not supported: " + geometryType);
		}

	}

	/**
	 * Write a Point
	 * @param point point
	 */
	public writePointText(point: Point): void {
		this.writer.write("(");
		this.writePoint(point);
		this.writer.write(")");
	}

	/**
	 * Write a Point
	 * @param point point
	 */
	public writePoint(point: Point): void {
		this.writeXY(point);
		this.writeZ(point);
		this.writeM(point);
	}

	private getNumberString (num: number) {
		let text = num.toString();
		if (text.indexOf('.') === -1) {
			text = text + '.0';
		}
		return text;
	}

	/**
	 * Write a Point X and Y value
	 * @param point point
	 */
	public writeXY(point: Point): void {
		this.writer.write(this.getNumberString(point.x));
		this.writer.write(" ");
		this.writer.write(this.getNumberString(point.y));
	}

	/**
	 * Write a Point Z value
	 * @param point point
	 */
	public writeZ(point: Point): void {
		if (point.hasZ) {
			this.writer.write(" ");
			this.writer.write(this.getNumberString(point.z));
		}
	}

	/**
	 * Write a Point M value
	 * @param point point
	 */
	public writeM(point: Point): void {
		if (point.hasM) {
			this.writer.write(" ");
			this.writer.write(this.getNumberString(point.m));
		}
	}

	/**
	 * Read a Line String
	 * @param lineString line string
	 */
	public writeLineString(lineString: LineString): void {

		if (lineString.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < lineString.numPoints(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.writePoint(lineString.getPoint(i));
			}

			this.writer.write(")");
		}

	}

	/**
	 * Write a Polygon
	 * @param polygon Polygon
	 */
	public writePolygon(polygon: Polygon): void {

		if (polygon.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < polygon.numRings(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.writeLineString(polygon.getRing(i) as LineString);
			}

			this.writer.write(")");
		}

	}

	/**
	 * Write a Multi Point
	 * @param multiPoint multi point
	 */
	public writeMultiPoint(multiPoint: MultiPoint): void {

		if (multiPoint.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < multiPoint.numPoints(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.writePointText(multiPoint.getPoint(i));
			}

			this.writer.write(")");
		}

	}

	/**
	 * Write a Multi Line String
	 * @param multiLineString Multi Line String
	 */
	public writeMultiLineString(multiLineString: MultiLineString): void {

		if (multiLineString.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < multiLineString.numLineStrings(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.writeLineString(multiLineString.getLineString(i));
			}

			this.writer.write(")");
		}

	}

	/**
	 * Write a Multi Polygon
	 * @param multiPolygon Multi Polygon
	 */
	public writeMultiPolygon(multiPolygon: MultiPolygon): void {

		if (multiPolygon.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < multiPolygon.numPolygons(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.writePolygon(multiPolygon.getPolygon(i));
			}

			this.writer.write(")");
		}
	}

	/**
	 * Write a Geometry Collection
	 * @param geometryCollection Geometry Collection
	 */
	public writeGeometryCollection(geometryCollection: GeometryCollection<Geometry>): void {

		if (geometryCollection.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < geometryCollection.numGeometries(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.write(geometryCollection.getGeometry(i));
			}

			this.writer.write(")");
		}

	}

	/**
	 * Write a Circular String
	 * @param circularString Circular String
	 */
	public writeCircularString(circularString: CircularString): void {

		if (circularString.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < circularString.numPoints(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.writePoint(circularString.getPoint(i));
			}

			this.writer.write(")");
		}

	}

	/**
	 * Write a Compound Curve
	 * @param compoundCurve Compound Curve
	 */
	public writeCompoundCurve(compoundCurve: CompoundCurve): void {

		if (compoundCurve.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < compoundCurve.numLineStrings(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.write(compoundCurve.getLineString(i));
			}

			this.writer.write(")");
		}

	}

	/**
	 * Write a Curve Polygon
	 * @param curvePolygon Curve Polygon
	 */
	public writeCurvePolygon(curvePolygon: CurvePolygon<Curve>): void {

		if (curvePolygon.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < curvePolygon.numRings(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.write(curvePolygon.getRing(i));
			}

			this.writer.write(")");
		}

	}

	/**
	 * Write a Polyhedral Surface
	 * @param polyhedralSurface Polyhedral Surface
	 */
	public writePolyhedralSurface(polyhedralSurface: PolyhedralSurface): void {

		if (polyhedralSurface.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < polyhedralSurface.numPolygons(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.writePolygon(polyhedralSurface.getPolygon(i));
			}

			this.writer.write(")");
		}

	}

	/**
	 * Write a TIN
	 * @param tin TIN
	 */
	public writeTIN(tin: TIN): void {

		if (tin.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < tin.numPolygons(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.writePolygon(tin.getPolygon(i));
			}

			this.writer.write(")");
		}

	}

	/**
	 * Write a Triangle
	 * @param triangle Triangle
	 */
	public writeTriangle(triangle: Triangle): void {

		if (triangle.isEmpty()) {
			GeometryWriter.writeEmpty(this.writer);
		} else {
			this.writer.write("(");

			for (let i = 0; i < triangle.numRings(); i++) {
				if (i > 0) {
					this.writer.write(", ");
				}
				this.writeLineString(triangle.getRing(i) as LineString);
			}

			this.writer.write(")");
		}

	}

	/**
	 * Write a geometry to well-known text
	 * @param writer writer
	 * @param geometry  geometry
	 */
	public static writeGeometryWithStringWriter(writer: StringWriter, geometry: Geometry): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.write(geometry);
	}

	/**
	 * Write a Point
	 * @param writer writer
	 * @param point point
	 */
	public static writePointText(writer: StringWriter, point: Point): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writePointText(point);
	}

	/**
	 * Write a Point
	 * @param writer writer
	 * @param point point
	 */
	public static writePoint(writer: StringWriter, point: Point): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writePoint(point);
	}

	/**
	 * Read a Line String
	 * @param writer writer
	 * @param lineString line string
	 */
	public static writeLineString(writer: StringWriter, lineString: LineString): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writeLineString(lineString);
	}

	/**
	 * Write a Polygon
	 * @param writer writer
	 * @param polygon Polygon
	 */
	public static writePolygon(writer: StringWriter, polygon: Polygon): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writePolygon(polygon);
	}

	/**
	 * Write a Multi Point
	 * @param writer writer
	 * @param multiPoint multi point
	 */
	public static writeMultiPoint(writer: StringWriter, multiPoint: MultiPoint): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writeMultiPoint(multiPoint);
	}

	/**
	 * Write a Multi Line String
	 * @param writer writer
	 * @param multiLineString Multi Line String
	 */
	public static writeMultiLineString(writer: StringWriter, multiLineString: MultiLineString): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writeMultiLineString(multiLineString);
	}

	/**
	 * Write a Multi Polygon
	 * 
	 * @param writer writer
	 * @param multiPolygon Multi Polygon
	 */
	public static writeMultiPolygon(writer: StringWriter, multiPolygon: MultiPolygon): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writeMultiPolygon(multiPolygon);
	}

	/**
	 * Write a Geometry Collection
	 * @param writer writer
	 * @param geometryCollection Geometry Collection
	 */
	public static writeGeometryCollection(writer: StringWriter, geometryCollection: GeometryCollection<Geometry>): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writeGeometryCollection(geometryCollection);
	}

	/**
	 * Write a Circular String
	 * @param writer writer
	 * @param circularString Circular String
	 */
	public static writeCircularString(writer: StringWriter, circularString: CircularString): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writeCircularString(circularString);
	}

	/**
	 * Write a Compound Curve
	 * @param writer writer
	 * @param compoundCurve Compound Curve
	 */
	public static writeCompoundCurve(writer: StringWriter, compoundCurve: CompoundCurve): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writeCompoundCurve(compoundCurve);
	}

	/**
	 * Write a Curve Polygon
	 * @param writer writer
	 * @param curvePolygon Curve Polygon
	 */
	public static writeCurvePolygon(writer: StringWriter, curvePolygon: CurvePolygon<Curve>): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writeCurvePolygon(curvePolygon);
	}

	/**
	 * Write a Polyhedral Surface
	 * @param writer writer
	 * @param polyhedralSurface Polyhedral Surface
	 */
	public static writePolyhedralSurface(writer: StringWriter, polyhedralSurface: PolyhedralSurface): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writePolyhedralSurface(polyhedralSurface);
	}

	/**
	 * Write a TIN
	 * @param writer writer
	 * @param tin TIN
	 */
	public static writeTIN(writer: StringWriter, tin: TIN): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writeTIN(tin);
	}

	/**
	 * Write a Triangle
	 * @param writer writer
	 * @param triangle Triangle
	 */
	public static writeTriangle(writer: StringWriter, triangle: Triangle): void {
		const geometryWriter = new GeometryWriter(writer);
		geometryWriter.writeTriangle(triangle);
	}

	/**
	 * Write the empty set
	 * @param writer
	 */
	private static writeEmpty(writer: StringWriter): void {
		writer.write("EMPTY");
	}

}
