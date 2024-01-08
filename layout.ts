export const themes: { [name: string]: Theme } = {
    "classic": {
        "dark": false,
        "edge": "#2B303A",
        "edge-text": "#DB2955",
        "backwards-edge": "#7692FF",
        "reality-fill": "#2B303A",
        "reality-text": "#FFFFFF",
        "fact-fill": "#C6CCD2",
        "attack-fill": "#ED96AC",
        "mitigation-fill": "#ABD2FA",
        "goal-fill": "#DB2955",
        "goal-text": "#FFFFFF",
    },
    "dark": {
        "dark": true,
        "edge": "#c4c9d4",
        "edge-text": "#c4c9d4",
        "backwards-edge": "#FFFD98",
        "backwards-edge-penwidth": 3,
        "backwards-edge-arrowsize": .5,
        "reality-fill": "#d9d9d9",
        "reality-text": "black",
        "fact-fill": "#707070",
        "fact-text": "white",
        "attack-fill": "#FBCAEF",
        "attack-text": "black",
        "mitigation-fill": "#5BCEFA",
        "mitigation-text": "black",
        "goal-fill": "#ED33B9",
        "goal-text": "white",
        "title": "white",
    },
    "default": {
        "dark": false,
        "edge": "#2B303A",
        "edge-text": "#010065",
        "backwards-edge": "#7692FF",
        "backwards-edge-penwidth": 3,
        "backwards-edge-arrowsize": .5,
        "reality-fill": "#272727",
        "reality-text": "#FFFFFF",
        "fact-fill": "#D2D5DD",
        "attack-fill": "#ff92cc",
        "mitigation-fill": "#B9D6F2",
        "goal-fill": "#5f00c2",
        "goal-text": "#FFFFFF",
    },
    "accessible": {
        "dark": false,
        "edge": "#2B303A",
        "edge-text": "#010065",
        "backwards-edge": "#7692FF",
        "backwards-edge-penwidth": 3,
        "backwards-edge-arrowsize": .5,
        "reality-fill": "#272727",
        "reality-text": "#FFFFFF",
        "fact-fill": "#D2D5DD",
        "attack-fill": "#FF7EC3",
        "mitigation-fill": "#CCCCFF",
        "goal-fill": "#5f00c2",
        "goal-text": "#FFFFFF",
    },
};

function mangleName(name: string) {
    if (/^[A-Za-z]\w*$/.test(name)) {
        return name;
    }
    return JSON.stringify(name);
}

export type Input = {
    theme?: keyof typeof themes | string;
    dark?: boolean;
    title?: string;
    goals?: NodeDeclaration[];
    facts?: NodeDeclaration[];
    attacks?: NodeDeclaration[];
    mitigations?: NodeDeclaration[];
    filter?: string[];
};

export type Node = {
    from: FromDeclaration[];
};

export type NodeDeclaration = Node;

export type FromDeclaration = string | ({
    backwards?: boolean;
    ungrouped?: boolean;
} & { [name: string]: string | null; });

export type ParsedFrom = {
    name: string;
    backwards: boolean;
    ungrouped: boolean;
    implemented: boolean;
    label?: string;
};

type NodeType = "attack" | "mitigation" | "fact" | "goal";

type Theme = {
    "dark"?: boolean;
    "title"?: string;
    "edge"?: string;
    "edge-text": string;
    "backwards-edge": string;
    "backwards-edge-penwidth"?: number;
    "backwards-edge-arrowsize"?: number;
    "reality-fill": string;
    "reality-text": string;
    "fact-fill": string;
    "fact-text"?: string;
    "attack-fill": string;
    "attack-text"?: string;
    "mitigation-fill": string;
    "mitigation-text"?: string;
    "goal-fill": string;
    "goal-text": string;
};

function firstProperty<T>(obj: { [key: string]: T }): [string, T] {
    const entries = Object.entries(obj);
    if (entries.length === 0) {
        throw new Error("expected at least one key in object");
    }
    return entries[0];
}

function parseFrom(raw: FromDeclaration): ParsedFrom {
    if (typeof raw == "object") {
        const [fromName, label] = firstProperty(raw);
        const result: ParsedFrom = {
            name: fromName,
            backwards: typeof raw.backwards === "boolean" ? raw.backwards : false,
            ungrouped: typeof raw.ungrouped === "boolean" ? raw.ungrouped : false,
            implemented: typeof raw.implemented === "boolean" ? raw.implemented : true,
        };
        if (typeof label === "string") {
            result.label = label;
        }
        return result;
    }
    return {
        name: String(raw),
        backwards: false,
        ungrouped: false,
        implemented: true,
    };
}

function wordwrap(text: string, limit: number): string {
    text = String(text);
    if (text.indexOf("\n") != -1) {
        return text;
    }
    const split = text.split(" ");
    let all = [];
    let current: string[] = [];
    let currentLength = 0;
    for (let i = 0; i < split.length; i++) {
        const line = split[i];
        if (currentLength == 0 || (currentLength + line.length < limit && line[0] != "(")) {
            current.push(line);
            currentLength += line.length;
        } else {
            all.push(current.join(" "));
            current = [line];
            currentLength = line.length;
        }
    }
    all.push(current.join(" "));
    return all.join("\n");
}

