module Data exposing (Language(..), ResultType, Type(..))

import Json.Decode as Jd
import Json.Encode as Je
import Map
import Set


{-| 型
-}
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


{-| 正常値と異常値
-}
type alias ResultType =
    { ok : Type, error : Type }


{-| プログラミング言語
-}
type Language
    = TypeScript
    | JavaScript
    | Elm


type UserId
    = UserId String


type FileToken
    = FileToken String


userIdToJsonValue : UserId -> Je.Value
userIdToJsonValue (UserId string) =
    Je.string string


fileTokenToJsonValue : FileToken -> Je.Value
fileTokenToJsonValue (FileToken string) =
    Je.string string


{-| TypeのJSONへのエンコーダ
-}
typeToJsonValue : Type -> Je.Value
typeToJsonValue type_ =
    case type_ of
        UInt32 ->
            Je.object [ ( "_", Je.string "UInt32" ) ]

        String ->
            Je.object [ ( "_", Je.string "String" ) ]

        Bool ->
            Je.object [ ( "_", Je.string "Bool" ) ]

        DateTime ->
            Je.object [ ( "_", Je.string "DateTime" ) ]

        List ->
            Je.object [ ( "_", Je.string "List" ), ( "type_", typeToJsonValue type_.type_ ) ]

        Maybe ->
            Je.object [ ( "_", Je.string "Maybe" ), ( "type_", typeToJsonValue type_.type_ ) ]

        Result ->
            Je.object [ ( "_", Je.string "Result" ), ( "resultType", resultTypeToJsonValue type_.resultType ) ]

        Id ->
            Je.object [ ( "_", Je.string "Id" ), ( "string_", Je.string type_.string_ ) ]

        Token ->
            Je.object [ ( "_", Je.string "Token" ), ( "string_", Je.string type_.string_ ) ]

        Custom ->
            Je.object [ ( "_", Je.string "Custom" ), ( "string_", Je.string type_.string_ ) ]


{-| ResultTypeのJSONへのエンコーダ
-}
resultTypeToJsonValue : ResultType -> Je.Value
resultTypeToJsonValue resultType =
    Je.object
        [ ( "ok", typeToJsonValue resultType.ok )
        , ( "error", typeToJsonValue resultType.error )
        ]


{-| LanguageのJSONへのエンコーダ
-}
languageToJsonValue : Language -> Je.Value
languageToJsonValue language =
    case language of
        TypeScript ->
            Je.string "TypeScript"

        JavaScript ->
            Je.string "JavaScript"

        Elm ->
            Je.string "Elm"
