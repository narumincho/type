module Data exposing (Data, Data(..))

import Set
import Map

{-| 型 -}
type Type
  = UInt32
  | String
  | Bool
  | DateTime
  | List Type
  | Maybe Type
  | Result ResultType
  | Id String
  | Token String
  | Custom String


{-| 正常値と異常値 -}
type alias ResultType= { ok: Type, error: Type }