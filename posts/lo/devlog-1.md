---
title: 'LO[1]: The purpose'
publish_date: 2022-01-29
tags: [lo]
---

In the previous DevLog I wrote about switching to Scala from TypeScript because
of performance issues. This time I though it would be better to start with
explaining what I am trying to do.

[GitHub Repo](https://github.com/glebbash/LO) |
[Previous Post](./devlog-0)

### 💡 The Idea

The idea is very big. I want to create a programming language (or maybe not only
programming language) that allows you to change any part of it:

- Want a new keyword - go add it to the compiler.
- Want a completely different syntax but same functionality - sure, just plug in
  the new parser.
- You can't use this language because it compiles to binary - no problem, update
  the compiler back-end and emit whatever you want like JVM bytecode or
  transpile to JavaScript or just interpret it.
- Compiler is a native binary so you can not plug it in anywhere? Well there is
  also a solution for that - compile the compiler using a different back-end and
  now you can run it wherever you wish.

Sound very nice. But how can this be implemented?

The answer is ...

### ♻️ Self-hosting compiler

_TLDR_: if you already know what a self-hosting compiler is you can just skip to
[the progress](#the-progress).

Self hosing compiler is a compiler that can compile it's own source code to
produce itself.
[A link to wiki](https://en.wikipedia.org/wiki/Self-hosting_(compilers)).

🤯🤯🤯 Woah. That is some time-travel loops level shit. How in the world is that
possible?

The steps for creating a self hosted compiler are actually super simple:

1. You write a compiler for language `${X}` in language you already have.
2. You improve the language `${X}` until it is powerful just enough.
3. You write a compiler for language `${X}` in language `${X}`.
4. You go to your old compiler and delete it so no one knows it was there in the
   beginning. (This step is of course required if you wan't everyone to be
   confused)

💥💥💥 Done. You have a self-hosting compiler for language `${X}`.

This process is called bootstrapping. And a here is a
[link](https://en.wikipedia.org/wiki/Bootstrapping_(compilers)) for better
explanation.

#### What can you do with it?

Well, lets say you want to add a new feature to the language. You modify the
compiler source, add the feature and you compile the new compiler. If you did
everything correctly the new compiler is still able to compile itself but now it
is also able to use the new feature to do that.

If that does not make any sense then I cannot explain anything properly. So go
on and google it. I promise it is very interesting.

## 🆕 The progress

Now that I explained what I am doing with my life... Let's look at where I am at
right now.

Currently I am done with step 1.

I have a language with lisp-like syntax that operates on low-level constructs
provided by LLVM.

I chose lisp-like syntax because it is the easiest to parse. And I chose LLVM
backend because it does most of the hard work and provides a high level API for
code generation.

I wanted to make the initial version of the language as small a possible
implementing only the parts necessary to produce the self-hosting compiler and I
am planning to change a lot when it will allow me to do so.

### 💪 Features implemented

It is now possible to duplicate
[C program for compiling hello-world](https://github.com/MWGuy/llvm-hello/blob/master/main.cpp)
using LLVM (Even though it technically is written in C++).

The source to can the `hello-world-compiler.lole` be can be found
[here](https://github.com/glebbash/LO/blob/main/examples/hello-world-compiler.lole).

## 🤷‍♂️ How did I do that?

Wow. That's a lot of words. If only it was that easy writing essays in school...

Initially I though about more for this DevLog but it was to big so I decided to
I'll split it in two.

Follow along if you want to know why you should stop writing tests. 🤔

[Next Post](./devlog-2)
