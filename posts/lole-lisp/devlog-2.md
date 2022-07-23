---
title: 'lole-lisp[2]: Time to stop writing tests'
publish_date: 2022-02-05
---

In the previous DevLog I guess I explained what I am trying to and what I had
done. Now let's see how I did that.

In the first DevLog I wrote about switching to Scala from TypeScript because of
performance issues. Let's see how it went.

## 👍 The Good

First of all, working with Scala is great. It has a nice language server, nice
syntax (Scala 3) and a lot of features that I was missing in TypeScript.

I implemented
[the parser](https://github.com/glebbash/lole-lisp/blob/refactor-scala/src/main/scala/Parser.scala)
in 50 lines of code. Using the
[cats-parse](https://github.com/typelevel/cats-parse) library.

A bit of struggle was writing the tests with JUnit. It is not that powerful as
Jest for example but the structure was always a one to one match.

## 👎 The Bad

Everything was going great and I even improved the parser to emit positions of
expressions and I wrote a good bunch of tests. And then came the part when I
needed to start to use LLVM to generate something from the parsed expressions.

Before choosing JVM based language I looked at the support for working with LLVM
and the best there is is
[org.bytedeco.llvm-platform](https://github.com/bytedeco/javacpp-presets/tree/master/llvm).

There are bindings to latest version of LLVM (13). And performance of the calls
should be Good because of Java's support for JNI.

So I went to Maven repository to copy paste a link to include the library and
... oh. Where is the llvm-13 version? The latest published is 12.

After half an hour trying to find it in docs and messing with the source options
on Maven site I found out that it was deployed to Nexus. Not a big deal I'll
just need to tell Scala to look for it in Nexus Repository and specify the
latest version...

After another half an hour I managed to find how to do that and I hit reload
dependencies. AND.......................................................

And literally nothing. After 45 minutes spinning trying to download the package
it was still going.

I even downloaded the jar manually (100MB+). But then I asked myself: Is it
worth it? Having 100mb jar file in git repository is not nice. And there seems
to be no way to just link the llvm-platform jar to already installed LLVM
binaries.

So I decided to drop Scala and look for something else. My options were C++ or
Rust.

I wanted to go with Rust first and then had some thoughts about C++. BUT.

I already have a working parser and compiler written in TypeScript (Node.js)
with only problem being slow calls to LLVM (around 5-10 seconds for simple
workflows).

### 🔙 Going back

If the only purpose of the first implementation is to just bootstrap
self-hosting compiler as soon as possible and then I could drop it and use fast
compiler (compiled using LLVM) than screw it, let's go back to TypeScript.

## 🥸 The Ugly

(Was trying to find a good 'ugly' emoji but that's the best I've got)

Now that I remember that I will be dropping the initial compiler. I can now care
a lot less about testing and adding quality of life features (like token
positions for better error messages).

And also I won't be adding TODOs for improvements.

This style of programming should be acceptable if the only purpose is going
fast.

I wonder if Ruby has good llvm bindings...

## ⏩ Status And Going Forward

So know when I have a compiler for language that can compile hello world. The
only thing I need to do is add enough features to make it able to parse its own
syntax. Add compiler from expressions to LLVM. And I'll have a working
self-hosting compiler.

Hopefully next DevLog will tell about self-hosting compiler for `lole-lisp` and
maybe explain the name of the language 😏.

`TODO: insert patented "see you in the next one" phrase`
