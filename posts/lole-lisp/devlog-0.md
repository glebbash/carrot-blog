---
title: 'lole-lisp[0]: New language for initial compiler'
publish_date: 2022-01-03
tags: [lole-lisp]
---

It may be strange to start the DevLog with a decision to switch to the new
language but it is also my first programming related post so I guess it is
better late than never.

## TypeScript POC results

After doing a
[POC containing hello-world emitted to LLVM IR](https://github.com/glebbash/lole-lisp/tree/1369f4323138f71d1eeede19d88f1308d53b6b1e)
from a compiler written in TypeScript/Node.js I noticed that Node.js does not
have a great support for C FFI.

Stuff that I tried:

- using [llvm-bindings](https://www.npmjs.com/package/llvm-bindings) library:
  - GOOD: interface looks nice and feels like working with with C++ library
    directly
  - GOOD: performance is nice: testing hello-world compilation takes less than 2
    seconds
  - BAD: inheritance is not implemented and thus some features are missing:
    getting value type is not possible as ConstValue extends Value and so on.
- using llvm-c API through
  [node-ffi-napi](https://www.npmjs.com/package/ffi-napi) ffi library:
  - GOOD: I am using the same approach as the self-hosted compiler will use thus
    making it easier to port later
  - GOOD: Having more control over what is happening (including specifying llvm
    lib path) and having access to all functions exposed in llvm-c (including
    getting value type)
  - a bit annoying: C API only exposes one type for all values (LLVMValueRef)
    which basically means losing a lot of type safety and need to track value
    attributes (such as function name for example) separately or needing to
    write even more wrappers to get around this
  - BAD: Having to write a bunch of glue code to wrap llvm-c to more usable
    interface
  - BAD: PERFORMANCE: this one was a deal breaker. Testing hello-world
    compilation took 13 seconds minimum, this includes:
    - around 5 seconds of loading libLLVM module (wrappers)
    - 1 second overhead of calling C function 😠, this is not acceptable at all
- using llvm-c API with [sbffi](https://www.npmjs.com/package/sbffi) library
  (alternative to node-ffi-napi): It claims to be faster than ffi-napi (<100ms
  overhead) but does not support most of the functionality of ffi-napi. Even
  more glue code to support strings and array pointers is not something I
  decided to do (even though it may work).

## Dropping Node

So the final decision was:

- not to use Node 😢 when you need C FFI

It does have native plugins feature though. Which is basically writing glue code
in C++. But instead of doing that I could have just used C++ directly 🤦.

So the next decision was to pick a better language/platform for the initial
compiler. Options: Deno, Rust, C++, something from JVM, Python 🤮.

## Deno

I could keep the parser and some of the compiler code and also using TypeScript
is nice but looking at [FFI Docs](https://deno.land/manual@main/runtime/ffi_api)
I immediately rejected this option as it basically has all problems of sbffi
(plus unknown performance).

## C++

C++ would be a good choice probably because it would have native support for
working with llvm, including both C and C++ APIs. But I have never actually
worked with C++ other than doing some assignments in uni. Also I think that
working with generics in C++ is a lot noisier than any other language that I
know. I might consider trying it later if other options won't work.

## JVM language

As I have some experience with Java (around 2 years of doing Android/LibGDX
personal projects) a JVM language could have been an option. Kotlin or Scala
specifically, not Java though as it is too verbose compared to others. There
seems to be up to date
[lvm 13 bindings](https://github.com/bytedeco/javacpp-presets/tree/master/llvm)
which are using llvm-c API.

### Kotlin

Deal breaker for Kotlin: IDE support. JetBrains are apparently too greedy to
make an open-source Kotlin language server so there is only a community version
of that. As I would like to keep my VSCode setup and have decent experience I
decided to skip this option.

### Scala

Scala on the other side seems to have an official
[VSCode extension](https://marketplace.visualstudio.com/items?itemName=scalameta.metals).
It is also one of the few languages with
[HKT support](https://www.baeldung.com/scala/higher-kinded-types#:~:text=What%20Is%20Higher%2DKinded%20Type,a%20wide%20range%20of%20objects)
so it is possible to write a really cool parser implementation using monads.
Hmm, looks like it does not have any obvious downsides (other than lack of
experience using it), could be a good option.

## Python

There seems to be some support for C FFI. But because I kinda hate Python (as a
JS developer) it would only be an option if it had a great C FFI. But reading
the
[ffi docs](https://cffi.readthedocs.io/en/latest/overview.html#main-mode-of-usage).
It looks to be only slightly better than node-fii-napi, so it was a no no for
Python.

## Rust

[FFI](https://doc.rust-lang.org/book/ffi.html) seems to be nice, and there are
even some libraries for using llvm which could be good for quick prototyping. I
tried to something using Rust (including attempts to make a programming
language) and it is a pretty good developing experience (when borrow checker is
in a good mood). Performance is definitely a bonus, but while developing compile
times should also be added - which are not the strongest side of Rust. Also
VSCode extension is nice

## Decision: Rust vs Scala (tldr: it's Scala)

While trying to decide on which language to choose I found
[this thread](https://users.scala-lang.org/t/what-are-some-of-the-advantages-of-using-scala-over-rust-c-and-other-native-languages/2556/13)
which was helpful in making this choice.

So, main downside of Rust is development speed as it forces you to think about
memory safety and type safety in general, which is actually good if you need top
performance and robustness but it is not something I would like to think about
for initial compiler (which will be trashed at some point).

And the main downside of Scala is startup performance (around 2 second no matter
the project size). But there is seems to be a way to fix that by using
[Scala Native](http://scala-native.org/). Not sure about how much of a problem
it is to switch back and forth though.

I really wanted to go with Rust again (I even waited for Rust [dev container]()
to build) but because Scala is new to me (and has less subjective downsides) I
decided to go that route.
