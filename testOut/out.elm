module Data exposing (AccessToken(..), ClientMode(..), Language(..), Location(..), ProjectId(..), ResultType, Type(..), UrlData, UserId(..), accessTokenJsonDecoder, accessTokenToJsonValue, clientModeJsonDecoder, clientModeToJsonValue, languageJsonDecoder, languageToJsonValue, locationJsonDecoder, locationToJsonValue, maybeJsonDecoder, maybeToJsonValue, projectIdJsonDecoder, projectIdToJsonValue, resultJsonDecoder, resultToJsonValue, resultTypeJsonDecoder, resultTypeToJsonValue, typeJsonDecoder, typeToJsonValue, urlDataJsonDecoder, urlDataToJsonValue, userIdJsonDecoder, userIdToJsonValue)

import Json.Decode as Jd
import Json.Decode.Pipeline as Jdp
import Json.Encode as Je


{-| 型
-}
type Type
    = TypeInt
    | TypeString
    | TypeBool
    | TypeList Type
    | TypeMaybe Type
    | TypeResult ResultType
    | TypeId String
    | TypeToken String
    | TypeCustom String


{-| 正常値と異常値
-}
type alias ResultType =
    { ok : Type, error : Type }


{-| 英語,日本語,エスペラント語などの言語
-}
type Language
    = LanguageJapanese
    | LanguageEnglish
    | LanguageEsperanto


{-| デバッグモードかどうか,言語とページの場所. URLとして表現されるデータ. Googleなどの検索エンジンの都合( <https://support.google.com/webmasters/answer/182192?hl=ja> )で,URLにページの言語のを入れて,言語ごとに別のURLである必要がある. デバッグ時のホスト名は <http://[::1]> になる
-}
type alias UrlData =
    { clientMode : ClientMode, location : Location, language : Language, accessToken : Maybe AccessToken }


{-| デバッグの状態と, デバッグ時ならアクセスしているポート番号
-}
type ClientMode
    = ClientModeDebugMode Int
    | ClientModeRelease


{-| DefinyWebアプリ内での場所を示すもの. URLから求められる. URLに変換できる
-}
type Location
    = LocationHome
    | LocationUser UserId
    | LocationProject ProjectId


type AccessToken
    = AccessToken String


type UserId
    = UserId String


type ProjectId
    = ProjectId String


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


accessTokenToJsonValue : AccessToken -> Je.Value
accessTokenToJsonValue (AccessToken string) =
    Je.string string


userIdToJsonValue : UserId -> Je.Value
userIdToJsonValue (UserId string) =
    Je.string string


projectIdToJsonValue : ProjectId -> Je.Value
projectIdToJsonValue (ProjectId string) =
    Je.string string


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
        Japanese ->
            Je.string "Japanese"

        English ->
            Je.string "English"

        Esperanto ->
            Je.string "Esperanto"


{-| UrlDataのJSONへのエンコーダ
-}
urlDataToJsonValue : UrlData -> Je.Value
urlDataToJsonValue urlData =
    Je.object
        [ ( "clientMode", clientModeToJsonValue urlData.clientMode )
        , ( "location", locationToJsonValue urlData.location )
        , ( "language", languageToJsonValue urlData.language )
        , ( "accessToken", maybeToJsonValue accessTokenToJsonValue urlData.accessToken )
        ]


{-| ClientModeのJSONへのエンコーダ
-}
clientModeToJsonValue : ClientMode -> Je.Value
clientModeToJsonValue clientMode =
    case clientMode of
        DebugMode parameter ->
            Je.object [ ( "_", Je.string "DebugMode" ), ( "int32", Je.int parameter ) ]

        Release ->
            Je.object [ ( "_", Je.string "Release" ) ]


{-| LocationのJSONへのエンコーダ
-}
locationToJsonValue : Location -> Je.Value
locationToJsonValue location =
    case location of
        Home ->
            Je.object [ ( "_", Je.string "Home" ) ]

        User parameter ->
            Je.object [ ( "_", Je.string "User" ), ( "userId", userIdToJsonValue parameter ) ]

        Project parameter ->
            Je.object [ ( "_", Je.string "Project" ), ( "projectId", projectIdToJsonValue parameter ) ]


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


accessTokenJsonDecoder : Jd.Decoder AccessToken
accessTokenJsonDecoder =
    Jd.map AccessToken Jd.string


userIdJsonDecoder : Jd.Decoder UserId
userIdJsonDecoder =
    Jd.map UserId Jd.string


projectIdJsonDecoder : Jd.Decoder ProjectId
projectIdJsonDecoder =
    Jd.map ProjectId Jd.string


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
                    "Japanese" ->
                        Jd.succeed Japanese

                    "English" ->
                        Jd.succeed English

                    "Esperanto" ->
                        Jd.succeed Esperanto

                    _ ->
                        Jd.fail ("Languageで不明なタグを受けたとった tag=" ++ tag)
            )


{-| UrlDataのJSON Decoder
-}
urlDataJsonDecoder : Jd.Decoder UrlData
urlDataJsonDecoder =
    Jd.succeed
        (\clientMode location language accessToken ->
            { clientMode = clientMode
            , location = location
            , language = language
            , accessToken = accessToken
            }
        )
        |> Jdp.required "clientMode" clientModeJsonDecoder
        |> Jdp.required "location" locationJsonDecoder
        |> Jdp.required "language" languageJsonDecoder
        |> Jdp.required "accessToken" (maybeJsonDecoder accessTokenJsonDecoder)


{-| ClientModeのJSON Decoder
-}
clientModeJsonDecoder : Jd.Decoder ClientMode
clientModeJsonDecoder =
    Jd.field "_" Jd.string
        |> Jd.andThen
            (\tag ->
                case tag of
                    "DebugMode" ->
                        Jd.field "int32" Jd.int |> Jd.map DebugMode

                    "Release" ->
                        Jd.succeed Release

                    _ ->
                        Jd.fail ("ClientModeで不明なタグを受けたとった tag=" ++ tag)
            )


{-| LocationのJSON Decoder
-}
locationJsonDecoder : Jd.Decoder Location
locationJsonDecoder =
    Jd.field "_" Jd.string
        |> Jd.andThen
            (\tag ->
                case tag of
                    "Home" ->
                        Jd.succeed Home

                    "User" ->
                        Jd.field "userId" userIdJsonDecoder |> Jd.map User

                    "Project" ->
                        Jd.field "projectId" projectIdJsonDecoder |> Jd.map Project

                    _ ->
                        Jd.fail ("Locationで不明なタグを受けたとった tag=" ++ tag)
            )
