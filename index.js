// @ts-check
import path from "node:path";
import fs from "node:fs/promises";
import express from "express";
import frontmatter from "frontmatter";
import { marked } from "marked";
import mime from "mime-types";
import process from "node:process";

await main();

async function main() {
  const posts = [];
  for await (const postPath of listMarkdownFiles("./posts")) {
    const dir = path.dirname(postPath);
    const { data, html } = await loadPost(postPath);

    posts.push({
      fsPath: postPath,
      path: "/" + dir.slice("posts/".length) + "/" + path.parse(postPath).name,
      data,
      html,
    });
  }

  posts.sort((a, b) => {
    const dateA = new Date(a.data?.["publish_date"] ?? "2022-01-01");
    const dateB = new Date(b.data?.["publish_date"] ?? "2022-01-01");
    return dateA > dateB ? 1 : dateB > dateA ? -1 : 0;
  });
  posts.reverse();

  const app = express();

  app.get("/", (req, res) => {
    const tag = req.query["tag"];
    const filteredPosts =
      tag === undefined
        ? posts
        : posts.filter((p) => p.data?.["tags"]?.includes(tag));

    const renderPostLink = (p) => `
      <article>
        <h3><a href="${p.path}">${p.data.title}</a></h3>
        ${renderPostInfo(p.data)}
        <h2></h2>
      </article>
    `;

    const html = renderPage({
      title: "Carrot Blog",
      content: `
        <article>
          <h1>🥕 Carrot Blog</h1>
          <p><code>by <a href="https://github.com/glebbash">@glebbash</a></code></p>
          ${filteredPosts.map(renderPostLink).join("\n")}
        </article>
      `,
    });

    return res.send(html);
  });

  if (process.env.DEV) {
    for (const post of posts) {
      app.get(post.path, async (_req, res) => {
        const { html } = await loadPost(post.fsPath);
        res.send(html);
      });
    }
  } else {
    for (const post of posts) {
      app.get(post.path, (_req, res) => res.send(post.html));
    }
  }

  // raw `.md` files and images
  app.use("/", serveStaticFiles("./posts"));

  const port = 3000;
  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}

function renderPage({ title, content }) {
  return `
    <title>${title}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥕</text></svg>" type="image/x-icon">
    <link rel="stylesheet" href="/github-markdown.css">
    <link rel="stylesheet" href="/styles.css">
    <body class="markdown-body" data-color-mode="auto" data-light-theme="light" data-dark-theme="dark">
      ${content}
    </body>
  `;
}

function renderPostInfo(data) {
  const date = (
    data.publish_date?.toISOString?.() ?? "2022-01-01T00:00:00.000Z"
  ).split("T")[0];

  const tags = (data.tags ?? [])
    .map((t) => `<a href="/?tag=${t}">#${t}</a>`)
    .join(" ");

  return `<p><code>${date} ${tags}</code></p>`;
}

async function loadPost(postPath) {
  const source = await fs.readFile(postPath, "utf8");
  const { data, content } = frontmatter(source);
  const pageContent = marked.parse(content);
  const title = data?.["title"];
  const html = renderPage({
    title,
    content: `
      <article>
        <h1><a href="/">/</a> ${title}</h1>
        ${renderPostInfo(data)}
        ${pageContent}
      </article>
    `,
  });

  return { data, html };
}

async function* listMarkdownFiles(dirPath) {
  const files = await fs.readdir(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      yield* listMarkdownFiles(filePath);
    } else if (path.extname(file) === ".md") {
      yield filePath;
    }
  }
}

function serveStaticFiles(directory) {
  return async (req, res, next) => {
    const filePath = path.join(directory, req.url);
    try {
      const data = await fs.readFile(filePath);
      const contentType = mime.lookup(filePath) || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.end(data);
    } catch (err) {
      // File not found or error reading the file
      next();
    }
  };
}
