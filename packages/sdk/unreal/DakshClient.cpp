#include "DakshClient.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Json.h"

UDakshClient::UDakshClient()
{
    BaseUrl = TEXT("http://localhost:3000");
}

void UDakshClient::AuthenticateDevice(const FString& TitleId, const FString& DeviceId)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    FString Url = FString::Printf(TEXT("%s/api/titles/%s/players"), *BaseUrl, *TitleId);

    Request->SetURL(Url);
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));

    TSharedPtr<FJsonObject> JsonObj = MakeShareable(new FJsonObject);
    JsonObj->SetStringField(TEXT("deviceId"), DeviceId);
    JsonObj->SetStringField(TEXT("platform"), TEXT("unreal_engine"));

    FString RequestBody;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&RequestBody);
    FJsonSerializer::Serialize(JsonObj.ToSharedRef(), Writer);
    Request->SetContentAsString(RequestBody);

    Request->OnProcessRequestComplete().BindLambda([this, TitleId](FHttpRequestPtr Req, FHttpResponsePtr Res, bool bConnected)
    {
        FDakshPlayerProfile Profile;
        if (bConnected && Res.IsValid() && (Res->GetResponseCode() == 200 || Res->GetResponseCode() == 201))
        {
            TSharedPtr<FJsonObject> JsonResponse;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Res->GetContentAsString());
            if (FJsonSerializer::Deserialize(Reader, JsonResponse) && JsonResponse.IsValid())
            {
                Profile.PlayerId = JsonResponse->GetStringField(TEXT("playerId"));
                Profile.SessionToken = JsonResponse->GetStringField(TEXT("token"));
                Profile.TitleId = TitleId;
                OnAuthComplete.Broadcast(true, Profile);
                return;
            }
        }
        OnAuthComplete.Broadcast(false, Profile);
    });

    Request->ProcessRequest();
}
