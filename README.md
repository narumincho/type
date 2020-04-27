# @narumincho/type

TypeScript のコード内で定義したスキーマから TypeScript の型定義とバイナリへのエンコーダ,デコーダーを生成する. Maybe や Result やカスタムの直積型,直和型をサポートしている.JavaScript の値のうち バイナリ型以外はJSON の範囲内に収めているので, Elm の port や Web Workers とのメッセージに使える. 型を変えたら完全に互換性が崩れる. Elm の 型定義と, port からきた JSON から Elm の型へのエンコーダ,デコーダーも生成できる

Definy のデータの内部形式としても使う.