// Collects Mirlow's public numbers from GitHub into one stats.json, which the
// website's /stats page reads. Run by scripts/stats.ps1 (npm run stats). GitHub
// only reports running download totals, so the daily numbers come
// from keeping each day's last total in `history`.
//
//   GITHUB_TOKEN=... node scripts/stats/collect.mjs <previous stats.json> <output>
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const [previousPath, outputPath] = process.argv.slice(2);
const owner = "franciscogfsm";
const name = "mirlow";
const installer = "Mirlow-Setup-x64.exe";
const headers = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
};

async function get(url, init) {
  const response = await fetch(url, { headers, ...init });
  if (!response.ok) throw new Error(`${url}: ${response.status} ${await response.text()}`);
  return response.json();
}

const releases = (await get(`https://api.github.com/repos/${owner}/${name}/releases?per_page=100`))
  .filter((each) => !each.draft)
  .map((each) => ({
    version: each.tag_name,
    published: each.published_at,
    downloads: each.assets.find((asset) => asset.name === installer)?.download_count ?? 0,
  }));

const discussionFields = "title url createdAt upvoteCount isAnswered author { login } comments { totalCount }";
const { data, errors } = await get("https://api.github.com/graphql", {
  method: "POST",
  body: JSON.stringify({
    query: `{
      repository(owner: "${owner}", name: "${name}") {
        stargazerCount
        forkCount
        ideas: discussionCategory(slug: "ideas") { id }
        questions: discussionCategory(slug: "q-a") { id }
        issues(states: OPEN, first: 30, orderBy: { field: CREATED_AT, direction: DESC }) {
          totalCount
          nodes { title url createdAt author { login } comments { totalCount } }
        }
      }
    }`,
  }),
});
if (errors) throw new Error(JSON.stringify(errors));
const repo = data.repository;

async function discussions(categoryId) {
  if (!categoryId) return { total: 0, items: [] };
  const result = await get("https://api.github.com/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: `query($id: ID!) { repository(owner: "${owner}", name: "${name}") {
        discussions(first: 50, categoryId: $id, orderBy: { field: CREATED_AT, direction: DESC }) {
          totalCount nodes { ${discussionFields} }
        }
      } }`,
      variables: { id: categoryId },
    }),
  });
  if (result.errors) throw new Error(JSON.stringify(result.errors));
  const { totalCount, nodes } = result.data.repository.discussions;
  return { total: totalCount, items: nodes.map(item) };
}

const item = (node) => ({
  title: node.title,
  url: node.url,
  created: node.createdAt,
  author: node.author?.login ?? "ghost",
  comments: node.comments.totalCount,
  ...(node.upvoteCount !== undefined && { votes: node.upvoteCount }),
  ...(node.isAnswered !== undefined && { answered: Boolean(node.isAnswered) }),
});

const [ideas, questions] = await Promise.all([discussions(repo.ideas?.id), discussions(repo.questions?.id)]);
ideas.items.sort((a, b) => b.votes - a.votes || b.created.localeCompare(a.created));

const total = releases.reduce((sum, each) => sum + each.downloads, 0);
// Windows PowerShell saves the previous file with a byte-order mark, which JSON.parse rejects.
const read = (path) => JSON.parse(readFileSync(path, "utf8").replace(/^﻿/, ""));
const previous = previousPath && existsSync(previousPath) ? read(previousPath) : {};
const today = new Date().toISOString().slice(0, 10);
// One entry per day, holding that day's latest totals.
const history = (previous.history ?? []).filter((day) => day.date !== today);
history.push({ date: today, downloads: total, stars: repo.stargazerCount });

const stats = {
  updated: new Date().toISOString(),
  stars: repo.stargazerCount,
  forks: repo.forkCount,
  downloads: total,
  releases,
  history,
  ideas,
  questions,
  issues: { total: repo.issues.totalCount, items: repo.issues.nodes.map(item) },
};
writeFileSync(outputPath, JSON.stringify(stats, null, 2));
console.log(`${total} downloads, ${repo.stargazerCount} stars, ${ideas.total} ideas, ${questions.total} questions`);
