public with sharing class SimpleAccountsController {
    
    @AuraEnabled(cacheable=true)
    public static List<Account> getSimpleAccounts() {
        try {
            return [
                SELECT Id, Name, BillingState, Phone, Type, Validated__c 
                FROM Account 
                WHERE Id != null
                ORDER BY Name 
                LIMIT 100
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving accounts: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void updateAccountValidation(String accountId, Boolean validated) {
        try {
            Account acc = new Account(
                Id = accountId,
                Validated__c = validated
            );
            update acc;
        } catch (Exception e) {
            throw new AuraHandledException('Error updating account validation: ' + e.getMessage());
        }
    }
}