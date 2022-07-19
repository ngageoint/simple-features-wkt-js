import { Point } from "@ngageoint/simple-features-js";
import {GeometryReader} from "../lib/GeometryReader";
import {GeometryWriter} from "../lib/GeometryWriter";
import WKTTestUtils from "./WKTTestUtils";

describe('README Tests', function () {
	const GEOMETRY = new Point(1.0, 1.0);
	const TEXT = "POINT (1.0 1.0)";

	function testRead(text) {
		// let bytes = ...
		const geometry = GeometryReader.readGeometry(text);
		const geometryType = geometry.geometryType;
		return geometry;
	}

	function testWrite(geometry) {
		// const geometry = ...
		const text = GeometryWriter.writeGeometry(geometry);
		return text;
	}

	it('test read', function () {
		const geometry = testRead(TEXT);
		geometry.equals(GEOMETRY).should.be.true;
	});

	it('test write', function () {
		const text = testWrite(GEOMETRY);
		(text === TEXT).should.be.true;
	});
});