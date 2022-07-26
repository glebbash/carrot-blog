import blog from "https://deno.land/x/blog@0.5.0/blog.tsx";

blog({
  title: "Carrot blog 🥕",
  description: "This is not a blog about carrots.",
  favicon:
    "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥕</text></svg>",
  author: "glebbash",
  theme: "light",
  dateStyle: "full",
  style: 'ul { list-style-type: "🥕 "; }',
  links: [
    { title: "GitHub", url: "https://github.com/glebbash" },
    { title: "LinkedIn", url: "https://www.linkedin.com/in/glebbash" },
  ],
});
