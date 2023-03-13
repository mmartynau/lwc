@isTest
public with sharing class ExternalItemControllerTest {
    @isTest static void correctData(){
        Account newAcc = new Account(Name = 'Test Name');
        insert newAcc;
        String accountId = newAcc.id;
        List<ExternalItem__c> externalList = new List<ExternalItem__c>();
        for (Integer i = 0; i < 5; i++) {
            externalList.add(new ExternalItem__c(ParentId__c = accountId));
        }
        insert externalList;
        System.assertEquals(5, ExternalItemController.getExternalItems(accountId)[0].exItemsList.size(), 'Should be 5');
    }
}