type GraphvizNodeProperties = { [key: string]: string };

function line(name: string, properties: GraphvizNodeProperties) {
    const entries = Object.entries(properties);
    if (entries.length == 0) {
        return name;
    }
    return name + " [ " + entries.map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(" ") + " ]";
}

export type RenderedOutput = {
    dot: string;
    title: string;
    types: { [key: string]: string };
    themeName: string;
};

export function convertToDot(parsed: Input): RenderedOutput {
    const font = 'Arial'
    const themeName = typeof parsed.theme === "string" && Object.hasOwnProperty.call(themes, parsed.theme) ? parsed.theme : "default";
    const theme = themes[themeName] as Theme;
    const dark = theme.dark ? true : false;

    const propertiesOfReality = { fillcolor: theme["reality-fill"], fontcolor: theme["reality-text"] } as const;
    const header = `// Generated from https://www.deciduous.app/
digraph {
    // base graph styling
    rankdir="TB";
    splines=true;
    overlap=false;
    nodesep="0.2";
    ranksep="0.4";
    label=${JSON.stringify(typeof parsed.title === "string" ? parsed.title : "")};
    labelloc="t";
    bgcolor=${JSON.stringify(dark ? "black" : "white")}
    fontcolor=${JSON.stringify(theme["title"] || "black")}
    fontname=${JSON.stringify(font)};
    node [ shape="plaintext" style="filled, rounded" fontname=${JSON.stringify(font)} margin=0.2 ]
    edge [ fontname=${JSON.stringify(font)} fontsize=12 color="${theme["edge"]}" ]

    // is reality a hologram?
    ${line("reality", { label: "Reality", ...propertiesOfReality })}

`;
    const goals = parsed.goals || [];
    const facts = parsed.facts || [];
    const attacks = parsed.attacks || [];
    const mitigations = parsed.mitigations || [];
    const filter = parsed.filter || [];
    const subgraphs = [];
    const forwards: { [name: string]: string[] } = {};
    const forwardsAll: { [name: string]: string[] } = {};
    const backwards: { [name: string]: string[] } = {};
    const allNodes = [...facts, ...attacks, ...mitigations, ...goals];
    const types: { [name: string]: NodeType } = {};
    for (const node of allNodes) {
        if (typeof node != "object" || node === null) {
            throw new Error(`nodes must each be an object containing at least one property`);
        }
        const [toName] = firstProperty(node);
        const fromNames = backwards[toName] || (backwards[toName] = []);
        if (node.from) {
            for (const from of node.from) {
                const { name, label, backwards, ungrouped } = parseFrom(from);
                if (!backwards && !ungrouped) {
                    const toNames = forwards[name] || (forwards[name] = []);
                    toNames.push(toName);
                    fromNames.push(name);
                }
                const toNames = forwardsAll[name] || (forwardsAll[name] = []);
                toNames.push(toName);
            }
        }
    }

    function anyDominates(forwards: { [name: string]: string[] }, d: string[], n: string) {
        // search to see if any nodes in d dominate n
        // nodes dominate themselves
        const search = [];
        const added: { [key: string]: true } = {};
        for (const other of d) {
            added[other] = true;
            search.push(other);
        }
        let cur: string | undefined;
        while ((cur = search.shift()) !== undefined) {
            if (cur === n) {
                return true;
            }
            const others: string[] | undefined = forwards[cur];
            if (others !== undefined) {
                for (const other of others) {
                    if (!Object.hasOwnProperty.call(added, other)) {
                        added[other] = true;
                        search.push(other);
                    }
                }
            }
        }
        return false;
    }

    function shouldShow(n: string) {
        if (filter.length == 0 || anyDominates(forwardsAll, filter, n)) {
            return true;
        }
        const arrayN = [n];
        return filter.find(other => anyDominates(forwardsAll, arrayN, other));
    }

    function defaultLabelForName(name: string): string {
        return name.replace(/_/g, " ").replace(/^[a-z]/, c => c.toUpperCase());
    }

    function nodes(type: NodeType, values: NodeDeclaration[], properties: GraphvizNodeProperties) {
        const result = [];
        for (const value of values) {
            const [name, label] = firstProperty(value);
            if (Object.hasOwnProperty.call(types, name)) {
                throw new Error(`${name} cannot be declared twice. It was previously declared as ${types[name]}`);
            }
            types[name] = type;
            if (shouldShow(name)) {
                result.push(line(mangleName(name), {
                    label: wordwrap(label === null ? defaultLabelForName(name) : String(label), 18),
                    ...name === "reality" ? propertiesOfReality : properties,
                }));
            }
        }
        return result;
    }

    const allNodeLines = [
        `// facts`,
        ...nodes("fact", facts, {
            fillcolor: theme["fact-fill"],
            fontcolor: theme["fact-text"] || "black",
        }),
        ``,
        `// attacks`,
        ...nodes("attack", attacks, {
            fillcolor: theme["attack-fill"],
            fontcolor: theme["attack-text"] || "black",
        }),
        ``,
        `// mitigations`,
        ...nodes("mitigation", mitigations, {
            fillcolor: theme["mitigation-fill"],
            fontcolor: theme["mitigation-text"] || "black",
        }),
        ``,
        `// goals`,
        ...nodes("goal", goals, {
            fillcolor: theme["goal-fill"],
            fontcolor: theme["goal-text"],
        })
    ];

    function edges(entries: NodeDeclaration[], properties: GraphvizNodeProperties) {
        return entries.reduce((edges, value) => {
            const [name] = firstProperty(value);
            if (!shouldShow(name)) {
                return edges;
            }
            (value.from || []).forEach((from) => {
                const { name: fromName, label, backwards, implemented } = parseFrom(from);
                if (!shouldShow(fromName)) {
                    return;
                }
                const props = {
                    ...properties,
                };
                if (typeof label === "string") {
                    props.xlabel = wordwrap(label, 20);
                    props.fontcolor = theme["edge-text"];
                }
                if (!implemented) {
                    props.style = "dotted";
                }
                if (backwards) {
                    props.style = "dotted";
                    props.color = theme["backwards-edge"];
                    if (typeof theme["backwards-edge-penwidth"] === "string") {
                        props.penwidth = theme["backwards-edge-penwidth"];
                    }
                    if (typeof theme["backwards-edge-arrowsize"] === "string") {
                        props.arrowsize = theme["backwards-edge-arrowsize"];
                    }
                    props.weight = "0";
                }
                edges.push(line(`${mangleName(fromName)} -> ${mangleName(name)}`, props));
            });
            return edges;
        }, [] as string[]);
    }

    const allEdgeLines = [...edges(goals, {}), ...edges(attacks, {}), ...edges(mitigations, {}), ...edges(facts, {})];

    const goalNames = goals.map((goal) => {
        const [goalName] = firstProperty(goal);
        return goalName;
    });

    for (const [fromName, toNames] of Object.entries(forwards)) {
        if (!shouldShow(fromName)) {
            continue;
        }
        const copy = toNames.concat();
        const filteredToNames = [];
        for (let i = 0; i < toNames.length; i++) {
            copy.splice(i, 1);
            if (!anyDominates(forwards, copy, toNames[i]) && goalNames.indexOf(toNames[i]) == -1 && shouldShow(toNames[i])) {
                filteredToNames.push(toNames[i]);
            }
            copy.splice(i, 0, toNames[i]);
        }
        if (filteredToNames.length > 1) {
            subgraphs.push(`    subgraph ${mangleName(fromName)}_order {
        rank=same;
        ${filteredToNames.map(toName => mangleName(toName) + ";").join("\n        ")}
    }
    ${line(filteredToNames.map(mangleName).join(" -> "), { style: "invis" })}`);
        }
    }

    const shownGoals = goalNames.filter(shouldShow);
    if (shownGoals.length > 1) {

        subgraphs.push(`    subgraph goal_order {
        rank=same;
        ${shownGoals.map(goalName => mangleName(goalName) + ";").join("\n        ")}
    }`);
        subgraphs.push("    " + line(shownGoals.join(" -> "), { style: "invis" }));
    }
    subgraphs.push(`    // top-to-bottom layout directives`);
    subgraphs.push(`    { rank=min; reality; }`);

    for (const node of allNodes) {
        const [toName] = firstProperty(node);
        if (shouldShow(toName) && !forwards[toName] && shownGoals.indexOf(toName) === -1) {
            for (const goalName of shownGoals) {
                subgraphs.push("    " + line(mangleName(toName) + " -> " + mangleName(goalName), { style: "invis", weight: "0" }));
            }
        }
    }
    subgraphs.push(`    { rank=max; ${shownGoals.map(goalName => mangleName(goalName) + "; ").join("")}}`);
    const footer = "\n\n}\n";

    return {
        dot: header + "    " + allNodeLines.join("\n    ") + "\n\n    // edges\n    " + allEdgeLines.join("\n    ") + "\n\n    // left-to-right layout directives\n" + subgraphs.join("\n\n") + footer,
        title: typeof parsed.title === "string" ? parsed.title : "",
        types,
        themeName,
    };
}

declare function btoa(text: string): string;

function base64Encode(text: string): string {
    return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode(parseInt(p1, 16))
    }));
}

declare function atob(text: string): string;

function base64Decode(text: string): string {
    return decodeURIComponent(Array.prototype.map.call(atob(text), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
}

export function embedDotComment(dot: string, input: string): string {
    return dot + "// deciduous:" + base64Encode(input);
}

export function embedSvgComment(svg: string, input: string): string {
    return svg + "<!-- deciduous:" + base64Encode(input) + " -->";
}

export function trailingPngComment(input: string): string {
    return "\n// deciduous:" + base64Encode(input);
}

export function parseEmbeddedComment(text: string): string | undefined {
    // extract hidden embedded comment
    const match = text.match(/\n(\/\/|<!--) deciduous:([a-zA-Z0-9]+=*)( -->)?$/);
    if (match) {
        return base64Decode(match[2]);
    }
    return undefined;
}
