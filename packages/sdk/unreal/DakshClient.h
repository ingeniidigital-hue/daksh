#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "DakshClient.generated.h"

USTRUCT(BlueprintType)
struct FDakshPlayerProfile
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly, Category = "Daksh")
    FString PlayerId;

    UPROPERTY(BlueprintReadOnly, Category = "Daksh")
    FString SessionToken;

    UPROPERTY(BlueprintReadOnly, Category = "Daksh")
    FString TitleId;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnDakshAuthComplete, bool, bSuccess, FDakshPlayerProfile, Profile);

UCLASS(BlueprintType, Blueprintable)
class DAKSHSDK_API UDakshClient : public UObject
{
    GENERATED_BODY()

public:
    UDakshClient();

    UFUNCTION(BlueprintCallable, Category = "Daksh|Auth")
    void AuthenticateDevice(const FString& TitleId, const FString& DeviceId);

    UPROPERTY(BlueprintAssignable, Category = "Daksh|Events")
    FOnDakshAuthComplete OnAuthComplete;

private:
    FString BaseUrl;
};
