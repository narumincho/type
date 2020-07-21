# DEPRECATED 非推奨

@narumincho/type は [definy-core](https://github.com/narumincho/definy-core)に統合されました

現在 js-ts-code-generator の devDependencies として依存しています. 今後は [js-ts-code-generator](https://github.com/narumincho/js-ts-code-generator) も [definy-core](https://github.com/narumincho/definy-core) を使うようにする

## @narumincho/type

TypeScript のコード内で定義したスキーマから TypeScript の型定義とバイナリへのエンコーダ,デコーダーを生成する. Maybe や Result やカスタムの直積型,直和型をサポートしている. 型パラメーターもうまく扱える. JavaScript の値のうち, [構造化複製アルゴリズム](https://developer.mozilla.org/ja/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) の範囲内に収めているので, Web Workers のメッセージや indexedD でに使える. スキーマを変えたら完全に互換性が崩れる.

Definy のデータの内部形式としても使う.

今後は Definy の型パーツ定義から TypeScript の型とバイナリへのエンコーダ,デコーダを生成できるようにし, Definy のコンパイラと統合していく
