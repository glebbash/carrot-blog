// @ts-check
import path from "node:path";
import fs from "node:fs/promises";
import express from "express";
import frontmatter from "frontmatter";
import { marked } from "marked";

await main();

async function main() {
  const app = express();

  app.get("/", async (req, res) => {
    const posts = await loadPosts();

    const tag = req.query["tag"];
    const filteredPosts =
      tag === undefined
        ? posts
        : posts.filter((p) => p.data?.["tags"]?.includes(tag));

    const html = renderIndex(filteredPosts);

    return res.send(html);
  });

  app.use(async (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const posts = await loadPosts();
    const post = posts.find((p) => p.path === req.path);
    if (post === undefined) {
      return next();
    }

    return res.send(post.html);
  });

  // raw `.md` files and images
  app.use("/", await serveStatic("./posts"));

  const port = 3000;
  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}

async function loadPosts() {
  const posts = [];
  for await (const postPath of listMarkdownFiles("./posts")) {
    const dir = path.dirname(postPath);
    const source = await fs.readFile(postPath, "utf8");
    const { data, content } = frontmatter(source);
    const pageContent = marked.parse(content);

    posts.push({
      fsPath: postPath,
      path: "/" + dir.slice("posts/".length) + "/" + path.parse(postPath).name,
      data: /** @type {object} */ (data),
      html: renderPost({ data, pageContent }),
    });
  }

  posts.sort((a, b) => {
    const dateA = new Date(a.data?.["publish_date"] ?? "2022-01-01");
    const dateB = new Date(b.data?.["publish_date"] ?? "2022-01-01");
    return dateA > dateB ? 1 : dateB > dateA ? -1 : 0;
  });
  posts.reverse();

  return posts;
}

function renderIndex(filteredPosts) {
  return renderPage({
    title: "Carrot Blog",
    content: `
      <header>
        <h1>🥕 Carrot Blog</h1>
        <p><code>by <a href="https://github.com/glebbash">@glebbash</a></code></p>
      </header>
      <article class="page-content">
        ${filteredPosts
          .map(
            (p) => `
              <article>
                <h3><a href="${p.path}">${p.data.title}</a></h3>
                <p>${renderPostInfoShort(p.data)}</p>
                <h2></h2>
              </article>
            `
          )
          .join("\n")}
      </article>
    `,
  });

  function renderPostInfoShort(data) {
    const date = (
      data.publish_date?.toISOString?.() ?? "2022-01-01T00:00:00.000Z"
    ).split("T")[0];

    const tags = (data.tags ?? [])
      .map((t) => `<a href="/?tag=${t}">#${t}</a>`)
      .join(" ");

    return `<code>${date} ${tags}</code>`;
  }
}

function renderPost({ data, pageContent }) {
  const title = data?.["title"];
  return renderPage({
    title,
    content: `
      <header>
        <h1>${title}</h1>
        <p>${renderPostInfo(data)}</p>
      </header>
      <article class="page-content">
        ${pageContent}
        <script src="https://giscus.app/client.js"
          data-repo="glebbash/carrot-blog"
          data-repo-id="R_kgDOHtC2Rg"
          data-category="General"
          data-category-id="DIC_kwDOHtC2Rs4Ciydu"
          data-mapping="pathname"
          data-strict="0"
          data-reactions-enabled="1"
          data-emit-metadata="0"
          data-input-position="bottom"
          data-theme="dark"
          data-lang="en"
          crossorigin="anonymous"
          async>
        </script>
      </article>
    `,
  });

  function renderPostInfo(data) {
    const date = (
      data.publish_date?.toISOString?.() ?? "2022-01-01T00:00:00.000Z"
    ).split("T")[0];

    const tags = (data.tags ?? [])
      .map((t) => `<a href="/?tag=${t}">#${t}</a>`)
      .join(" ");

    const prevPost = data.prev ?? "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const nextPost = data.next ?? "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    return `
      <code><a href="/">/</a></code>
      <code><a href="${prevPost}">prev</a></code>
      <code><a href="${nextPost}">next</a></code>
      <code>${date} ${tags}</code>
    `;
  }
}

function renderPage({ title, content }) {
  return `
    <!DOCTYPE html>
    <title>${title}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥕</text></svg>" type="image/x-icon">
    <link rel="stylesheet" href="/github-markdown.css">
    <link rel="stylesheet" href="/styles.css">
    <body class="markdown-body" data-color-mode="auto" data-light-theme="light" data-dark-theme="dark">
      <div style="backdrop-filter: blur(10px); flex: 1;">
        ${content}
      </div>
    </body>
  `;
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

async function serveStatic(directory) {
  const mime = await import("mime-types");

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
