import { convertToDot, embedDotComment, embedSvgComment, trailingPngComment, parseEmbeddedComment } from "./layout.js";

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

function fileExtension(path) {
	const result = path.match(/\.\w+$/)[0];
	switch (result) {
		case ".svg":
		case ".dot":
		case ".png":
		case ".yaml":
			return result;
		default:
			throw new Error(`invalid file path: ${path}; only support .svg, .dot, .png, and .yaml`);
	}
}

const [inputFile, outputFile] = args;

let newInput;

switch (fileExtension(inputFile)) {
	case ".yaml":
		newInput = await fs.readFile(inputFile, "utf8");
		break;
	case ".dot":
	case ".svg":
	case ".png": {
		const fileContents = await fs.readFile(inputFile, "latin1");
		newInput = parseEmbeddedComment(fileContents);
		if (newInput === undefined) {
			console.error(`${inputFile} is not a compatible deciduous image.`)
			process.exit(1);
		}
		break;
	}
}

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

switch (fileExtension(outputFile)) {
	case ".yaml": {
		await fs.writeFile(outputFile, newInput);
		break;
	}
	case ".dot": {
		const branded = embedDotComment(dot, newInput);
		await fs.writeFile(outputFile, branded, "utf-8");
		break;
	}
	case ".svg": {
		const svg = (await graphviz).layout(dot, "svg", "dot");
		const branded = embedSvgComment(svg, newInput);
		await fs.writeFile(outputFile, branded, "utf-8");
		break;
	}
	case ".png": {
		const svg = (await graphviz).layout(dot, "svg", "dot");
		const png = await svgtoimgAsync(svg);
		const branded = Buffer.concat([png, Buffer.from(trailingPngComment(newInput))]);
		await fs.writeFile(outputFile, branded);
		break;
	}
}
