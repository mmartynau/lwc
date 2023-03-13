import { LightningElement, wire, api } from 'lwc';
import getExternalItems from '@salesforce/apex/ExternalItemController.getExternalItems';
import { NavigationMixin } from 'lightning/navigation';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import externalItemEditModal from 'c/externalItemEditModal';
import { subscribe, MessageContext } from 'lightning/messageService';
import REFRESH_APEX from '@salesforce/messageChannel/refreshApex__c';
import NAME_FIELD from '@salesforce/schema/ExternalItem__c.Name';
import DESCRIPTION_FIELD from '@salesforce/schema/ExternalItem__c.Description__c';
import CREATED_DATE_FIELD from '@salesforce/schema/ExternalItem__c.CreatedDate';
const actions = [
    { label: 'View', name: 'view' },
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' }
];
const COLUMNS = [
    { label: 'Name', fieldName: NAME_FIELD.fieldApiName, type: 'number' },
    { label: 'Description', fieldName: DESCRIPTION_FIELD.fieldApiName, type: 'text' },
    { label: 'Created Date', fieldName: CREATED_DATE_FIELD.fieldApiName, type: 'date' },
    {
        label: 'Actions',
        type: 'action',
        typeAttributes: {
            rowActions: actions,
            menuAlignment: 'right'
        }
    }
];
const COLUMNSWITHOUTACTIONS = [
    { label: 'Name', fieldName: NAME_FIELD.fieldApiName, type: 'number' },
    { label: 'Description', fieldName: DESCRIPTION_FIELD.fieldApiName, type: 'text' },
    { label: 'Created Date', fieldName: CREATED_DATE_FIELD.fieldApiName, type: 'date' },
];

export default class ExternalItem extends NavigationMixin(LightningElement) {
    @api recordId;
    @api pageSize = 5;
    columns;
    rowId;
    results;
    resultEdit;
    apexData;
    count = 0;
    isDeleting;
    pageNumber = 1;
    visibleRecords;
    totalPageCount = 0;
    permissionCreateEdit;
    fields = [NAME_FIELD, DESCRIPTION_FIELD, CREATED_DATE_FIELD];
    subscription = null;
    @wire(MessageContext)
    messageContext;
    subscribeToMessageChannel() {
        this.subscription = subscribe(
          this.messageContext,
          REFRESH_APEX,
          (message) => this.handleMessage(message)
        );
    }
    handleMessage(message) {
        if(message.info == 'refreshApex') {
          refreshApex(this.apexData);
        }
    }
    connectedCallback() {
        this.subscribeToMessageChannel();
    }
    get disablePrevious() {
        return this.pageNumber <= 1;
    }
    get disableNext() {
        return this.pageNumber >= this.totalPageCount;
    }
    @wire(getExternalItems, {recordId: '$recordId'})
    wiredResults( result ) {
        this.apexData = result;
        if (result.data) {
            this.results = result.data[0].exItemsList;
            this.permissionCreateEdit = result.data[0].permissionCreateEdit;
            this.columns = this.permissionCreateEdit ? COLUMNS : COLUMNSWITHOUTACTIONS;
            // this.visibleRecords = this.results.slice(0, this.pageSize);
            this.handlePageChange();
            this.count = result.data[0].exItemsListSize;
            this.totalPageCount = Math.ceil(this.count / this.pageSize);
            this.title = 'External Items (' + this.count + ')';
            this.error = undefined;
        } else if (result.error) {
            console.log(JSON.stringify(result.error));
            this.error = result.error;
            this.results = undefined;
        }
    }
    navigateToNewExternalItem(){
        const defaultValues = encodeDefaultFieldValues({
            ParentId__c: this.recordId
        });
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'ExternalItem__c',
                actionName: 'new'
            },
            state: {
                defaultFieldValues: defaultValues,
                navigationLocation: 'RELATED_LIST'
            }
        });
    }
    handleRowAction(event){
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        this.rowId = row.Id;
        switch (actionName) {
            case 'view':
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.rowId,
                        actionName: 'view'
                    }
                });
                break;
            case 'edit':
                this.openExternalItemEditModal();
                break;
            case 'delete':
                this.isDeleting = true;
                break;
        }
    }
    handleDelete(){
        deleteRecord(this.rowId)
                .then(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Record deleted',
                            variant: 'success'
                        })
                    );
                    if (this.count % this.pageSize == 1) {
                        this.handlePrevPage();
                        console.log('done prevPage');
                    }
                    refreshApex(this.apexData);
                    this.handlePageChange();
                })
                .catch(error => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error deleting record',
                            message: error.body.message,
                            variant: 'error'
                        })
                    );
                });
                this.isDeleting = false;
    }
    handleNoDelete(){
        this.isDeleting = false;
    }
    handleNextPage() {
        if(this.pageNumber < this.totalPageCount) {
            this.pageNumber = this.pageNumber + 1;
        }
        this.handlePageChange();
    }
    handlePrevPage() {
        if(this.pageNumber > 1) {
            this.pageNumber = this.pageNumber - 1;
        }
        this.handlePageChange();
    }
    handlePageChange(){
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = this.pageSize * this.pageNumber;
        this.visibleRecords = this.results.slice(start, end);
    }
    async openExternalItemEditModal() {
        this.resultEdit = await externalItemEditModal.open({
            size: 'medium',
            description: 'Edit record',
            fields: this.fields,
            recordId: this.rowId
        });
    }
}