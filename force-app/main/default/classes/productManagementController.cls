public with sharing class productManagementController {
    @AuraEnabled(cacheable=true)
    public static List<Product2> getProducts(){
        return [SELECT Id, Name, Description, StockKeepingUnit FROM Product2];
    }

    @AuraEnabled(cacheable=true)
    public static List<Pricebook2> getPriceBooks(){
        return [SELECT Id, Name, Description, IsStandard, IsActive FROM Pricebook2];
        
    }

    @AuraEnabled(cacheable=true)
    public static List<PricebookEntry> getPriceBookEntries(){
        return [SELECT Id, Name, UnitPrice, Pricebook2Id, Product2Id FROM PricebookEntry];
    }
}
