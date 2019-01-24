mcat
Nysol_Mcat

`args2dict`(コンストラクタに入れる前とコンストラクタ内で2回呼ばれているのは重複していないだろうか？)
場所は`mcmd/nysollib/nysolutil.py 68~`

# `nysol._nysolshell_core.getparalist`

`nysol._nysolshell_core`は`src/nysolshell.cpp`内にある
`getparalist`の実態は`getparams`で、
その中で`kgshell.getparams`が呼ばれている
`kgshell.getparams`は`src/kgshell.h`で宣言されている
当然中身は`src/kgshell.cpp`

# `int kgshell::getparams( kgstr_t cmdname, PyObject* list)` `src/kgshell.cpp:1420`

`_kgmod_map`の中から`cmdname`を探してパラメータ情報を返すっぽい
`_kgmod_map`は同じファイルの37行目から131行目までコマンド別に定義されている
`mcat`の場合、`boost::lambda::bind(boost::lambda::new_ptr<kgCat>())`が代入されている

この中の`kgCat`はどこにあるかというと、`src/kgshellfunc.h`で各コマンドのヘッダをまとめている部分かと思われる。
その中に`#include <kgcat.h>`も存在するので、`src/mod/kgcat.h`を見る。（`kg2cat`も存在しているが今は気にしないことにする）

`kgCat`は`boost::lambda::new_ptr<T>`に入れて使われているので、
`kgCat`型のポインタが作られているのだろう。`lambda::bind`はよくわかっていないが、C++11とかで書き直せないんかな。


`vector < vector <kgstr_t> > paralist = mod->params();` `kgshell.cpp:1433`
の`params()`が見つからない。これって`kgCat`のポインタじゃないの？

というわけで`src/kgmod/kgmod.h`と`src/kgmod/kgmod.cpp`を見てみる。
（基盤となるコードは`src/kgmod`にあり、各コマンドのコードは`src/mod`にあるようです）

あった！`vector< vector<string> > params(void);`が`src/kgmod/kgmod.h:172`に。
ただし、実装は`src/kgmod/kgmod.cpp:418`にあったものの、以下だけですね。
```
vector< vector<string> > kgMod::params(void){
	return _args.getparams(_paralist,_paraflg);
}
```
ちなみに`_args`は以下で宣言されている
``` src/kgmod/kgmod.cpp:53
kgArgs       _args;    // 引数
```

kgArgs::getparams()がありますね(272行目)
ただ、実際にmcatのパラメータ定義をどこで与えているのかはわからないままでした。

# nysol_pythonにした方がむしろ遅い問題
53.254sもかかっている
これをじゃあsubprocess.Popenベースに戻してみよう
