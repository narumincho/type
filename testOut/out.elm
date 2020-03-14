module Data exposing (Language(..), ResultType, Type(..), languageJsonDecoder, languageToJsonValue, maybeJsonDecoder, maybeToJsonValue, resultJsonDecoder, resultToJsonValue, resultTypeJsonDecoder, resultTypeToJsonValue, typeJsonDecoder, typeToJsonValue)

import Json.Decode as Jd
import Json.Decode.Pipeline as Jdp
import Json.Encode as Je


{-| 型
-}
type Type
    = Int
    | String
    | Bool
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
            Je.object [ ( "_", Je.string "Ok" ), ( "ok", okToJsonValueFunction value ) ]

        Err value ->
            Je.object [ ( "_", Je.string "Error" ), ( "error", errorToJsonValueFunction value ) ]


{-| TypeのJSONへのエンコーダ
-}
typeToJsonValue : Type -> Je.Value
typeToJsonValue type_ =
    case type_ of
        Int ->
            Je.object [ ( "_", Je.string "Int" ) ]

        String ->
            Je.object [ ( "_", Je.string "String" ) ]

        Bool ->
            Je.object [ ( "_", Je.string "Bool" ) ]

        List parameter ->
            Je.object [ ( "_", Je.string "List" ), ( "type_", typeToJsonValue parameter ) ]

        Maybe parameter ->
            Je.object [ ( "_", Je.string "Maybe" ), ( "type_", typeToJsonValue parameter ) ]

        Result parameter ->
            Je.object [ ( "_", Je.string "Result" ), ( "resultType", resultTypeToJsonValue parameter ) ]

        Id parameter ->
            Je.object [ ( "_", Je.string "Id" ), ( "string_", Je.string parameter ) ]

        Token parameter ->
            Je.object [ ( "_", Je.string "Token" ), ( "string_", Je.string parameter ) ]

        Custom parameter ->
            Je.object [ ( "_", Je.string "Custom" ), ( "string_", Je.string parameter ) ]


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


{-| TypeのJSON Decoder
-}
typeJsonDecoder : Jd.Decoder Type
typeJsonDecoder =
    Jd.field "_" Jd.string
        |> Jd.andThen
            (\tag ->
                case tag of
                    "Int" ->
                        Jd.succeed Int

                    "String" ->
                        Jd.succeed String

                    "Bool" ->
                        Jd.succeed Bool

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

                    _ ->
                        Jd.fail ("Typeで不明なタグを受けたとった tag=" ++ tag)
            )


{-| ResultTypeのJSON Decoder
-}
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


{-| LanguageのJSON Decoder
-}
languageJsonDecoder : Jd.Decoder Language
languageJsonDecoder =
    Jd.string
        |> Jd.andThen
            (\tag ->
                case tag of
                    "TypeScript" ->
                        Jd.succeed TypeScript

                    "JavaScript" ->
                        Jd.succeed JavaScript

                    "Elm" ->
                        Jd.succeed Elm

                    _ ->
                        Jd.fail ("Languageで不明なタグを受けたとった tag=" ++ tag)
            )
