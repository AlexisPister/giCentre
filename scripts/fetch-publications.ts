// Scrapes the City Research Online publications search into
// src/publications.json, which the /publications page renders.
//
//   npm run publications                 fetch the live search (all pages)
//   npm run publications -- page.html…   parse saved copies of the results
//
// The repository rate-limits automated searches (HTTP 429), so this is run by
// hand and the JSON is committed, rather than fetched during the site build.
// If you get a 429, open the search in a browser, save each results page, and
// pass the saved files instead.
import { readFile, writeFile } from "node:fs/promises";
import {
    PUBLICATIONS_SEARCH_URL,
    type Publication,
} from "../src/publications.ts";

const OUT = new URL("../src/publications.json", import.meta.url);
const PAGE_DELAY_MS = 2000;

const ENTITIES: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
};

const decode = (s: string) =>
    s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e: string) =>
        e[0] === "#"
            ? String.fromCodePoint(
                  e[1].toLowerCase() === "x"
                      ? parseInt(e.slice(2), 16)
                      : parseInt(e.slice(1), 10),
              )
            : (ENTITIES[e.toLowerCase()] ?? m),
    );

const text = (html: string) =>
    decode(html.replace(/<[^>]*>/g, ""))
        .replace(/\s+/g, " ")
        .trim();

// Every EPrints citation opens with the author list, wrapped in
// <span id="creators_name_<eprint id>_init">. That marker is shared by search
// results and browse pages, so split on it rather than on the surrounding
// table rows / paragraphs.
function parseCitations(html: string): Publication[] {
    const starts = [...html.matchAll(/<span id="creators_name_(\d+)_init">/g)];

    return starts.flatMap((start, i) => {
        const end = starts[i + 1]?.index ?? html.length;
        // A citation never spans a row or paragraph boundary; trimming there
        // keeps page footers out of the last entry.
        const chunk = html
            .slice(start.index, end)
            .split(/<\/(?:td|p|li)>/)[0];

        const titleLink = chunk.match(
            /<a href="(https?:\/\/[^"]*\/id\/eprint\/\d+\/?)">([\s\S]*?)<\/a>/,
        );
        if (!titleLink) return [];
        const afterTitle = chunk.slice(titleLink.index! + titleLink[0].length);

        const year = chunk.slice(0, titleLink.index).match(/\((\d{4})\)/);
        // Journals and books italicise the venue; conference items instead
        // read "Paper presented at the <event>, <dates>, <place>."
        const venue =
            afterTitle.match(/<em>([\s\S]*?)<\/em>/) ??
            text(afterTitle).match(/presented at (?:the )?(.+?),\s/);
        const doi = afterTitle.match(/href="https?:\/\/(?:dx\.)?doi\.org\/([^"]+)"/);

        return [
            {
                id: Number(start[1]),
                title: text(titleLink[2]),
                authors: [
                    ...chunk.matchAll(
                        /<span class="person_name">([\s\S]*?)<\/span>/g,
                    ),
                ].map((m) => text(m[1])),
                year: year ? Number(year[1]) : undefined,
                venue: venue ? text(venue[1]).replace(/\.$/, "") : undefined,
                link: titleLink[1],
                doi: doi ? decode(doi[1]) : undefined,
            },
        ];
    });
}

// Search results are paginated; EPrints renders a plain "Next" link.
const nextPageUrl = (html: string, current: string) => {
    const next = [...html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g)]
        .find((m) => m[2].trim().toLowerCase() === "next");
    return next ? new URL(decode(next[1]), current).href : undefined;
};

async function fetchAll(): Promise<Publication[]> {
    const all: Publication[] = [];
    let url: string | undefined = PUBLICATIONS_SEARCH_URL;

    for (let page = 1; url; page++) {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(
                `${res.status} ${res.statusText} fetching results page ${page}` +
                    (res.status === 429
                        ? " (rate-limited: save the pages from a browser and pass them as arguments instead)"
                        : ""),
            );
        }
        const html = await res.text();
        const found = parseCitations(html);
        console.log(`page ${page}: ${found.length} publications`);
        all.push(...found);

        url = nextPageUrl(html, url);
        if (url) await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
    }
    return all;
}

async function main() {
    const files = process.argv.slice(2);
    const found = files.length
        ? (await Promise.all(files.map((f) => readFile(f, "utf8")))).flatMap(
              parseCitations,
          )
        : await fetchAll();

    // Pages overlap and co-authored items can repeat; keep the first copy.
    const seen = new Set<number>();
    const publications = found.filter(
        (p) => !seen.has(p.id) && seen.add(p.id),
    );

    if (publications.length === 0) {
        throw new Error(
            "No publications found — the results markup may have changed; publications.json left untouched.",
        );
    }

    publications.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    await writeFile(OUT, JSON.stringify(publications, null, 2) + "\n");
    console.log(`wrote ${publications.length} publications to ${OUT.pathname}`);
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
