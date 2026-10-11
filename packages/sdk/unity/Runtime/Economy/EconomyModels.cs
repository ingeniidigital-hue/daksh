using System;
using System.Collections.Generic;

namespace Daksh.SDK
{
    [Serializable]
    public class CatalogItem
    {
        public string id;
        public string titleId;
        public string name;
        public string description;
        public string category;
        public bool isActive;
    }

    [Serializable]
    public class CatalogResponse
    {
        public string titleId;
        public int total;
        public CatalogItem[] items;
    }

    [Serializable]
    public class VirtualCurrency
    {
        public string code;
        public string name;
        public int initialDeposit;
    }

    [Serializable]
    public class CurrencyListResponse
    {
        public string titleId;
        public VirtualCurrency[] currencies;
    }

    [Serializable]
    public class InventoryItemInstance
    {
        public string instanceId;
        public string itemId;
        public string name;
        public string acquiredAt;
    }

    [Serializable]
    public class PurchaseRequest
    {
        public string titleId;
        public string playerId;
        public string itemId;
        public string currencyCode;
        public string idempotencyKey;
    }

    [Serializable]
    public class PurchaseResult
    {
        public bool success;
        public bool isDeduped;
        public string txId;
        public string error;
        public int newBalance;
        public string currencyCode;
        public InventoryItemInstance grantedItem;
    }
}
