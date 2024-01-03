import { convertToDot, embedDotComment, embedSvgComment, trailingPngComment } from "./layout.js";

import { load } from "js-yaml";
import { promises as fs } from "node:fs";
import { Buffer } from "node:buffer";
import { Graphviz } from "@hpcc-js/wasm";
import svg2img from "svg2img";

const args = process.argv.slice(2);

if (args.length != 2) {
	console.log("usage: deciduous input.yaml output.svg\n   or: deciduous input.yaml output.dot");
	process.exit(1);
}

const graphviz = Graphviz.load();

const [inputFile, outputFile] = args;

const newInput = await fs.readFile(args[0], "utf8");
const parsed = load(newInput);
const { dot } = convertToDot(parsed);

function svgtoimgAsync(args) {
	return new Promise((resolve, reject) => {
		svg2img(args, function(err, buffer) {
			if (err != null) {
				reject(err);
			} else {
				resolve(buffer);
			}
		});
	});
}

switch (outputFile.match(/\.\w+$/)[0]) {
	case ".svg": {
		const svg = (await graphviz).layout(dot, "svg", "dot");
		const branded = embedSvgComment(svg, newInput);
		await fs.writeFile(outputFile, branded, "utf-8");
		break;
	}
	case ".dot": {
		const branded = embedDotComment(dot, newInput);
		await fs.writeFile(outputFile, branded, "utf-8");
		break;
	}
	case ".png": {
		const svg = (await graphviz).layout(dot, "svg", "dot");
		const png = await svgtoimgAsync(svg);
		const branded = Buffer.concat([png, Buffer.from(trailingPngComment(newInput))]);
		await fs.writeFile(outputFile, png);
		break;
	}
	default: {
		console.log("invalid output filename: " + outputFile);
		break;
	}
}
