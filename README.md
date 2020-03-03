# @narumincho/type

TypeScript のコード内で定義したスキーマから TypeScript の型定義とバイナリへのエンコーダ,デコーダーを生成する. Maybe や Result やカスタムの直積型,直和型をサポートしている. JavaScript の値のうち JSON の範囲内に収めているので, Elm の port や Web Workers とのメッセージに使える. 型を変えたら完全に互換性が崩れる. Definy のデータの内部形式としても使う

今後は Elm の 型定義と, port からきた JSON から Elm の型へのエンコーダ,デコーダーを生成するようにする
