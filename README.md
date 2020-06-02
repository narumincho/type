# @narumincho/type

TypeScript のコード内で定義したスキーマから TypeScript の型定義とバイナリへのエンコーダ,デコーダーを生成する. Maybe や Result やカスタムの直積型,直和型をサポートしている. 型パラメーターもうまく扱える. JavaScript の値のうち, [構造化複製アルゴリズム](https://developer.mozilla.org/ja/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) の範囲内に収めているので, Web Workers のメッセージやindexedDでに使える. スキーマを変えたら完全に互換性が崩れる.

Definy のデータの内部形式としても使う.

今後はDefinyの型パーツ定義からTypeScriptの型とバイナリへのエンコーダ,デコーダを生成できるようにし, Definyのコンパイラと統合していく