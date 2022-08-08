---
title: 'lole-lisp[4]: Deno, LLVM-C, ffigen'
publish_date: 2022-08-08
tags: [lole-lisp, deno, deno-ffigen]
---

Last time I forgot to mention that I switched from Node to Deno. Well, it was
great!

[GitHub Repo](https://github.com/glebbash/lole-lisp) |
[Previous Post](./devlog-3)

## 💪 Deno

Switching from Node to Deno is a very pleasant experience (I know, I did it like
3 times on different projects).

First of all, forget all of the configuration files - no more `eslintrc`, no
more `prettierrc`, no more `jest.config.ts`, no more `package.json` and
`package-lock.json`, no more `tsconfig.json`, you get the gist.

Pretty much everything you would expect from a modern programming language is
here: static type system thanks for out-of-the-box TypeScript support, built-in
formatting, linting, doc generator, test runner, you name it.

It even has an actual [standard library](https://deno.land/std).

Damn, it even let's you deploy your code as cloud functions using [Deno Deploy]
for _FREE_! [This exact blog] is even hosted like this.

But there is a catch. There must always be a fucking catch or otherwise life
would be pointless.

### 🤮 Node compatibility

Compatibility with any NPM package that is not
[is-even](https://www.npmjs.com/package/is-even) is, well... odd 🤣🤣🤣.

You can try to import the needed module from `esm.sh` or you might even try to
use [Node.js compat mode], and it might work. BUT.

But everytime I tried to use something, it would just break with some random
error on runtime or when importing modules. Heck there was even this weird thing
when it worked fine locally but then failed with a cryptic error in Deno Deploy.

So, if you wanted to switch from Node to Deno for a big production project -
don't. Some time must pass until we have popular library support for Deno, and
browsers in general (probably will involve something WASM related).

But even though it is not suitable yet for big projects, or when you need to use
Node specific libraries, it is _PERFECT_ for hobby projects, scripting, clis and
simple cloud functions. Which is where this project fits exactly.

## ♻️ LLVM-C

So given that you need to pretty much write everything from scratch when using
Deno (at least for now) and Node doesn't have good enough LLVM bindings, see
[devlog#0](https://carrot-blog.deno.dev/lole-lisp/devlog-0#typescript-poc-results),
the main thing I need to do use LLVM as a backend is to have actual bindings for
it.

Rewriting my subset of LLVM-C bindings from Node to Deno was relatively
painless. Which was pretty much the only place where more code was added, pretty
much in other places I was just reducing code size due to Deno's great APIs.

But I already saw how easy it is to use them without neededing to add function
definitions manually (directly from C). And I wanted to cheat a bit by
generating them directly from headers.

Googling for bindings generation for Deno or even Node didn't yield useful
results, which is great because now I can do it myself.

## 💡 deno-ffigen

And this is where previous devlog ended. A new sub-project - deno-ffigen.

As I always overengineer and try to solve the problem for a general case and not
for specific needs, it was actually pretty easy.

After a few iterations and testing bindings generation on LLVM-C, sqlite3 and
Lua, the resulting tool is ready for testing by not just myself. For example:
adding support for Lua bindings generation involved changing about 3 lines of
code.

So here is an imaginary QA section with someone that would like to try it out
(my schizophrenia is really kicking in):

---

> Q. What is deno-ffigen?

A. This is a tool to generate typesafe bindings from C libraries to Deno.

---

> Q. What is required to make it work at the current stage?

A. Linux, docker, deno. Shared library file and a header file for the library.

---

> Q. Will the generated bindings work on OS X or Windows?

A. Theoretically, they should work if library exposed the same symbols for all
targets. But as was tested with sqlite3, it doesn't work on OS X yet, but it
should be just a matter of getting the correct exposed symbols list.

---

> Q. How does it work?

A. It is actually pretty simple.

Generation is divided into 3 steps:

- Extracting library symbols from header file.

  The process involves running a docker image which is a wrapper on top of
  [c2ffi](https://github.com/rpav/c2ffi), because I don't want to build and
  install it everytime;

- Extracting exposed symbols from shared lib (using readelf for now);
- Using outputs from previous steps the actual bindings generation logic takes
  place. deno-ffigen exposes a set of functions (an API) which can be used from
  your own build script to output typescript sources for the bindings.

---

> Q. So you need a build script to generate bindings. Why not just have a cli?

A. This is actually a very interesting topic.

I actually started with a CLI, and I even have one.

It allows you to generate bindings with decent configuration, but apparently
there is a lot that might need to be tweeked from case to case.

And when you have a lot of configurations for the tool it becomes really hard to
fit it all into CLI arguments and options. So normally everyone uses some kind
of configuration files or even build languages.

But because Deno is so great, you actually do not need a configuration file,
heck, you don't even need the CLI itself. You just expose the needed API for
your tool, and all of the configuration now becomes simple function arguments.
On top of it you get typesafety for configuration and easy to write (and read)
documentation.

I am naming this approach "Code as CLI and configuration" and I do not care if
the name is bad or if it already had a name.

I think this approach is really great and I would love to see it being used
more. I am not the only one doing this kind of thing btw, you can check out
[dnt](https://github.com/denoland/dnt), which is the source of inspiration for
this.

---

> Q. Do you actually have schizophrenia?

A. No. Yes. No.

---

I wanted to make it into a separate DevLog about `deno-ffigen`, but right now I
think it fits here nicely.

Apart from this great invention there is currently no progress on lole-lisp as I
was busy extracting deno-ffigen out of it and unhardcoding a lot of LLVM-C
related stuff to make it work for sqlite3 and in general.

Will see you in the next one 👋, fuck off.

`TODO: insert patented "see you in the next one" phrase`

[Next Post](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

[Deno Deploy]: https://deno.com/deploy
[This exact blog]: https://github.com/glebbash/carrot-blog
[Node.js compat mode]: https://deno.land/manual@v1.17.0/npm_nodejs/compatibility_mode
