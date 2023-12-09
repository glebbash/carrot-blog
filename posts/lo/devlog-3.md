---
title: 'LO[3]: WASM, JIT and a new sub project?!'
publish_date: 2022-07-20
tags: [lo]
---

A long time ago...

... I wrote a previous part of this DevLog thingy.

Last time I said `Hopefully next DevLog will tell about self-hosting compiler`.
Welp that didn't work out.

Instead I was desperately trying to get JIT compilation to work. And then Elden
Ring came out...

After about 3 months I discovered [GitPod](https://gitpod.io/) and
[Github Codespaces](https://github.com/features/codespaces) and decided to give
`LO` another shot.

Also during that time I got really obsessed with WASM (even more then before).
So I decided to switch the compiler backend from LLVM to WASM.

[GitHub Repo](https://github.com/glebbash/LO) |
[Previous Post](./devlog-2)

## 🦇 WASM TIME!!!

P.S. If title of this section seems familiar to you, it's because it is a
reference to the movie of all time - Morbius (and definitely not
[wasmtime](https://wasmtime.dev/)).

So, after about 2 days I had a hello world using WASM target and specifically
[WASI](https://wasi.dev/) using
[binaryen](https://github.com/WebAssembly/binaryen) as a backend. Thanks to
Deno's WASI implementation it makes it super simple. Even though I discovered
that after I already implemented `fd_write` after watching a
[cool video](https://www.youtube.com/watch?v=2qV-1JhxWeE) about that from
TSoding. Btw you should definetely check him out if you are reading this.

I also improved the (macro system/compile time functions) because WASM hello
world without macros looks as simple as this
([reference](https://github.com/bytecodealliance/wasmtime/blob/main/docs/WASI-tutorial.md)):

```clojure
(module
    ;; Import the required fd_write WASI function which will write the given io vectors to stdout
    ;; The function signature for fd_write is:
    ;; (File Descriptor, *iovs, iovs_len, nwritten) -> Returns number of bytes written
    (import "wasi_unstable" "fd_write" (func $fd_write (param i32 i32 i32 i32) (result i32)))

    (memory 1)
    (export "memory" (memory 0))

    ;; Write 'hello world\n' to memory at an offset of 8 bytes
    ;; Note the trailing newline which is required for the text to appear
    (data (i32.const 8) "hello world\n")

    (func $main (export "_start")
        ;; Creating a new io vector within linear memory
        (i32.store (i32.const 0) (i32.const 8))  ;; iov.iov_base - This is a pointer to the start of the 'hello world\n' string
        (i32.store (i32.const 4) (i32.const 12))  ;; iov.iov_len - The length of the 'hello world\n' string

        (call $fd_write
            (i32.const 1) ;; file_descriptor - 1 for stdout
            (i32.const 0) ;; *iovs - The pointer to the iov array, which is stored at memory location 0
            (i32.const 1) ;; iovs_len - We're printing 1 string stored in an iov - so one.
            (i32.const 20) ;; nwritten - A place in memory to store the number of bytes written
        )
        drop ;; Discard the number of bytes written from the top of the stack
    )
)
```

Yeah, and the macroed version looks like this:

```clojure
(#include "./lib/std.lole")

(#def MESSAGE_OFFSET 8)
(#def MESSAGE_LENGTH 13)

(memory
  (MESSAGE_OFFSET "Hello World!\n")
)

(#main
  (i32/store 0 MESSAGE_OFFSET)
  (i32/store 4 MESSAGE_LENGTH)

  (#def iovs_offset 0)
  (#def iovs_length 1)
  (#def nwritten_ptr 24)

  (#print iovs_offset iovs_length nwritten_ptr)
)
```

Better but not quite that good. Apparently WASM doesn't have a builtin `malloc`
and you need to create it yourself. This is where I finally understood how RAM
works, yeah after about 6 years programming, duh.

I tried to search for some already created modules for WASM that implemented
some kind of allocator but without any luck.

I definitely want a WASM target now, but I am too lazy to build everything
myself. I even considered creating a dummy allocator which will be able to only
`malloc` and not `free` by just adding items to the memory and keeping track of
the index. But that wouldn't really work long-term.

And that's where I recalled that LLVM has a WASM target...

## ⚡ JIT

So I switched to LLVM backend branch, to see the my failed attempts at JIT 😢.

This time I was serious, I wanted to get it to work as currently I was depending
on `lli` to run the generated `.ll` files.

All the LLVM-C tutorials used `LLVMInitializeNativeTarget` function, but when I
was trying to call it I wasn't able to find the function symbol.

So I though, maybe, maybe this is because my llvm-14 (it was llvm-13 before the
break) installation was not compiled with correct options. So I opened a new
GitPod instance, I cloned llvm repo, looked for about 4 hours trying to find the
needed options, and started the build.

After about 1.5 hours I had myself a `libLLVM-15git.so` file which was only
54mb. Great! (I only compiled for X86 and WASM targets optimizing for size).

So plugged that in to `Deno.dlopen`. And boom!!!

Nothing. The same problem was still there.

And that's when I decided to try to do the same thing in C. Boom! First try.
It's working. Function (to sum numbers) is compiled and can be executed.

So I googled. I read all the docs on ExecutionEngine and all StackOverflow
threads. I even created a
[minimal reproduction of my problem](https://github.com/glebbash/deno-llvm-jit)
(getting a compiled function reference always returned null) to ask for help in
llvm discord server.

After that I tried to do the same thing but now using dlopen in C. Aaaaand....
It was not finding `LLVMInitializeNativeTarget` again.

So I went to LLVM-C's source to find this fucking thing:

```c
/** LLVMInitializeNativeTarget - The main program should call this function to
    initialize the native target corresponding to the host.  This is useful
    for JIT applications to ensure that the target gets linked in correctly. */
static inline LLVMBool LLVMInitializeNativeTarget(void) {
  /* If we have a native target, initialize it to ensure it is linked in. */
#ifdef LLVM_NATIVE_TARGET
  LLVM_NATIVE_TARGETINFO();
  LLVM_NATIVE_TARGET();
  LLVM_NATIVE_TARGETMC();
  return 0;
#else
  return 1;
#endif
}
```

This fucking this was driving me nuts. Apparently it was an inline function
which contained only macros defined in another file.

They were referring to LLVMInitializeX86Target*, functions (for X86 target). But
I was already calling them in my code.

`LLVMInitializeX86Target` and `LLVMInitializeX86TargetMC`, but I forgot
`LLVMInitializeX86TargetInfo`.

Boom!

A real boom this time. Everything just worked. Function successfully compiled
and I was finally able to calculate the sum of 34 and 35.

## ❓ A new sub-project

After messing with LLVM-C bindings, I accidentally created a sub-project that
might actually become useful (and maybe popular).

Too bad you can't like and subscribe, because the next part will be all about
it, stay tuned.

`TODO: insert patented "see you in the next one" phrase`

[Next Post](./devlog-4)
