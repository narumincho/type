module Data exposing (Language(..), ResultType, Type(..))

import Json.Decode as Jd
import Json.Decode.Pipeline as Jdp
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


maybeToJsonValue : (a -> Je.Value) -> Maybe a -> Je.Value
maybeToJsonValue toJsonValueFunction maybe =
    case maybe of
        Just value ->
            Je.object [ ( "_", Je.string "Just" ), ( "value", toJsonValueFunction value ) ]

        Nothing ->
            Je.object [ ( "_", Je.string "Nothing" ) ]


resultToJsonValue : (ok -> Je.Value) -> (error -> Je.Value) -> Result error ok -> Je.Value
resultToJsonValue okToJsonValueFunction errorToJsonValueFunction result =
    case result of
        Ok value ->
            Je.object [ ( "_", Je.string "Ok" ), ( "ok", okToJsonValueFunction result ) ]

        Err value ->
            Je.object [ ( "_", Je.string "Error" ), ( "error", errorToJsonValueFunction result ) ]


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


maybeJsonDecoder : Jd.Decoder a -> Jd.Decoder (Maybe a)
maybeJsonDecoder decoder =
    Jd.field "_" Jd.string
        |> Jd.andThen
            (\tag ->
                case tag of
                    "Just" ->
                        Jd.field "value" decoder |> Jd.map Just

                    "Nothing" ->
                        Jd.succeed Nothing

                    _ ->
                        Jd.fail "maybeのtagの指定が間違っていた"
            )


resultJsonDecoder : Jd.Decoder ok -> Jd.Decoder error -> Jd.Decoder (Result error ok)
resultJsonDecoder okDecoder errorDecoder =
    Jd.field "_" Jd.string
        |> Jd.andThen
            (\tag ->
                case tag of
                    "Ok" ->
                        Jd.field "ok" okDecoder |> Jd.map Ok

                    "Error" ->
                        Jd.field "error" errorDecoder |> Jd.map Err

                    _ ->
                        Jd.fail "resultのtagの指定が間違っていた"
            )


userIdJsonDecoder : Jd.Decoder UserId
userIdJsonDecoder =
    Jd.map UserId Jd.string


fileTokenJsonDecoder : Jd.Decoder FileToken
fileTokenJsonDecoder =
    Jd.map FileToken Jd.string


typeJsonDecoder : Jd.Decoder Type
typeJsonDecoder =
    Jd.field "_" Jd.string
        |> Jd.andThen
            (\tag ->
                case tag of
                    "UInt32" ->
                        Jd.succeed UInt32

                    "String" ->
                        Jd.succeed String

                    "Bool" ->
                        Jd.succeed Bool

                    "DateTime" ->
                        Jd.succeed DateTime

                    "List" ->
                        Jd.field "type_" typeJsonDecoder |> Jd.map List

                    "Maybe" ->
                        Jd.field "type_" typeJsonDecoder |> Jd.map Maybe

                    "Result" ->
                        Jd.field "resultType" resultTypeJsonDecoder |> Jd.map Result

                    "Id" ->
                        Jd.field "string_" Jd.string |> Jd.map Id

                    "Token" ->
                        Jd.field "string_" Jd.string |> Jd.map Token

                    "Custom" ->
                        Jd.field "string_" Jd.string |> Jd.map Custom
            )


resultTypeJsonDecoder : Jd.Decoder ResultType
resultTypeJsonDecoder =
    Jd.succeed
        (\ok error ->
            { ok = ok
            , error = error
            }
        )
        |> Jdp.required "ok" typeJsonDecoder
        |> Jdp.required "error" typeJsonDecoder


languageJsonDecoder : Jd.Decoder Language
languageJsonDecoder =
    Jd.field "_" Jd.string
        |> Jd.andThen
            (\tag ->
                case tag of
                    "TypeScript" ->
                        Jd.succeed TypeScript

                    "JavaScript" ->
                        Jd.succeed JavaScript

                    "Elm" ->
                        Jd.succeed Elm
            )
