public class ExternalItemController {
   @AuraEnabled(cacheable=true)
   public static List<ExternalItemsListWrapper> getExternalItems(String recordId){
      ExternalItemsListWrapper extWrapper = new ExternalItemsListWrapper();
      extWrapper.exItemsList = [
         SELECT Name, Description__c, CreatedDate, ParentId__c
         FROM ExternalItem__c
         WHERE ParentId__c = :recordId
         ORDER BY Name
      ];
      extWrapper.exItemsListSize = extWrapper.exItemsList.size();
      extWrapper.permissionCreateEdit = ExternalItem__c.sObjectType.getDescribe().isCreateable() && ExternalItem__c.sObjectType.getDescribe().isUpdateable();
      return new List<ExternalItemsListWrapper>{extWrapper};
   }

   public class ExternalItemsListWrapper{
      @AuraEnabled
      public List<ExternalItem__c> exItemsList{get;set;}
      @AuraEnabled
      public Integer exItemsListSize{get;set;}
      @AuraEnabled
      public Boolean permissionCreateEdit{get;set;}
  }
}