public with sharing class productManagementController {
    @AuraEnabled(cacheable=true)
    public static List<Product2> getProducts(){
        return [SELECT Id, Name, Description FROM Product2];
    }
}
